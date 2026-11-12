
const express = require("express");
const router = express.Router();
const db = require("./db");

// ==========================================
// GET STATE
// GET /api/state/get
// PUBLIC API - NO TOKEN REQUIRED
// ==========================================

router.get("/get", async (req, res) => {
    try {

        // QUERY PARAMETERS
        const {
            STATE_ID = "-1",
            COUNTRY_ID = "-1"
        } = req.query;

        const stateId = Number(STATE_ID);
        const countryId = Number(COUNTRY_ID);

        // VALIDATION
        if (
            !Number.isInteger(stateId) ||
            (stateId !== -1 && stateId <= 0)
        ) {
            return res.status(400).json({
                status: "FAILED",
                message: "STATE_ID must be -1 or a positive integer"
            });
        }

        if (
            !Number.isInteger(countryId) ||
            (countryId !== -1 && countryId <= 0)
        ) {
            return res.status(400).json({
                status: "FAILED",
                message: "COUNTRY_ID must be -1 or a positive integer"
            });
        }

        // DATABASE CALL
        const [result] = await db.query(
            "CALL sp_m_state_get(?, ?)",
            [
                stateId,
                countryId
            ]
        );

        return res.status(200).json({
            status: "SUCCESS",
            message: "State details fetched successfully",
            data: result[0] || []
        });

    } catch (error) {

        console.error("GET STATE API ERROR:", error);

        return res.status(500).json({
            status: "FAILED",
            message: error.sqlMessage || error.message
        });

    }
});

module.exports = router;
