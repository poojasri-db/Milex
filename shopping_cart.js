
const express = require("express");
const router = express.Router();
const db = require("./db");
const authenticateToken = require("./auth_middleware");

// ==========================================
// HELPER: GET CUSTOMER_ID USING USER_ID
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
// INSERT SHOPPING CART
// POST /api/shopping-cart/insert
// CUSTOMER ONLY
// ==========================================

router.post("/insert", authenticateToken, async (req, res) => {
    try {
        const userType = String(req.user.USER_TYPE || "")
            .trim()
            .toUpperCase();

        if (userType !== "CUSTOMER") {
            return res.status(403).json({
                success: false,
                message: "Access denied. Customer only."
            });
        }

        const {
            PRODUCT_ID,
            SELLER_ID,
            CUSTOMER_ID,
            QUANTITY,
            UNIT_PRICE,
            DISCOUNT,
            TAX,
            TOTAL_AMOUNT
        } = req.body || {};

        if (
            !Number.isInteger(Number(PRODUCT_ID)) || Number(PRODUCT_ID) <= 0 ||
            !Number.isInteger(Number(SELLER_ID)) || Number(SELLER_ID) <= 0 ||
            !Number.isInteger(Number(CUSTOMER_ID)) || Number(CUSTOMER_ID) <= 0 ||
            !Number.isInteger(Number(QUANTITY)) || Number(QUANTITY) <= 0 ||
            !Number.isFinite(Number(UNIT_PRICE)) || Number(UNIT_PRICE) < 0 ||
            !Number.isFinite(Number(DISCOUNT)) || Number(DISCOUNT) < 0 ||
            !Number.isFinite(Number(TAX)) || Number(TAX) < 0 ||
            !Number.isFinite(Number(TOTAL_AMOUNT)) || Number(TOTAL_AMOUNT) < 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid or missing shopping cart details."
            });
        }

        const [result] = await db.query(
            "CALL sp_o_shopping_cart_insert(?,?,?,?,?,?,?,?,?)",
            [
                PRODUCT_ID,
                SELLER_ID,
                QUANTITY,
                UNIT_PRICE,
                DISCOUNT,
                TAX,
                TOTAL_AMOUNT,
                CUSTOMER_ID,
                req.user.USER_ID
            ]
        );

        return res.status(200).json({
            success: true,
            message: "Shopping cart item added successfully",
            data: result[0]
        });

    } catch (error) {
        console.error("Shopping Cart Insert Error:", error);

        return res.status(500).json({
            success: false,
            message: error.sqlMessage || error.message
        });
    }
});



// ==========================================
// UPDATE SHOPPING CART
// PUT /api/shopping-cart/update
// CUSTOMER ONLY
// ==========================================

router.put("/update", authenticateToken, async (req, res) => {
    try {
        const userType = String(req.user.USER_TYPE || "")
            .trim()
            .toUpperCase();

        if (userType !== "CUSTOMER") {
            return res.status(403).json({
                success: false,
                message: "Access denied. Customer only."
            });
        }

        const {
            CART_ID,
            PRODUCT_ID,
            SELLER_ID,
            QUANTITY,
            UNIT_PRICE,
            DISCOUNT,
            TAX,
            TOTAL_AMOUNT
        } = req.body;

        if (
            !Number.isInteger(Number(CART_ID)) || Number(CART_ID) <= 0 ||
            !Number.isInteger(Number(PRODUCT_ID)) || Number(PRODUCT_ID) <= 0 ||
            !Number.isInteger(Number(SELLER_ID)) || Number(SELLER_ID) <= 0 ||
            !Number.isInteger(Number(QUANTITY)) || Number(QUANTITY) <= 0 ||
            !Number.isFinite(Number(UNIT_PRICE)) || Number(UNIT_PRICE) < 0 ||
            !Number.isFinite(Number(DISCOUNT)) || Number(DISCOUNT) < 0 ||
            !Number.isFinite(Number(TAX)) || Number(TAX) < 0 ||
            !Number.isFinite(Number(TOTAL_AMOUNT)) || Number(TOTAL_AMOUNT) < 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid or missing shopping cart details."
            });
        }

        const CUSTOMER_ID = await getCustomerId(req.user.USER_ID);

        if (!CUSTOMER_ID) {
            return res.status(404).json({
                success: false,
                message: "Customer registration not found."
            });
        }

        const [result] = await db.query(
            "CALL sp_o_shopping_cart_update(?,?,?,?,?,?,?,?,?,?)",
            [
                CART_ID,
                PRODUCT_ID,
                SELLER_ID,
                CUSTOMER_ID,
                QUANTITY,
                UNIT_PRICE,
                DISCOUNT,
                TAX,
                TOTAL_AMOUNT,
                req.user.USER_ID
            ]
        );

        return res.status(200).json({
            success: true,
            message: "Shopping cart updated successfully",
            data: result[0]
        });

    } catch (error) {
        console.error("Shopping Cart Update Error:", error);

        return res.status(500).json({
            success: false,
            message: error.sqlMessage || error.message
        });
    }
});



// ==========================================
// GET SHOPPING CART
// GET /api/shopping_cart/get
// ==========================================

router.get("/get", async (req, res) => {
    try {

        const {
            CART_ID = -1,
            PRODUCT_ID = -1,
            SELLER_ID = -1,
            CUSTOMER_ID,
            LIMIT = 10,
            OFFSET = 0
        } = req.query;

        // CUSTOMER ID VALIDATION
        if (
            CUSTOMER_ID === undefined ||
            CUSTOMER_ID === "" ||
            !Number.isInteger(Number(CUSTOMER_ID)) ||
            Number(CUSTOMER_ID) <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Valid CUSTOMER_ID is required"
            });
        }

        // CALL STORED PROCEDURE
        const [result] = await db.query(
            "CALL sp_o_shopping_cart_get(?,?,?,?,?,?)",
            [
                Number(CART_ID),
                Number(PRODUCT_ID),
                Number(SELLER_ID),
                Number(CUSTOMER_ID),
                Number(LIMIT),
                Number(OFFSET)
            ]
        );

        // FETCH CART DETAILS
        const cartData = result[0] || [];

        return res.status(200).json({
            success: true,
            message: cartData.length > 0
                ? "Shopping cart details fetched successfully"
                : "No shopping cart records found for this customer",
            CUSTOMER_ID: Number(CUSTOMER_ID),
            total_records: cartData.length,
            data: cartData
        });

    } catch (error) {

        console.error("Shopping Cart Get Error:", error);

        return res.status(500).json({
            success: false,
            message: error.sqlMessage || error.message
        });
    }
});



// ==========================================
// DELETE SHOPPING CART
// DELETE /api/shopping-cart/delete
// CUSTOMER ONLY
// ==========================================

router.delete("/delete", authenticateToken, async (req, res) => {
    try {
        const userType = String(req.user.USER_TYPE || "")
            .trim()
            .toUpperCase();

        if (userType !== "CUSTOMER") {
            return res.status(403).json({
                success: false,
                message: "Access denied. Customer only."
            });
        }

        const {
            CART_ID,
            PRODUCT_ID,
            SELLER_ID
        } = req.body;

        if (
            !Number.isInteger(Number(CART_ID)) || Number(CART_ID) <= 0 ||
            !Number.isInteger(Number(PRODUCT_ID)) || Number(PRODUCT_ID) <= 0 ||
            !Number.isInteger(Number(SELLER_ID)) || Number(SELLER_ID) <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Valid CART_ID, PRODUCT_ID and SELLER_ID are required."
            });
        }

        const CUSTOMER_ID = await getCustomerId(req.user.USER_ID);

        if (!CUSTOMER_ID) {
            return res.status(404).json({
                success: false,
                message: "Customer registration not found."
            });
        }

        const [result] = await db.query(
            "CALL sp_o_shopping_cart_delete(?,?,?,?)",
            [
                CART_ID,
                PRODUCT_ID,
                SELLER_ID,
                CUSTOMER_ID
            ]
        );

        return res.status(200).json({
            success: true,
            message: "Shopping cart item deleted successfully",
            data: result[0]
        });

    } catch (error) {
        console.error("Shopping Cart Delete Error:", error);

        return res.status(500).json({
            success: false,
            message: error.sqlMessage || error.message
        });
    }
});

module.exports = router;
