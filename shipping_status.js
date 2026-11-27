
const express = require("express");
const router = express.Router();
const db = require("./db");
const authenticateToken = require("./auth_middleware");

// ==========================================
// GET SHIPPING STATUS
// GET /api/shipping-status/get
// Access: ADMIN, SELLER, CUSTOMER
// ==========================================

router.get("/get", authenticateToken, async (req, res) => {
    try {

        // ROLE VALIDATION
        const userType = String(req.user.USER_TYPE || "")
            .trim()
            .toUpperCase();

        if (!["ADMIN", "SELLER", "CUSTOMER"].includes(userType)) {
            return res.status(403).json({
                status: "FAILED",
                message: "Access denied. Admin, Seller or Customer only."
            });
        }

        // QUERY PARAMETER
        const {
            SHIPPING_STATUS_ID = "-1"
        } = req.query;

        const shippingStatusId = Number(SHIPPING_STATUS_ID);

        // VALIDATION
        if (
            !Number.isInteger(shippingStatusId) ||
            (shippingStatusId !== -1 && shippingStatusId <= 0)
        ) {
            return res.status(400).json({
                status: "FAILED",
                message: "SHIPPING_STATUS_ID must be -1 or a positive integer"
            });
        }

        // DATABASE CALL
        const [result] = await db.query(
            "CALL sp_m_shipping_status_get(?)",
            [shippingStatusId]
        );

        const responseData = result[0] || [];

        return res.status(200).json({
            status: "SUCCESS",
            message: "Shipping status details fetched successfully",
            count: responseData.length,
            data: responseData
        });

    } catch (error) {

        console.error("Shipping Status GET Error:", error);

        return res.status(500).json({
            status: "FAILED",
            message: error.sqlMessage || error.message
        });

    }
});

module.exports = router;
