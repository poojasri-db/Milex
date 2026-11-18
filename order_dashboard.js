
const express = require("express");
const router = express.Router();
const db = require("./db");
const ExcelJS = require("exceljs");
const authenticateToken = require("./auth_middleware");

// ==========================================
// ORDER MANAGEMENT DASHBOARD GET
// GET /api/order_management_dashboard/get
// ADMIN / SELLER
// ==========================================

router.get("/get", authenticateToken, async (req, res) => {

    try {

        const USER_TYPE = String(req.user.USER_TYPE || "")
            .trim()
            .toUpperCase();

        let SELLER_ID;

        if (USER_TYPE === "ADMIN") {
            SELLER_ID = Number(req.query.SELLER_ID ?? -1);
        } else if (USER_TYPE === "SELLER") {
            SELLER_ID = Number(req.user.SELLER_ID);

            if (!Number.isSafeInteger(SELLER_ID) || SELLER_ID <= 0) {
                return res.status(400).json({
                    status: "FAILED",
                    message: "Seller ID not found in authenticated user"
                });
            }
        } else {
            return res.status(403).json({
                status: "FAILED",
                message: "Access denied"
            });
        }

        const {
            DAYS = "30",
            SEARCH = "",
            ORDER_STATUS = "-1",
            PAYMENT_STATUS = "-1",
            SHIPPING_STATUS = "-1",
            LIMIT = "10",
            OFFSET = "0"
        } = req.query;

        const days = Number(DAYS);
        const orderStatus = Number(ORDER_STATUS);
        const paymentStatus = Number(PAYMENT_STATUS);
        const shippingStatus = Number(SHIPPING_STATUS);
        const limit = Number(LIMIT);
        const offset = Number(OFFSET);

        if (
            !Number.isSafeInteger(SELLER_ID) ||
            (SELLER_ID !== -1 && SELLER_ID <= 0)
        ) {
            return res.status(400).json({
                status: "FAILED",
                message: "Invalid SELLER_ID"
            });
        }

        if (![7, 30, 60, 90, 180].includes(days)) {
            return res.status(400).json({
                status: "FAILED",
                message: "DAYS must be 7, 30, 60, 90 or 180"
            });
        }

        if (SELLER_ID === -1 && USER_TYPE !== "ADMIN") {
            return res.status(403).json({
                status: "FAILED",
                message: "Only admin can view all sellers"
            });
        }

        const statuses = [
            orderStatus,
            paymentStatus,
            shippingStatus
        ];

        if (!statuses.every(value =>
            Number.isSafeInteger(value) &&
            (value === -1 || value > 0)
        )) {
            return res.status(400).json({
                status: "FAILED",
                message: "Invalid status filter"
            });
        }

        if (typeof SEARCH !== "string" || SEARCH.length > 100) {
            return res.status(400).json({
                status: "FAILED",
                message: "SEARCH must not exceed 100 characters"
            });
        }

        if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
            return res.status(400).json({
                status: "FAILED",
                message: "LIMIT must be between 1 and 100"
            });
        }

        if (!Number.isSafeInteger(offset) || offset < 0) {
            return res.status(400).json({
                status: "FAILED",
                message: "OFFSET must be zero or a positive integer"
            });
        }

        const [result] = await db.query(
            "CALL sp_m_order_management_dashboard_get(?,?,?,?,?,?,?,?)",
            [
                SELLER_ID,
                days,
                SEARCH.trim(),
                orderStatus,
                paymentStatus,
                shippingStatus,
                limit,
                offset
            ]
        );

        const dashboard = result[0] && result[0][0]
            ? result[0][0]
            : {};

        const orders = result[1] || [];

        const totalRecords = result[2] && result[2][0]
            ? result[2][0].TOTAL_RECORDS
            : 0;

        return res.status(200).json({
            status: "SUCCESS",
            message: "Order management dashboard fetched successfully",
            dashboard,
            total_records: totalRecords,
            data: orders
        });

    } catch (error) {

        console.error("ORDER MANAGEMENT DASHBOARD GET API ERROR:", error);

        return res.status(500).json({
            status: "FAILED",
            message: error.sqlMessage || error.message
        });
    }
});


// ==========================================
// ORDER MANAGEMENT DASHBOARD EXPORT
// GET /api/order_management_dashboard/export
// ADMIN / SELLER
// EXPORT ALL FILTERED RECORDS TO EXCEL
// ==========================================

router.get("/export", authenticateToken, async (req, res) => {

    try {

        const USER_TYPE = String(req.user.USER_TYPE || "")
            .trim()
            .toUpperCase();

        let SELLER_ID;

        if (USER_TYPE === "ADMIN") {

            SELLER_ID = Number(req.query.SELLER_ID ?? -1);

        } else if (USER_TYPE === "SELLER") {

            SELLER_ID = Number(req.user.SELLER_ID);

            if (!Number.isSafeInteger(SELLER_ID) || SELLER_ID <= 0) {
                return res.status(400).json({
                    status: "FAILED",
                    message: "Seller ID not found in authenticated user"
                });
            }

        } else {

            return res.status(403).json({
                status: "FAILED",
                message: "Access denied"
            });

        }

        const {
            DAYS = "30",
            SEARCH = "",
            ORDER_STATUS = "-1",
            PAYMENT_STATUS = "-1",
            SHIPPING_STATUS = "-1"
        } = req.query;

        const days = Number(DAYS);
        const orderStatus = Number(ORDER_STATUS);
        const paymentStatus = Number(PAYMENT_STATUS);
        const shippingStatus = Number(SHIPPING_STATUS);

        // SELLER ID VALIDATION

        if (
            !Number.isSafeInteger(SELLER_ID) ||
            (SELLER_ID !== -1 && SELLER_ID <= 0)
        ) {
            return res.status(400).json({
                status: "FAILED",
                message: "Invalid SELLER_ID"
            });
        }

        // DAYS VALIDATION

        if (![7, 30, 60, 90, 180].includes(days)) {
            return res.status(400).json({
                status: "FAILED",
                message: "DAYS must be 7, 30, 60, 90 or 180"
            });
        }

        // ADMIN ONLY - ALL SELLERS

        if (SELLER_ID === -1 && USER_TYPE !== "ADMIN") {
            return res.status(403).json({
                status: "FAILED",
                message: "Only admin can export all sellers"
            });
        }

        // STATUS VALIDATION

        const statuses = [
            orderStatus,
            paymentStatus,
            shippingStatus
        ];

        if (!statuses.every(value =>
            Number.isSafeInteger(value) &&
            (value === -1 || value > 0)
        )) {
            return res.status(400).json({
                status: "FAILED",
                message: "Invalid status filter"
            });
        }

        // SEARCH VALIDATION

        if (typeof SEARCH !== "string" || SEARCH.length > 100) {
            return res.status(400).json({
                status: "FAILED",
                message: "SEARCH must not exceed 100 characters"
            });
        }

        const searchValue = SEARCH.trim();
        const searchPattern = `%${searchValue}%`;

        // FETCH ALL FILTERED ORDERS
        // NO LIMIT / OFFSET FOR EXPORT

        const sql = `
            SELECT
                o.ORDER_ID,
                o.ORDER_NUMBER,
                o.ORDER_DATE,
                o.SELLER_ID,
                o.CUSTOMER_ID,

                CONCAT_WS(
                    ' ',
                    c.FIRST_NAME,
                    c.LAST_NAME
                ) AS CUSTOMER_NAME,

                c.MOBILE_NUMBER AS CUSTOMER_MOBILE,

                o.PRODUCT_ID,
                p.PRODUCT_NAME,
                o.QUANTITY,
                o.TOTAL_AMOUNT AS ORDER_AMOUNT,
                o.PAYMENT_STATUS,
                o.ORDER_STATUS,
                o.SHIPPING_STATUS,
                o.DELIVERY_ADDRESS_ID,
                o.CREATED_BY,
                o.UPDATED_BY,
                o.CREATED_AT,
                o.UPDATED_AT

            FROM o_place_orders o

            LEFT JOIN m_customer_registration c
                ON c.CUSTOMER_ID = o.CUSTOMER_ID

            LEFT JOIN m_products p
                ON p.PRODUCT_ID = o.PRODUCT_ID

            WHERE
                (? = -1 OR o.SELLER_ID = ?)

                AND o.ORDER_DATE >= DATE_SUB(
                    CURDATE(),
                    INTERVAL ? DAY
                )

                AND o.ORDER_DATE < DATE_ADD(
                    CURDATE(),
                    INTERVAL 1 DAY
                )

                AND (
                    ? = -1
                    OR o.ORDER_STATUS = ?
                )

                AND (
                    ? = -1
                    OR o.PAYMENT_STATUS = ?
                )

                AND (
                    ? = -1
                    OR o.SHIPPING_STATUS = ?
                )

                AND (
                    ? = ''
                    OR o.ORDER_NUMBER LIKE ?
                    OR CONCAT_WS(
                        ' ',
                        c.FIRST_NAME,
                        c.LAST_NAME
                    ) LIKE ?
                    OR c.MOBILE_NUMBER LIKE ?
                )

            ORDER BY
                o.ORDER_DATE DESC,
                o.ORDER_ID DESC
        `;

        const params = [
            SELLER_ID,
            SELLER_ID,
            days,

            orderStatus,
            orderStatus,

            paymentStatus,
            paymentStatus,

            shippingStatus,
            shippingStatus,

            searchValue,
            searchPattern,
            searchPattern,
            searchPattern
        ];

        const [orders] = await db.query(sql, params);

        // CREATE EXCEL WORKBOOK

        const workbook = new ExcelJS.Workbook();

        workbook.creator = "Ecom Milex";
        workbook.created = new Date();

        const worksheet = workbook.addWorksheet("Order Management");

        worksheet.columns = [
            { header: "Order ID", key: "ORDER_ID", width: 12 },
            { header: "Order Number", key: "ORDER_NUMBER", width: 22 },
            { header: "Order Date", key: "ORDER_DATE", width: 22 },
            { header: "Seller ID", key: "SELLER_ID", width: 12 },
            { header: "Customer ID", key: "CUSTOMER_ID", width: 14 },
            { header: "Customer Name", key: "CUSTOMER_NAME", width: 25 },
            { header: "Customer Mobile", key: "CUSTOMER_MOBILE", width: 18 },
            { header: "Product ID", key: "PRODUCT_ID", width: 12 },
            { header: "Product Name", key: "PRODUCT_NAME", width: 25 },
            { header: "Quantity", key: "QUANTITY", width: 12 },
            { header: "Order Amount", key: "ORDER_AMOUNT", width: 16 },
            { header: "Payment Status", key: "PAYMENT_STATUS", width: 16 },
            { header: "Order Status", key: "ORDER_STATUS", width: 16 },
            { header: "Shipping Status", key: "SHIPPING_STATUS", width: 18 },
            { header: "Delivery Address ID", key: "DELIVERY_ADDRESS_ID", width: 20 },
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

        // ADD ALL FILTERED ORDERS

        orders.forEach(order => {
            worksheet.addRow(order);
        });

        // DATE FORMATTING

        ["ORDER_DATE", "CREATED_AT", "UPDATED_AT"].forEach(key => {

            const column = worksheet.getColumn(key);

            column.numFmt = "yyyy-mm-dd hh:mm:ss";

        });

        worksheet.autoFilter = {
            from: "A1",
            to: `${worksheet.getColumn(worksheet.columnCount).letter}1`
        };

        worksheet.views = [
            {
                state: "frozen",
                ySplit: 1
            }
        ];

        // SEND EXCEL FILE

        const buffer = await workbook.xlsx.writeBuffer();

        const fileName = `Order_Management_${new Date()
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

        console.error("ORDER MANAGEMENT DASHBOARD EXPORT ERROR:", error);

        return res.status(500).json({
            status: "FAILED",
            message: error.sqlMessage || error.message
        });

    }

});

module.exports = router;
