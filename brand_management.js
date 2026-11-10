
const express = require("express");
const router = express.Router();
const db = require("./db");

// ==========================================
// INSERT BRAND
// POST /api/brand_management/insert
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

        res.status(200).json({
            status: true,
            message: "Brand inserted successfully",
            data: result[0] || []
        });

    } catch (error) {
        console.error("Brand Insert Error:", error);

        res.status(500).json({
            status: false,
            message: error.sqlMessage || "Failed to insert brand"
        });
    }
});


// ==========================================
// UPDATE BRAND
// PUT /api/brand_management/update
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

        res.status(200).json({
            status: true,
            message: "Brand updated successfully",
            data: result[0] || []
        });

    } catch (error) {
        console.error("Brand Update Error:", error);

        res.status(500).json({
            status: false,
            message: "Failed to update brand",
            error: error.message
        });
    }
});


// ==========================================
// GET BRAND
// GET /api/brand_management/get
// ==========================================
router.get("/get", async (req, res) => {
    try {
        const {
            BRAND_ID = -1,
            CATEGORY_ID = -1,
            SUB_CATEGORY_ID = -1,
            LIMIT = 10,
            OFFSET = 0
        } = req.query;

        const [result] = await db.query(
            "CALL sp_m_brand_management_get(?,?,?,?,?)",
            [
                Number(BRAND_ID),
                Number(CATEGORY_ID),
                Number(SUB_CATEGORY_ID),
                Number(LIMIT),
                Number(OFFSET)
            ]
        );

        res.status(200).json({
            status: true,
            message: "Brand details fetched successfully",
            data: result[0] || []
        });

    } catch (error) {
        console.error("Brand Get Error:", error);

        res.status(500).json({
            status: false,
            message: "Failed to fetch brand details",
            error: error.message
        });
    }
});


// ==========================================
// DELETE BRAND (SOFT DELETE)
// DELETE /api/brand_management/delete
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

        res.status(200).json({
            status: true,
            message: "Brand deactivated successfully",
            data: result[0] || []
        });

    } catch (error) {
        console.error("Brand Delete Error:", error);

        res.status(500).json({
            status: false,
            message: "Failed to deactivate brand",
            error: error.message
        });
    }
});

module.exports = router;
