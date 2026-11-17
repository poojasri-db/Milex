
const express = require("express");
const router = express.Router();
const db = require("./db");
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
                message: "Only admin can view all sellers"
            });
        }

        // STATUS VALIDATION
        const statuses = [
            orderStatus,
            paymentStatus,
            shippingStatus
        ];

        if (!statuses.every(
            value => Number.isSafeInteger(value) &&
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

        // PAGINATION VALIDATION
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

        // STORED PROCEDURE CALL
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

        // RESULT SET 1 - KPI CARDS
        const dashboard = result[0] && result[0][0]
            ? result[0][0]
            : {};

        // RESULT SET 2 - ORDER DETAILS
        const orders = result[1] || [];

        // RESULT SET 3 - TOTAL RECORDS
        const totalRecords = result[2] && result[2][0]
            ? result[2][0].TOTAL_RECORDS
            : 0;

        return res.status(200).json({
            status: "SUCCESS",
            message: "Order management dashboard fetched successfully",

            dashboard: dashboard,

            total_records: totalRecords,

            data: orders
        });

    } catch (error) {

        console.error(
            "ORDER MANAGEMENT DASHBOARD GET API ERROR:",
            error
        );

        return res.status(500).json({
            status: "FAILED",
            message: error.sqlMessage || error.message
        });

    }

});

module.exports = router;
