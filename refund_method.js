
const express = require("express");
const router = express.Router();

const db = require("./db");
const authenticateToken = require("./auth_middleware");

// ==========================================
// GET REFUND METHODS
// GET /api/refund-methods
// ==========================================

router.get("/", authenticateToken, async (req, res) => {
    try {
        const {
            REFUND_METHOD_ID = "-1"
        } = req.query;

        const refundMethodId = Number(REFUND_METHOD_ID);

        if (
            !Number.isSafeInteger(refundMethodId) ||
            (refundMethodId !== -1 && refundMethodId <= 0)
        ) {
            return res.status(400).json({
                STATUS: "ERROR",
                MESSAGE: "REFUND_METHOD_ID must be -1 or a positive integer"
            });
        }

        const [result] = await db.query(
            "CALL sp_m_refund_methods_get(?)",
            [refundMethodId]
        );

        const rows = result[0] || [];

        return res.status(200).json({
            STATUS: "SUCCESS",
            MESSAGE: rows.length
                ? "Refund methods fetched successfully"
                : "No active refund methods found",
            COUNT: rows.length,
            DATA: rows
        });

    } catch (error) {
        console.error("Refund Methods Get Error:", error);

        return res.status(500).json({
            STATUS: "ERROR",
            MESSAGE: error.sqlMessage || error.message
        });
    }
});

module.exports = router;
