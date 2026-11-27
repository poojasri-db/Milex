
const express = require("express");
const router = express.Router();

const db = require("./db");
const authenticateToken = require("./auth_middleware");

// ==========================================
// GET SIZES
// GET /api/sizes/get
// Access: ADMIN, SELLER
// ==========================================

router.get("/get", authenticateToken, async (req, res) => {
    try {

        // ROLE VALIDATION
        const userType = String(req.user.USER_TYPE || "")
            .trim()
            .toUpperCase();

        if (!["ADMIN", "SELLER"].includes(userType)) {
            return res.status(403).json({
                status: "FAILED",
                message: "Access denied. Admin or Seller only."
            });
        }

        // QUERY PARAMETERS
        const { SIZE_ID = "-1" } = req.query;

        const sizeId = Number(SIZE_ID);

        // VALIDATION
        if (
            !Number.isSafeInteger(sizeId) ||
            (sizeId !== -1 && sizeId <= 0)
        ) {
            return res.status(400).json({
                status: "FAILED",
                message: "SIZE_ID must be -1 or a positive integer"
            });
        }

        // DATABASE CALL
        const [result] = await db.query(
            "CALL sp_m_sizes_get(?)",
            [sizeId]
        );

        const rows = result[0] || [];

        return res.status(200).json({
            status: "SUCCESS",
            count: rows.length,
            data: rows
        });

    } catch (error) {
        console.error("GET SIZES API ERROR:", error);

        return res.status(500).json({
            status: "FAILED",
            message: error.sqlMessage || "Internal server error"
        });
    }
});

module.exports = router;
