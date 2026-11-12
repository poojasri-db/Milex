
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

// ==========================================
// APPLY AUTHENTICATION AND AUTHORIZATION
// ==========================================

router.use(authenticateToken);
router.use(adminOnly);


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
            STATUS
        } = req.body || {};

        await db.query(
            "CALL sp_m_shipping_provider_management_insert(?, ?, ?, ?, ?, ?, ?)",
            [
                PROVIDER_NAME,
                CONTACT_NUMBER,
                EMAIL,
                API_CONFIGURATION,
                SERVICE_TYPE,
                STATUS,
                req.user.USER_ID
            ]
        );

        return res.status(200).json({
            status: "SUCCESS",
            message: "Shipping provider inserted successfully"
        });

    } catch (error) {

        return res.status(400).json({
            status: "FAILED",
            message: error.sqlMessage || error.message
        });

    }
});


// ==========================================
// UPDATE SHIPPING PROVIDER
// PUT /api/shipping-provider/update
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
            STATUS
        } = req.body || {};

        await db.query(
            "CALL sp_m_shipping_provider_management_update(?, ?, ?, ?, ?, ?, ?, ?)",
            [
                PROVIDER_ID,
                PROVIDER_NAME,
                CONTACT_NUMBER,
                EMAIL,
                API_CONFIGURATION,
                SERVICE_TYPE,
                STATUS,
                req.user.USER_ID
            ]
        );

        return res.status(200).json({
            status: "SUCCESS",
            message: "Shipping provider updated successfully"
        });

    } catch (error) {

        return res.status(400).json({
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

        if (!/^-1$|^[0-9]+$/.test(String(PROVIDER_ID))) {
            return res.status(400).json({
                status: "FAILED",
                message: "Invalid PROVIDER_ID"
            });
        }

        const [result] = await db.query(
            "CALL sp_m_shipping_provider_management_get(?)",
            [PROVIDER_ID]
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
// DELETE SHIPPING PROVIDER
// DELETE /api/shipping-provider/delete
// ==========================================

router.delete("/delete", async (req, res) => {
    try {

        const { PROVIDER_ID } = req.body || {};

        if (
            PROVIDER_ID === undefined ||
            !/^[0-9]+$/.test(String(PROVIDER_ID)) ||
            Number(PROVIDER_ID) <= 0
        ) {
            return res.status(400).json({
                status: "FAILED",
                message: "Valid PROVIDER_ID is required"
            });
        }

        await db.query(
            "CALL sp_m_shipping_provider_management_delete(?)",
            [PROVIDER_ID]
        );

        return res.status(200).json({
            status: "SUCCESS",
            message: "Shipping provider deleted successfully"
        });

    } catch (error) {

        return res.status(400).json({
            status: "FAILED",
            message: error.sqlMessage || error.message
        });

    }
});

module.exports = router;
