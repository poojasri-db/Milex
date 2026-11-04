
const express = require("express");
const router = express.Router();
const db = require("./db");

// ==========================================
// INSERT PRODUCT VARIANT
// POST /api/product-variant/insert
// ==========================================
router.post("/insert", async (req, res) => {
    try {
        const {
            VARIANT_NAME, BARCODE, SIZE, COLOR, MATERIAL, WEIGHT, PRICE,
            STOCK_QUANTITY, VARIANT_IMAGE, PRODUCT_ID, SELLER_ID, SELLER_NAME, CREATED_BY
        } = req.body || {};

        if (!PRODUCT_ID) {
            return res.status(400).json({
                status: "FAILURE",
                message: "PRODUCT_ID is required"
            });
        }

        const [result] = await db.query(
            "CALL sp_o_product_variant_insert(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [
                VARIANT_NAME, BARCODE, SIZE, COLOR, MATERIAL, WEIGHT, PRICE,
                STOCK_QUANTITY, VARIANT_IMAGE, PRODUCT_ID, SELLER_ID, SELLER_NAME, CREATED_BY
            ]
        );

        return res.status(200).json({
            status: "SUCCESS",
            message: "Product variant inserted successfully",
            data: result[0][0]
        });

    } catch (error) {
        console.error("INSERT ERROR:", error);

        return res.status(400).json({
            status: "FAILURE",
            message: error.sqlMessage || error.message
        });
    }
});


// ==========================================
// UPDATE PRODUCT VARIANT
// POST /api/product-variant/update
// ==========================================
router.put("/update", async (req, res) => {
    try {
        const {
            VARIANT_ID, VARIANT_NAME, BARCODE, SIZE, COLOR, MATERIAL, WEIGHT,
            PRICE, STOCK_QUANTITY, VARIANT_IMAGE, PRODUCT_ID, SELLER_ID,
            SELLER_NAME, UPDATED_BY
        } = req.body || {};

        if (!VARIANT_ID || !PRODUCT_ID) {
            return res.status(400).json({
                status: "FAILURE",
                message: "VARIANT_ID and PRODUCT_ID are required"
            });
        }

        const [result] = await db.query(
            "CALL sp_o_product_variant_update(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [
                VARIANT_ID, VARIANT_NAME, BARCODE, SIZE, COLOR, MATERIAL, WEIGHT,
                PRICE, STOCK_QUANTITY, VARIANT_IMAGE, PRODUCT_ID, SELLER_ID,
                SELLER_NAME, UPDATED_BY
            ]
        );

        return res.status(200).json({
            status: "SUCCESS",
            message: "Product variant updated successfully",
            data: result[0][0]
        });

    } catch (error) {
        console.error("UPDATE ERROR:", error);

        return res.status(400).json({
            status: "FAILURE",
            message: error.sqlMessage || error.message
        });
    }
});


// ==========================================
// GET PRODUCT VARIANT WITH PAGINATION
// GET /api/product-variant/get
// ==========================================
router.get("/get", async (req, res) => {
    try {
        let {
            PRODUCT_ID = -1,
            VARIANT_ID = -1,
            LIMIT = 10,
            OFFSET = 0
        } = req.query;

        PRODUCT_ID = Number(PRODUCT_ID);
        VARIANT_ID = Number(VARIANT_ID);
        LIMIT = Number(LIMIT);
        OFFSET = Number(OFFSET);

        if (
            !Number.isInteger(PRODUCT_ID) ||
            !Number.isInteger(VARIANT_ID) ||
            !Number.isInteger(LIMIT) ||
            !Number.isInteger(OFFSET) ||
            LIMIT <= 0 ||
            OFFSET < 0
        ) {
            return res.status(400).json({
                status: "FAILURE",
                message: "Invalid PRODUCT_ID, VARIANT_ID, LIMIT or OFFSET"
            });
        }

        const [result] = await db.query(
            "CALL sp_o_product_variant_get(?, ?, ?, ?)",
            [PRODUCT_ID, VARIANT_ID, LIMIT, OFFSET]
        );

        return res.status(200).json({
            status: "SUCCESS",
            message: "Product variant details fetched successfully",
            data: result[0]
        });

    } catch (error) {
        console.error("GET ERROR:", error);

        return res.status(400).json({
            status: "FAILURE",
            message: error.sqlMessage || error.message
        });
    }
});


// ==========================================
// DELETE PRODUCT VARIANT
// POST /api/product-variant/delete
// ==========================================
router.delete("/delete", async (req, res) => {
    try {
        const { PRODUCT_ID, VARIANT_ID } = req.body || {};

        if (!PRODUCT_ID || !VARIANT_ID) {
            return res.status(400).json({
                status: "FAILURE",
                message: "PRODUCT_ID and VARIANT_ID are required"
            });
        }

        const [result] = await db.query(
            "CALL sp_o_product_variant_delete(?, ?)",
            [PRODUCT_ID, VARIANT_ID]
        );

        return res.status(200).json({
            status: "SUCCESS",
            message: "Product variant deleted successfully",
            data: result[0][0]
        });

    } catch (error) {
        console.error("DELETE ERROR:", error);

        return res.status(400).json({
            status: "FAILURE",
            message: error.sqlMessage || error.message
        });
    }
});

module.exports = router;
