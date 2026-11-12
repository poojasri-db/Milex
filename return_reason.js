
const express = require("express");
const router = express.Router();
const db = require("./db");
const authenticateToken = require("./auth_middleware");

// ==========================================
// GET RETURN REASONS
// GET /api/return-reasons/get
// ADMIN + CUSTOMER
// ==========================================

router.get("/get", authenticateToken, async (req, res) => {
    try {
        const userType = String(req.user.USER_TYPE || "")
            .trim()
            .toUpperCase();

        if (!["ADMIN", "CUSTOMER"].includes(userType)) {
            return res.status(403).json({
                success: false,
                message: "Access denied. Admin or Customer only."
            });
        }

        const {
            REASON_ID = "-1",
            REASON = "-1",
            LIMIT = "10",
            OFFSET = "0"
        } = req.query;

        const reasonId = Number(REASON_ID);
        const limit = Number(LIMIT);
        const offset = Number(OFFSET);

        if (
            !Number.isSafeInteger(reasonId) ||
            (reasonId !== -1 && reasonId <= 0)
        ) {
            return res.status(400).json({
                success: false,
                message: "REASON_ID must be -1 or a positive integer"
            });
        }

        if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
            return res.status(400).json({
                success: false,
                message: "LIMIT must be between 1 and 100"
            });
        }

        if (!Number.isSafeInteger(offset) || offset < 0) {
            return res.status(400).json({
                success: false,
                message: "OFFSET must be zero or a positive integer"
            });
        }

        const [result] = await db.query(
            "CALL sp_m_return_reasons_get(?, ?, ?, ?)",
            [
                reasonId,
                typeof REASON === "string" ? REASON.trim() : "-1",
                limit,
                offset
            ]
        );

        return res.status(200).json({
            success: true,
            message: "Return reasons fetched successfully",
            data: result[0]
        });

    } catch (error) {
        console.error("Return Reason Get Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch return reasons",
            error: error.sqlMessage || error.message
        });
    }
});

module.exports = router;
