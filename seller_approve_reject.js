
const express = require("express");
const router = express.Router();
const db = require("./db");
const authenticateToken = require("./auth_middleware");

const { sendSellerApprovalMail } = require("./mailer");

// ==========================================
// SELLER APPROVE / REJECT
// PUT /api/seller-approval/update
// ADMIN AUTHENTICATION REQUIRED
// SEND APPROVAL EMAIL ONLY WHEN APPROVED
// ==========================================

router.put("/update", authenticateToken, async (req, res) => {
    try {

        const {
            SELLER_ID,
            DECISION
        } = req.body || {};

        // VALIDATE INPUT
        if (!SELLER_ID || !DECISION) {
            return res.status(400).json({
                status: "FAILED",
                message: "SELLER_ID and DECISION are required"
            });
        }

        // CHECK ADMIN ROLE
        const userType = String(
            req.user.USER_TYPE || ""
        ).trim().toUpperCase();

        if (userType !== "ADMIN") {
            return res.status(403).json({
                status: "FAILED",
                message: "Only admin users can approve or reject sellers"
            });
        }

        const decision = String(DECISION).trim().toUpperCase();

        if (!["APPROVED", "REJECTED"].includes(decision)) {
            return res.status(400).json({
                status: "FAILED",
                message: "DECISION must be APPROVED or REJECTED"
            });
        }

        // GET UPDATED_BY FROM TOKEN
        const UPDATED_BY = req.user.USER_ID;

        // APPROVE / REJECT SELLER
        const [result] = await db.query(
            "CALL sp_m_seller_approve_reject(?,?,?)",
            [
                SELLER_ID,
                decision,
                UPDATED_BY
            ]
        );

        const response = result[0][0];

        let emailSent = false;
        let emailMessage = "No approval email sent because seller was rejected";

        // ==========================================
        // SEND EMAIL ONLY WHEN SELLER IS APPROVED
        // ==========================================

        if (decision === "APPROVED") {

            try {

                // GET SELLER DETAILS AND USERNAME
                const [sellerData] = await db.query(
                    `SELECT
                        S.SELLER_NAME,
                        S.EMAIL,
                        U.USER_NAME
                    FROM m_seller_onboarding S
                    INNER JOIN m_user U
                        ON S.USER_ID = U.USER_ID
                    WHERE S.SELLER_ID = ?
                    LIMIT 1`,
                    [SELLER_ID]
                );

                if (sellerData.length === 0) {
                    throw new Error("Seller details or user account not found");
                }

                const seller = sellerData[0];

                // SEND APPROVAL EMAIL
                await sendSellerApprovalMail(
                    seller.SELLER_NAME,
                    seller.USER_NAME,
                    seller.EMAIL
                );

                emailSent = true;
                emailMessage = "Seller approval email sent successfully";

            } catch (mailError) {

                console.error(
                    "SELLER APPROVAL EMAIL ERROR:",
                    mailError
                );

                emailMessage = "Seller approved successfully, but approval email could not be sent";
            }
        }

        return res.status(200).json({
            status: "SUCCESS",
            message: response.MESSAGE,
            data: response,
            EMAIL_SENT: emailSent,
            EMAIL_MESSAGE: emailMessage
        });

    } catch (error) {

        console.error("SELLER APPROVAL API ERROR:", error);

        return res.status(500).json({
            status: "FAILED",
            message: error.sqlMessage || "Internal server error"
        });
    }
});

module.exports = router;
