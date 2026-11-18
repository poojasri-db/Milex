
const express = require("express");
const router = express.Router();
const db = require("./db");
const authenticateToken = require("./auth_middleware");
const ExcelJS = require("exceljs");

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
        ).trim().toUpperCase();

        const { RETURN_ID, RETURN_STATUS } = req.body;

        // Allow ADMIN and SELLER
        if (!["ADMIN", "SELLER"].includes(USER_TYPE)) {
            return res.status(403).json({
                success: false,
                message: "Only admin and seller can approve or reject return requests"
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

        const status = String(RETURN_STATUS || "")
            .trim()
            .toUpperCase();

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




router.get("/get", authenticateToken, async (req, res) => {
    try {

        const USER_TYPE = String(
            req.user.USER_TYPE || req.user.role || ""
        ).toUpperCase();

        const SELLER_ID = req.user.SELLER_ID;

        const {
            DAYS = 30,
            RETURN_STATUS = "-1",
            RETURN_REASON = "-1",
            LIMIT = 10,
            OFFSET = 0
        } = req.query;

        let FILTER_SELLER_ID = -1;

        if (USER_TYPE === "SELLER") {
            if (!SELLER_ID) {
                return res.status(403).json({
                    success: false,
                    message: "Seller ID not found in token"
                });
            }

            FILTER_SELLER_ID = SELLER_ID;
        } else if (USER_TYPE !== "ADMIN") {
            return res.status(403).json({
                success: false,
                message: "Access denied"
            });
        }

        const [result] = await db.query(
            `CALL sp_o_return_requests_get(?, ?, ?, ?, ?, ?)`,
            [
                Number(DAYS),
                FILTER_SELLER_ID,
                RETURN_STATUS,
                RETURN_REASON,
                Number(LIMIT),
                Number(OFFSET)
            ]
        );

        const data = result[0] || [];
        const total = result[1]?.[0]?.TOTAL_RECORDS || 0;

        return res.status(200).json({
            success: true,
            message: "Return requests fetched successfully",
            total_records: total,
            data
        });

    } catch (error) {
        console.error("Return Request GET Error:", error);

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



// ==========================================
// EXPORT RETURN REQUESTS
// GET /api/return-requests/export
// ADMIN / SELLER
// EXPORT ALL FILTERED RECORDS TO EXCEL
// ==========================================

router.get("/export", async (req, res) => {
    try {

        const USER_TYPE = String(
            req.user.USER_TYPE || req.user.role || ""
        ).trim().toUpperCase();

        const SELLER_ID = req.user.SELLER_ID;

        const {
            DAYS = 30,
            RETURN_STATUS = "-1",
            RETURN_REASON = "-1"
        } = req.query;

        let FILTER_SELLER_ID = -1;

        // ROLE VALIDATION

        if (USER_TYPE === "SELLER") {

            if (!SELLER_ID) {
                return res.status(403).json({
                    success: false,
                    message: "Seller ID not found in token"
                });
            }

            FILTER_SELLER_ID = Number(SELLER_ID);

            if (
                !Number.isSafeInteger(FILTER_SELLER_ID) ||
                FILTER_SELLER_ID <= 0
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid Seller ID"
                });
            }

        } else if (USER_TYPE !== "ADMIN") {

            return res.status(403).json({
                success: false,
                message: "Access denied"
            });

        }

        // DAYS VALIDATION

        const days = Number(DAYS);

        if (![7, 30, 60, 90, 180].includes(days)) {
            return res.status(400).json({
                success: false,
                message: "DAYS must be 7, 30, 60, 90 or 180"
            });
        }

        // FETCH ALL FILTERED RETURN REQUESTS
        // NO LIMIT / OFFSET

        const sql = `
            SELECT
                rr.RETURN_ID,
                rr.ORDER_ID,
                rr.ORDER_NUMBER,
                rr.PRODUCT_ID,
                p.PRODUCT_NAME,
                rr.QUANTITY,
                rr.RETURN_REASON,
                rr.RETURN_DESCRIPTION,
                rr.RETURN_IMAGES,
                rr.PICKUP_ADDRESS_ID,
                rr.ADDRESS,
                rr.SELLER_ID,
                rr.CUSTOMER_ID,

                CONCAT_WS(
                    ' ',
                    c.FIRST_NAME,
                    c.LAST_NAME
                ) AS CUSTOMER_NAME,

                c.MOBILE_NUMBER AS CUSTOMER_MOBILE,

                rr.VARIANT_ID,
                rr.RETURN_STATUS,
                os.ORDER_STATUS AS RETURN_STATUS_NAME,
                rr.CREATED_BY,
                rr.UPDATED_BY,
                rr.CREATED_AT,
                rr.UPDATED_AT

            FROM o_return_requests rr

            LEFT JOIN m_customer_registration c
                ON c.CUSTOMER_ID = rr.CUSTOMER_ID

            LEFT JOIN m_products p
                ON p.PRODUCT_ID = rr.PRODUCT_ID

            LEFT JOIN m_order_status os
                ON os.ORDER_STATUS_ID = rr.RETURN_STATUS

            WHERE
                rr.CREATED_AT >= DATE_SUB(
                    CURDATE(),
                    INTERVAL ? DAY
                )

                AND rr.CREATED_AT < DATE_ADD(
                    CURDATE(),
                    INTERVAL 1 DAY
                )

                AND (
                    ? = -1
                    OR rr.SELLER_ID = ?
                )

                AND (
                    ? IS NULL
                    OR ? = ''
                    OR ? = '-1'
                    OR rr.RETURN_STATUS = ?
                )

                AND (
                    ? IS NULL
                    OR ? = ''
                    OR ? = '-1'
                    OR rr.RETURN_REASON = ?
                )

            ORDER BY rr.RETURN_ID DESC
        `;

        const params = [
            days,

            FILTER_SELLER_ID,
            FILTER_SELLER_ID,

            RETURN_STATUS,
            RETURN_STATUS,
            RETURN_STATUS,
            RETURN_STATUS,

            RETURN_REASON,
            RETURN_REASON,
            RETURN_REASON,
            RETURN_REASON
        ];

        const [returns] = await db.query(sql, params);

        // CREATE EXCEL WORKBOOK

        const workbook = new ExcelJS.Workbook();

        workbook.creator = "Ecom Milex";
        workbook.created = new Date();

        const worksheet = workbook.addWorksheet("Return Requests");

        worksheet.columns = [
            { header: "Return ID", key: "RETURN_ID", width: 12 },
            { header: "Order ID", key: "ORDER_ID", width: 12 },
            { header: "Order Number", key: "ORDER_NUMBER", width: 22 },
            { header: "Product ID", key: "PRODUCT_ID", width: 12 },
            { header: "Product Name", key: "PRODUCT_NAME", width: 25 },
            { header: "Quantity", key: "QUANTITY", width: 12 },
            { header: "Return Reason", key: "RETURN_REASON", width: 22 },
            { header: "Return Description", key: "RETURN_DESCRIPTION", width: 30 },
            { header: "Return Images", key: "RETURN_IMAGES", width: 35 },
            { header: "Pickup Address ID", key: "PICKUP_ADDRESS_ID", width: 18 },
            { header: "Address", key: "ADDRESS", width: 35 },
            { header: "Seller ID", key: "SELLER_ID", width: 12 },
            { header: "Customer ID", key: "CUSTOMER_ID", width: 14 },
            { header: "Customer Name", key: "CUSTOMER_NAME", width: 22 },
            { header: "Customer Mobile", key: "CUSTOMER_MOBILE", width: 18 },
            { header: "Variant ID", key: "VARIANT_ID", width: 12 },
            { header: "Return Status", key: "RETURN_STATUS", width: 16 },
            { header: "Return Status Name", key: "RETURN_STATUS_NAME", width: 20 },
            { header: "Created By", key: "CREATED_BY", width: 14 },
            { header: "Updated By", key: "UPDATED_BY", width: 14 },
            { header: "Created At", key: "CREATED_AT", width: 22 },
            { header: "Updated At", key: "UPDATED_AT", width: 22 }
        ];

        // HEADER STYLE

        worksheet.getRow(1).font = {
            bold: true,
            color: { argb: "FFFFFFFF" }
        };

        worksheet.getRow(1).fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FF1F4E78" }
        };

        worksheet.getRow(1).alignment = {
            vertical: "middle",
            horizontal: "center"
        };

        // ADD ALL FILTERED RECORDS

        returns.forEach(item => {
            worksheet.addRow(item);
        });

        // DATE FORMATTING

        ["CREATED_AT", "UPDATED_AT"].forEach(key => {
            worksheet.getColumn(key).numFmt = "yyyy-mm-dd hh:mm:ss";
        });

        // FREEZE HEADER

        worksheet.views = [
            {
                state: "frozen",
                ySplit: 1
            }
        ];

        // EXCEL FILTER

        worksheet.autoFilter = {
            from: "A1",
            to: `${worksheet.getColumn(worksheet.columnCount).letter}1`
        };

        // GENERATE EXCEL FILE

        const buffer = await workbook.xlsx.writeBuffer();

        const fileName = `Return_Requests_${new Date()
            .toISOString()
            .slice(0, 10)}.xlsx`;

        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );

        res.setHeader(
            "Content-Disposition",
            `attachment; filename="${fileName}"`
        );

        res.setHeader("Content-Length", buffer.length);

        return res.status(200).send(Buffer.from(buffer));

    } catch (error) {

        console.error("RETURN REQUEST EXPORT ERROR:", error);

        return res.status(500).json({
            success: false,
            message: error.sqlMessage || error.message
        });

    }
});


module.exports = router;
