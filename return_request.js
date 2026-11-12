
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
            PICKUP_ADDRESS_ID
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
            !RETURN_REASON
        ) {
            return res.status(400).json({
                success: false,
                message: "ORDER_ID, PRODUCT_ID, QUANTITY and RETURN_REASON are required"
            });
        }

        const orderId = String(ORDER_ID);
        const productId = String(PRODUCT_ID);
        const quantity = Number(QUANTITY);

        if (
            !/^[0-9]+$/.test(orderId) ||
            !/^[0-9]+$/.test(productId) ||
            !Number.isSafeInteger(quantity) ||
            quantity <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid ORDER_ID, PRODUCT_ID or QUANTITY"
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

        if (PICKUP_ADDRESS_ID) {

            const [addresses] = await db.query(
                `SELECT ADDRESS_ID
                 FROM o_customer_addresses
                 WHERE ADDRESS_ID = ?
                 AND CUSTOMER_ID = ?
                 LIMIT 1`,
                [
                    PICKUP_ADDRESS_ID,
                    order.CUSTOMER_ID
                ]
            );

            if (!addresses.length) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid pickup address for this order's customer"
                });
            }
        }

        // ==========================================
        // INSERT RETURN REQUEST
        // RETURN STATUS ALWAYS PENDING
        // ==========================================

        const [result] = await db.query(
            `CALL sp_o_return_requests_insert(?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                orderId,
                productId,
                quantity,
                RETURN_REASON,
                RETURN_DESCRIPTION || null,
                RETURN_IMAGES || null,
                PICKUP_ADDRESS_ID || null,
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
// UPDATE RETURN REQUEST
// PUT /api/return-requests/update
// ADMIN ONLY
// ==========================================

router.put("/update", async (req, res) => {
    try {

        if (!adminOnly(req, res)) return;

        const {
            RETURN_ID,
            ORDER_ID,
            PRODUCT_ID,
            QUANTITY,
            RETURN_REASON,
            RETURN_DESCRIPTION,
            RETURN_IMAGES,
            PICKUP_ADDRESS_ID,
            RETURN_STATUS
        } = req.body || {};

        if (!RETURN_ID || !ORDER_ID || !PRODUCT_ID) {
            return res.status(400).json({
                success: false,
                message: "RETURN_ID, ORDER_ID and PRODUCT_ID are required"
            });
        }

        // ==========================================
        // VERIFY RETURN REQUEST EXISTS
        // ==========================================

        const [existing] = await db.query(
            `SELECT RETURN_ID
             FROM o_return_requests
             WHERE RETURN_ID = ?
             LIMIT 1`,
            [RETURN_ID]
        );

        if (!existing.length) {
            return res.status(404).json({
                success: false,
                message: "Return request not found"
            });
        }

        // ==========================================
        // VERIFY ORDER AND PRODUCT
        // ==========================================

        const [orders] = await db.query(
            `SELECT ORDER_ID, CUSTOMER_ID, PRODUCT_ID, QUANTITY
             FROM o_place_orders
             WHERE ORDER_ID = ?
             LIMIT 1`,
            [ORDER_ID]
        );

        if (!orders.length) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        const order = orders[0];

        if (
            String(order.PRODUCT_ID) !== String(PRODUCT_ID) ||
            (
                QUANTITY !== undefined &&
                QUANTITY !== null &&
                Number(QUANTITY) > Number(order.QUANTITY)
            )
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid product or return quantity"
            });
        }

        // ==========================================
        // VERIFY PICKUP ADDRESS
        // ==========================================

        if (PICKUP_ADDRESS_ID) {

            const [addresses] = await db.query(
                `SELECT ADDRESS_ID
                 FROM o_customer_addresses
                 WHERE ADDRESS_ID = ?
                 AND CUSTOMER_ID = ?
                 LIMIT 1`,
                [
                    PICKUP_ADDRESS_ID,
                    order.CUSTOMER_ID
                ]
            );

            if (!addresses.length) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid pickup address"
                });
            }
        }

        // ==========================================
        // UPDATE RETURN REQUEST
        // ==========================================

        const [result] = await db.query(
            `CALL sp_o_return_requests_update(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                RETURN_ID,
                ORDER_ID,
                PRODUCT_ID,
                QUANTITY,
                RETURN_REASON,
                RETURN_DESCRIPTION,
                RETURN_IMAGES,
                PICKUP_ADDRESS_ID,
                RETURN_STATUS,
                req.user.USER_ID
            ]
        );

        return res.status(200).json({
            success: true,
            message: "Return request updated successfully",
            data: result[0][0] || {}
        });

    } catch (error) {

        console.error("Return Request Update Error:", error);

        return res.status(500).json({
            success: false,
            message: error.sqlMessage || error.message
        });
    }
});


// ==========================================
// GET RETURN REQUESTS
// GET /api/return-requests/get
// ADMIN: ALL RETURNS
// CUSTOMER: OWN RETURNS ONLY
// ==========================================

router.get("/get", async (req, res) => {
    try {

        const userType = String(req.user.USER_TYPE || "")
            .trim()
            .toUpperCase();

        if (!["ADMIN", "CUSTOMER"].includes(userType)) {
            return res.status(403).json({
                success: false,
                message: "Access denied."
            });
        }

        const {
            RETURN_ID = "-1",
            ORDER_ID = "-1",
            PRODUCT_ID = "-1",
            LIMIT = "10",
            OFFSET = "0"
        } = req.query;

        // ==========================================
        // VALIDATE FILTERS
        // ==========================================

        const filters = {
            RETURN_ID,
            ORDER_ID,
            PRODUCT_ID
        };

        for (const [key, value] of Object.entries(filters)) {

            if (!/^-1$|^[0-9]+$/.test(String(value))) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid ${key}`
                });
            }
        }

        const limit = Number(LIMIT);
        const offset = Number(OFFSET);

        if (
            !Number.isSafeInteger(limit) ||
            limit <= 0 ||
            limit > 100 ||
            !Number.isSafeInteger(offset) ||
            offset < 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid LIMIT or OFFSET"
            });
        }

        // ==========================================
        // BUILD SECURE GET QUERY
        // ==========================================

        let sql = `
            SELECT
                rr.*
            FROM o_return_requests rr
            INNER JOIN o_place_orders o
                ON o.ORDER_ID = rr.ORDER_ID
            WHERE 1 = 1
        `;

        const params = [];

        // Customer can see only their own returns
        if (userType === "CUSTOMER") {

            const customerId = await getCustomerId(req.user.USER_ID);

            if (!customerId) {
                return res.status(403).json({
                    success: false,
                    message: "Customer registration not found"
                });
            }

            sql += ` AND o.CUSTOMER_ID = ?`;
            params.push(customerId);
        }

        if (RETURN_ID !== "-1") {
            sql += ` AND rr.RETURN_ID = ?`;
            params.push(RETURN_ID);
        }

        if (ORDER_ID !== "-1") {
            sql += ` AND rr.ORDER_ID = ?`;
            params.push(ORDER_ID);
        }

        if (PRODUCT_ID !== "-1") {
            sql += ` AND rr.PRODUCT_ID = ?`;
            params.push(PRODUCT_ID);
        }

        sql += ` ORDER BY rr.RETURN_ID DESC LIMIT ? OFFSET ?`;

        params.push(limit, offset);

        const [result] = await db.query(sql, params);

        return res.status(200).json({
            success: true,
            message: "Return requests fetched successfully",
            limit,
            offset,
            data: result
        });

    } catch (error) {

        console.error("Return Request Get Error:", error);

        return res.status(500).json({
            success: false,
            message: error.sqlMessage || error.message
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

        // ==========================================
        // DELETE RETURN REQUEST
        // ==========================================

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
