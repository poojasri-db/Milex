
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

        const { MATERIAL_ID = "-1" } = req.query;

        const materialId = Number(MATERIAL_ID);

        if (
            !Number.isSafeInteger(materialId) ||
            (materialId !== -1 && materialId <= 0)
        ) {
            return res.status(400).json({
                status: "FAILED",
                message: "MATERIAL_ID must be -1 or a positive integer"
            });
        }

        const [result] = await db.query(
            "CALL sp_m_materials_get(?)",
            [materialId]
        );

        const rows = result[0] || [];

        return res.status(200).json({
            status: "SUCCESS",
            message: rows.length
                ? "Materials fetched successfully"
                : "No materials found",
            count: rows.length,
            data: rows
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
