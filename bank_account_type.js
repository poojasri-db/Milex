
const express = require("express");
const router = express.Router();
const db = require("./db");
const authenticateToken = require("./auth_middleware");

// ==========================================
// GET BANK ACCOUNT TYPES
// GET /api/bank-account-type/get/:id?limit=10&offset=0
// ADMIN + SELLER
// Use -1 to get all records
// ==========================================

router.get("/get/:id", authenticateToken, async (req, res) => {
    try {
        const userType = String(req.user.USER_TYPE || "")
            .trim()
            .toUpperCase();

        if (!["ADMIN", "SELLER"].includes(userType)) {
            return res.status(403).json({
                STATUS: "ERROR",
                MESSAGE: "Access denied. Admin or Seller only."
            });
        }

        const ACCOUNT_TYPE_ID = Number(req.params.id);

        const LIMIT = req.query.limit === undefined
            ? 10
            : Number(req.query.limit);

        const OFFSET = req.query.offset === undefined
            ? 0
            : Number(req.query.offset);

        if (
            !Number.isSafeInteger(ACCOUNT_TYPE_ID) ||
            ACCOUNT_TYPE_ID < -1 ||
            ACCOUNT_TYPE_ID === 0
        ) {
            return res.status(400).json({
                STATUS: "ERROR",
                MESSAGE: "Provide a valid ACCOUNT_TYPE_ID or use -1 for all records"
            });
        }

        if (
            !Number.isSafeInteger(LIMIT) ||
            LIMIT <= 0 ||
            LIMIT > 100 ||
            !Number.isSafeInteger(OFFSET) ||
            OFFSET < 0
        ) {
            return res.status(400).json({
                STATUS: "ERROR",
                MESSAGE: "Invalid LIMIT or OFFSET"
            });
        }

        const [result] = await db.query(
            "CALL sp_m_bank_account_type_get(?, ?, ?)",
            [
                ACCOUNT_TYPE_ID,
                LIMIT,
                OFFSET
            ]
        );

        const rows = result?.[0] || [];

        return res.status(200).json({
            STATUS: "SUCCESS",
            MESSAGE: rows.length
                ? "Bank account types retrieved successfully"
                : "No bank account types found",
            DATA: rows
        });

    } catch (error) {
        console.error("Bank account type get error:", error);

        return res.status(500).json({
            STATUS: "ERROR",
            MESSAGE: "Failed to get bank account types",
            ERROR: error.sqlMessage || error.message
        });
    }
});

module.exports = router;
