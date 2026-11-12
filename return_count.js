
const express = require("express");
const router = express.Router();
const db = require("./db");
const authenticateToken = require("./auth_middleware");

// ==========================================
// RETURN REQUEST DASHBOARD COUNT
// GET /api/return-requests/count
// ADMIN ONLY
// ==========================================

router.get("/count", authenticateToken, async (req, res) => {
    try {

        // ==========================================
        // ADMIN AUTHORIZATION
        // ==========================================

        if (
            String(req.user.USER_TYPE || "").trim().toUpperCase() !== "ADMIN"
        ) {
            return res.status(403).json({
                success: false,
                message: "Access denied. Admin only."
            });
        }

        // ==========================================
        // CALL STORED PROCEDURE
        // ==========================================

        const [result] = await db.query(
            "CALL sp_o_return_requests_count()"
        );

        const data = result[0][0] || {};

        // ==========================================
        // SUCCESS RESPONSE
        // ==========================================

        return res.status(200).json({
            success: true,
            message: "Return request counts fetched successfully",
            data: {
                TOTAL_REQUESTS: data.TOTAL_REQUESTS || 0,
                PENDING: data.PENDING || 0,
                IN_TRANSIT: data.IN_TRANSIT || 0,
                APPROVED: data.APPROVED || 0,
                REJECTED: data.REJECTED || 0
            }
        });

    } catch (error) {

        console.error("Return Request Count Error:", error);

        return res.status(500).json({
            success: false,
            message: error.sqlMessage || error.message
        });

    }
});

module.exports = router;
