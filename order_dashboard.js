
const express = require("express");
const router = express.Router();
const db = require("./db");

// ==========================================
// GET FILTERED ORDER DETAILS
// GET /api/order_dashboard/get
// ==========================================

router.get("/get", async (req, res) => {
    try {

        const {
            DAYS = "7",
            ORDER_STATUS = "-1",
            PAYMENT_STATUS = "-1",
            SHIPPING_STATUS = "-1",
            LIMIT = "10",
            OFFSET = "0"
        } = req.query;

        // Validate BIGINT filter values as strings
        const bigintFilters = {
            ORDER_STATUS,
            PAYMENT_STATUS,
            SHIPPING_STATUS
        };

        for (const [key, value] of Object.entries(bigintFilters)) {
            if (!/^-1$|^[0-9]+$/.test(String(value))) {
                return res.status(400).json({
                    status: "FAILED",
                    message: `Invalid ${key}`
                });
            }
        }

        const days = Number(DAYS);
        const limit = Number(LIMIT);
        const offset = Number(OFFSET);

        if (![7, 30, 60, 90, 180].includes(days)) {
            return res.status(400).json({
                status: "FAILED",
                message: "Invalid DAYS"
            });
        }

        if (
            !Number.isSafeInteger(limit) ||
            limit <= 0 ||
            limit > 100 ||
            !Number.isSafeInteger(offset) ||
            offset < 0
        ) {
            return res.status(400).json({
                status: "FAILED",
                message: "Invalid LIMIT or OFFSET"
            });
        }

        const [result] = await db.query(
            "CALL sp_m_order_management_dashboard_get(?, ?, ?, ?, ?, ?)",
            [
                days,
                ORDER_STATUS,
                PAYMENT_STATUS,
                SHIPPING_STATUS,
                limit,
                offset
            ]
        );

        return res.status(200).json({
            status: "SUCCESS",
            message: "Orders fetched successfully",
            total_records: result[1][0].TOTAL_RECORDS,
            limit: limit,
            offset: offset,
            data: result[0]
        });

    } catch (error) {

        console.error("Order Dashboard GET Error:", error);

        return res.status(500).json({
            status: "FAILED",
            message: error.sqlMessage || error.message
        });

    }
});

module.exports = router;
