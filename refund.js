
const express = require("express");
const router = express.Router();

const db = require("./db");
const authenticateToken = require("./auth_middleware");

router.get("/", authenticateToken, async (req, res) => {
    try {
        const {
            ORDER_NUMBER = "-1",
            ORDER_ID = -1,
            LIMIT = 10,
            OFFSET = 0
        } = req.query;

        const [result] = await db.query(
            `CALL sp_o_refunds_get(?, ?, ?, ?)`,
            [
                ORDER_NUMBER,
                Number(ORDER_ID),
                Number(LIMIT),
                Number(OFFSET)
            ]
        );

        return res.status(200).json({
            STATUS: "SUCCESS",
            MESSAGE: "Refund requests fetched successfully",
            DATA: result[0]
        });

    } catch (error) {
        console.error("Refund Requests Get Error:", error);

        return res.status(500).json({
            STATUS: "ERROR",
            MESSAGE: error.message
        });
    }
});

module.exports = router;
