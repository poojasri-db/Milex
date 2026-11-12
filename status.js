const express = require("express");
const router = express.Router();
const db = require("./db");
const authenticateToken = require("./auth_middleware");

// ==========================================
// GET STATUS
// GET /api/status/get/:id?limit=10&offset=0
// Use -1 to get all records
// Access: ADMIN, SELLER, CUSTOMER
// ==========================================

router.get("/get/:id", authenticateToken, async (req, res) => {
    try {

        // ROLE VALIDATION
        const userType = String(req.user.USER_TYPE || "")
            .trim()
            .toUpperCase();

        if (!["ADMIN", "SELLER", "CUSTOMER"].includes(userType)) {
            return res.status(403).json({
                STATUS: "ERROR",
                MESSAGE: "Access denied. Admin, Seller or Customer only."
            });
        }

        // QUERY PARAMETERS
        const STATUS_ID = Number(req.params.id);

        const LIMIT = req.query.limit === undefined
            ? 10
            : Number(req.query.limit);

        const OFFSET = req.query.offset === undefined
            ? 0
            : Number(req.query.offset);

        // STATUS ID VALIDATION
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

        // LIMIT AND OFFSET VALIDATION
        if (
            !Number.isSafeInteger(LIMIT) ||
            LIMIT <= 0 ||
            LIMIT > 100 ||
            !Number.isSafeInteger(OFFSET) ||
            OFFSET < 0
        ) {
            return res.status(400).json({
                STATUS: "ERROR",
                MESSAGE: "LIMIT must be between 1 and 100 and OFFSET must be zero or greater"
            });
        }

        // DATABASE CALL
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