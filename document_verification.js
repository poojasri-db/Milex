const express = require("express");
const router = express.Router();
const db = require("./db");

// ==========================================
// APPROVE SELLER DOCUMENT
// PUT /api/document_verification/approve
// ==========================================

router.put("/approve", async (req, res) => {
    try {
        const {
            DOCUMENT_ID,
            PROOF_TYPE,
            UPDATED_BY
        } = req.body;

        if (!DOCUMENT_ID || !PROOF_TYPE || !UPDATED_BY) {
            return res.status(400).json({
                status: "FAILED",
                message: "DOCUMENT_ID, PROOF_TYPE and UPDATED_BY are required"
            });
        }

        const [result] = await db.query(
            "CALL sp_o_seller_documents_review(?,?,?,?,?)",
            [
                DOCUMENT_ID,
                PROOF_TYPE,
                "APPROVED",
                null,
                UPDATED_BY
            ]
        );

        return res.status(200).json({
            status: "SUCCESS",
            message: result[0][0].MESSAGE,
            data: result[0][0]
        });

    } catch (error) {
        console.error("SELLER DOCUMENT APPROVE API ERROR:", error);

        return res.status(500).json({
            status: "FAILED",
            message: error.sqlMessage || "Internal server error"
        });
    }
});


// ==========================================
// REJECT SELLER DOCUMENT
// PUT /api/document_verification/reject
// ==========================================

router.put("/reject", async (req, res) => {
    try {
        const {
            DOCUMENT_ID,
            PROOF_TYPE,
            REJECTION_REASON,
            UPDATED_BY
        } = req.body;

        if (
            !DOCUMENT_ID ||
            !PROOF_TYPE ||
            !REJECTION_REASON ||
            !UPDATED_BY
        ) {
            return res.status(400).json({
                status: "FAILED",
                message: "DOCUMENT_ID, PROOF_TYPE, REJECTION_REASON and UPDATED_BY are required"
            });
        }

        const [result] = await db.query(
            "CALL sp_o_seller_documents_review(?,?,?,?,?)",
            [
                DOCUMENT_ID,
                PROOF_TYPE,
                "REJECTED",
                REJECTION_REASON,
                UPDATED_BY
            ]
        );

        return res.status(200).json({
            status: "SUCCESS",
            message: result[0][0].MESSAGE,
            data: result[0][0]
        });

    } catch (error) {
        console.error("SELLER DOCUMENT REJECT API ERROR:", error);

        return res.status(500).json({
            status: "FAILED",
            message: error.sqlMessage || "Internal server error"
        });
    }
});

module.exports = router;