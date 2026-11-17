
const express = require("express");
const router = express.Router();
const db = require("./db");
const authenticateToken = require("./auth_middleware");

// ==========================================
// GET SELLER ORDERS
// SELLER ONLY
// ==========================================

router.get("/get", authenticateToken, async (req, res) => {

    try {

        const USER_ID = req.user.USER_ID;
        const USER_TYPE = String(req.user.USER_TYPE || "").toUpperCase();

        // CHECK SELLER LOGIN

        if (USER_TYPE !== "SELLER") {
            return res.status(403).json({
                status: "FAILED",
                message: "Only sellers can view seller orders"
            });
        }

        if (!USER_ID) {
            return res.status(400).json({
                status: "FAILED",
                message: "User ID not found in token"
            });
        }

        // GET SELLER ID USING USER ID

        const [sellerResult] = await db.query(
            `SELECT SELLER_ID
             FROM m_seller_onboarding
             WHERE USER_ID = ?
             LIMIT 1`,
            [USER_ID]
        );

        if (!sellerResult.length) {
            return res.status(404).json({
                status: "FAILED",
                message: "Seller profile not found"
            });
        }

        const SELLER_ID = sellerResult[0].SELLER_ID;

        // GET PARAMETERS

        const {
            ORDER_ID = "-1",
            STATUS = "-1",
            LIMIT = 10,
            OFFSET = 0
        } = req.query;

        const limit = Number(LIMIT);
        const offset = Number(OFFSET);

        if (
            !Number.isInteger(limit) || limit <= 0 ||
            !Number.isInteger(offset) || offset < 0
        ) {
            return res.status(400).json({
                status: "FAILED",
                message: "Invalid LIMIT or OFFSET"
            });
        }

        if (
            ORDER_ID !== "-1" &&
            (!/^\d+$/.test(String(ORDER_ID)) ||
             Number(ORDER_ID) <= 0)
        ) {
            return res.status(400).json({
                status: "FAILED",
                message: "Invalid ORDER_ID"
            });
        }

        // CALL STORED PROCEDURE USING SELLER ID

        const [result] = await db.query(
            `CALL sp_o_place_orders_seller_get(?,?,?,?,?)`,
            [
                SELLER_ID,
                Number(ORDER_ID),
                STATUS,
                limit,
                offset
            ]
        );

        const orders = result[0] || [];
        const totalRecords = result[1]?.[0]?.TOTAL_RECORDS || 0;

        return res.status(200).json({
            status: "SUCCESS",
            message: "Seller orders fetched successfully",
            SELLER_ID: SELLER_ID,
            data: orders,
            pagination: {
                TOTAL_RECORDS: totalRecords,
                LIMIT: limit,
                OFFSET: offset
            }
        });

    } catch (error) {

        console.error("SELLER ORDER GET ERROR:", error);

        return res.status(400).json({
            status: "FAILED",
            message: error.sqlMessage || error.message
        });

    }

});

module.exports = router;
