
const express = require("express");
const router = express.Router();
const db = require("./db");
const authenticateToken = require("./auth_middleware");

// ==========================================
// PLACE ORDER API
// ==========================================

router.post("/", authenticateToken, async (req, res) => {
    try {
        const USER_ID = req.user.USER_ID || req.user.sub;
        const CUSTOMER_ID = req.user.CUSTOMER_ID;
        const USER_TYPE = String(
            req.user.role || req.user.USER_TYPE || ""
        ).toUpperCase();

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

        const {
            CART_ID = 0,
            DELIVERY_ADDRESS_ID,
            BILLING_ADDRESS_ID,
            PAYMENT_METHOD,
            SHIPPING_CHARGES = 0
        } = req.body;

        if (!DELIVERY_ADDRESS_ID || !BILLING_ADDRESS_ID || !PAYMENT_METHOD) {
            return res.status(400).json({
                success: false,
                message: "DELIVERY_ADDRESS_ID, BILLING_ADDRESS_ID and PAYMENT_METHOD are required"
            });
        }

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


// ==========================================
// UPDATE ORDER API
// ==========================================

router.put('/update', authenticateToken, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                status: false,
                message: 'Authentication required'
            });
        }

        const {
            ORDER_ID,
            ORDER_STATUS,
            PAYMENT_STATUS,
            SHIPPING_STATUS
        } = req.body;

        if (
            !ORDER_ID ||
            ORDER_STATUS === undefined ||
            PAYMENT_STATUS === undefined ||
            SHIPPING_STATUS === undefined
        ) {
            return res.status(400).json({
                status: false,
                message: 'ORDER_ID, ORDER_STATUS, PAYMENT_STATUS and SHIPPING_STATUS are required'
            });
        }

        // Get authenticated user details
        const USER_ID = req.user.USER_ID || req.user.sub;

        const userType = String(
            req.user.role || req.user.USER_TYPE || ''
        ).trim().toUpperCase();

        // Allow ADMIN and SELLER
        if (!['ADMIN', 'SELLER'].includes(userType)) {
            return res.status(403).json({
                status: false,
                message: 'Only admins and sellers can update orders'
            });
        }

        if (!USER_ID) {
            return res.status(400).json({
                status: false,
                message: 'User ID not found in login token'
            });
        }

        const [result] = await db.query(
            'CALL sp_o_place_orders_update(?, ?, ?, ?, ?)',
            [
                ORDER_ID,
                ORDER_STATUS,
                PAYMENT_STATUS,
                SHIPPING_STATUS,
                USER_ID
            ]
        );

        return res.status(200).json({
            status: true,
            message: 'Order updated successfully'
        });

    } catch (error) {
        console.error('UPDATE ORDER ERROR:', error);

        return res.status(400).json({
            status: false,
            message: error.sqlMessage || error.message
        });
    }
});

module.exports = router;
