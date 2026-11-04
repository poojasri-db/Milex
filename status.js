const express = require("express");
const router = express.Router();
const db = require("./db");

// ==========================================
// GET STATUS
// GET /api/status/get/:id?limit=10&offset=0
// Use -1 to get all records
// ==========================================

router.get("/get/:id", async (req, res) => {
    try {
        const STATUS_ID = Number(req.params.id);

        const LIMIT = Number(req.query.limit) || 10;
        const OFFSET = Number(req.query.offset) || 0;

        if (
            !Number.isSafeInteger(STATUS_ID) ||
            STATUS_ID < -1 ||
            STATUS_ID === 0
        ) {
            return res.status(400).json({
                STATUS: "ERROR",
                MESSAGE: "Provide a valid STATUS_ID or use -1 for all records"
            });
        }

        if (
            !Number.isSafeInteger(LIMIT) ||
            LIMIT <= 0 ||
            !Number.isSafeInteger(OFFSET) ||
            OFFSET < 0
        ) {
            return res.status(400).json({
                STATUS: "ERROR",
                MESSAGE: "Invalid LIMIT or OFFSET"
            });
        }

        const [result] = await db.query(
            "CALL sp_m_status_get(?, ?, ?)",
            [
                STATUS_ID,
                LIMIT,
                OFFSET
            ]
        );

        const rows = result?.[0] || [];

        return res.status(200).json({
            STATUS: "SUCCESS",
            MESSAGE: rows.length
                ? "Status retrieved successfully"
                : "No status found",
            DATA: rows
        });

    } catch (error) {
        console.error("Status get error:", error);

        return res.status(500).json({
            STATUS: "ERROR",
            MESSAGE: "Failed to get status",
            ERROR: error.sqlMessage || error.message
        });
    }
});

module.exports = router;