const express = require("express");
const router = express.Router();
const db = require("./db");

// ==========================================
// GET SHIPPING STATUS
// GET /api/shipping-status/get
// ==========================================

router.get("/get", async (req, res) => {
    try {

        const {
            SHIPPING_STATUS_ID = -1,
            LIMIT = 10,
            OFFSET = 0
        } = req.query;

        const [result] = await db.query(
            "CALL sp_m_shipping_status_get(?, ?, ?)",
            [
                Number(SHIPPING_STATUS_ID),
                Number(LIMIT),
                Number(OFFSET)
            ]
        );

        res.status(200).json({
            status: "SUCCESS",
            message: "Shipping status details fetched successfully",
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