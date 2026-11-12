
const express = require("express");
const router = express.Router();
const db = require("./db");
const authenticateToken = require("./auth_middleware");


// ==========================================
// ADMIN AUTHORIZATION MIDDLEWARE
// USER_TYPE_ID = 3
// ==========================================

const authorizeAdmin = (req, res, next) => {

    if (Number(req.user.USER_TYPE_ID) !== 3) {
        return res.status(403).json({
            status: "FAILED",
            message: "Access denied. Admin permission required."
        });
    }

    next();
};


// ==========================================
// APPROVE SELLER DOCUMENT
// PUT /api/document_verification/approve
// ADMIN ONLY
// ==========================================

router.put(
    "/approve",
    authenticateToken,
    authorizeAdmin,
    async (req, res) => {
        try {

            const {
                DOCUMENT_ID,
                PROOF_TYPE
            } = req.body || {};

            if (!DOCUMENT_ID || !PROOF_TYPE) {
                return res.status(400).json({
                    status: "FAILED",
                    message: "DOCUMENT_ID and PROOF_TYPE are required"
                });
            }

            const UPDATED_BY = req.user.USER_ID;

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
    }
);


// ==========================================
// REJECT SELLER DOCUMENT
// PUT /api/document_verification/reject
// ADMIN ONLY
// ==========================================

router.put(
    "/reject",
    authenticateToken,
    authorizeAdmin,
    async (req, res) => {
        try {

            const {
                DOCUMENT_ID,
                PROOF_TYPE,
                REJECTION_REASON
            } = req.body || {};

            if (!DOCUMENT_ID || !PROOF_TYPE || !REJECTION_REASON) {
                return res.status(400).json({
                    status: "FAILED",
                    message: "DOCUMENT_ID, PROOF_TYPE and REJECTION_REASON are required"
                });
            }

            const UPDATED_BY = req.user.USER_ID;

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
    }
);


module.exports = router;
