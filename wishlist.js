
const express = require("express");
const router = express.Router();
const db = require("./db");
const authenticateToken = require("./auth_middleware");

// ==========================================
// SAVE FOR LATER
// PUT /api/shopping-cart/save-for-later
// CUSTOMER ONLY
// ==========================================

router.put("/save_for_later", authenticateToken, async (req, res) => {
    try {
        const userType = String(req.user.USER_TYPE || "")
            .trim()
            .toUpperCase();

        if (userType !== "CUSTOMER") {
            return res.status(403).json({
                status: false,
                message: "Only customers can save cart items for later"
            });
        }

        const { CART_ID } = req.body || {};

        if (
            !Number.isInteger(Number(CART_ID)) ||
            Number(CART_ID) <= 0
        ) {
            return res.status(400).json({
                status: false,
                message: "A valid CART_ID is required"
            });
        }

        // Get CUSTOMER_ID using logged-in USER_ID
        const [customer] = await db.query(
            `SELECT CUSTOMER_ID
             FROM m_customer_registration
             WHERE USER_ID = ?
             LIMIT 1`,
            [req.user.USER_ID]
        );

        if (customer.length === 0) {
            return res.status(404).json({
                status: false,
                message: "Customer account not found"
            });
        }

        const CUSTOMER_ID = customer[0].CUSTOMER_ID;

        const [result] = await db.query(
            "CALL sp_o_shopping_cart_save_for_later(?,?,?)",
            [
                CART_ID,
                CUSTOMER_ID,
                req.user.USER_ID
            ]
        );

        return res.status(200).json({
            status: true,
            message: "Product moved to Save for Later successfully",
            data: result[0]
        });

    } catch (error) {
        console.error("SAVE FOR LATER ERROR:", error);

        return res.status(500).json({
            status: false,
            message: error.sqlMessage || error.message
        });
    }
});

module.exports = router;
