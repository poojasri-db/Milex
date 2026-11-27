
const express = require("express");
const router = express.Router();

const db = require("./db");
const authenticateToken = require("./auth_middleware");

// ==========================================
// GET STATUS
// GET /api/status/get/:id
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

        // STATUS ID
        const STATUS_ID = String(req.params.id).trim();

        // VALIDATION
        if (
            !/^-?\d+$/.test(STATUS_ID) ||
            !Number.isSafeInteger(Number(STATUS_ID)) ||
            (Number(STATUS_ID) !== -1 && Number(STATUS_ID) <= 0)
        ) {
            return res.status(400).json({
                STATUS: "ERROR",
                MESSAGE: "Provide a valid STATUS_ID or use -1 for all records"
            });
        }

        // DATABASE CALL
        const [result] = await db.query(
            "CALL sp_m_status_get(?)",
            [STATUS_ID]
        );

        const rows = result?.[0] || [];

        return res.status(200).json({
            STATUS: "SUCCESS",
            MESSAGE: rows.length
                ? "Status retrieved successfully"
                : "No status found",
            COUNT: rows.length,
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
