
const express = require("express");
const router = express.Router();
const db = require("./db");
const authenticateToken = require("./auth_middleware");

// ==========================================
// BUSINESS TYPE GET
// GET /api/business-type/get
// ADMIN + SELLER
// ==========================================

router.get("/get", authenticateToken, async (req, res) => {
    try {
        const userType = String(req.user.USER_TYPE || "")
            .trim()
            .toUpperCase();

        if (!["ADMIN", "SELLER"].includes(userType)) {
            return res.status(403).json({
                STATUS: "FAILURE",
                MESSAGE: "Access denied. Admin or Seller only."
            });
        }

        const {
            BUSINESS_TYPE_ID = "-1"
        } = req.query;

        const businessTypeId = Number(BUSINESS_TYPE_ID);

        if (
            !Number.isSafeInteger(businessTypeId) ||
            (businessTypeId !== -1 && businessTypeId <= 0)
        ) {
            return res.status(400).json({
                STATUS: "FAILURE",
                MESSAGE: "BUSINESS_TYPE_ID must be -1 or a positive integer"
            });
        }

        const [result] = await db.query(
            "CALL sp_m_business_type_get(?)",
            [businessTypeId]
        );

        return res.status(200).json({
            STATUS: "SUCCESS",
            MESSAGE: "Business type details retrieved successfully",
            DATA: result[0] || []
        });

    } catch (error) {
        console.error("Business Type GET Error:", error);

        return res.status(500).json({
            STATUS: "FAILURE",
            MESSAGE: error.sqlMessage || error.message
        });
    }
});

module.exports = router;
