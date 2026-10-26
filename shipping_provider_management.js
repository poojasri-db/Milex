
const express = require("express");
const router = express.Router();
const db = require("./db");

// ==========================================
// INSERT SHIPPING PROVIDER
// POST /api/shipping-provider/insert
// ==========================================

router.post("/insert", async (req, res) => {
    try {
        const {
            PROVIDER_NAME,
            CONTACT_NUMBER,
            EMAIL,
            API_CONFIGURATION,
            SERVICE_TYPE,
            STATUS,
            CREATED_BY
        } = req.body || {};

        const [result] = await db.query(
            "CALL sp_m_shipping_provider_management_insert(?, ?, ?, ?, ?, ?, ?)",
            [
                PROVIDER_NAME,
                CONTACT_NUMBER,
                EMAIL,
                API_CONFIGURATION,
                SERVICE_TYPE,
                STATUS,
                CREATED_BY
            ]
        );

        res.status(200).json({
            status: "SUCCESS",
            message: "Shipping provider inserted successfully"
        });

    } catch (error) {
        res.status(400).json({
            status: "FAILED",
            message: error.sqlMessage || error.message
        });
    }
});

// ==========================================
// UPDATE SHIPPING PROVIDER
// POST /api/shipping-provider/update
// ==========================================

router.put("/update", async (req, res) => {
    try {
        const {
            PROVIDER_ID,
            PROVIDER_NAME,
            CONTACT_NUMBER,
            EMAIL,
            API_CONFIGURATION,
            SERVICE_TYPE,
            STATUS,
            UPDATED_BY
        } = req.body || {};

        const [result] = await db.query(
            "CALL sp_m_shipping_provider_management_update(?, ?, ?, ?, ?, ?, ?, ?)",
            [
                PROVIDER_ID,
                PROVIDER_NAME,
                CONTACT_NUMBER,
                EMAIL,
                API_CONFIGURATION,
                SERVICE_TYPE,
                STATUS,
                UPDATED_BY
            ]
        );

        res.status(200).json({
            status: "SUCCESS",
            message: "Shipping provider updated successfully"
        });

    } catch (error) {
        res.status(400).json({
            status: "FAILED",
            message: error.sqlMessage || error.message
        });
    }
});

// ==========================================
// GET SHIPPING PROVIDER
// GET /api/shipping-provider/get
// ==========================================

router.get("/get", async (req, res) => {
    try {
        const PROVIDER_ID =
            req.query.PROVIDER_ID !== undefined
                ? req.query.PROVIDER_ID
                : -1;

        const [result] = await db.query(
            "CALL sp_m_shipping_provider_management_get(?)",
            [PROVIDER_ID]
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
// DELETE SHIPPING PROVIDER
// POST /api/shipping-provider/delete
// ==========================================

router.delete("/delete", async (req, res) => {
    try {
        const { PROVIDER_ID } = req.body || {};

        const [result] = await db.query(
            "CALL sp_m_shipping_provider_management_delete(?)",
            [PROVIDER_ID]
        );

        res.status(200).json({
            status: "SUCCESS",
            message: "Shipping provider deleted successfully"
        });

    } catch (error) {
        res.status(400).json({
            status: "FAILED",
            message: error.sqlMessage || error.message
        });
    }
});

module.exports = router;
