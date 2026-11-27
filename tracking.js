
const express = require("express");
const router = express.Router();

const db = require("./db");
const authenticateToken = require("./auth_middleware");

// GET SHIPMENT TRACKING API
router.get("/", authenticateToken, async (req, res) => {
    try {
        const USER_TYPE = String(
            req.user.role || req.user.USER_TYPE || ""
        ).trim().toUpperCase();

        const CUSTOMER_ID = req.user.CUSTOMER_ID;
        const SELLER_ID = req.user.SELLER_ID;

        // Allow only ADMIN, CUSTOMER and SELLER
        if (!["ADMIN", "CUSTOMER", "SELLER"].includes(USER_TYPE)) {
            return res.status(403).json({
                success: false,
                message: "Access denied. Only admin, customers and sellers can view shipment tracking."
            });
        }

        // Validate customer ID
        if (USER_TYPE === "CUSTOMER" && !CUSTOMER_ID) {
            return res.status(400).json({
                success: false,
                message: "Customer ID not found in login token. Please login again."
            });
        }

        // Validate seller ID
        if (USER_TYPE === "SELLER" && !SELLER_ID) {
            return res.status(400).json({
                success: false,
                message: "Seller ID not found in login token. Please login again."
            });
        }

        const {
            ORDER_ID = 0,
            ORDER_NUMBER = "-1",
            LIMIT = 10,
            OFFSET = 0
        } = req.query;

        // Validate pagination
        const limit = Number(LIMIT);
        const offset = Number(OFFSET);

        if (!Number.isInteger(limit) || limit <= 0) {
            return res.status(400).json({
                success: false,
                message: "LIMIT must be a positive integer"
            });
        }

        if (!Number.isInteger(offset) || offset < 0) {
            return res.status(400).json({
                success: false,
                message: "OFFSET must be a non-negative integer"
            });
        }

        const orderId = Number(ORDER_ID);

        if (!Number.isInteger(orderId) || orderId < 0) {
            return res.status(400).json({
                success: false,
                message: "ORDER_ID must be a valid positive integer or 0"
            });
        }

        // Call stored procedure
        const [result] = await db.query(
            `CALL sp_o_shipment_tracking_get(?, ?, ?, ?, ?, ?, ?)`,
            [
                orderId,
                ORDER_NUMBER,
                USER_TYPE,
                CUSTOMER_ID || null,
                SELLER_ID || null,
                limit,
                offset
            ]
        );

        const responseData = result[0] || [];

        return res.status(200).json({
            success: true,
            message: responseData.length > 0
                ? "Shipment tracking details fetched successfully"
                : "No shipment tracking details found",
            count: responseData.length,
            data: responseData
        });

    } catch (error) {
        console.error("Shipment Tracking GET Error:", error);

        return res.status(500).json({
            success: false,
            message: error.sqlMessage || error.message ||
                "Failed to fetch shipment tracking details"
        });
    }
});

module.exports = router;
