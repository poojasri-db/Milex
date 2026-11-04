
const express = require("express");
const router = express.Router();
const db = require("./db");

// ==========================================
// INSERT SUB CATEGORY
// POST /api/sub-category/insert
// ==========================================

router.post("/insert", async (req, res) => {
    try {
        const {
            SUB_CATEGORY_NAME,
            CATEGORY_ID,
            STATUS,
            CREATED_BY
        } = req.body;

        const [result] = await db.query(
            "CALL sp_m_sub_category_management_insert(?,?,?,?)",
            [
                SUB_CATEGORY_NAME,
                CATEGORY_ID,
                STATUS,
                CREATED_BY
            ]
        );

        return res.status(200).json({
            status: true,
            message: "Sub category inserted successfully",
            data: result[0]
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
// ==========================================

router.put("/update", async (req, res) => {
    try {
        const {
            SUB_CATEGORY_ID,
            CATEGORY_ID,
            SUB_CATEGORY_NAME,
            STATUS,
            UPDATED_BY
        } = req.body;

        const [result] = await db.query(
            "CALL sp_m_sub_category_management_update(?,?,?,?,?)",
            [
                SUB_CATEGORY_ID,
                CATEGORY_ID,
                SUB_CATEGORY_NAME,
                STATUS,
                UPDATED_BY
            ]
        );

        return res.status(200).json({
            status: true,
            message: "Sub category updated successfully",
            data: result[0]
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
// ==========================================

router.get("/get", async (req, res) => {
    try {
        const {
            SUB_CATEGORY_ID = "-1",
            CATEGORY_ID = "-1",
            LIMIT = 10,
            OFFSET = 0
        } = req.query;

        const limit = Math.max(1, parseInt(LIMIT, 10) || 10);
        const offset = Math.max(0, parseInt(OFFSET, 10) || 0);

        const [result] = await db.query(
            "CALL sp_m_sub_category_management_get(?,?,?,?)",
            [
                SUB_CATEGORY_ID,
                CATEGORY_ID,
                limit,
                offset
            ]
        );

        return res.status(200).json({
            status: true,
            message: "Sub categories fetched successfully",
            data: result[0]
        });

    } catch (error) {
        console.error("Get Sub Category Error:", error);

        return res.status(500).json({
            status: false,
            message: error.sqlMessage || error.message
        });
    }
});


// ==========================================
// DELETE (DEACTIVATE) SUB CATEGORY
// DELETE /api/sub-category/delete
// ==========================================

router.delete("/delete", async (req, res) => {
    try {
        const {
            SUB_CATEGORY_ID,
            CATEGORY_ID
        } = req.body;

        const [result] = await db.query(
            "CALL sp_m_sub_category_management_delete(?,?)",
            [
                SUB_CATEGORY_ID,
                CATEGORY_ID
            ]
        );

        return res.status(200).json({
            status: true,
            message: "Sub category deactivated successfully",
            data: result[0]
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
