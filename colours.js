
const express = require("express");
const router = express.Router();
const db = require("./db");
const authenticateToken = require("./auth_middleware");

// ==========================================
// GET COLOURS
// GET /api/colours/get
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

        const { COLOUR_ID = "-1" } = req.query;

        const colourId = Number(COLOUR_ID);

        if (
            !Number.isSafeInteger(colourId) ||
            (colourId !== -1 && colourId <= 0)
        ) {
            return res.status(400).json({
                status: "FAILED",
                message: "COLOUR_ID must be -1 or a positive integer"
            });
        }

        const [result] = await db.query(
            "CALL sp_m_colours_get(?)",
            [colourId]
        );

        const rows = result[0] || [];

        return res.status(200).json({
            status: "SUCCESS",
            message: rows.length
                ? "Colours fetched successfully"
                : "No colours found",
            count: rows.length,
            data: rows
        });

    } catch (error) {
        console.error("GET COLOURS API ERROR:", error);

        return res.status(500).json({
            status: "FAILED",
            message: error.sqlMessage || error.message
        });
    }
});

module.exports = router;
