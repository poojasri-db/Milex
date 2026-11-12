
const express = require("express");
const router = express.Router();
const db = require("./db");
const authenticateToken = require("./auth_middleware");

// ==========================================
// HELPER: GET CUSTOMER_ID
// ==========================================

async function getCustomerId(userId) {
    const [customer] = await db.query(
        `SELECT CUSTOMER_ID
         FROM m_customer_registration
         WHERE USER_ID = ?
         LIMIT 1`,
        [userId]
    );

    return customer.length > 0 ? customer[0].CUSTOMER_ID : null;
}

// ==========================================
// MOVE TO CART
// PUT /api/wishlist/move-to-cart
// CUSTOMER ONLY
// ==========================================

router.put("/update", authenticateToken, async (req, res) => {
    try {
        const userType = String(req.user.USER_TYPE || "")
            .trim()
            .toUpperCase();

        if (userType !== "CUSTOMER") {
            return res.status(403).json({
                status: false,
                message: "Only customers can move products to cart"
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

        const CUSTOMER_ID = await getCustomerId(req.user.USER_ID);

        if (!CUSTOMER_ID) {
            return res.status(404).json({
                status: false,
                message: "Customer account not found"
            });
        }

        const [result] = await db.query(
            "CALL sp_o_shopping_cart_move_to_cart(?,?,?)",
            [
                CART_ID,
                CUSTOMER_ID,
                req.user.USER_ID
            ]
        );

        return res.status(200).json({
            status: true,
            message: "Product moved to cart successfully",
            data: result[0]
        });

    } catch (error) {
        console.error("MOVE TO CART ERROR:", error);

        return res.status(500).json({
            status: false,
            message: error.sqlMessage || error.message
        });
    }
});



// ==========================================
// GET SAVE FOR LATER PRODUCTS
// GET /api/wishlist/get
// CUSTOMER ONLY
// ==========================================

router.get("/get", authenticateToken, async (req, res) => {
    try {
        const userType = String(req.user.USER_TYPE || "")
            .trim()
            .toUpperCase();

        if (userType !== "CUSTOMER") {
            return res.status(403).json({
                status: false,
                message: "Only customers can view saved products"
            });
        }

        const CUSTOMER_ID = await getCustomerId(req.user.USER_ID);

        if (!CUSTOMER_ID) {
            return res.status(404).json({
                status: false,
                message: "Customer account not found"
            });
        }

        let {
            CART_ID = "-1",
            PRODUCT_ID = "-1",
            CATEGORY_ID = "-1",
            SELLER_ID = "-1",
            LIMIT = 10,
            OFFSET = 0
        } = req.query;

        const validFilter = (value) =>
            Number.isInteger(Number(value)) &&
            (Number(value) === -1 || Number(value) > 0);

        CART_ID = Number(CART_ID);
        PRODUCT_ID = Number(PRODUCT_ID);
        CATEGORY_ID = Number(CATEGORY_ID);
        SELLER_ID = Number(SELLER_ID);
        LIMIT = Number(LIMIT);
        OFFSET = Number(OFFSET);

        if (
            !validFilter(CART_ID) ||
            !validFilter(PRODUCT_ID) ||
            !validFilter(CATEGORY_ID) ||
            !validFilter(SELLER_ID) ||
            !Number.isInteger(LIMIT) ||
            LIMIT < 1 ||
            LIMIT > 100 ||
            !Number.isInteger(OFFSET) ||
            OFFSET < 0
        ) {
            return res.status(400).json({
                status: false,
                message: "Invalid filter or pagination parameters"
            });
        }

        const [result] = await db.query(
            "CALL sp_o_shopping_cart_save_for_later_get(?,?,?,?,?,?,?)",
            [
                CART_ID,
                PRODUCT_ID,
                CATEGORY_ID,
                SELLER_ID,
                CUSTOMER_ID,
                LIMIT,
                OFFSET
            ]
        );

        return res.status(200).json({
            status: true,
            message: "Save for Later products fetched successfully",
            data: result[0]
        });

    } catch (error) {
        console.error("SAVE FOR LATER GET ERROR:", error);

        return res.status(500).json({
            status: false,
            message: error.sqlMessage || error.message
        });
    }
});


module.exports = router;
