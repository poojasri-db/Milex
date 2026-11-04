
const express = require("express");
const router = express.Router();
const db = require("./db");

// ==========================================
// GET BRAND
// GET /api/brand/get
// ==========================================

router.get("/get", async (req, res) => {
    try {
        const {
            BRAND_ID,
            LIMIT,
            OFFSET
        } = req.query;

        const [result] = await db.query(
            "CALL sp_m_brand_get(?, ?, ?)",
            [
                BRAND_ID ?? -1,
                LIMIT ?? 10,
                OFFSET ?? 0
            ]
        );

        res.status(200).json({
            status: "SUCCESS",
            message: "Brand details fetched successfully",
            data: result[0]
        });

    } catch (error) {
        console.error("GET BRAND ERROR:", error);

        res.status(500).json({
            status: "ERROR",
            message: error.message
        });
    }
});

module.exports = router;
