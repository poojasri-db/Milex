
const express = require("express");
const router = express.Router();
const db = require("./db");

// ==========================================
// INSERT PRODUCT
// POST /api/products/insert
// ==========================================

router.post("/insert", async (req, res) => {
    try {
        const {
            PRODUCT_NAME,
            CATEGORY_ID,
            BRAND_ID,
            PRODUCT_DESCRIPTION,
            HSN_CODE,
            TAX_RATE,
            SELLING_PRICE,
            MRP,
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
        } = req.body || {};

        await db.query(
            "CALL sp_m_products_insert(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [
                PRODUCT_NAME,
                CATEGORY_ID,
                BRAND_ID,
                PRODUCT_DESCRIPTION,
                HSN_CODE,
                TAX_RATE,
                SELLING_PRICE,
                MRP,
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
            status: "SUCCESS",
            message: "Product inserted successfully"
        });

    } catch (error) {
        res.status(400).json({
            status: "FAILED",
            message: error.sqlMessage || error.message
        });
    }
});

// ==========================================
// UPDATE PRODUCT
// POST /api/products/update
// ==========================================

router.put("/update", async (req, res) => {
    try {
        const {
            PRODUCT_ID,
            PRODUCT_NAME,
            CATEGORY_ID,
            BRAND_ID,
            PRODUCT_DESCRIPTION,
            HSN_CODE,
            TAX_RATE,
            SELLING_PRICE,
            MRP,
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
        } = req.body || {};

        await db.query(
            "CALL sp_m_products_update(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [
                PRODUCT_ID,
                PRODUCT_NAME,
                CATEGORY_ID,
                BRAND_ID,
                PRODUCT_DESCRIPTION,
                HSN_CODE,
                TAX_RATE,
                SELLING_PRICE,
                MRP,
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
            status: "SUCCESS",
            message: "Product updated successfully"
        });

    } catch (error) {
        res.status(400).json({
            status: "FAILED",
            message: error.sqlMessage || error.message
        });
    }
});

// ==========================================
// GET PRODUCTS
// GET /api/products/get
// ==========================================

router.get("/get", async (req, res) => {
    try {
        const PRODUCT_ID =
            req.query.PRODUCT_ID !== undefined
                ? req.query.PRODUCT_ID
                : -1;

        const CATEGORY_ID =
            req.query.CATEGORY_ID !== undefined
                ? req.query.CATEGORY_ID
                : null;

        const BRAND_ID =
            req.query.BRAND_ID !== undefined
                ? req.query.BRAND_ID
                : null;

        const [result] = await db.query(
            "CALL sp_m_products_get(?, ?, ?)",
            [PRODUCT_ID, CATEGORY_ID, BRAND_ID]
        );

        res.status(200).json({
            status: "SUCCESS",
            data: result[0]
        });

    } catch (error) {
        res.status(400).json({
            status: "FAILED",
            message: error.sqlMessage || error.message
        });
    }
});

// ==========================================
// DELETE PRODUCT
// POST /api/products/delete
// ==========================================

router.delete("/delete", async (req, res) => {
    try {
        const {
            PRODUCT_ID,
            CATEGORY_ID,
            BRAND_ID
        } = req.body || {};

        await db.query(
            "CALL sp_m_products_delete(?, ?, ?)",
            [
                PRODUCT_ID,
                CATEGORY_ID,
                BRAND_ID
            ]
        );

        res.status(200).json({
            status: "SUCCESS",
            message: "Product deleted successfully"
        });

    } catch (error) {
        res.status(400).json({
            status: "FAILED",
            message: error.sqlMessage || error.message
        });
    }
});

module.exports = router;
