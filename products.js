
const express = require("express");
const router = express.Router();
const db = require("./db");
const authenticateToken = require("./auth_middleware");

// ==========================================
// INSERT PRODUCT
// POST /api/products/insert
// PROTECTED API
// ==========================================

router.post("/insert", authenticateToken, async (req, res) => {
    try {
        const {
            PRODUCT_NAME,
            CATEGORY_ID,
            SUB_CATEGORY_ID,
            BRAND_ID,
            PRODUCT_IMAGE,
            PRODUCT_VIDEO,
            PRODUCT_DESCRIPTION,
            HSN_CODE,
            TAX_RATE,
            SELLING_PRICE,
            PRICE,
            DISCOUNT,
            STOCK_QUANTITY,
            MINIMUM_ORDER_QUANTITY,
            MAXIMUM_ORDER_QUANTITY,
            WEIGHT,
            LENGTH,
            WIDTH,
            HEIGHT,
            SELLER_ID
        } = req.body;

        const CREATED_BY = req.user.USER_ID;

        const [result] = await db.query(
            "CALL sp_m_products_insert(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            [
                PRODUCT_NAME,
                CATEGORY_ID,
                SUB_CATEGORY_ID,
                BRAND_ID,
                PRODUCT_IMAGE,
                PRODUCT_VIDEO,
                PRODUCT_DESCRIPTION,
                HSN_CODE,
                TAX_RATE,
                SELLING_PRICE,
                PRICE,
                DISCOUNT,
                STOCK_QUANTITY,
                MINIMUM_ORDER_QUANTITY,
                MAXIMUM_ORDER_QUANTITY,
                WEIGHT,
                LENGTH,
                WIDTH,
                HEIGHT,
                SELLER_ID,
                CREATED_BY
            ]
        );

        res.status(200).json({
            status: true,
            message: "Product inserted successfully",
            data: result[0] || []
        });

    } catch (error) {
        console.error("Product Insert Error:", error);

        res.status(500).json({
            status: false,
            message: error.sqlMessage || "Failed to insert product"
        });
    }
});


// ==========================================
// UPDATE PRODUCT
// PUT /api/products/update
// PROTECTED API
// ==========================================

router.put("/update", authenticateToken, async (req, res) => {
    try {
        const {
            PRODUCT_ID,
            PRODUCT_NAME,
            CATEGORY_ID,
            SUB_CATEGORY_ID,
            BRAND_ID,
            PRODUCT_IMAGE,
            PRODUCT_VIDEO,
            PRODUCT_DESCRIPTION,
            HSN_CODE,
            TAX_RATE,
            SELLING_PRICE,
            PRICE,
            DISCOUNT,
            STOCK_QUANTITY,
            MINIMUM_ORDER_QUANTITY,
            MAXIMUM_ORDER_QUANTITY,
            WEIGHT,
            LENGTH,
            WIDTH,
            HEIGHT,
            SELLER_ID
        } = req.body;

        const UPDATED_BY = req.user.USER_ID;

        const [result] = await db.query(
            "CALL sp_m_products_update(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            [
                PRODUCT_ID,
                PRODUCT_NAME,
                CATEGORY_ID,
                SUB_CATEGORY_ID,
                BRAND_ID,
                PRODUCT_IMAGE,
                PRODUCT_VIDEO,
                PRODUCT_DESCRIPTION,
                HSN_CODE,
                TAX_RATE,
                SELLING_PRICE,
                PRICE,
                DISCOUNT,
                STOCK_QUANTITY,
                MINIMUM_ORDER_QUANTITY,
                MAXIMUM_ORDER_QUANTITY,
                WEIGHT,
                LENGTH,
                WIDTH,
                HEIGHT,
                SELLER_ID,
                UPDATED_BY
            ]
        );

        res.status(200).json({
            status: true,
            message: "Product updated successfully",
            data: result[0] || []
        });

    } catch (error) {
        console.error("Product Update Error:", error);

        res.status(500).json({
            status: false,
            message: error.sqlMessage || "Failed to update product"
        });
    }
});


// ==========================================
// GET PRODUCTS
// GET /api/products/get
// PUBLIC API
// ==========================================

router.get("/get", async (req, res) => {
    try {
        const {
            PRODUCT_ID = "-1",
            CATEGORY_ID = "-1",
            BRAND_ID = "-1",
            LIMIT = 10,
            OFFSET = 0
        } = req.query;

        const [result] = await db.query(
            "CALL sp_m_products_get(?,?,?,?,?)",
            [
                PRODUCT_ID,
                CATEGORY_ID,
                BRAND_ID,
                Number(LIMIT),
                Number(OFFSET)
            ]
        );

        res.status(200).json({
            status: true,
            message: "Product details fetched successfully",
            data: result[0] || []
        });

    } catch (error) {
        console.error("Product Get Error:", error);

        res.status(500).json({
            status: false,
            message: error.sqlMessage || "Failed to fetch products"
        });
    }
});


// ==========================================
// DELETE PRODUCT (SOFT DELETE)
// DELETE /api/products/delete
// PROTECTED API
// ==========================================

router.delete("/delete", authenticateToken, async (req, res) => {
    try {
        const {
            PRODUCT_ID,
            CATEGORY_ID,
            SUB_CATEGORY_ID,
            BRAND_ID
        } = req.body;

        const [result] = await db.query(
            "CALL sp_m_products_delete(?,?,?,?)",
            [
                PRODUCT_ID,
                CATEGORY_ID,
                SUB_CATEGORY_ID,
                BRAND_ID
            ]
        );

        res.status(200).json({
            status: true,
            message: "Product deactivated successfully",
            data: result[0] || []
        });

    } catch (error) {
        console.error("Product Delete Error:", error);

        res.status(500).json({
            status: false,
            message: error.sqlMessage || "Failed to deactivate product"
        });
    }
});

module.exports = router;
