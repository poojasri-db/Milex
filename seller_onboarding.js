
const express = require("express");
const router = express.Router();
const db = require("./db");

// ==========================================
// INSERT SELLER ONBOARDING
// POST /api/seller-onboarding/insert
// ==========================================

router.post("/insert", async (req, res) => {
    try {
        const {
            BUSINESS_NAME,
            SELLER_NAME,
            BUSINESS_TYPE,
            EMAIL,
            MOBILE_NUMBER,
            BUSINESS_ADDRESS,
            CITY,
            STATE,
            COUNTRY,
            PINCODE,
            GST_NUMBER,
            PAN_NUMBER,
            BUSINESS_REGISTRATION_NUMBER,
            CONTACT_PERSON_NAME,
            CONTACT_PERSON_MOBILE,
            CONTACT_PERSON_EMAIL,
            USER_NAME,
            USER_PASSWORD,
            CREATED_BY
        } = req.body || {};

        const [result] = await db.query(
            "CALL sp_m_seller_onboarding_insert(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            [
                BUSINESS_NAME,
                SELLER_NAME,
                BUSINESS_TYPE,
                EMAIL,
                MOBILE_NUMBER,
                BUSINESS_ADDRESS,
                CITY,
                STATE,
                COUNTRY,
                PINCODE,
                GST_NUMBER,
                PAN_NUMBER,
                BUSINESS_REGISTRATION_NUMBER,
                CONTACT_PERSON_NAME,
                CONTACT_PERSON_MOBILE,
                CONTACT_PERSON_EMAIL,
                USER_NAME,
                USER_PASSWORD,
                CREATED_BY
            ]
        );

        res.json({
            status: "SUCCESS",
            data: result[0]
        });

    } catch (error) {
        res.status(500).json({
            status: "FAILED",
            message: error.message
        });
    }
});


// ==========================================
// UPDATE SELLER ONBOARDING
// POST /api/seller-onboarding/update
// ==========================================

router.put("/update", async (req, res) => {
    try {
        const {
            SELLER_ID,
            BUSINESS_NAME,
            SELLER_NAME,
            BUSINESS_TYPE,
            EMAIL,
            MOBILE_NUMBER,
            BUSINESS_ADDRESS,
            CITY,
            STATE,
            COUNTRY,
            PINCODE,
            GST_NUMBER,
            PAN_NUMBER,
            BUSINESS_REGISTRATION_NUMBER,
            CONTACT_PERSON_NAME,
            CONTACT_PERSON_MOBILE,
            CONTACT_PERSON_EMAIL,
            USER_ID,
            USER_NAME,
            USER_PASSWORD,
            UPDATED_BY
        } = req.body || {};

        const [result] = await db.query(
            "CALL sp_m_seller_onboarding_update(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            [
                SELLER_ID,
                BUSINESS_NAME,
                SELLER_NAME,
                BUSINESS_TYPE,
                EMAIL,
                MOBILE_NUMBER,
                BUSINESS_ADDRESS,
                CITY,
                STATE,
                COUNTRY,
                PINCODE,
                GST_NUMBER,
                PAN_NUMBER,
                BUSINESS_REGISTRATION_NUMBER,
                CONTACT_PERSON_NAME,
                CONTACT_PERSON_MOBILE,
                CONTACT_PERSON_EMAIL,
                USER_ID,
                USER_NAME,
                USER_PASSWORD,
                UPDATED_BY
            ]
        );

        res.json({
            status: "SUCCESS",
            data: result[0]
        });

    } catch (error) {
        res.status(500).json({
            status: "FAILED",
            message: error.message
        });
    }
});


// ==========================================
// GET SELLER ONBOARDING
// GET /api/seller-onboarding/get
// ==========================================

router.get("/get", async (req, res) => {
    try {
        const SELLER_ID =
            req.query.SELLER_ID !== undefined
                ? req.query.SELLER_ID
                : -1;

        const USER_TYPE =
            req.query.USER_TYPE || "SELLER";

        const [result] = await db.query(
            "CALL sp_m_seller_onboarding_get(?,?)",
            [
                SELLER_ID,
                USER_TYPE
            ]
        );

        res.json({
            status: "SUCCESS",
            data: result[0]
        });

    } catch (error) {
        res.status(500).json({
            status: "FAILED",
            message: error.message
        });
    }
});


// ==========================================
// DELETE / DEACTIVATE SELLER
// POST /api/seller-onboarding/delete
// ==========================================

router.delete("/delete", async (req, res) => {
    try {
        const { SELLER_ID } = req.body || {};

        const [result] = await db.query(
            "CALL sp_m_seller_onboarding_delete(?)",
            [
                SELLER_ID
            ]
        );

        res.json({
            status: "SUCCESS",
            data: result[0]
        });

    } catch (error) {
        res.status(500).json({
            status: "FAILED",
            message: error.message
        });
    }
});

module.exports = router;
