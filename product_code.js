
const express = require("express");
const router = express.Router();
const db = require("./db");

// ==========================================
// GET PRODUCT CODE SKU
// GET /api/product-code/get
// ==========================================

router.get("/get", async (req, res) => {
    try {
        const {
            PRODUCT_ID = -1,
            LIMIT = 10,
            OFFSET = 0
        } = req.query;

        const [result] = await db.query(
            "CALL sp_m_product_code_get(?, ?, ?)",
            [
                Number(PRODUCT_ID),
                Number(LIMIT),
                Number(OFFSET)
            ]
        );

        res.status(200).json({
            success: true,
            message: "Product codes fetched successfully",
            data: result[0]
        });

    } catch (error) {
        console.error("Product Code GET Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch product codes",
            error: error.message
        });
    }
});

module.exports = router;
