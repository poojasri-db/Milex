
const express = require("express");
const router = express.Router();
const db = require("./db");
const authenticateToken = require("./auth_middleware");

// ==========================================
// ROLE AUTHORIZATION
// ==========================================

const allowRoles = (...roles) => {
    return (req, res, next) => {

        const userType = String(req.user?.USER_TYPE || "")
            .trim()
            .toUpperCase();

        if (!roles.includes(userType)) {
            return res.status(403).json({
                status: "FAILED",
                message: "Access denied. You are not authorized."
            });
        }

        next();
    };
};

// Apply authentication to all routes
router.use(authenticateToken);


// ==========================================
// INSERT OFFER
// ADMIN, SELLER
// POST /api/offers-discounts/insert
// ==========================================

router.post("/insert", allowRoles("ADMIN", "SELLER"), async (req, res) => {
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
            PRODUCT_IDS,
            CATEGORY_IDS
        } = req.body || {};

        await db.query(
            "CALL sp_m_offers_discounts_insert(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [
                OFFER_NAME,
                OFFER_CODE,
                OFFER_TYPE,
                DISCOUNT_VALUE,
                MINIMUM_ORDER_AMOUNT,
                MAXIMUM_DISCOUNT,
                START_DATE,
                END_DATE,
                JSON.stringify(PRODUCT_IDS || []),
                JSON.stringify(CATEGORY_IDS || []),
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
// ADMIN, SELLER
// PUT /api/offers-discounts/update
// ==========================================

router.put("/update", allowRoles("ADMIN", "SELLER"), async (req, res) => {
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
            PRODUCT_IDS,
            CATEGORY_IDS,
            STATUS
        } = req.body || {};

        if (!OFFER_ID || Number(OFFER_ID) <= 0) {
            return res.status(400).json({
                status: "FAILED",
                message: "Valid OFFER_ID is required"
            });
        }

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
                JSON.stringify(PRODUCT_IDS || []),
                JSON.stringify(CATEGORY_IDS || []),
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
// ADMIN, SELLER, CUSTOMER
// GET /api/offers-discounts/get
// ==========================================

router.get("/get", allowRoles("ADMIN", "SELLER", "CUSTOMER"), async (req, res) => {
    try {

        const OFFER_ID =
            req.query.OFFER_ID !== undefined
                ? req.query.OFFER_ID
                : -1;

        const LIMIT =
            req.query.LIMIT !== undefined
                ? req.query.LIMIT
                : 10;

        const OFFSET =
            req.query.OFFSET !== undefined
                ? req.query.OFFSET
                : 0;

        if (!/^-1$|^[0-9]+$/.test(String(OFFER_ID))) {
            return res.status(400).json({
                status: "FAILED",
                message: "Invalid OFFER_ID"
            });
        }

        if (!/^[0-9]+$/.test(String(LIMIT)) || Number(LIMIT) <= 0) {
            return res.status(400).json({
                status: "FAILED",
                message: "Invalid LIMIT"
            });
        }

        if (!/^[0-9]+$/.test(String(OFFSET))) {
            return res.status(400).json({
                status: "FAILED",
                message: "Invalid OFFSET"
            });
        }

        const [result] = await db.query(
            "CALL sp_m_offers_discounts_get(?, ?, ?)",
            [
                OFFER_ID,
                Number(LIMIT),
                Number(OFFSET)
            ]
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
// ADMIN, SELLER
// DELETE /api/offers-discounts/delete
// ==========================================

router.delete("/delete", allowRoles("ADMIN", "SELLER"), async (req, res) => {
    try {

        const { OFFER_ID } = req.body || {};

        if (
            !OFFER_ID ||
            !/^[0-9]+$/.test(String(OFFER_ID)) ||
            Number(OFFER_ID) <= 0
        ) {
            return res.status(400).json({
                status: "FAILED",
                message: "Invalid OFFER_ID"
            });
        }

        await db.query(
            "CALL sp_m_offers_discounts_delete(?)",
            [OFFER_ID]
        );

        return res.status(200).json({
            status: "SUCCESS",
            message: "Offer deactivated successfully"
        });

    } catch (error) {

        return res.status(400).json({
            status: "FAILED",
            message: error.sqlMessage || error.message
        });

    }
});


module.exports = router;
