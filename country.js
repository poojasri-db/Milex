const express = require("express");
const router = express.Router();
const db = require("./db");

// ==========================================
// COUNTRY GET
// GET /api/country/get
// ==========================================

router.get("/get", async (req, res) => {
    try {
        const {
            COUNTRY_ID = -1
        } = req.query;

        const [result] = await db.query(
            "CALL sp_m_country_get(?)",
            [COUNTRY_ID]
        );

        res.status(200).json({
            STATUS: "SUCCESS",
            MESSAGE: "Country details retrieved successfully",
            DATA: result[0]
        });

    } catch (error) {
        res.status(400).json({
            STATUS: "FAILURE",
            MESSAGE: error.sqlMessage || error.message
        });
    }
});

module.exports = router;