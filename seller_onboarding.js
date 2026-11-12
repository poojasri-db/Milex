
const express = require("express");
const router = express.Router();
const db = require("./db");
const bcrypt = require("bcrypt");
const authenticateToken = require("./auth_middleware");

// --------------------------------------------------
// HELPER: CHECK ADMIN
// --------------------------------------------------
const isAdmin = (req) => {
    return String(req.user?.USER_TYPE || "").toUpperCase() === "ADMIN";
};

// --------------------------------------------------
// HELPER: CHECK SELLER
// --------------------------------------------------
const isSeller = (req) => {
    return String(req.user?.USER_TYPE || "").toUpperCase() === "SELLER";
};

// --------------------------------------------------
// HELPER: GET SELLER ID USING LOGGED-IN USER ID
// --------------------------------------------------
const getSellerIdByUserId = async (userId) => {
    const [rows] = await db.query(
        `SELECT SELLER_ID
         FROM m_seller_onboarding
         WHERE USER_ID = ?
         LIMIT 1`,
        [userId]
    );

    return rows.length ? rows[0].SELLER_ID : null;
};

// ==================================================
// 1. PUBLIC SELLER REGISTRATION - INSERT
// POST /insert
// ==================================================
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
            USER_PASSWORD
        } = req.body;

        // Required field validation
        if (
            !BUSINESS_NAME ||
            !SELLER_NAME ||
            !EMAIL ||
            !MOBILE_NUMBER ||
            !USER_NAME ||
            !USER_PASSWORD
        ) {
            return res.status(400).json({
                STATUS: "FAILED",
                MESSAGE: "BUSINESS_NAME, SELLER_NAME, EMAIL, MOBILE_NUMBER, USER_NAME and USER_PASSWORD are required"
            });
        }

        if (String(USER_PASSWORD).length < 8) {
            return res.status(400).json({
                STATUS: "FAILED",
                MESSAGE: "Password must contain at least 8 characters"
            });
        }

        // Check duplicate username
        const [existingUser] = await db.query(
            `SELECT USER_ID
             FROM m_user
             WHERE USER_NAME = ?
             LIMIT 1`,
            [USER_NAME]
        );

        if (existingUser.length > 0) {
            return res.status(409).json({
                STATUS: "FAILED",
                MESSAGE: "Username already exists"
            });
        }

        // Check duplicate email
        const [existingEmail] = await db.query(
            `SELECT SELLER_ID
             FROM m_seller_onboarding
             WHERE EMAIL = ?
             LIMIT 1`,
            [EMAIL]
        );

        if (existingEmail.length > 0) {
            return res.status(409).json({
                STATUS: "FAILED",
                MESSAGE: "Email already registered"
            });
        }

        // Hash password before sending it to stored procedure
        const hashedPassword = await bcrypt.hash(USER_PASSWORD, 12);

        // Public registration: CREATED_BY must be NULL
        const [result] = await db.query(
            `CALL sp_m_seller_onboarding_insert(
                ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?, ?, ?, ?
            )`,
            [
                BUSINESS_NAME,
                SELLER_NAME,
                BUSINESS_TYPE || null,
                EMAIL,
                String(MOBILE_NUMBER),
                BUSINESS_ADDRESS || null,
                CITY || null,
                STATE || null,
                COUNTRY || null,
                PINCODE || null,
                GST_NUMBER || null,
                PAN_NUMBER || null,
                BUSINESS_REGISTRATION_NUMBER || null,
                CONTACT_PERSON_NAME || null,
                CONTACT_PERSON_MOBILE ? String(CONTACT_PERSON_MOBILE) : null,
                CONTACT_PERSON_EMAIL || null,
                USER_NAME,
                hashedPassword,
                null
            ]
        );

        const insertedData = result?.[1]?.[0];

        return res.status(200).json({
            STATUS: "SUCCESS",
            MESSAGE: "Seller registration submitted successfully. Your account is pending approval.",
            SELLER_ID: insertedData?.SELLER_ID || null,
            USER_ID: insertedData?.USER_ID || null
        });

    } catch (error) {
        console.error("SELLER INSERT ERROR:", error);

        return res.status(500).json({
            STATUS: "FAILED",
            MESSAGE: error.sqlMessage || error.message
        });
    }
});


// ==================================================
// 2. UPDATE SELLER ONBOARDING
// PUT /update
// SELLER: OWN RECORD ONLY
// ADMIN: ANY SELLER
// ==================================================
router.put("/update", authenticateToken, async (req, res) => {
    try {
        if (!isAdmin(req) && !isSeller(req)) {
            return res.status(403).json({
                STATUS: "FAILED",
                MESSAGE: "Only sellers and admins can update seller details"
            });
        }

        let SELLER_ID;

        if (isAdmin(req)) {
            SELLER_ID = req.body.SELLER_ID;

            if (!SELLER_ID) {
                return res.status(400).json({
                    STATUS: "FAILED",
                    MESSAGE: "SELLER_ID is required"
                });
            }
        } else {
            // Seller ID is resolved from authenticated user.
            SELLER_ID = await getSellerIdByUserId(req.user.USER_ID);

            if (!SELLER_ID) {
                return res.status(404).json({
                    STATUS: "FAILED",
                    MESSAGE: "Seller profile not found for this account"
                });
            }
        }

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
            USER_PASSWORD
        } = req.body;

        // Hash password only when a new password is provided
        let hashedPassword = null;

        if (USER_PASSWORD !== undefined && USER_PASSWORD !== null && USER_PASSWORD !== "") {

            if (String(USER_PASSWORD).length < 8) {
                return res.status(400).json({
                    STATUS: "FAILED",
                    MESSAGE: "Password must contain at least 8 characters"
                });
            }

            hashedPassword = await bcrypt.hash(
                String(USER_PASSWORD),
                12
            );
        }

        const [result] = await db.query(
            `CALL sp_m_seller_onboarding_update(
                ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?, ?, ?, ?
            )`,
            [
                SELLER_ID,
                BUSINESS_NAME || null,
                SELLER_NAME || null,
                BUSINESS_TYPE || null,
                EMAIL || null,
                MOBILE_NUMBER ? String(MOBILE_NUMBER) : null,
                BUSINESS_ADDRESS || null,
                CITY || null,
                STATE || null,
                COUNTRY || null,
                PINCODE || null,
                GST_NUMBER || null,
                PAN_NUMBER || null,
                BUSINESS_REGISTRATION_NUMBER || null,
                CONTACT_PERSON_NAME || null,
                CONTACT_PERSON_MOBILE ? String(CONTACT_PERSON_MOBILE) : null,
                CONTACT_PERSON_EMAIL || null,
                hashedPassword,
                req.user.USER_ID
            ]
        );

        return res.status(200).json({
            STATUS: "SUCCESS",
            MESSAGE: "Seller details updated successfully"
        });

    } catch (error) {
        console.error("SELLER UPDATE ERROR:", error);

        return res.status(500).json({
            STATUS: "FAILED",
            MESSAGE: error.sqlMessage || error.message
        });
    }
});


// ==================================================
// 3. GET SELLER ONBOARDING
// GET /get
// SELLER: OWN RECORD ONLY
// ADMIN: ALL OR SPECIFIC SELLER
// ==================================================
router.get("/get", authenticateToken, async (req, res) => {
    try {
        if (!isAdmin(req) && !isSeller(req)) {
            return res.status(403).json({
                STATUS: "FAILED",
                MESSAGE: "You are not authorized to view seller details"
            });
        }

        let SELLER_ID = req.query.SELLER_ID || -1;

        if (isSeller(req)) {
            // Ignore any SELLER_ID passed in query by the seller.
            SELLER_ID = await getSellerIdByUserId(req.user.USER_ID);

            if (!SELLER_ID) {
                return res.status(404).json({
                    STATUS: "FAILED",
                    MESSAGE: "Seller profile not found for this account"
                });
            }
        }

        const LIMIT = Math.max(
            1,
            Math.min(parseInt(req.query.LIMIT, 10) || 10, 100)
        );

        const OFFSET = Math.max(
            0,
            parseInt(req.query.OFFSET, 10) || 0
        );

        const USER_TYPE = String(req.user.USER_TYPE).toUpperCase();

        const [result] = await db.query(
            `CALL sp_m_seller_onboarding_get(?, ?, ?, ?)`,
            [
                SELLER_ID,
                USER_TYPE,
                LIMIT,
                OFFSET
            ]
        );

        return res.status(200).json({
            STATUS: "SUCCESS",
            MESSAGE: "Seller details retrieved successfully",
            DATA: result?.[0] || []
        });

    } catch (error) {
        console.error("SELLER GET ERROR:", error);

        return res.status(500).json({
            STATUS: "FAILED",
            MESSAGE: error.sqlMessage || error.message
        });
    }
});

// ==================================================
// 4. DELETE / DEACTIVATE SELLER
// DELETE /delete
// ADMIN ONLY
// ==================================================
router.delete("/delete", authenticateToken, async (req, res) => {
    try {
        if (!isAdmin(req)) {
            return res.status(403).json({
                STATUS: "FAILED",
                MESSAGE: "Only admin can deactivate a seller"
            });
        }

        const { SELLER_ID } = req.body;

        if (!SELLER_ID) {
            return res.status(400).json({
                STATUS: "FAILED",
                MESSAGE: "SELLER_ID is required"
            });
        }

        await db.query(
            `CALL sp_m_seller_onboarding_delete(?)`,
            [SELLER_ID]
        );

        return res.status(200).json({
            STATUS: "SUCCESS",
            MESSAGE: "Seller deactivated successfully"
        });

    } catch (error) {
        console.error("SELLER DELETE ERROR:", error);

        return res.status(500).json({
            STATUS: "FAILED",
            MESSAGE: error.sqlMessage || error.message
        });
    }
});

module.exports = router;
