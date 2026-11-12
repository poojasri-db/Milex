
const express = require("express");
const router = express.Router();
const db = require("./db");
const authenticateToken = require("./auth_middleware");

// ==========================================
// SELLER APPROVE / REJECT
// PUT /api/seller-approval/update
// ADMIN AUTHENTICATION REQUIRED
// ==========================================

router.put("/update", authenticateToken, async (req, res) => {
    try {
        const {
            SELLER_ID,
            DECISION
        } = req.body || {};

        // Validate input
        if (!SELLER_ID || !DECISION) {
            return res.status(400).json({
                status: "FAILED",
                message: "SELLER_ID and DECISION are required"
            });
        }

        // Check admin role
        const userType = String(
            req.user.USER_TYPE || ""
        ).trim().toUpperCase();

        if (userType !== "ADMIN") {
            return res.status(403).json({
                status: "FAILED",
                message: "Only admin users can approve or reject sellers"
            });
        }

        const decision = String(DECISION).trim().toUpperCase();

        if (!["APPROVED", "REJECTED"].includes(decision)) {
            return res.status(400).json({
                status: "FAILED",
                message: "DECISION must be APPROVED or REJECTED"
            });
        }

        // Get UPDATED_BY from authenticated token
        const UPDATED_BY = req.user.USER_ID;

        const [result] = await db.query(
            "CALL sp_m_seller_approve_reject(?,?,?)",
            [
                SELLER_ID,
                decision,
                UPDATED_BY
            ]
        );

        return res.status(200).json({
            status: "SUCCESS",
            message: result[0][0].MESSAGE,
            data: result[0][0]
        });

    } catch (error) {
        console.error("SELLER APPROVAL API ERROR:", error);

        return res.status(500).json({
            status: "FAILED",
            message: error.sqlMessage || "Internal server error"
        });
    }
});

module.exports = router;
