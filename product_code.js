
const express = require("express");
const router = express.Router();
const db = require("./db");
const authenticateToken = require("./auth_middleware");

// ==========================================
// GET PRODUCT CODE SKU
// GET /api/product-code/get
// Access: ADMIN, SELLER
// ==========================================

router.get("/get", authenticateToken, async (req, res) => {
    try {
        // ROLE VALIDATION
        const userType = String(req.user.USER_TYPE || "")
            .trim()
            .toUpperCase();

        if (!["ADMIN", "SELLER"].includes(userType)) {
            return res.status(403).json({
                success: false,
                message: "Access denied. Admin or Seller only."
            });
        }

        // QUERY PARAMETERS
        const { PRODUCT_ID = "-1" } = req.query;

        const productId = Number(PRODUCT_ID);

        // VALIDATION
        if (
            !Number.isSafeInteger(productId) ||
            (productId !== -1 && productId <= 0)
        ) {
            return res.status(400).json({
                success: false,
                message: "PRODUCT_ID must be -1 or a positive integer"
            });
        }

        // DATABASE CALL
        const [result] = await db.query(
            "CALL sp_m_product_code_get(?)",
            [productId]
        );

        const rows = result[0] || [];

        return res.status(200).json({
            success: true,
            message: rows.length
                ? "Product codes fetched successfully"
                : "No product codes found",
            count: rows.length,
            data: rows
        });

    } catch (error) {
        console.error("Product Code GET Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch product codes",
            error: error.sqlMessage || error.message
        });
    }
});

module.exports = router;
