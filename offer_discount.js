
const express = require("express");
const router = express.Router();
const db = require("./db");

// ==========================================
// INSERT OFFER
// POST /api/offers-discounts/insert
// ==========================================

router.post("/insert", async (req, res) => {
    try {
        const {
            OFFER_NAME,
            OFFER_CODE,
            OFFER_TYPE,
            DISCOUNT_VALUE,
            MINIMUM_ORDER_AMOUNT,
            MAXIMUM_DISCOUNT,
            START_DATE,
            END_DATE,
            PRODUCT_ID,
            CATEGORY_ID,
            STATUS,
            CREATED_BY
        } = req.body || {};

        await db.query(
            "CALL sp_m_offers_discounts_insert(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [
                OFFER_NAME,
                OFFER_CODE,
                OFFER_TYPE,
                DISCOUNT_VALUE,
                MINIMUM_ORDER_AMOUNT,
                MAXIMUM_DISCOUNT,
                START_DATE,
                END_DATE,
                PRODUCT_ID,
                CATEGORY_ID,
                STATUS,
                CREATED_BY
            ]
        );

        res.status(200).json({
            status: "SUCCESS",
            message: "Offer inserted successfully"
        });

    } catch (error) {
        res.status(400).json({
            status: "FAILED",
            message: error.sqlMessage || error.message
        });
    }
});

// ==========================================
// UPDATE OFFER
// POST /api/offers-discounts/update
// ==========================================

router.put("/update", async (req, res) => {
    try {
        const {
            OFFER_ID,
            OFFER_NAME,
            OFFER_CODE,
            OFFER_TYPE,
            DISCOUNT_VALUE,
            MINIMUM_ORDER_AMOUNT,
            MAXIMUM_DISCOUNT,
            START_DATE,
            END_DATE,
            PRODUCT_ID,
            CATEGORY_ID,
            STATUS,
            UPDATED_BY
        } = req.body || {};

        await db.query(
            "CALL sp_m_offers_discounts_update(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [
                OFFER_ID,
                OFFER_NAME,
                OFFER_CODE,
                OFFER_TYPE,
                DISCOUNT_VALUE,
                MINIMUM_ORDER_AMOUNT,
                MAXIMUM_DISCOUNT,
                START_DATE,
                END_DATE,
                PRODUCT_ID,
                CATEGORY_ID,
                STATUS,
                UPDATED_BY
            ]
        );

        res.status(200).json({
            status: "SUCCESS",
            message: "Offer updated successfully"
        });

    } catch (error) {
        res.status(400).json({
            status: "FAILED",
            message: error.sqlMessage || error.message
        });
    }
});

// ==========================================
// GET OFFERS
// GET /api/offers-discounts/get
// ==========================================

router.get("/get", async (req, res) => {
    try {
        const OFFER_ID =
            req.query.OFFER_ID !== undefined
                ? req.query.OFFER_ID
                : -1;

        const [result] = await db.query(
            "CALL sp_m_offers_discounts_get(?)",
            [OFFER_ID]
        );

        res.status(200).json({
            status: "SUCCESS",
            data: result[0]
        });

    } catch (error) {
        res.status(400).json({
            status: "FAILED",
            message: error.sqlMessage || error.message
        });
    }
});

// ==========================================
// DELETE OFFER
// POST /api/offers-discounts/delete
// ==========================================

router.delete("/delete", async (req, res) => {
    try {
        const { OFFER_ID } = req.body || {};

        await db.query(
            "CALL sp_m_offers_discounts_delete(?)",
            [OFFER_ID]
        );

        res.status(200).json({
            status: "SUCCESS",
            message: "Offer deleted successfully"
        });

    } catch (error) {
        res.status(400).json({
            status: "FAILED",
            message: error.sqlMessage || error.message
        });
    }
});

module.exports = router;
