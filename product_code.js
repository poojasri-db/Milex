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
        const {
            PRODUCT_ID = "-1",
            LIMIT = "10",
            OFFSET = "0"
        } = req.query;

        const productId = Number(PRODUCT_ID);
        const limit = Number(LIMIT);
        const offset = Number(OFFSET);

        // VALIDATION
        if (
            !Number.isInteger(productId) ||
            (productId !== -1 && productId <= 0)
        ) {
            return res.status(400).json({
                success: false,
                message: "PRODUCT_ID must be -1 or a positive integer"
            });
        }

        if (
            !Number.isInteger(limit) ||
            limit < 1 ||
            limit > 100
        ) {
            return res.status(400).json({
                success: false,
                message: "LIMIT must be between 1 and 100"
            });
        }

        if (
            !Number.isInteger(offset) ||
            offset < 0
        ) {
            return res.status(400).json({
                success: false,
                message: "OFFSET must be zero or a positive integer"
            });
        }

        // DATABASE CALL
        const [result] = await db.query(
            "CALL sp_m_product_code_get(?, ?, ?)",
            [productId, limit, offset]
        );

        return res.status(200).json({
            success: true,
            message: "Product codes fetched successfully",
            data: result[0]
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