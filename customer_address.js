
const express = require("express");
const router = express.Router();
const db = require("./db");
const authenticateToken = require("./auth_middleware");

// All customer address APIs require a valid JWT token
router.use(authenticateToken);


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


// 1. INSERT CUSTOMER ADDRESS
router.post("/insert", async (req, res) => {
    try {

        const {
            ADDRESS_TYPE,
            FULL_NAME,
            MOBILE_NUMBER,
            ADDRESS_LINE_1,
            ADDRESS_LINE_2,
            LANDMARK,
            CITY,
            STATE,
            COUNTRY,
            PINCODE,
            DEFAULT_ADDRESS
        } = req.body;

        // Get logged-in USER_ID from JWT
        const USER_ID = req.user.USER_ID;

        // Get CUSTOMER_ID from m_customer_registration
        const CUSTOMER_ID = await getAuthenticatedCustomerId(USER_ID);

        if (!CUSTOMER_ID) {
            return res.status(403).json({
                status: "FAILED",
                message: "Customer account not found"
            });
        }

        // CREATED_BY must come from JWT
        const CREATED_BY = USER_ID;

        const [result] = await db.query(
            `CALL sp_o_customer_addresses_insert(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                ADDRESS_TYPE,
                FULL_NAME,
                MOBILE_NUMBER,
                ADDRESS_LINE_1,
                ADDRESS_LINE_2,
                LANDMARK,
                CITY,
                STATE,
                COUNTRY,
                PINCODE,
                DEFAULT_ADDRESS ?? 0,
                CUSTOMER_ID,
                CREATED_BY
            ]
        );

        return res.status(201).json({
            status: "SUCCESS",
            message: "Customer address inserted successfully",
            data: result[0]
        });

    } catch (error) {

        console.error("Customer address insert error:", error);

        return res.status(500).json({
            status: "FAILED",
            message: error.sqlMessage || error.message
        });
    }
});


// 2. UPDATE CUSTOMER ADDRESS
router.put("/update", async (req, res) => {
    try {

        const {
            ADDRESS_ID,
            ADDRESS_TYPE,
            FULL_NAME,
            MOBILE_NUMBER,
            ADDRESS_LINE_1,
            ADDRESS_LINE_2,
            LANDMARK,
            CITY,
            STATE,
            COUNTRY,
            PINCODE,
            DEFAULT_ADDRESS
        } = req.body;

        if (!ADDRESS_ID) {
            return res.status(400).json({
                status: "FAILED",
                message: "ADDRESS_ID is required"
            });
        }

        const USER_ID = req.user.USER_ID;

        const CUSTOMER_ID = await getAuthenticatedCustomerId(USER_ID);

        if (!CUSTOMER_ID) {
            return res.status(403).json({
                status: "FAILED",
                message: "Customer account not found"
            });
        }

        // UPDATED_BY must come from JWT
        const UPDATED_BY = USER_ID;

        const [result] = await db.query(
            `CALL sp_o_customer_addresses_update(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                ADDRESS_ID,
                ADDRESS_TYPE,
                FULL_NAME,
                MOBILE_NUMBER,
                ADDRESS_LINE_1,
                ADDRESS_LINE_2,
                LANDMARK,
                CITY,
                STATE,
                COUNTRY,
                PINCODE,
                DEFAULT_ADDRESS ?? 0,
                CUSTOMER_ID,
                UPDATED_BY
            ]
        );

        return res.status(200).json({
            status: "SUCCESS",
            message: "Customer address updated successfully",
            data: result[0]
        });

    } catch (error) {

        console.error("Customer address update error:", error);

        return res.status(500).json({
            status: "FAILED",
            message: error.sqlMessage || error.message
        });
    }
});


// 3. GET CUSTOMER ADDRESSES
router.get("/get", async (req, res) => {
    try {

        const {
            ADDRESS_ID = "-1",
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

        if (
            ADDRESS_ID !== "-1" &&
            !/^\d+$/.test(String(ADDRESS_ID))
        ) {
            return res.status(400).json({
                status: "FAILED",
                message: "Invalid ADDRESS_ID"
            });
        }

        const [result] = await db.query(
            `CALL sp_o_customer_addresses_get(?, ?, ?, ?)`,
            [
                ADDRESS_ID,
                CUSTOMER_ID,
                limit,
                offset
            ]
        );

        return res.status(200).json({
            status: "SUCCESS",
            message: "Customer addresses fetched successfully",
            total_records: result[0].length,
            data: result[0]
        });

    } catch (error) {

        console.error("Customer address get error:", error);

        return res.status(500).json({
            status: "FAILED",
            message: error.sqlMessage || error.message
        });
    }
});


// 4. DELETE CUSTOMER ADDRESS
router.delete("/delete", async (req, res) => {
    try {

        const { ADDRESS_ID } = req.body;

        if (!ADDRESS_ID) {
            return res.status(400).json({
                status: "FAILED",
                message: "ADDRESS_ID is required"
            });
        }

        if (!/^\d+$/.test(String(ADDRESS_ID))) {
            return res.status(400).json({
                status: "FAILED",
                message: "Invalid ADDRESS_ID"
            });
        }

        const USER_ID = req.user.USER_ID;

        const CUSTOMER_ID = await getAuthenticatedCustomerId(USER_ID);

        if (!CUSTOMER_ID) {
            return res.status(403).json({
                status: "FAILED",
                message: "Customer account not found"
            });
        }

        const [result] = await db.query(
            `CALL sp_o_customer_addresses_delete(?, ?)`,
            [
                ADDRESS_ID,
                CUSTOMER_ID
            ]
        );

        return res.status(200).json({
            status: "SUCCESS",
            message: "Customer address deleted successfully",
            data: result[0]
        });

    } catch (error) {

        console.error("Customer address delete error:", error);

        return res.status(500).json({
            status: "FAILED",
            message: error.sqlMessage || error.message
        });
    }
});


module.exports = router;
