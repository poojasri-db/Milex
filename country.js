
const express = require("express");
const router = express.Router();
const db = require("./db");

// ==========================================
// COUNTRY GET
// GET /api/country/get
// PUBLIC API - NO TOKEN REQUIRED
// ==========================================

router.get("/get", async (req, res) => {
    try {
        const { COUNTRY_ID = "-1" } = req.query;

        const countryId = Number(COUNTRY_ID);

        if (
            !Number.isSafeInteger(countryId) ||
            (countryId !== -1 && countryId <= 0)
        ) {
            return res.status(400).json({
                STATUS: "FAILURE",
                MESSAGE: "COUNTRY_ID must be -1 or a positive integer"
            });
        }

        const [result] = await db.query(
            "CALL sp_m_country_get(?)",
            [countryId]
        );

        const rows = result[0] || [];

        return res.status(200).json({
            STATUS: "SUCCESS",
            MESSAGE: rows.length
                ? "Country details retrieved successfully"
                : "No country details found",
            COUNT: rows.length,
            DATA: rows
        });

    } catch (error) {
        console.error("COUNTRY GET ERROR:", error);

        return res.status(500).json({
            STATUS: "FAILURE",
            MESSAGE: error.sqlMessage || error.message
        });
    }
});

module.exports = router;
