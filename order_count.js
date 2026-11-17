
const express = require("express");
const router = express.Router();
const db = require("./db");
const authenticateToken = require("./auth_middleware");

// ==========================================
// ORDER MANAGEMENT DASHBOARD COUNT
// GET /api/order_management/dashboard-count/get
// ADMIN / SELLER
// ==========================================

router.get("/get", authenticateToken, async (req, res) => {
    try {

        const USER_TYPE = String(req.user.USER_TYPE || "")
            .trim()
            .toUpperCase();

        let SELLER_ID;

        // ADMIN
        if (USER_TYPE === "ADMIN") {

            SELLER_ID = Number(req.query.SELLER_ID ?? -1);

        }
        // SELLER
        else if (USER_TYPE === "SELLER") {

            SELLER_ID = Number(req.user.SELLER_ID);

            if (!Number.isSafeInteger(SELLER_ID) || SELLER_ID <= 0) {
                return res.status(400).json({
                    status: "FAILED",
                    message: "Seller ID not found in authenticated user"
                });
            }

        } else {

            return res.status(403).json({
                status: "FAILED",
                message: "Access denied"
            });

        }

        // ==========================================
        // GET REQUEST PARAMETERS
        // ==========================================

        const {
            DAYS = "7"
        } = req.query;

        const days = Number(DAYS);

        // SELLER ID VALIDATION
        if (
            !Number.isSafeInteger(SELLER_ID) ||
            (SELLER_ID !== -1 && SELLER_ID <= 0)
        ) {
            return res.status(400).json({
                status: "FAILED",
                message: "Invalid SELLER_ID"
            });
        }

        // ADMIN ONLY - ALL SELLERS
        if (SELLER_ID === -1 && USER_TYPE !== "ADMIN") {
            return res.status(403).json({
                status: "FAILED",
                message: "Only admin can view all sellers"
            });
        }

        // DAYS VALIDATION
        if (![7, 30, 60, 90, 180].includes(days)) {
            return res.status(400).json({
                status: "FAILED",
                message: "DAYS must be 7, 30, 60, 90 or 180"
            });
        }

        // ==========================================
        // CALL STORED PROCEDURE
        // ==========================================

        const [result] = await db.query(
            "CALL sp_m_order_management_dashboard_count(?,?)",
            [
                SELLER_ID,
                days
            ]
        );

        // ==========================================
        // SUCCESS RESPONSE
        // ==========================================

        return res.status(200).json({
            status: "SUCCESS",
            message: "Order dashboard counts fetched successfully",
            data: result[0][0] || {}
        });

    } catch (error) {

        console.error("ORDER DASHBOARD ERROR:", error);

        return res.status(500).json({
            status: "FAILED",
            message: error.sqlMessage || error.message
        });

    }
});

module.exports = router;
