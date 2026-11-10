const express = require("express");
const router = express.Router();
const db = require("./db");

// ==========================================
// GET SELLER VERIFICATION DETAILS
// GET /api/seller-verification/get
// ==========================================

router.get("/get", async (req, res) => {
    try {
        const {
            BUSINESS_TYPE_ID = "-1",
            SELLER_ID = "-1",
            DOCUMENT_VERIFICATION_STATUS = "-1",
            DAYS = 7,
            LIMIT = 10,
            OFFSET = 0
        } = req.query;

        const [result] = await db.query(
            "CALL sp_o_seller_verification_get(?,?,?,?,?,?)",
            [
                BUSINESS_TYPE_ID,
                SELLER_ID,
                DOCUMENT_VERIFICATION_STATUS,
                Number(DAYS),
                Number(LIMIT),
                Number(OFFSET)
            ]
        );

        res.status(200).json({
            success: true,
            message: "Seller verification details fetched successfully",
            data: result[0] || []
        });

    } catch (error) {
        console.error("Seller Verification Get Error:", error);

        res.status(500).json({
            success: false,
            message: error.sqlMessage || "Failed to fetch seller verification details"
        });
    }
});

module.exports = router;