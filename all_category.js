const express = require("express");
const router = express.Router();
const db = require("./db");

// ==========================================
// GET ALL CATEGORY NAMES
// GET /api/category/get
// ==========================================

router.get("/get", async (req, res) => {
    try {
        const [result] = await db.query(
            "CALL sp_m_category_get(?, ?, ?)",
            [-1, 100, 0]
        );

        return res.status(200).json({
            status: "SUCCESS",
            message: "Category names fetched successfully",
            data: result[0] || []
        });

    } catch (error) {
        console.error("GET CATEGORY ERROR:", error);

        return res.status(500).json({
            status: "ERROR",
            message: error.sqlMessage || error.message
        });
    }
});

module.exports = router;