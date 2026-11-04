const express = require("express");
const router = express.Router();
const db = require("./db");

router.get("/get", async (req, res) => {
    try {

        const {
            STATE_ID = -1,
            COUNTRY_ID = -1
        } = req.query;

        const [result] = await db.query(
            "CALL sp_m_state_get(?, ?)",
            [
                STATE_ID,
                COUNTRY_ID
            ]
        );

        res.status(200).json({
            status: "SUCCESS",
            message: "State details fetched successfully",
            data: result[0]
        });

    } catch (error) {

        res.status(400).json({
            status: "FAILED",
            message: error.sqlMessage || error.message
        });

    }
});

module.exports = router;