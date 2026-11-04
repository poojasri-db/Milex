
const express = require('express');
const router = express.Router();
const db = require('./db');

// INSERT PRODUCT
router.post('/insert', async (req, res) => {
    try {
        const {
            PRODUCT_NAME,
            CATEGORY_ID,
            SUB_CATEGORY_ID,
            BRAND_ID,
            PRODUCT_VARIANT_ID,
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
        } = req.body;

        const [result] = await db.query(
            `CALL sp_m_products_insert(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                PRODUCT_NAME,
                CATEGORY_ID,
                SUB_CATEGORY_ID,
                BRAND_ID,
                PRODUCT_VARIANT_ID,
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
            success: true,
            message: 'Product inserted successfully',
            data: result[0]
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.sqlMessage || error.message
        });
    }
});


// UPDATE PRODUCT
router.put('/update', async (req, res) => {
    try {
        const {
            PRODUCT_ID,
            PRODUCT_NAME,
            CATEGORY_ID,
            SUB_CATEGORY_ID,
            BRAND_ID,
            PRODUCT_VARIANT_ID,
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
        } = req.body;

        const [result] = await db.query(
            `CALL sp_m_products_update(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                PRODUCT_ID,
                PRODUCT_NAME,
                CATEGORY_ID,
                SUB_CATEGORY_ID,
                BRAND_ID,
                PRODUCT_VARIANT_ID,
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
            success: true,
            message: 'Product updated successfully',
            data: result[0]
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.sqlMessage || error.message
        });
    }
});


// GET PRODUCTS
router.get('/get', async (req, res) => {
    try {
        const {
            PRODUCT_ID = '-1',
            CATEGORY_ID = '-1',
            BRAND_ID = '-1',
            LIMIT = 10,
            OFFSET = 0
        } = req.query;

        const [result] = await db.query(
            `CALL sp_m_products_get(?, ?, ?, ?, ?)`,
            [
                PRODUCT_ID,
                CATEGORY_ID,
                BRAND_ID,
                Number(LIMIT),
                Number(OFFSET)
            ]
        );

        res.status(200).json({
            success: true,
            message: 'Product details fetched successfully',
            data: result[0]
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.sqlMessage || error.message
        });
    }
});


// DELETE PRODUCT
router.delete('/delete', async (req, res) => {
    try {
        const {
            PRODUCT_ID,
            CATEGORY_ID,
            BRAND_ID
        } = req.body;

        const [result] = await db.query(
            `CALL sp_m_products_delete(?, ?, ?)`,
            [
                PRODUCT_ID,
                CATEGORY_ID,
                BRAND_ID
            ]
        );

        res.status(200).json({
            success: true,
            message: 'Product deleted successfully',
            data: result[0]
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.sqlMessage || error.message
        });
    }
});

module.exports = router;
