
const express = require("express");
const router = express.Router();
const db = require("./db");
const authenticateToken = require("./auth_middleware");


// GET CUSTOMER_ID USING LOGGED-IN USER_ID
async function getAuthenticatedCustomerId(USER_ID) {

    const [rows] = await db.query(
        `SELECT CUSTOMER_ID
         FROM m_customer_registration
         WHERE USER_ID = ?
         LIMIT 1`,
        [USER_ID]
    );

    if (rows.length === 0) {
        return null;
    }

    return rows[0].CUSTOMER_ID;
}


// ==========================================
// 1. CUSTOMER REGISTRATION INSERT
// PUBLIC API
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
            CONFIRM_PASSWORD
        } = req.body || {};

        if (
            !FIRST_NAME ||
            !LAST_NAME ||
            !EMAIL ||
            !MOBILE_NUMBER ||
            !USER_NAME ||
            !USER_PASSWORD ||
            !CONFIRM_PASSWORD
        ) {
            return res.status(400).json({
                status: "FAILED",
                message: "All required registration fields must be provided"
            });
        }

        // Public registration: no JWT and no req.user
        // CREATED_BY is NULL because the customer is self-registering.
        const CREATED_BY = null;

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

        return res.status(201).json({
            status: "SUCCESS",
            message: "Customer registered successfully",
            data: result[0]
        });

    } catch (error) {

        console.error("Customer Registration Insert Error:", error);

        return res.status(500).json({
            status: "FAILED",
            message: error.sqlMessage || error.message
        });
    }
});


// ==========================================
// 2. CUSTOMER REGISTRATION UPDATE
// PRIVATE API
// PUT /api/customer-registration/update
// ==========================================

router.put("/update", authenticateToken, async (req, res) => {
    try {

        const {
            FIRST_NAME,
            LAST_NAME,
            EMAIL,
            MOBILE_NUMBER,
            USER_NAME,
            USER_PASSWORD,
            CONFIRM_PASSWORD
        } = req.body || {};

        const USER_ID = req.user.USER_ID;

        // Get CUSTOMER_ID from authenticated user
        const CUSTOMER_ID = await getAuthenticatedCustomerId(USER_ID);

        if (!CUSTOMER_ID) {
            return res.status(403).json({
                status: "FAILED",
                message: "Customer account not found"
            });
        }

        const UPDATED_BY = USER_ID;

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

        return res.status(200).json({
            status: "SUCCESS",
            message: "Customer registration updated successfully",
            data: result[0]
        });

    } catch (error) {

        console.error("Customer Registration Update Error:", error);

        return res.status(500).json({
            status: "FAILED",
            message: error.sqlMessage || error.message
        });
    }
});


// ==========================================
// 3. CUSTOMER REGISTRATION GET
// PRIVATE API
// GET /api/customer-registration/get
// ==========================================

router.get("/get", authenticateToken, async (req, res) => {
    try {

        const {
            USER_TYPE = "",
            LIMIT = "10",
            OFFSET = "0"
        } = req.query;

        const USER_ID = req.user.USER_ID;

        const CUSTOMER_ID = await getAuthenticatedCustomerId(USER_ID);

        if (!CUSTOMER_ID) {
            return res.status(403).json({
                status: "FAILED",
                message: "Customer account not found"
            });
        }

        const limit = Number(LIMIT);
        const offset = Number(OFFSET);

        if (
            !Number.isInteger(limit) ||
            limit <= 0 ||
            !Number.isInteger(offset) ||
            offset < 0
        ) {
            return res.status(400).json({
                status: "FAILED",
                message: "Invalid LIMIT or OFFSET"
            });
        }

        const [result] = await db.query(
            "CALL sp_m_customer_registration_get(?, ?, ?, ?)",
            [
                CUSTOMER_ID,
                USER_TYPE,
                limit,
                offset
            ]
        );

        return res.status(200).json({
            status: "SUCCESS",
            message: "Customer registration details fetched successfully",
            data: result[0]
        });

    } catch (error) {

        console.error("Customer Registration Get Error:", error);

        return res.status(500).json({
            status: "FAILED",
            message: error.sqlMessage || error.message
        });
    }
});


// ==========================================
// 4. CUSTOMER REGISTRATION DELETE / DEACTIVATE
// PRIVATE API
// DELETE /api/customer-registration/delete
// ==========================================

router.delete("/delete", authenticateToken, async (req, res) => {
    try {

        const USER_ID = req.user.USER_ID;

        // Get CUSTOMER_ID from authenticated user
        const CUSTOMER_ID = await getAuthenticatedCustomerId(USER_ID);

        if (!CUSTOMER_ID) {
            return res.status(403).json({
                status: "FAILED",
                message: "Customer account not found"
            });
        }

        const [result] = await db.query(
            "CALL sp_m_customer_registration_delete(?)",
            [
                CUSTOMER_ID
            ]
        );

        return res.status(200).json({
            status: "SUCCESS",
            message: "Customer account deactivated successfully",
            data: result[0]
        });

    } catch (error) {

        console.error("Customer Registration Delete Error:", error);

        return res.status(500).json({
            status: "FAILED",
            message: error.sqlMessage || error.message
        });
    }
});


module.exports = router;
