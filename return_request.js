
const express = require("express");
const router = express.Router();
const db = require("./db");
const authenticateToken = require("./auth_middleware");

// ==========================================
// APPLY JWT AUTHENTICATION
// ==========================================

router.use(authenticateToken);

// ==========================================
// HELPER: GET CUSTOMER ID FROM USER ID
// ==========================================

const getCustomerId = async (userId) => {

    const [rows] = await db.query(
        `SELECT CUSTOMER_ID
         FROM m_customer_registration
         WHERE USER_ID = ?
         LIMIT 1`,
        [userId]
    );

    return rows.length ? rows[0].CUSTOMER_ID : null;
};

// ==========================================
// HELPER: ADMIN AUTHORIZATION
// ==========================================

const adminOnly = (req, res) => {

    if (
        String(req.user.USER_TYPE || "").trim().toUpperCase() !== "ADMIN"
    ) {
        res.status(403).json({
            success: false,
            message: "Access denied. Admin only."
        });

        return false;
    }

    return true;
};


// ==========================================
// INSERT RETURN REQUEST
// POST /api/return-requests/insert
// ADMIN / CUSTOMER
// ==========================================

router.post("/insert", async (req, res) => {
    try {

        const {
            ORDER_ID,
            PRODUCT_ID,
            QUANTITY,
            RETURN_REASON,
            RETURN_DESCRIPTION,
            RETURN_IMAGES,
            PICKUP_ADDRESS_ID,
            SELLER_ID,
            VARIANT_ID
        } = req.body || {};

        const userType = String(req.user.USER_TYPE || "")
            .trim()
            .toUpperCase();

        if (!["ADMIN", "CUSTOMER"].includes(userType)) {
            return res.status(403).json({
                success: false,
                message: "Access denied."
            });
        }

        // ==========================================
        // VALIDATE REQUIRED FIELDS
        // ==========================================

        if (
            !ORDER_ID ||
            !PRODUCT_ID ||
            !QUANTITY ||
            !RETURN_REASON ||
            !PICKUP_ADDRESS_ID ||
            !SELLER_ID ||
            !VARIANT_ID
        ) {
            return res.status(400).json({
                success: false,
                message: "ORDER_ID, PRODUCT_ID, QUANTITY, RETURN_REASON, PICKUP_ADDRESS_ID, SELLER_ID and VARIANT_ID are required"
            });
        }

        const orderId = String(ORDER_ID);
        const productId = String(PRODUCT_ID);
        const quantity = Number(QUANTITY);
        const sellerId = String(SELLER_ID);
        const variantId = String(VARIANT_ID);
        const pickupAddressId = String(PICKUP_ADDRESS_ID);

        if (
            !/^[0-9]+$/.test(orderId) ||
            !/^[0-9]+$/.test(productId) ||
            !/^[0-9]+$/.test(sellerId) ||
            !/^[0-9]+$/.test(variantId) ||
            !/^[0-9]+$/.test(pickupAddressId) ||
            Number(orderId) <= 0 ||
            Number(productId) <= 0 ||
            Number(sellerId) <= 0 ||
            Number(variantId) <= 0 ||
            Number(pickupAddressId) <= 0 ||
            !Number.isSafeInteger(quantity) ||
            quantity <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid input values"
            });
        }

        // ==========================================
        // GET CUSTOMER ID
        // ==========================================

        let customerId = null;

        if (userType === "CUSTOMER") {

            customerId = await getCustomerId(req.user.USER_ID);

            if (!customerId) {
                return res.status(403).json({
                    success: false,
                    message: "Customer registration not found for this user"
                });
            }
        }

        // ==========================================
        // VERIFY ORDER OWNERSHIP AND PRODUCT
        // ==========================================

        const [orders] = await db.query(
            `SELECT
                ORDER_ID,
                ORDER_NUMBER,
                CUSTOMER_ID,
                PRODUCT_ID,
                QUANTITY
             FROM o_place_orders
             WHERE ORDER_ID = ?
             LIMIT 1`,
            [orderId]
        );

        if (!orders.length) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        const order = orders[0];

        if (
            userType === "CUSTOMER" &&
            String(order.CUSTOMER_ID) !== String(customerId)
        ) {
            return res.status(403).json({
                success: false,
                message: "You cannot create a return request for another customer's order"
            });
        }

        if (String(order.PRODUCT_ID) !== productId) {
            return res.status(400).json({
                success: false,
                message: "Product does not belong to this order"
            });
        }

        if (quantity > Number(order.QUANTITY)) {
            return res.status(400).json({
                success: false,
                message: "Return quantity cannot exceed ordered quantity"
            });
        }

        // ==========================================
        // VERIFY PICKUP ADDRESS OWNERSHIP
        // ==========================================

        const [addresses] = await db.query(
            `SELECT ADDRESS_ID
             FROM o_customer_addresses
             WHERE ADDRESS_ID = ?
             AND CUSTOMER_ID = ?
             LIMIT 1`,
            [
                pickupAddressId,
                order.CUSTOMER_ID
            ]
        );

        if (!addresses.length) {
            return res.status(400).json({
                success: false,
                message: "Invalid pickup address for this order's customer"
            });
        }

        // ==========================================
        // INSERT RETURN REQUEST
        // ADDRESS FETCHED AUTOMATICALLY BY SP
        // RETURN STATUS ALWAYS PENDING
        // ==========================================

        const [result] = await db.query(
            `CALL sp_o_return_requests_insert(
                ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
            )`,
            [
                orderId,
                productId,
                quantity,
                RETURN_REASON,
                RETURN_DESCRIPTION || null,
                RETURN_IMAGES || null,
                pickupAddressId,
                sellerId,
                order.CUSTOMER_ID,
                variantId,
                "PENDING",
                req.user.USER_ID
            ]
        );

        return res.status(200).json({
            success: true,
            message: "Return request created successfully",
            data: result[0][0] || {}
        });

    } catch (error) {

        console.error("Return Request Insert Error:", error);

        return res.status(500).json({
            success: false,
            message: error.sqlMessage || error.message
        });
    }
});


// ==========================================
// APPROVE / REJECT RETURN REQUEST
// ==========================================

router.put("/update", authenticateToken, async (req, res) => {
    try {

        const USER_ID = req.user.USER_ID || req.user.sub;

        const USER_TYPE = String(
            req.user.USER_TYPE || req.user.role || ""
        ).toUpperCase();

        const { RETURN_ID, RETURN_STATUS } = req.body;

        if (USER_TYPE !== "ADMIN") {
            return res.status(403).json({
                success: false,
                message: "Only admin can approve or reject return requests"
            });
        }

        if (!USER_ID) {
            return res.status(400).json({
                success: false,
                message: "User ID not found"
            });
        }

        if (
            !RETURN_ID ||
            !Number.isInteger(Number(RETURN_ID)) ||
            Number(RETURN_ID) <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Valid RETURN_ID is required"
            });
        }

        const status = String(RETURN_STATUS || "").toUpperCase();

        if (!["APPROVED", "REJECTED"].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "RETURN_STATUS must be APPROVED or REJECTED"
            });
        }

        const [result] = await db.query(
            "CALL sp_o_return_requests_update(?, ?, ?)",
            [
                RETURN_ID,
                status,
                USER_ID
            ]
        );

        return res.status(200).json({
            success: true,
            message: `Return request ${status.toLowerCase()} successfully`
        });

    } catch (error) {

        console.error("Return Request Update Error:", error);

        return res.status(500).json({
            success: false,
            message: error.sqlMessage || error.message
        });
    }
});



router.get("/get", (req, res, next) => {
    if (!adminOnly(req, res)) return;
    next();
}, async (req, res) => {

    try {

        const {
            DAYS = 30,
            RETURN_STATUS = "-1",
            RETURN_REASON = "-1",
            SEARCH = "",
            LIMIT = 10,
            OFFSET = 0
        } = req.query;

        const days = Number(DAYS);
        const limit = Number(LIMIT);
        const offset = Number(OFFSET);

        if (![7, 30, 60, 90, 180].includes(days)) {
            return res.status(400).json({
                success: false,
                message: "Invalid DAYS. Allowed values: 7, 30, 60, 90, 180"
            });
        }

        if (
            !Number.isInteger(limit) ||
            limit <= 0 ||
            !Number.isInteger(offset) ||
            offset < 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid LIMIT or OFFSET"
            });
        }

        const [result] = await db.query(
            `CALL sp_o_return_requests_get(?, ?, ?, ?, ?, ?)`,
            [
                days,
                RETURN_STATUS,
                RETURN_REASON,
                SEARCH,
                limit,
                offset
            ]
        );

        const returnRequests = result[0];
        const totalRecords = result[1][0].TOTAL_RECORDS;

        return res.status(200).json({
            success: true,
            message: "Return requests fetched successfully",
            total_records: totalRecords,
            data: returnRequests
        });

    } catch (error) {

        console.error("Return Requests Get Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch return requests",
            error: error.message
        });

    }

});



// ==========================================
// DELETE RETURN REQUEST
// DELETE /api/return-requests/delete
// ADMIN ONLY
// ==========================================

router.delete("/delete", async (req, res) => {
    try {

        if (!adminOnly(req, res)) return;

        const {
            RETURN_ID,
            ORDER_ID,
            PRODUCT_ID
        } = req.body || {};

        if (!RETURN_ID || !ORDER_ID || !PRODUCT_ID) {
            return res.status(400).json({
                success: false,
                message: "RETURN_ID, ORDER_ID and PRODUCT_ID are required"
            });
        }

        const [result] = await db.query(
            `CALL sp_o_return_requests_delete(?, ?, ?)`,
            [
                RETURN_ID,
                ORDER_ID,
                PRODUCT_ID
            ]
        );

        return res.status(200).json({
            success: true,
            message: "Return request deleted successfully",
            data: result[0][0] || {}
        });

    } catch (error) {

        console.error("Return Request Delete Error:", error);

        return res.status(500).json({
            success: false,
            message: error.sqlMessage || error.message
        });
    }
});

module.exports = router;
