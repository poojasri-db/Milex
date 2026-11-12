
const express = require("express");
const router = express.Router();
const db = require("./db");
const authenticateToken = require("./auth_middleware");

// ==========================================
// ORDER MANAGEMENT DASHBOARD COUNT
// GET /api/order_management/dashboard-count/get
// ADMIN ONLY
// ==========================================

router.get("/get", authenticateToken, async (req, res) => {
    try {

        // ==========================================
        // ADMIN AUTHORIZATION
        // ==========================================

        if (
            String(req.user.USER_TYPE || "").trim().toUpperCase() !== "ADMIN"
        ) {
            return res.status(403).json({
                status: "FAILED",
                message: "Access denied. Admin only."
            });
        }

        // ==========================================
        // GET REQUEST PARAMETERS
        // ==========================================

        const {
            DAYS = 7
        } = req.query;

        const days = Number(DAYS);

        if (!Number.isInteger(days) || days <= 0) {
            return res.status(400).json({
                status: "FAILED",
                message: "DAYS must be a positive integer"
            });
        }

        // ==========================================
        // CALL STORED PROCEDURE
        // ==========================================

        const [result] = await db.query(
            "CALL sp_m_order_management_dashboard_count(?)",
            [days]
        );

        // ==========================================
        // SUCCESS RESPONSE
        // ==========================================

        return res.status(200).json({
            status: "SUCCESS",
            message: "Order dashboard counts fetched successfully",
            data: result[0][0] || {}
        });

    } catch (error) {

        console.error("ORDER DASHBOARD ERROR:", error);

        return res.status(400).json({
            status: "FAILED",
            message: error.sqlMessage || error.message
        });

    }
});

module.exports = router;
