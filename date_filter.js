
const express = require("express");
const router = express.Router();
const db = require("./db");

// ==========================================
// GET DATE FILTER
// GET /api/date-filter/get
// ==========================================

router.get("/get", async (req, res) => {
    try {
        const { DATE_FILTER_ID = "-1" } = req.query;

        const dateFilterId = Number(DATE_FILTER_ID);

        if (
            !Number.isSafeInteger(dateFilterId) ||
            (dateFilterId !== -1 && dateFilterId <= 0)
        ) {
            return res.status(400).json({
                status: "FAILED",
                message: "DATE_FILTER_ID must be -1 or a positive integer"
            });
        }

        const [result] = await db.query(
            "CALL sp_m_date_filter_get(?)",
            [dateFilterId]
        );

        const rows = result[0] || [];

        return res.status(200).json({
            status: "SUCCESS",
            message: rows.length
                ? "Date filter details fetched successfully"
                : "No date filter details found",
            count: rows.length,
            data: rows
        });

    } catch (error) {
        console.error("GET DATE FILTER API ERROR:", error);

        return res.status(500).json({
            status: "FAILED",
            message: error.sqlMessage || error.message
        });
    }
});

module.exports = router;
