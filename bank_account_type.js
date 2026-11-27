
const express = require("express");
const router = express.Router();
const db = require("./db");

// ==========================================
// GET BANK ACCOUNT TYPES
// GET /api/bank-account-type/get/:id
// No Authentication Required
// Use -1 to get all records
// ==========================================

router.get("/get/:id", async (req, res) => {
    try {
        const ACCOUNT_TYPE_ID = Number(req.params.id);

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

        const [result] = await db.query(
            "CALL sp_m_bank_account_type_get(?)",
            [String(ACCOUNT_TYPE_ID)]
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
