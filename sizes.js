const express = require("express");
const router = express.Router();
const db = require("./db");

// ==========================================
// GET SIZES
// GET /api/sizes/get
// ==========================================

router.get("/get", async (req, res) => {
    try {
        const {
            SIZE_ID = -1,
            LIMIT = 10,
            OFFSET = 0
        } = req.query;

        if (
            isNaN(SIZE_ID) ||
            isNaN(LIMIT) ||
            isNaN(OFFSET) ||
            Number(LIMIT) <= 0 ||
            Number(OFFSET) < 0
        ) {
            return res.status(400).json({
                status: "FAILED",
                message: "Invalid SIZE_ID, LIMIT or OFFSET"
            });
        }

        const [result] = await db.query(
            "CALL sp_m_sizes_get(?,?,?)",
            [
                Number(SIZE_ID),
                Number(LIMIT),
                Number(OFFSET)
            ]
        );

        return res.status(200).json({
            status: "SUCCESS",
            data: result[0]
        });

    } catch (error) {
        console.error("GET SIZES API ERROR:", error);

        return res.status(500).json({
            status: "FAILED",
            message: error.sqlMessage || "Internal server error"
        });
    }
});

module.exports = router;