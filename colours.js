const express = require("express");
const router = express.Router();
const db = require("./db");

// ==========================================
// GET COLOURS
// GET /api/colours/get
// ==========================================

router.get("/get", async (req, res) => {
    try {
        const {
            COLOUR_ID = -1,
            LIMIT = 10,
            OFFSET = 0
        } = req.query;

        const [result] = await db.query(
            "CALL sp_m_colours_get(?,?,?)",
            [
                Number(COLOUR_ID),
                Number(LIMIT),
                Number(OFFSET)
            ]
        );

        return res.status(200).json({
            status: "SUCCESS",
            data: result[0]
        });

    } catch (error) {
        console.error("GET COLOURS API ERROR:", error);

        return res.status(500).json({
            status: "FAILED",
            message: error.sqlMessage || "Internal server error"
        });
    }
});

module.exports = router;