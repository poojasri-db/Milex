const express = require("express");
const router = express.Router();
const db = require("./db");

// ==========================================
// GET MATERIALS
// GET /api/materials/get
// ==========================================

router.get("/get", async (req, res) => {
    try {
        const {
            MATERIAL_ID = -1,
            LIMIT = 10,
            OFFSET = 0
        } = req.query;

        if (
            !Number.isInteger(Number(MATERIAL_ID)) ||
            !Number.isInteger(Number(LIMIT)) ||
            !Number.isInteger(Number(OFFSET)) ||
            Number(MATERIAL_ID) < -1 ||
            Number(LIMIT) <= 0 ||
            Number(OFFSET) < 0
        ) {
            return res.status(400).json({
                status: "FAILED",
                message: "Invalid MATERIAL_ID, LIMIT or OFFSET"
            });
        }

        const [result] = await db.query(
            "CALL sp_m_materials_get(?,?,?)",
            [
                Number(MATERIAL_ID),
                Number(LIMIT),
                Number(OFFSET)
            ]
        );

        return res.status(200).json({
            status: "SUCCESS",
            data: result[0]
        });

    } catch (error) {
        console.error("GET MATERIALS API ERROR:", error);

        return res.status(500).json({
            status: "FAILED",
            message: error.sqlMessage || "Internal server error"
        });
    }
});

module.exports = router;