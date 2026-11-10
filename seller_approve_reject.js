const express = require("express");
const router = express.Router();
const db = require("./db");

// ==========================================
// SELLER APPROVE / REJECT
// PUT /api/seller-approval/update
// ==========================================

router.put("/update", async (req, res) => {
    try {
        const {
            SELLER_ID,
            DECISION,
            UPDATED_BY
        } = req.body;

        if (!SELLER_ID || !DECISION || !UPDATED_BY) {
            return res.status(400).json({
                status: "FAILED",
                message: "SELLER_ID, DECISION and UPDATED_BY are required"
            });
        }

        const decision = String(DECISION).trim().toUpperCase();

        if (!["APPROVED", "REJECTED"].includes(decision)) {
            return res.status(400).json({
                status: "FAILED",
                message: "DECISION must be APPROVED or REJECTED"
            });
        }

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