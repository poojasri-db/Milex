
const express = require("express");
const router = express.Router();
const db = require("./db");
const authenticateToken = require("./auth_middleware");

// ==========================================
// GET MATERIALS
// GET /api/materials/get
// ADMIN + SELLER
// ==========================================

router.get("/get", authenticateToken, async (req, res) => {
    try {
        const userType = String(req.user.USER_TYPE || "")
            .trim()
            .toUpperCase();

        if (!["ADMIN", "SELLER"].includes(userType)) {
            return res.status(403).json({
                status: "FAILED",
                message: "Access denied. Admin or Seller only."
            });
        }

        const {
            MATERIAL_ID = "-1",
            LIMIT = "10",
            OFFSET = "0"
        } = req.query;

        const materialId = Number(MATERIAL_ID);
        const limit = Number(LIMIT);
        const offset = Number(OFFSET);

        if (
            !Number.isSafeInteger(materialId) ||
            (materialId !== -1 && materialId <= 0) ||
            !Number.isInteger(limit) ||
            limit <= 0 ||
            limit > 100 ||
            !Number.isSafeInteger(offset) ||
            offset < 0
        ) {
            return res.status(400).json({
                status: "FAILED",
                message: "Invalid MATERIAL_ID, LIMIT or OFFSET"
            });
        }

        const [result] = await db.query(
            "CALL sp_m_materials_get(?,?,?)",
            [
                materialId,
                limit,
                offset
            ]
        );

        return res.status(200).json({
            status: "SUCCESS",
            message: "Materials fetched successfully",
            data: result[0] || []
        });

    } catch (error) {
        console.error("GET MATERIALS API ERROR:", error);

        return res.status(500).json({
            status: "FAILED",
            message: error.sqlMessage || error.message
        });
    }
});

module.exports = router;
