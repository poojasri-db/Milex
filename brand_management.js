const express = require("express");
const router = express.Router();
const db = require("./db");
const authenticateToken = require("./auth_middleware");

// ==========================================
// INSERT BRAND
// POST /api/brand_management/insert
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
            BRAND_NAME,
            BRAND_LOGO,
            DESCRIPTION,
            STATUS,
            CATEGORY_ID,
            SUB_CATEGORY_ID
        } = req.body;

        if (
            !BRAND_NAME ||
            !String(BRAND_NAME).trim() ||
            CATEGORY_ID === undefined ||
            SUB_CATEGORY_ID === undefined
        ) {
            return res.status(400).json({
                status: false,
                message: "BRAND_NAME, CATEGORY_ID and SUB_CATEGORY_ID are required"
            });
        }

        const categoryId = Number(CATEGORY_ID);
        const subCategoryId = Number(SUB_CATEGORY_ID);

        if (
            !Number.isSafeInteger(categoryId) || categoryId <= 0 ||
            !Number.isSafeInteger(subCategoryId) || subCategoryId <= 0
        ) {
            return res.status(400).json({
                status: false,
                message: "Invalid CATEGORY_ID or SUB_CATEGORY_ID"
            });
        }

        const [result] = await db.query(
            "CALL sp_m_brand_management_insert(?,?,?,?,?,?,?)",
            [
                BRAND_NAME,
                BRAND_LOGO ?? null,
                DESCRIPTION ?? null,
                STATUS ?? null,
                categoryId,
                subCategoryId,
                req.user.USER_ID
            ]
        );

        return res.status(200).json({
            status: true,
            message: "Brand inserted successfully",
            data: result[0] || []
        });

    } catch (error) {
        console.error("Brand Insert Error:", error);

        return res.status(500).json({
            status: false,
            message: error.sqlMessage || "Failed to insert brand"
        });
    }
});


// ==========================================
// UPDATE BRAND
// PUT /api/brand_management/update
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
            BRAND_ID,
            BRAND_NAME,
            BRAND_LOGO,
            DESCRIPTION,
            STATUS,
            CATEGORY_ID,
            SUB_CATEGORY_ID
        } = req.body;

        const brandId = Number(BRAND_ID);
        const categoryId = Number(CATEGORY_ID);
        const subCategoryId = Number(SUB_CATEGORY_ID);

        if (
            !Number.isSafeInteger(brandId) || brandId <= 0 ||
            !BRAND_NAME ||
            !String(BRAND_NAME).trim() ||
            !Number.isSafeInteger(categoryId) || categoryId <= 0 ||
            !Number.isSafeInteger(subCategoryId) || subCategoryId <= 0
        ) {
            return res.status(400).json({
                status: false,
                message: "Provide valid BRAND_ID, BRAND_NAME, CATEGORY_ID and SUB_CATEGORY_ID"
            });
        }

        const [result] = await db.query(
            "CALL sp_m_brand_management_update(?,?,?,?,?,?,?,?)",
            [
                brandId,
                BRAND_NAME,
                BRAND_LOGO ?? null,
                DESCRIPTION ?? null,
                STATUS ?? null,
                categoryId,
                subCategoryId,
                req.user.USER_ID
            ]
        );

        return res.status(200).json({
            status: true,
            message: "Brand updated successfully",
            data: result[0] || []
        });

    } catch (error) {
        console.error("Brand Update Error:", error);

        return res.status(500).json({
            status: false,
            message: error.sqlMessage || "Failed to update brand"
        });
    }
});


// ==========================================
// GET BRAND
// GET /api/brand_management/get
// Access: ADMIN, SELLER
// ==========================================

router.get("/get", authenticateToken, async (req, res) => {
    try {
        const userType = String(req.user.USER_TYPE || "")
            .trim()
            .toUpperCase();

        if (!["ADMIN", "SELLER"].includes(userType)) {
            return res.status(403).json({
                status: false,
                message: "Access denied. Admin or Seller only."
            });
        }

        const {
            BRAND_ID = "-1",
            CATEGORY_ID = "-1",
            SUB_CATEGORY_ID = "-1",
            LIMIT = "10",
            OFFSET = "0"
        } = req.query;

        const brandId = Number(BRAND_ID);
        const categoryId = Number(CATEGORY_ID);
        const subCategoryId = Number(SUB_CATEGORY_ID);
        const limit = Number(LIMIT);
        const offset = Number(OFFSET);

        if (
            !Number.isSafeInteger(brandId) ||
            (brandId !== -1 && brandId <= 0) ||
            !Number.isSafeInteger(categoryId) ||
            (categoryId !== -1 && categoryId <= 0) ||
            !Number.isSafeInteger(subCategoryId) ||
            (subCategoryId !== -1 && subCategoryId <= 0)
        ) {
            return res.status(400).json({
                status: false,
                message: "BRAND_ID, CATEGORY_ID and SUB_CATEGORY_ID must be -1 or positive integers"
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
            "CALL sp_m_brand_management_get(?,?,?,?,?)",
            [
                brandId,
                categoryId,
                subCategoryId,
                limit,
                offset
            ]
        );

        return res.status(200).json({
            status: true,
            message: "Brand details fetched successfully",
            data: result[0] || []
        });

    } catch (error) {
        console.error("Brand Get Error:", error);

        return res.status(500).json({
            status: false,
            message: error.sqlMessage || "Failed to fetch brand details"
        });
    }
});


// ==========================================
// DELETE BRAND (SOFT DELETE)
// DELETE /api/brand_management/delete
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
            BRAND_ID,
            CATEGORY_ID,
            SUB_CATEGORY_ID
        } = req.body;

        const brandId = Number(BRAND_ID);
        const categoryId = Number(CATEGORY_ID);
        const subCategoryId = Number(SUB_CATEGORY_ID);

        if (
            !Number.isSafeInteger(brandId) || brandId <= 0 ||
            !Number.isSafeInteger(categoryId) || categoryId <= 0 ||
            !Number.isSafeInteger(subCategoryId) || subCategoryId <= 0
        ) {
            return res.status(400).json({
                status: false,
                message: "Provide valid BRAND_ID, CATEGORY_ID and SUB_CATEGORY_ID"
            });
        }

        const [result] = await db.query(
            "CALL sp_m_brand_management_delete(?,?,?)",
            [
                brandId,
                categoryId,
                subCategoryId
            ]
        );

        return res.status(200).json({
            status: true,
            message: "Brand deactivated successfully",
            data: result[0] || []
        });

    } catch (error) {
        console.error("Brand Delete Error:", error);

        return res.status(500).json({
            status: false,
            message: error.sqlMessage || "Failed to deactivate brand"
        });
    }
});

module.exports = router;