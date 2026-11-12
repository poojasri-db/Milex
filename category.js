
const express = require("express");
const router = express.Router();
const db = require("./db");
const authenticateToken = require("./auth_middleware");

// ==========================================
// GET CATEGORY
// GET /api/category/get
// ADMIN + SELLER
// ==========================================

router.get("/get", authenticateToken, async (req, res) => {
    try {
        const userType = String(req.user.USER_TYPE || "")
            .trim()
            .toUpperCase();

        if (!["ADMIN", "SELLER"].includes(userType)) {
            return res.status(403).json({
                status: "FAILURE",
                message: "Access denied. Admin or Seller only."
            });
        }

        const {
            CATEGORY_ID = "-1",
            LIMIT = "10",
            OFFSET = "0"
        } = req.query;

        const categoryId = Number(CATEGORY_ID);
        const limit = Number(LIMIT);
        const offset = Number(OFFSET);

        if (
            !Number.isSafeInteger(categoryId) ||
            (categoryId !== -1 && categoryId <= 0)
        ) {
            return res.status(400).json({
                status: "ERROR",
                message: "CATEGORY_ID must be -1 or a positive integer"
            });
        }

        if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
            return res.status(400).json({
                status: "ERROR",
                message: "LIMIT must be between 1 and 100"
            });
        }

        if (!Number.isSafeInteger(offset) || offset < 0) {
            return res.status(400).json({
                status: "ERROR",
                message: "OFFSET must be zero or a positive integer"
            });
        }

        const [result] = await db.query(
            "CALL sp_m_category_get(?, ?, ?)",
            [
                categoryId,
                limit,
                offset
            ]
        );

        return res.status(200).json({
            status: "SUCCESS",
            message: "Category details fetched successfully",
            data: result[0] || []
        });

    } catch (error) {
        console.error("GET CATEGORY ERROR:", error);

        return res.status(500).json({
            status: "ERROR",
            message: error.sqlMessage || error.message
        });
    }
});

module.exports = router;
