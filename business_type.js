const express = require("express");
const router = express.Router();
const db = require("./db");

// ==========================================
// BUSINESS TYPE GET
// GET /api/business-type/get
// ==========================================

router.get("/get", async (req, res) => {
    try {
        const {
            BUSINESS_TYPE_ID = -1
        } = req.query;

        const [result] = await db.query(
            "CALL sp_m_business_type_get(?)",
            [BUSINESS_TYPE_ID]
        );

        res.status(200).json({
            STATUS: "SUCCESS",
            MESSAGE: "Business type details retrieved successfully",
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