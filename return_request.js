
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



router.post("/", authenticateToken, async (req, res) => {
    try {
        const {
            ORDER_NUMBER,
            ORDER_ID,
            REASON_ID,
            RETURN_DESCRIPTION,
            RETURN_OPTION,
            REFUND_METHOD,
            PRODUCT_ID,
            VARIANT_ID,
            SELLER_ID,
            PICKUP_ADDRESS_ID
        } = req.body;

        const CREATED_BY = req.user.USER_ID || req.user.sub;

        const [result] = await db.query(
            `CALL sp_o_return_requests_insert(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                ORDER_NUMBER,
                ORDER_ID,
                REASON_ID,
                RETURN_DESCRIPTION || null,
                RETURN_OPTION,
                REFUND_METHOD || null,
                PRODUCT_ID,
                VARIANT_ID,
                SELLER_ID,
                PICKUP_ADDRESS_ID,
                CREATED_BY
            ]
        );

        const response = result[0][0];

        if (response.STATUS === "ERROR") {
            return res.status(400).json({
                STATUS: "ERROR",
                MESSAGE: response.ERROR_MESSAGE
            });
        }

        return res.status(200).json({
            STATUS: "SUCCESS",
            MESSAGE: "Return request submitted successfully",
            DATA: response
        });

    } catch (error) {
        console.error("Return Request Insert Error:", error);

        return res.status(500).json({
            STATUS: "ERROR",
            MESSAGE: error.message
        });
    }
});




// UPDATE RETURN REQUEST
router.put("/update", authenticateToken, async (req, res) => {
    try {
        const {
            RETURN_ID,
            ACTION,
            RETURN_STATUS
        } = req.body;

        const USER_ID = req.user.USER_ID || req.user.sub;

        // Validate RETURN_ID
        if (!RETURN_ID) {
            return res.status(400).json({
                STATUS: "ERROR",
                MESSAGE: "RETURN_ID is required"
            });
        }

        // Validate USER_ID
        if (!USER_ID) {
            return res.status(400).json({
                STATUS: "ERROR",
                MESSAGE: "User ID not found in login token"
            });
        }

        // ACTION is optional for status-only updates
        let FINAL_ACTION = null;

        if (ACTION !== null && ACTION !== undefined &&
            String(ACTION).trim() !== "") {

            FINAL_ACTION = String(ACTION).trim().toUpperCase();

            if (!["APPROVED", "REJECTED"].includes(FINAL_ACTION)) {
                return res.status(400).json({
                    STATUS: "ERROR",
                    MESSAGE: "ACTION must be APPROVED or REJECTED"
                });
            }
        }

        // Validate RETURN_STATUS
        if (
            RETURN_STATUS === null ||
            RETURN_STATUS === undefined ||
            RETURN_STATUS === ""
        ) {
            return res.status(400).json({
                STATUS: "ERROR",
                MESSAGE: "RETURN_STATUS is required"
            });
        }

        // Call stored procedure
        const [result] = await db.query(
            "CALL sp_o_return_requests_update(?, ?, ?, ?)",
            [
                RETURN_ID,
                FINAL_ACTION,
                RETURN_STATUS,
                USER_ID
            ]
        );

        const response = result[0]?.[0];

        if (response && response.STATUS === "ERROR") {
            return res.status(400).json({
                STATUS: "ERROR",
                MESSAGE: response.MESSAGE
            });
        }

        return res.status(200).json({
            STATUS: "SUCCESS",
            MESSAGE: response?.MESSAGE || "Return request updated successfully"
        });

    } catch (error) {
        console.error("UPDATE RETURN REQUEST ERROR:", error);

        return res.status(500).json({
            STATUS: "ERROR",
            MESSAGE: error.sqlMessage || error.message
        });
    }
});




// GET RETURN REQUESTS
router.get("/get", authenticateToken, async (req, res) => {
    try {
        const {
            DAYS = 30,
            SELLER_ID = -1,
            RETURN_STATUS = "-1",
            RETURN_REASON = "-1",
            LIMIT = 10,
            OFFSET = 0
        } = req.query;

        // Validate DAYS
        if (![7, 30, 60, 90, 180].includes(Number(DAYS))) {
            return res.status(400).json({
                STATUS: "ERROR",
                MESSAGE: "Invalid DAYS. Allowed values are 7, 30, 60, 90, 180"
            });
        }

        // Validate LIMIT and OFFSET
        if (
            Number(LIMIT) <= 0 ||
            !Number.isInteger(Number(LIMIT)) ||
            Number(OFFSET) < 0 ||
            !Number.isInteger(Number(OFFSET))
        ) {
            return res.status(400).json({
                STATUS: "ERROR",
                MESSAGE: "Invalid LIMIT or OFFSET"
            });
        }

        const [result] = await db.query(
            "CALL sp_o_return_requests_get(?, ?, ?, ?, ?, ?)",
            [
                Number(DAYS),
                Number(SELLER_ID),
                RETURN_STATUS,
                RETURN_REASON,
                Number(LIMIT),
                Number(OFFSET)
            ]
        );

        const returnRequests = result[0] || [];
        const totalRecords = result[1]?.[0]?.TOTAL_RECORDS || 0;

        return res.status(200).json({
            STATUS: "SUCCESS",
            MESSAGE: "Return requests fetched successfully",
            TOTAL_RECORDS: totalRecords,
            LIMIT: Number(LIMIT),
            OFFSET: Number(OFFSET),
            DATA: returnRequests
        });

    } catch (error) {
        console.error("GET RETURN REQUEST ERROR:", error);

        return res.status(500).json({
            STATUS: "ERROR",
            MESSAGE: error.sqlMessage || error.message
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
