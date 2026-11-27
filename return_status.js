
const express = require("express");
const router = express.Router();

const db = require("./db");
const authenticateToken = require("./auth_middleware");

router.get("/", authenticateToken, async (req, res) => {
    try {
        const { RETURN_STATUS_ID = "-1" } = req.query;

        const returnStatusId = Number(RETURN_STATUS_ID);

        if (
            !Number.isSafeInteger(returnStatusId) ||
            (returnStatusId !== -1 && returnStatusId <= 0)
        ) {
            return res.status(400).json({
                STATUS: "ERROR",
                MESSAGE: "RETURN_STATUS_ID must be -1 or a positive integer"
            });
        }

        const [result] = await db.query(
            "CALL sp_m_return_status(?)",
            [returnStatusId]
        );

        const rows = result[0] || [];

        return res.status(200).json({
            STATUS: "SUCCESS",
            MESSAGE: "Return status retrieved successfully",
            COUNT: rows.length,
            DATA: rows
        });

    } catch (error) {
        console.error("Return Status Get Error:", error);

        return res.status(500).json({
            STATUS: "ERROR",
            MESSAGE: error.sqlMessage || error.message
        });
    }
});

module.exports = router;
