
const express = require("express");
const router = express.Router();
const db = require("./db");

// ==========================================
// CATEGORY MANAGEMENT INSERT
// POST /api/category_management/insert
// ==========================================

router.post("/insert", async (req, res) => {
    try {
        const {
            CATEGORY_NAME,
            PARENT_CATEGORY_ID,
            CATEGORY_IMAGE,
            DESCRIPTION,
            STATUS,
            CREATED_BY
        } = req.body;

        const [result] = await db.query(
            "CALL sp_m_category_management_insert(?, ?, ?, ?, ?, ?)",
            [
                CATEGORY_NAME,
                PARENT_CATEGORY_ID,
                CATEGORY_IMAGE,
                DESCRIPTION,
                STATUS,
                CREATED_BY
            ]
        );

        res.status(200).json({
            success: true,
            message: "Category inserted successfully",
            data: result[0]
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.sqlMessage || error.message
        });
    }
});


// ==========================================
// CATEGORY MANAGEMENT UPDATE
// PUT /api/category_management/update
// ==========================================

router.put("/update", async (req, res) => {
    try {
        const {
            CATEGORY_ID,
            CATEGORY_NAME,
            PARENT_CATEGORY_ID,
            CATEGORY_IMAGE,
            DESCRIPTION,
            STATUS,
            UPDATED_BY
        } = req.body;

        const [result] = await db.query(
            "CALL sp_m_category_management_update(?, ?, ?, ?, ?, ?, ?)",
            [
                CATEGORY_ID,
                CATEGORY_NAME,
                PARENT_CATEGORY_ID,
                CATEGORY_IMAGE,
                DESCRIPTION,
                STATUS,
                UPDATED_BY
            ]
        );

        res.status(200).json({
            success: true,
            message: "Category updated successfully",
            data: result[0]
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.sqlMessage || error.message
        });
    }
});


// ==========================================
// CATEGORY MANAGEMENT DELETE
// DELETE /api/category_management/delete
// ==========================================

router.delete("/delete", async (req, res) => {
    try {
        const { CATEGORY_ID } = req.body;

        if (!CATEGORY_ID) {
            return res.status(400).json({
                status: false,
                message: "CATEGORY_ID is required"
            });
        }

        const [result] = await db.query(
            "CALL sp_m_category_management_delete(?)",
            [CATEGORY_ID]
        );

        return res.status(200).json({
            status: true,
            message: "Category deactivated successfully"
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
// ==========================================

router.get("/get", async (req, res) => {
    try {
        const {
            CATEGORY_ID = "-1",
            LIMIT = 10,
            OFFSET = 0
        } = req.query;

        const [result] = await db.query(
            "CALL sp_m_category_management_get(?, ?, ?)",
            [
                CATEGORY_ID,
                parseInt(LIMIT, 10),
                parseInt(OFFSET, 10)
            ]
        );

        res.status(200).json({
            success: true,
            message: "Category details fetched successfully",
            data: result[0]
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.sqlMessage || error.message
        });
    }
});

module.exports = router;
