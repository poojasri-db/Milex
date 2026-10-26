
const express = require("express");
const router = express.Router();
const db = require("./db");

// ==========================================
// CUSTOMER REGISTRATION INSERT
// POST /api/customer-registration/insert
// ==========================================

router.post("/insert", async (req, res) => {
    try {
        const {
            FIRST_NAME,
            LAST_NAME,
            EMAIL,
            MOBILE_NUMBER,
            USER_NAME,
            USER_PASSWORD,
            CONFIRM_PASSWORD,
            CREATED_BY
        } = req.body || {};

        const [result] = await db.query(
            "CALL sp_m_customer_registration_insert(?,?,?,?,?,?,?,?)",
            [
                FIRST_NAME,
                LAST_NAME,
                EMAIL,
                MOBILE_NUMBER,
                USER_NAME,
                USER_PASSWORD,
                CONFIRM_PASSWORD,
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
// CUSTOMER REGISTRATION UPDATE
// POST /api/customer-registration/update
// ==========================================

router.put("/update", async (req, res) => {
    try {
        const {
            CUSTOMER_ID,
            FIRST_NAME,
            LAST_NAME,
            EMAIL,
            MOBILE_NUMBER,
            USER_ID,
            USER_NAME,
            USER_PASSWORD,
            CONFIRM_PASSWORD,
            UPDATED_BY
        } = req.body || {};

        const [result] = await db.query(
            "CALL sp_m_customer_registration_update(?,?,?,?,?,?,?,?,?,?)",
            [
                CUSTOMER_ID,
                FIRST_NAME,
                LAST_NAME,
                EMAIL,
                MOBILE_NUMBER,
                USER_ID,
                USER_NAME,
                USER_PASSWORD,
                CONFIRM_PASSWORD,
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
// CUSTOMER REGISTRATION GET
// GET /api/customer-registration/get
// ==========================================

router.get("/get", async (req, res) => {
    try {
        const CUSTOMER_ID =
            req.query.CUSTOMER_ID !== undefined
                ? req.query.CUSTOMER_ID
                : -1;

        const USER_TYPE = req.query.USER_TYPE || "CUSTOMER";

        const [result] = await db.query(
            "CALL sp_m_customer_registration_get(?,?)",
            [
                CUSTOMER_ID,
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
// CUSTOMER REGISTRATION DELETE / DEACTIVATE
// POST /api/customer-registration/delete
// ==========================================

router.delete("/delete", async (req, res) => {
    try {
        const { CUSTOMER_ID } = req.body || {};

        const [result] = await db.query(
            "CALL sp_m_customer_registration_delete(?)",
            [
                CUSTOMER_ID
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
