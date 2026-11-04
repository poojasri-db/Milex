
const express = require("express");
const router = express.Router();
const db = require("./db");

// ==========================================
// GET TAX RATE
// GET /api/tax_rate/get
// ==========================================

router.get("/get", async (req, res) => {
    try {
        const {
            TAX_RATE_ID,
            LIMIT,
            OFFSET
        } = req.query;

        const [result] = await db.query(
            "CALL sp_m_tax_rate_get(?, ?, ?)",
            [
                TAX_RATE_ID ?? -1,
                LIMIT ?? 10,
                OFFSET ?? 0
            ]
        );

        res.status(200).json({
            status: "SUCCESS",
            message: "Tax rate details fetched successfully",
            data: result[0]
        });

    } catch (error) {
        console.error("GET TAX RATE ERROR:", error);

        res.status(500).json({
            status: "ERROR",
            message: error.message
        });
    }
});

module.exports = router;
