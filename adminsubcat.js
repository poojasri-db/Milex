const express = require("express");
const router = express.Router();

const db = require("./db");
const authenticateToken = require("./auth_middleware");

// ==========================================
// ADMIN SUB CATEGORY GET API
// ==========================================

router.get("/", authenticateToken, async (req, res) => {
    try {

        // ADMIN ONLY ACCESS
        if (req.user.USER_TYPE !== "ADMIN") {
            return res.status(403).json({
                status: "FAILED",
                message: "Access denied. Admin only."
            });
        }

        const {
            SUB_CATEGORY_ID = "-1",
            CATEGORY_ID = "-1",
            STATUS = "-1"
        } = req.query;

        const [result] = await db.query(
            `CALL sp_m_admin_sub_category_get(?, ?, ?)`,
            [
                SUB_CATEGORY_ID,
                CATEGORY_ID,
                STATUS
            ]
        );

        return res.status(200).json({
            status: "SUCCESS",
            message: "Sub categories fetched successfully",
            data: result[0]
        });

    } catch (error) {
        console.error("Admin Sub Category GET Error:", error);

        return res.status(500).json({
            status: "FAILED",
            message: error.message
        });
    }
});

module.exports = router;