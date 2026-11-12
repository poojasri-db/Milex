
const express = require("express");
const router = express.Router();
const db = require("./db");
const authenticateToken = require("./auth_middleware");

// ==========================================
// GET PAYMENT STATUS
// GET /api/payment-status/get
// ADMIN + SELLER + CUSTOMER
// ==========================================

router.get("/get", authenticateToken, async (req, res) => {
    try {
        const userType = String(req.user.USER_TYPE || "")
            .trim()
            .toUpperCase();

        if (!["ADMIN", "SELLER", "CUSTOMER"].includes(userType)) {
            return res.status(403).json({
                status: "FAILED",
                message: "Access denied."
            });
        }

        const {
            PAYMENT_STATUS_ID = "-1",
            LIMIT = "10",
            OFFSET = "0"
        } = req.query;

        const paymentStatusId = Number(PAYMENT_STATUS_ID);
        const limit = Number(LIMIT);
        const offset = Number(OFFSET);

        if (
            !Number.isSafeInteger(paymentStatusId) ||
            (paymentStatusId !== -1 && paymentStatusId <= 0)
        ) {
            return res.status(400).json({
                status: "FAILED",
                message: "PAYMENT_STATUS_ID must be -1 or a positive integer"
            });
        }

        if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
            return res.status(400).json({
                status: "FAILED",
                message: "LIMIT must be between 1 and 100"
            });
        }

        if (!Number.isSafeInteger(offset) || offset < 0) {
            return res.status(400).json({
                status: "FAILED",
                message: "OFFSET must be zero or a positive integer"
            });
        }

        const [result] = await db.query(
            "CALL sp_m_payment_status_get(?, ?, ?)",
            [
                paymentStatusId,
                limit,
                offset
            ]
        );

        return res.status(200).json({
            status: "SUCCESS",
            message: "Payment status details fetched successfully",
            data: result[0] || []
        });

    } catch (error) {
        console.error("GET PAYMENT STATUS ERROR:", error);

        return res.status(500).json({
            status: "FAILED",
            message: error.sqlMessage || error.message
        });
    }
});

module.exports = router;
