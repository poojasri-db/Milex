const express = require("express");
const router = express.Router();
const db = require("./db");

// ==========================================
// ORDER MANAGEMENT DASHBOARD COUNT
// GET /api/order_management/dashboard-count
// ==========================================

router.get("/get", async (req, res) => {
    try {

        const {
            DAYS = 7
        } = req.query;

        const [result] = await db.query(
            "CALL sp_m_order_management_dashboard_count(?)",
            [
                Number(DAYS)
            ]
        );

        res.status(200).json({
            status: "SUCCESS",
            message: "Order dashboard counts fetched successfully",
            data: result[0][0] || {}
        });

    } catch (error) {

        res.status(400).json({
            status: "FAILED",
            message: error.sqlMessage || error.message
        });

    }
});

module.exports = router;