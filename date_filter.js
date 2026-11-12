
const express = require("express");
const router = express.Router();
const db = require("./db");
const authenticateToken = require("./auth_middleware");

// ==========================================
// GET DATE FILTER
// GET /api/date-filter/get
// ADMIN ONLY
// ==========================================

router.get("/get", authenticateToken, async (req, res) => {
    try {
        const userType = String(req.user.USER_TYPE || "")
            .trim()
            .toUpperCase();

        if (userType !== "ADMIN") {
            return res.status(403).json({
                status: "FAILED",
                message: "Access denied. Admin only."
            });
        }

        const {
            DATE_FILTER_ID = "-1",
            LIMIT = "10",
            OFFSET = "0"
        } = req.query;

        const dateFilterId = Number(DATE_FILTER_ID);
        const limit = Number(LIMIT);
        const offset = Number(OFFSET);

        if (
            !Number.isSafeInteger(dateFilterId) ||
            (dateFilterId !== -1 && dateFilterId <= 0)
        ) {
            return res.status(400).json({
                status: "FAILED",
                message: "DATE_FILTER_ID must be -1 or a positive integer"
            });
        }

        if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
            return res.status(400).json({
                status: "FAILED",
                message: "LIMIT must be between 1 and 100"
            });
        }

        if (!Number.isSafeInteger(offset) || offset < 0) {
            return res.status(400).json({
                status: "FAILED",
                message: "OFFSET must be zero or a positive integer"
            });
        }

        const [result] = await db.query(
            "CALL sp_m_date_filter_get(?,?,?)",
            [
                dateFilterId,
                limit,
                offset
            ]
        );

        return res.status(200).json({
            status: "SUCCESS",
            message: "Date filter details fetched successfully",
            data: result[0] || []
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
