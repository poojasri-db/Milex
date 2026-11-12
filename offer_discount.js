
const express = require("express");
const router = express.Router();
const db = require("./db");
const authenticateToken = require("./auth_middleware");

// ==========================================
// ADMIN AUTHORIZATION
// ==========================================

const adminOnly = (req, res, next) => {

    if (
        String(req.user.USER_TYPE || "").trim().toUpperCase() !== "ADMIN"
    ) {
        return res.status(403).json({
            status: "FAILED",
            message: "Access denied. Admin only."
        });
    }

    next();
};

// Apply authentication and admin authorization
// to all routes below
router.use(authenticateToken);
router.use(adminOnly);


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
            STATUS
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
                req.user.USER_ID
            ]
        );

        return res.status(200).json({
            status: "SUCCESS",
            message: "Offer inserted successfully"
        });

    } catch (error) {

        return res.status(400).json({
            status: "FAILED",
            message: error.sqlMessage || error.message
        });

    }
});


// ==========================================
// UPDATE OFFER
// PUT /api/offers-discounts/update
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
            STATUS
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
                req.user.USER_ID
            ]
        );

        return res.status(200).json({
            status: "SUCCESS",
            message: "Offer updated successfully"
        });

    } catch (error) {

        return res.status(400).json({
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

        if (!/^-1$|^[0-9]+$/.test(String(OFFER_ID))) {
            return res.status(400).json({
                status: "FAILED",
                message: "Invalid OFFER_ID"
            });
        }

        const [result] = await db.query(
            "CALL sp_m_offers_discounts_get(?)",
            [OFFER_ID]
        );

        return res.status(200).json({
            status: "SUCCESS",
            data: result[0]
        });

    } catch (error) {

        return res.status(400).json({
            status: "FAILED",
            message: error.sqlMessage || error.message
        });

    }
});


// ==========================================
// DELETE OFFER
// DELETE /api/offers-discounts/delete
// ==========================================

router.delete("/delete", async (req, res) => {
    try {

        const { OFFER_ID } = req.body || {};

        if (
            OFFER_ID === undefined ||
            !/^[0-9]+$/.test(String(OFFER_ID)) ||
            Number(OFFER_ID) <= 0
        ) {
            return res.status(400).json({
                status: "FAILED",
                message: "Valid OFFER_ID is required"
            });
        }

        await db.query(
            "CALL sp_m_offers_discounts_delete(?)",
            [OFFER_ID]
        );

        return res.status(200).json({
            status: "SUCCESS",
            message: "Offer deleted successfully"
        });

    } catch (error) {

        return res.status(400).json({
            status: "FAILED",
            message: error.sqlMessage || error.message
        });

    }
});

module.exports = router;
