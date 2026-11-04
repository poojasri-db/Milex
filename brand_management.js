
const express = require("express");
const router = express.Router();
const db = require("./db");

// ==========================================
// BRAND INSERT
// POST /api/brand/insert
// ==========================================

router.post("/insert", async (req, res) => {
    try {
        const {
            BRAND_NAME,
            BRAND_LOGO,
            DESCRIPTION,
            STATUS,
            CATEGORY_ID,
            SUB_CATEGORY_ID,
            CREATED_BY
        } = req.body;

        const [result] = await db.query(
            "CALL sp_m_brand_management_insert(?,?,?,?,?,?,?)",
            [
                BRAND_NAME,
                BRAND_LOGO,
                DESCRIPTION,
                STATUS,
                CATEGORY_ID,
                SUB_CATEGORY_ID,
                CREATED_BY
            ]
        );

        return res.status(200).json({
            success: true,
            message: "Brand inserted successfully",
            data: result[0]
        });

    } catch (error) {
        console.error("Brand Insert Error:", error);

        return res.status(500).json({
            success: false,
            message: error.sqlMessage || error.message
        });
    }
});


// ==========================================
// BRAND UPDATE
// PUT /api/brand/update
// ==========================================

router.put("/update", async (req, res) => {
    try {
        const {
            BRAND_ID,
            BRAND_NAME,
            BRAND_LOGO,
            DESCRIPTION,
            STATUS,
            CATEGORY_ID,
            SUB_CATEGORY_ID,
            UPDATED_BY
        } = req.body;

        const [result] = await db.query(
            "CALL sp_m_brand_management_update(?,?,?,?,?,?,?,?)",
            [
                BRAND_ID,
                BRAND_NAME,
                BRAND_LOGO,
                DESCRIPTION,
                STATUS,
                CATEGORY_ID,
                SUB_CATEGORY_ID,
                UPDATED_BY
            ]
        );

        return res.status(200).json({
            success: true,
            message: "Brand updated successfully",
            data: result[0]
        });

    } catch (error) {
        console.error("Brand Update Error:", error);

        return res.status(500).json({
            success: false,
            message: error.sqlMessage || error.message
        });
    }
});


// ==========================================
// BRAND GET
// GET /api/brand/get
// ==========================================

router.get("/get", async (req, res) => {
    try {
        const {
            BRAND_ID = "-1",
            CATEGORY_ID = "-1",
            SUB_CATEGORY_ID = "-1",
            LIMIT = 10,
            OFFSET = 0
        } = req.query;

        const limit = Math.max(1, parseInt(LIMIT, 10) || 10);
        const offset = Math.max(0, parseInt(OFFSET, 10) || 0);

        const [result] = await db.query(
            "CALL sp_m_brand_management_get(?,?,?,?,?)",
            [
                BRAND_ID,
                CATEGORY_ID,
                SUB_CATEGORY_ID,
                limit,
                offset
            ]
        );

        return res.status(200).json({
            success: true,
            message: "Brand details fetched successfully",
            data: result[0]
        });

    } catch (error) {
        console.error("Brand Get Error:", error);

        return res.status(500).json({
            success: false,
            message: error.sqlMessage || error.message
        });
    }
});


// ==========================================
// BRAND DELETE (SOFT DEACTIVATE)
// DELETE /api/brand/delete
// ==========================================

router.delete("/delete", async (req, res) => {
    try {
        const {
            BRAND_ID,
            CATEGORY_ID,
            SUB_CATEGORY_ID
        } = req.body;

        const [result] = await db.query(
            "CALL sp_m_brand_management_delete(?,?,?)",
            [
                BRAND_ID,
                CATEGORY_ID,
                SUB_CATEGORY_ID
            ]
        );

        return res.status(200).json({
            success: true,
            message: "Brand deactivated successfully",
            data: result[0]
        });

    } catch (error) {
        console.error("Brand Delete Error:", error);

        return res.status(500).json({
            success: false,
            message: error.sqlMessage || error.message
        });
    }
});

module.exports = router;
