const express = require("express");
const router = express.Router();
const db = require("./db");

// ==========================================
// GET CATEGORY
// GET /api/category/get
// ==========================================

router.get("/get", async (req, res) => {
    try {
        const {
            CATEGORY_ID,
            LIMIT,
            OFFSET
        } = req.query;

        const [result] = await db.query(
            "CALL sp_m_category_get(?, ?, ?)",
            [
                CATEGORY_ID || "-1",
                LIMIT ?? 10,
                OFFSET ?? 0
            ]
        );

        res.status(200).json({
            status: "SUCCESS",
            message: "Category details fetched successfully",
            data: result[0]
        });

    } catch (error) {
        console.error("GET CATEGORY ERROR:", error);

        res.status(500).json({
            status: "ERROR",
            message: error.message
        });
    }
});

module.exports = router;