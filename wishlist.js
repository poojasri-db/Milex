const express = require('express');
const router = express.Router();
const db = require('./db');
const authenticateToken = require('./auth_middleware');

router.use(authenticateToken);

router.post('/manage', async (req, res) => {
    try {
        const { PRODUCT_ID, PRODUCT_VARIANT_ID, ACTION } = req.body;

        if (!PRODUCT_ID || !ACTION) {
            return res.status(400).json({
                status: false,
                message: 'PRODUCT_ID and ACTION are required'
            });
        }

        const action = String(ACTION).trim().toUpperCase();

        if (!['ADD', 'REMOVE'].includes(action)) {
            return res.status(400).json({
                status: false,
                message: 'Invalid action'
            });
        }

        // Allow only authenticated customers
        const userType = String(req.user.USER_TYPE || '')
            .trim()
            .toUpperCase();

        if (userType !== 'CUSTOMER') {
            return res.status(403).json({
                status: false,
                message: 'Only customers can manage wishlist'
            });
        }

        // Get customer ID using authenticated USER_ID
        const [customer] = await db.query(
            `SELECT CUSTOMER_ID
             FROM m_customer_registration
             WHERE USER_ID = ?`,
            [req.user.USER_ID]
        );

        if (customer.length === 0) {
            return res.status(404).json({
                status: false,
                message: 'Customer not found'
            });
        }

        const CUSTOMER_ID = customer[0].CUSTOMER_ID;
        const VARIANT_ID = PRODUCT_VARIANT_ID ?? 0;

        const [result] = await db.query(
            'CALL sp_o_wishlist_manage(?, ?, ?, ?)',
            [
                CUSTOMER_ID,
                PRODUCT_ID,
                VARIANT_ID,
                action
            ]
        );

        return res.status(200).json({
            status: true,
            message: result[0][0].MESSAGE,
            data: {
                CUSTOMER_ID,
                PRODUCT_ID,
                PRODUCT_VARIANT_ID: VARIANT_ID
            }
        });

    } catch (error) {
        console.error('WISHLIST ERROR:', error);

        return res.status(400).json({
            status: false,
            message: error.sqlMessage || 'Wishlist operation failed'
        });
    }
});

// GET CUSTOMER WISHLIST
router.get('/get', authenticateToken, async (req, res) => {
    try {

        const CUSTOMER_ID = req.user.CUSTOMER_ID;

        if (!CUSTOMER_ID) {
            return res.status(401).json({
                status: false,
                message: 'Customer ID not found in token'
            });
        }

        const LIMIT = parseInt(req.query.LIMIT) || 10;
        const OFFSET = parseInt(req.query.OFFSET) || 0;

        const [result] = await db.query(
            'CALL sp_o_wishlist_get(?, ?, ?)',
            [
                CUSTOMER_ID,
                LIMIT,
                OFFSET
            ]
        );

        return res.status(200).json({
            status: true,
            message: result[0].length > 0
                ? 'WISHLIST DETAILS FETCHED SUCCESSFULLY'
                : 'WISHLIST IS EMPTY',
            data: result[0]
        });

    } catch (error) {

        console.error('WISHLIST GET ERROR:', error);

        return res.status(500).json({
            status: false,
            message: error.sqlMessage || 'Failed to fetch wishlist'
        });
    }
});

module.exports = router;