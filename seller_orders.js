
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
        const USER_TYPE = String(req.user.USER_TYPE).toUpperCase();

        // CHECK SELLER LOGIN

        if (USER_TYPE !== "SELLER") {
            return res.status(403).json({
                status: "FAILED",
                message: "Only sellers can view seller orders"
            });
        }

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

        // CALL STORED PROCEDURE

        const [result] = await db.query(
            `CALL sp_o_place_orders_seller_get(?,?,?,?,?)`,
            [
                USER_ID,
                ORDER_ID,
                STATUS,
                limit,
                offset
            ]
        );

        const orders = result[0];
        const totalRecords = result[1][0].TOTAL_RECORDS;

        return res.status(200).json({
            status: "SUCCESS",
            message: "Seller orders fetched successfully",
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
