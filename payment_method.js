const express = require("express");
const router = express.Router();
const db = require("./db");
const authenticateToken = require("./auth_middleware");

router.use(authenticateToken);

// ==========================================
// GET PAYMENT METHODS
// ==========================================

router.get("/get", async (req, res) => {
    try {
        const {
            PAYMENT_METHOD_ID = -1,
            PAYMENT_METHOD_NAME = "",
            LIMIT = 10,
            OFFSET = 0
        } = req.query;

        const [result] = await db.query(
            "CALL sp_o_payment_method_get(?, ?, ?, ?)",
            [
                PAYMENT_METHOD_ID,
                PAYMENT_METHOD_NAME,
                LIMIT,
                OFFSET
            ]
        );

        return res.status(200).json({
            success: true,
            message: "Payment methods fetched successfully",
            data: result[0]
        });

    } catch (error) {
        console.error("PAYMENT METHOD GET ERROR:", error);

        return res.status(500).json({
            success: false,
            message: error.sqlMessage || error.message
        });
    }
});

module.exports = router;