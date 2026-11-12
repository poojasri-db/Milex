
const express = require("express");
const router = express.Router();
const db = require("./db");
const authenticateToken = require("./auth_middleware");

// ==========================================
// SELLER VERIFICATION DASHBOARD
// GET /api/seller-verification-dashboard/dashboard
// ADMIN ONLY
// ==========================================

router.get("/dashboard", authenticateToken, async (req, res) => {
    try {

        // ADMIN AUTHORIZATION
        const userType = String(
            req.user.USER_TYPE || ""
        ).trim().toUpperCase();

        if (userType !== "ADMIN") {
            return res.status(403).json({
                status: "FAILED",
                message: "Only admin users can access seller verification dashboard"
            });
        }

        const DAYS = req.query.DAYS || 7;

        if (!/^\d+$/.test(String(DAYS)) || Number(DAYS) <= 0) {
            return res.status(400).json({
                status: "FAILED",
                message: "Invalid DAYS value"
            });
        }

        const [result] = await db.query(
            "CALL sp_o_seller_verification_dashboard(?)",
            [Number(DAYS)]
        );

        return res.status(200).json({
            status: "SUCCESS",
            data: result[0][0]
        });

    } catch (error) {
        console.error("SELLER VERIFICATION DASHBOARD ERROR:", error);

        return res.status(500).json({
            status: "FAILED",
            message: error.sqlMessage || error.message
        });
    }
});

module.exports = router;
