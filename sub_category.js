const express = require("express");
const router = express.Router();
const db = require("./db");
const authenticateToken = require("./auth_middleware");

// ==========================================
// INSERT SUB CATEGORY
// POST /api/sub-category/insert
// Access: ADMIN ONLY
// ==========================================

router.post("/insert", authenticateToken, async (req, res) => {
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

        const {
            SUB_CATEGORY_NAME,
            CATEGORY_ID,
            STATUS
        } = req.body;

        const categoryId = Number(CATEGORY_ID);

        if (
            !SUB_CATEGORY_NAME ||
            !String(SUB_CATEGORY_NAME).trim() ||
            !Number.isSafeInteger(categoryId) ||
            categoryId <= 0
        ) {
            return res.status(400).json({
                status: false,
                message: "Valid SUB_CATEGORY_NAME and CATEGORY_ID are required"
            });
        }

        const [result] = await db.query(
            "CALL sp_m_sub_category_management_insert(?,?,?,?)",
            [
                SUB_CATEGORY_NAME,
                categoryId,
                STATUS ?? null,
                req.user.USER_ID
            ]
        );

        return res.status(200).json({
            status: true,
            message: "Sub category inserted successfully",
            data: result[0] || []
        });

    } catch (error) {
        console.error("Insert Sub Category Error:", error);

        return res.status(500).json({
            status: false,
            message: error.sqlMessage || error.message
        });
    }
});


// ==========================================
// UPDATE SUB CATEGORY
// PUT /api/sub-category/update
// Access: ADMIN ONLY
// ==========================================

router.put("/update", authenticateToken, async (req, res) => {
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

        const {
            SUB_CATEGORY_ID,
            CATEGORY_ID,
            SUB_CATEGORY_NAME,
            STATUS
        } = req.body;

        const subCategoryId = Number(SUB_CATEGORY_ID);
        const categoryId = Number(CATEGORY_ID);

        if (
            !Number.isSafeInteger(subCategoryId) ||
            subCategoryId <= 0 ||
            !Number.isSafeInteger(categoryId) ||
            categoryId <= 0 ||
            !SUB_CATEGORY_NAME ||
            !String(SUB_CATEGORY_NAME).trim()
        ) {
            return res.status(400).json({
                status: false,
                message: "Valid SUB_CATEGORY_ID, CATEGORY_ID and SUB_CATEGORY_NAME are required"
            });
        }

        const [result] = await db.query(
            "CALL sp_m_sub_category_management_update(?,?,?,?,?)",
            [
                subCategoryId,
                categoryId,
                SUB_CATEGORY_NAME,
                STATUS ?? null,
                req.user.USER_ID
            ]
        );

        return res.status(200).json({
            status: true,
            message: "Sub category updated successfully",
            data: result[0] || []
        });

    } catch (error) {
        console.error("Update Sub Category Error:", error);

        return res.status(500).json({
            status: false,
            message: error.sqlMessage || error.message
        });
    }
});


// ==========================================
// GET SUB CATEGORY
// GET /api/sub-category/get
// Access: ADMIN, SELLER, CUSTOMER
// ==========================================

router.get("/get", authenticateToken, async (req, res) => {
    try {
        const userType = String(req.user.USER_TYPE || "")
            .trim()
            .toUpperCase();

        if (!["ADMIN", "SELLER", "CUSTOMER"].includes(userType)) {
            return res.status(403).json({
                status: false,
                message: "Access denied. Admin, Seller or Customer only."
            });
        }

        const {
            SUB_CATEGORY_ID = "-1",
            CATEGORY_ID = "-1",
            LIMIT = "10",
            OFFSET = "0"
        } = req.query;

        const subCategoryId = Number(SUB_CATEGORY_ID);
        const categoryId = Number(CATEGORY_ID);
        const limit = Number(LIMIT);
        const offset = Number(OFFSET);

        if (
            !Number.isSafeInteger(subCategoryId) ||
            (subCategoryId !== -1 && subCategoryId <= 0) ||
            !Number.isSafeInteger(categoryId) ||
            (categoryId !== -1 && categoryId <= 0)
        ) {
            return res.status(400).json({
                status: false,
                message: "SUB_CATEGORY_ID and CATEGORY_ID must be -1 or positive integers"
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
                status: false,
                message: "LIMIT must be between 1 and 100 and OFFSET must be zero or greater"
            });
        }

        const [result] = await db.query(
            "CALL sp_m_sub_category_management_get(?,?,?,?)",
            [
                subCategoryId,
                categoryId,
                limit,
                offset
            ]
        );

        return res.status(200).json({
            status: true,
            message: "Sub categories fetched successfully",
            data: result[0] || []
        });

    } catch (error) {
        console.error("Sub category GET error:", error);

        return res.status(500).json({
            status: false,
            message: "Failed to fetch sub categories",
            error: error.sqlMessage || error.message
        });
    }
});


// ==========================================
// DELETE (DEACTIVATE) SUB CATEGORY
// DELETE /api/sub-category/delete
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

        const {
            SUB_CATEGORY_ID,
            CATEGORY_ID
        } = req.body;

        const subCategoryId = Number(SUB_CATEGORY_ID);
        const categoryId = Number(CATEGORY_ID);

        if (
            !Number.isSafeInteger(subCategoryId) ||
            subCategoryId <= 0 ||
            !Number.isSafeInteger(categoryId) ||
            categoryId <= 0
        ) {
            return res.status(400).json({
                status: false,
                message: "Valid SUB_CATEGORY_ID and CATEGORY_ID are required"
            });
        }

        const [result] = await db.query(
            "CALL sp_m_sub_category_management_delete(?,?)",
            [
                subCategoryId,
                categoryId
            ]
        );

        return res.status(200).json({
            status: true,
            message: "Sub category deactivated successfully",
            data: result[0] || []
        });

    } catch (error) {
        console.error("Delete Sub Category Error:", error);

        return res.status(500).json({
            status: false,
            message: error.sqlMessage || error.message
        });
    }
});

module.exports = router;