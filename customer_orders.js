const express = require("express");
const router = express.Router();
const db = require("./db");
const authenticateToken = require("./auth_middleware");

// ==========================================
// JWT AUTHENTICATION
// ==========================================

router.use(authenticateToken);

// ==========================================
// GET CUSTOMER ID USING USER ID
// ==========================================

async function getCustomerId(userId) {

    const [rows] = await db.query(
        `SELECT CUSTOMER_ID
         FROM m_customer_registration
         WHERE USER_ID = ?`,
        [userId]
    );

    return rows.length > 0 ? rows[0].CUSTOMER_ID : null;
}

// ==========================================
// GET CUSTOMER ORDERS
// ==========================================

router.get("/get", async (req, res) => {

    try {

        const userId = req.user.USER_ID;

        // Get customer ID from logged-in user
        const customerId = await getCustomerId(userId);

        if (!customerId) {
            return res.status(404).json({
                success: false,
                message: "Customer not found"
            });
        }

        const LIMIT = parseInt(req.query.LIMIT) || 10;
        const OFFSET = parseInt(req.query.OFFSET) || 0;

        if (LIMIT <= 0 || OFFSET < 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid LIMIT or OFFSET"
            });
        }

        // Call stored procedure
        const [result] = await db.query(
            "CALL sp_o_place_orders_customer_get(?, ?, ?)",
            [customerId, LIMIT, OFFSET]
        );

        const orders = result[0];

        return res.status(200).json({
            success: true,
            message: "Customer orders fetched successfully",
            total_records: orders.length,
            data: orders
        });

    } catch (error) {

        console.error("Customer Orders Get Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch customer orders",
            error: error.message
        });

    }

});

module.exports = router;