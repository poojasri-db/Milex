
const express = require("express");
const router = express.Router();
const db = require("./db");
const authenticateToken = require("./auth_middleware");

// ==========================================
// GET SELLER VERIFICATION DETAILS
// GET /api/seller-verification/get
// ADMIN ONLY
// ==========================================

router.get("/get", authenticateToken, async (req, res) => {
    try {

        // ADMIN AUTHORIZATION
        const userType = String(
            req.user.USER_TYPE || ""
        ).trim().toUpperCase();

        if (userType !== "ADMIN") {
            return res.status(403).json({
                success: false,
                message: "Only admin users can access seller verification details"
            });
        }

        const {
            BUSINESS_TYPE_ID = "-1",
            SELLER_ID = "-1",
            DOCUMENT_VERIFICATION_STATUS = "-1",
            DAYS = 7,
            LIMIT = 10,
            OFFSET = 0
        } = req.query;

        const days = Number(DAYS);
        const limit = Number(LIMIT);
        const offset = Number(OFFSET);

        if (
            !Number.isInteger(days) || days <= 0 ||
            !Number.isInteger(limit) || limit <= 0 ||
            !Number.isInteger(offset) || offset < 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid DAYS, LIMIT or OFFSET"
            });
        }

        const [result] = await db.query(
            "CALL sp_o_seller_verification_get(?,?,?,?,?,?)",
            [
                BUSINESS_TYPE_ID,
                SELLER_ID,
                DOCUMENT_VERIFICATION_STATUS,
                days,
                limit,
                offset
            ]
        );

        return res.status(200).json({
            success: true,
            message: "Seller verification details fetched successfully",
            data: result[0] || []
        });

    } catch (error) {
        console.error("SELLER VERIFICATION GET ERROR:", error);

        return res.status(500).json({
            success: false,
            message: error.sqlMessage || "Failed to fetch seller verification details"
        });
    }
});

module.exports = router;
