const express = require("express");
const router = express.Router();
const db = require("./db");

// ==========================================
// ORDER STATUS GET
// GET /api/order-status/get
// ==========================================

router.get("/get", async (req, res) => {
    try {
        const {
            ORDER_STATUS_ID = -1,
            LIMIT = 10,
            OFFSET = 0
        } = req.query;

        const [result] = await db.query(
            "CALL sp_m_order_status_get(?, ?, ?)",
            [
                Number(ORDER_STATUS_ID),
                Number(LIMIT),
                Number(OFFSET)
            ]
        );

        res.status(200).json({
            status: "SUCCESS",
            message: "Order status details fetched successfully",
            data: result[0] || []
        });

    } catch (error) {
        res.status(400).json({
            status: "FAILED",
            message: error.sqlMessage || error.message
        });
    }
});

module.exports = router;