const express = require("express");
const router = express.Router();

const db = require("./db");
const authenticateToken = require("./auth_middleware");

router.get("/", authenticateToken, async (req, res) => {
    try {
        const {
            ORDER_NUMBER,
            LIMIT = 10,
            OFFSET = 0
        } = req.query;

        if (!ORDER_NUMBER) {
            return res.status(400).json({
                STATUS: "ERROR",
                MESSAGE: "ORDER_NUMBER is required"
            });
        }

        const [result] = await db.query(
            `CALL sp_o_return_request_dropdown(?, ?, ?)`,
            [
                ORDER_NUMBER,
                parseInt(LIMIT),
                parseInt(OFFSET)
            ]
        );

        return res.status(200).json({
            STATUS: "SUCCESS",
            MESSAGE: "Return request dropdown retrieved successfully",
            DATA: result[0]
        });

    } catch (error) {
        return res.status(500).json({
            STATUS: "ERROR",
            MESSAGE: error.message
        });
    }
});

module.exports = router;