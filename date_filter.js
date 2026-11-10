const express = require("express");
const router = express.Router();
const db = require("./db");

// ==========================================
// GET DATE FILTER
// GET /api/date-filter/get
// ==========================================

router.get("/get", async (req, res) => {
    try {
        const {
            DATE_FILTER_ID = -1,
            LIMIT = 10,
            OFFSET = 0
        } = req.query;

        const [result] = await db.query(
            "CALL sp_m_date_filter_get(?,?,?)",
            [
                Number(DATE_FILTER_ID),
                Number(LIMIT),
                Number(OFFSET)
            ]
        );

        return res.status(200).json({
            status: "SUCCESS",
            data: result[0]
        });

    } catch (error) {
        console.error("GET DATE FILTER API ERROR:", error);

        return res.status(500).json({
            status: "FAILED",
            message: error.sqlMessage || "Internal server error"
        });
    }
});

module.exports = router;