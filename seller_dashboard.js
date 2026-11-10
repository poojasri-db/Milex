const express = require("express");
const router = express.Router();
const db = require("./db");

router.get("/dashboard", async (req, res) => {
    try {
        const DAYS = req.query.DAYS || 7;

        if (!/^\d+$/.test(String(DAYS)) || Number(DAYS) <= 0) {
            return res.status(400).json({
                status: "FAILED",
                message: "Invalid DAYS value"
            });
        }

        const [result] = await db.query(
            "CALL sp_o_seller_verification_dashboard(?)",
            [Number(DAYS)]
        );

        return res.status(200).json({
            status: "SUCCESS",
            data: result[0][0]
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            status: "FAILED",
            message: error.message
        });
    }
});

module.exports = router;