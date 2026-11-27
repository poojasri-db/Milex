
const express = require("express");
const router = express.Router();

const db = require("./db");
const authenticateToken = require("./auth_middleware");

// ==========================================
// GET TAX RATE
// GET /api/tax_rate/get
// Access: ADMIN, SELLER
// ==========================================

router.get("/get", authenticateToken, async (req, res) => {
    try {

        // ROLE VALIDATION
        const userType = String(req.user.USER_TYPE || "")
            .trim()
            .toUpperCase();

        if (!["ADMIN", "SELLER"].includes(userType)) {
            return res.status(403).json({
                status: "FAILED",
                message: "Access denied. Admin or Seller only."
            });
        }

        // QUERY PARAMETERS
        const { TAX_RATE_ID = "-1" } = req.query;

        const taxRateId = Number(TAX_RATE_ID);

        // VALIDATION
        if (
            !Number.isSafeInteger(taxRateId) ||
            (taxRateId !== -1 && taxRateId <= 0)
        ) {
            return res.status(400).json({
                status: "FAILED",
                message: "TAX_RATE_ID must be -1 or a positive integer"
            });
        }

        // DATABASE CALL
        const [result] = await db.query(
            "CALL sp_m_tax_rate_get(?)",
            [taxRateId]
        );

        const rows = result[0] || [];

        return res.status(200).json({
            status: "SUCCESS",
            message: "Tax rate details fetched successfully",
            count: rows.length,
            data: rows
        });

    } catch (error) {
        console.error("GET TAX RATE ERROR:", error);

        return res.status(500).json({
            status: "ERROR",
            message: error.sqlMessage || error.message
        });
    }
});

module.exports = router;
