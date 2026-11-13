const express = require("express");
const router = express.Router();
const db = require("./db");
const authenticateToken = require("./auth_middleware");

router.post("/", authenticateToken, async (req, res) => {
    try {
        // Get logged-in user details from JWT
        const USER_ID = req.user.USER_ID || req.user.sub;
        const CUSTOMER_ID = req.user.CUSTOMER_ID;
        const USER_TYPE = String(
            req.user.role || req.user.USER_TYPE || ""
        ).toUpperCase();

        // Only customers can place orders
        if (USER_TYPE !== "CUSTOMER") {
            return res.status(403).json({
                success: false,
                message: "Only customers can place orders"
            });
        }

        if (!CUSTOMER_ID) {
            return res.status(400).json({
                success: false,
                message: "Customer ID not found in login token. Please login again."
            });
        }

        if (!USER_ID) {
            return res.status(400).json({
                success: false,
                message: "User ID not found in login token"
            });
        }

        // Request body
        const {
            CART_ID = 0,
            DELIVERY_ADDRESS_ID,
            BILLING_ADDRESS_ID,
            PAYMENT_METHOD,
            SHIPPING_CHARGES = 0
        } = req.body;

        // Validate required fields
        if (!DELIVERY_ADDRESS_ID || !BILLING_ADDRESS_ID || !PAYMENT_METHOD) {
            return res.status(400).json({
                success: false,
                message: "DELIVERY_ADDRESS_ID, BILLING_ADDRESS_ID and PAYMENT_METHOD are required"
            });
        }

        // Call stored procedure
        const [result] = await db.query(
            `CALL sp_o_place_order(?, ?, ?, ?, ?, ?, ?)`,
            [
                CUSTOMER_ID,
                CART_ID,
                DELIVERY_ADDRESS_ID,
                BILLING_ADDRESS_ID,
                PAYMENT_METHOD,
                SHIPPING_CHARGES,
                USER_ID
            ]
        );

        const responseData = result[0][0];

        return res.status(200).json({
            success: true,
            message: responseData.MESSAGE,
            data: {
                ORDER_NUMBER: responseData.ORDER_NUMBER,
                STATUS: responseData.STATUS
            }
        });

    } catch (error) {
        console.error("Place Order Error:", error);

        return res.status(500).json({
            success: false,
            message: error.sqlMessage || error.message || "Failed to place order"
        });
    }
});

module.exports = router;