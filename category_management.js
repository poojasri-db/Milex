const express = require("express");
const router = express.Router();
const db = require("./db");
const authenticateToken = require("./auth_middleware");

// ==========================================
// CATEGORY MANAGEMENT INSERT
// POST /api/category_management/insert
// Access: ADMIN ONLY
// ==========================================

router.post("/insert", authenticateToken, async (req, res) => {
    try {
        const userType = String(req.user.USER_TYPE || "")
            .trim()
            .toUpperCase();

        if (userType !== "ADMIN") {
            return res.status(403).json({
                success: false,
                message: "Access denied. Admin only."
            });
        }

        const {
            CATEGORY_NAME,
            PARENT_CATEGORY_ID,
            CATEGORY_IMAGE,
            DESCRIPTION,
            STATUS
        } = req.body;

        if (!CATEGORY_NAME || !String(CATEGORY_NAME).trim()) {
            return res.status(400).json({
                success: false,
                message: "CATEGORY_NAME is required"
            });
        }

        const parentCategoryId =
            PARENT_CATEGORY_ID === undefined ||
            PARENT_CATEGORY_ID === null ||
            PARENT_CATEGORY_ID === ""
                ? null
                : Number(PARENT_CATEGORY_ID);

        if (
            parentCategoryId !== null &&
            (!Number.isSafeInteger(parentCategoryId) ||
                parentCategoryId <= 0)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid PARENT_CATEGORY_ID"
            });
        }

        const [result] = await db.query(
            "CALL sp_m_category_management_insert(?, ?, ?, ?, ?, ?)",
            [
                CATEGORY_NAME,
                parentCategoryId,
                CATEGORY_IMAGE ?? null,
                DESCRIPTION ?? null,
                STATUS ?? null,
                req.user.USER_ID
            ]
        );

        return res.status(200).json({
            success: true,
            message: "Category inserted successfully",
            data: result[0] || []
        });

    } catch (error) {
        console.error("Category Insert Error:", error);

        return res.status(500).json({
            success: false,
            message: error.sqlMessage || error.message
        });
    }
});


// ==========================================
// CATEGORY MANAGEMENT UPDATE
// PUT /api/category_management/update
// Access: ADMIN ONLY
// ==========================================

router.put("/update", authenticateToken, async (req, res) => {
    try {
        const userType = String(req.user.USER_TYPE || "")
            .trim()
            .toUpperCase();

        if (userType !== "ADMIN") {
            return res.status(403).json({
                success: false,
                message: "Access denied. Admin only."
            });
        }

        const {
            CATEGORY_ID,
            CATEGORY_NAME,
            PARENT_CATEGORY_ID,
            CATEGORY_IMAGE,
            DESCRIPTION,
            STATUS
        } = req.body;

        const categoryId = Number(CATEGORY_ID);

        const parentCategoryId =
            PARENT_CATEGORY_ID === undefined ||
            PARENT_CATEGORY_ID === null ||
            PARENT_CATEGORY_ID === ""
                ? null
                : Number(PARENT_CATEGORY_ID);

        if (
            !Number.isSafeInteger(categoryId) ||
            categoryId <= 0 ||
            !CATEGORY_NAME ||
            !String(CATEGORY_NAME).trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "Valid CATEGORY_ID and CATEGORY_NAME are required"
            });
        }

        if (
            parentCategoryId !== null &&
            (!Number.isSafeInteger(parentCategoryId) ||
                parentCategoryId <= 0)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid PARENT_CATEGORY_ID"
            });
        }

        const [result] = await db.query(
            "CALL sp_m_category_management_update(?, ?, ?, ?, ?, ?, ?)",
            [
                categoryId,
                CATEGORY_NAME,
                parentCategoryId,
                CATEGORY_IMAGE ?? null,
                DESCRIPTION ?? null,
                STATUS ?? null,
                req.user.USER_ID
            ]
        );

        return res.status(200).json({
            success: true,
            message: "Category updated successfully",
            data: result[0] || []
        });

    } catch (error) {
        console.error("Category Update Error:", error);

        return res.status(500).json({
            success: false,
            message: error.sqlMessage || error.message
        });
    }
});


// ==========================================
// CATEGORY MANAGEMENT DELETE
// DELETE /api/category_management/delete
// Access: ADMIN ONLY
// ==========================================

router.delete("/delete", authenticateToken, async (req, res) => {
    try {
        const userType = String(req.user.USER_TYPE || "")
            .trim()
            .toUpperCase();

        if (userType !== "ADMIN") {
            return res.status(403).json({
                status: false,
                message: "Access denied. Admin only."
            });
        }

        const { CATEGORY_ID } = req.body;

        const categoryId = Number(CATEGORY_ID);

        if (
            !Number.isSafeInteger(categoryId) ||
            categoryId <= 0
        ) {
            return res.status(400).json({
                status: false,
                message: "Valid CATEGORY_ID is required"
            });
        }

        const [result] = await db.query(
            "CALL sp_m_category_management_delete(?)",
            [categoryId]
        );

        return res.status(200).json({
            status: true,
            message: "Category deactivated successfully",
            data: result[0] || []
        });

    } catch (error) {
        console.error("Category Delete Error:", error);

        return res.status(500).json({
            status: false,
            message: error.sqlMessage || "Failed to deactivate category"
        });
    }
});


// ==========================================
// CATEGORY MANAGEMENT GET
// GET /api/category_management/get
// Access: ADMIN, SELLER, CUSTOMER
// ==========================================

router.get("/get", authenticateToken, async (req, res) => {
    try {
        const userType = String(req.user.USER_TYPE || "")
            .trim()
            .toUpperCase();

        if (!["ADMIN", "SELLER", "CUSTOMER"].includes(userType)) {
            return res.status(403).json({
                success: false,
                message: "Access denied. Admin, Seller or Customer only."
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
                success: false,
                message: "CATEGORY_ID must be -1 or a positive integer"
            });
        }

        if (
            !Number.isSafeInteger(limit) ||
            limit < 1 ||
            limit > 100 ||
            !Number.isSafeInteger(offset) ||
            offset < 0
        ) {
            return res.status(400).json({
                success: false,
                message: "LIMIT must be between 1 and 100 and OFFSET must be zero or greater"
            });
        }

        const [result] = await db.query(
            "CALL sp_m_category_management_get(?, ?, ?)",
            [
                categoryId,
                limit,
                offset
            ]
        );

        return res.status(200).json({
            success: true,
            message: "Category details fetched successfully",
            data: result[0] || []
        });

    } catch (error) {
        console.error("Category Get Error:", error);

        return res.status(500).json({
            success: false,
            message: error.sqlMessage || error.message
        });
    }
});

module.exports = router;