
const express = require("express");
const router = express.Router();
const db = require("./db");
const authenticateToken = require("./auth_middleware");

// ==========================================
// ORDER STATUS GET
// GET /api/order-status/get
// ADMIN + CUSTOMER + SELLER
// ==========================================

router.get("/get", authenticateToken, async (req, res) => {
    try {
        const userType = String(req.user.USER_TYPE || "")
            .trim()
            .toUpperCase();

        if (!["ADMIN", "CUSTOMER", "SELLER"].includes(userType)) {
            return res.status(403).json({
                status: "FAILED",
                message: "Access denied."
            });
        }

        const { ORDER_STATUS_ID = "-1" } = req.query;

        const orderStatusId = Number(ORDER_STATUS_ID);

        if (
            !Number.isSafeInteger(orderStatusId) ||
            (orderStatusId !== -1 && orderStatusId <= 0)
        ) {
            return res.status(400).json({
                status: "FAILED",
                message: "ORDER_STATUS_ID must be -1 or a positive integer"
            });
        }

        const [result] = await db.query(
            "CALL sp_m_order_status_get(?)",
            [orderStatusId]
        );

        const rows = result[0] || [];

        return res.status(200).json({
            status: "SUCCESS",
            message: rows.length
                ? "Order status details fetched successfully"
                : "No order status details found",
            count: rows.length,
            data: rows
        });

    } catch (error) {
        console.error("Order Status GET Error:", error);

        return res.status(500).json({
            status: "FAILED",
            message: error.sqlMessage || error.message
        });
    }
});

module.exports = router;
