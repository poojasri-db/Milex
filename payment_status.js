const express = require("express");
const router = express.Router();
const db = require("./db");

// ==========================================
// GET PAYMENT STATUS
// GET /api/payment-status/get
// ==========================================

router.get("/get", async (req, res) => {
    try {

        const {
            PAYMENT_STATUS_ID = -1,
            LIMIT = 10,
            OFFSET = 0
        } = req.query;

        const [result] = await db.query(
            "CALL sp_m_payment_status_get(?, ?, ?)",
            [
                Number(PAYMENT_STATUS_ID),
                Number(LIMIT),
                Number(OFFSET)
            ]
        );

        res.status(200).json({
            status: "SUCCESS",
            message: "Payment status details fetched successfully",
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