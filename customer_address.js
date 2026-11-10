
const express = require("express");
const router = express.Router();
const db = require("./db");

// ==========================================
// INSERT CUSTOMER ADDRESS
// POST /api/customer_addresses/insert
// ==========================================

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
            DEFAULT_ADDRESS,
            CUSTOMER_ID,
            CREATED_BY
        } = req.body || {};

        if (
            !ADDRESS_TYPE ||
            !FULL_NAME ||
            !MOBILE_NUMBER ||
            !ADDRESS_LINE_1 ||
            !CITY ||
            !STATE ||
            !COUNTRY ||
            !PINCODE ||
            CUSTOMER_ID == null
        ) {
            return res.status(400).json({
                status: "FAILED",
                message: "Required fields are missing"
            });
        }

        const [result] = await db.query(
            "CALL sp_o_customer_addresses_insert(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [
                ADDRESS_TYPE,
                FULL_NAME,
                MOBILE_NUMBER,
                ADDRESS_LINE_1,
                ADDRESS_LINE_2 || null,
                LANDMARK || null,
                CITY,
                STATE,
                COUNTRY,
                PINCODE,
                DEFAULT_ADDRESS ?? 0,
                CUSTOMER_ID,
                CREATED_BY || null
            ]
        );

        return res.status(200).json({
            status: "SUCCESS",
            message: "Customer address inserted successfully"
        });

    } catch (error) {

        console.error("Customer Address Insert Error:", error);

        return res.status(500).json({
            status: "FAILED",
            message: error.sqlMessage || error.message
        });

    }
});


// ==========================================
// UPDATE CUSTOMER ADDRESS
// PUT /api/customer_addresses/update
// ==========================================

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
            DEFAULT_ADDRESS,
            CUSTOMER_ID,
            UPDATED_BY
        } = req.body || {};

        if (
            ADDRESS_ID == null ||
            CUSTOMER_ID == null ||
            !ADDRESS_TYPE ||
            !FULL_NAME ||
            !MOBILE_NUMBER ||
            !ADDRESS_LINE_1 ||
            !CITY ||
            !STATE ||
            !COUNTRY ||
            !PINCODE
        ) {
            return res.status(400).json({
                status: "FAILED",
                message: "Required fields are missing"
            });
        }

        const [result] = await db.query(
            "CALL sp_o_customer_addresses_update(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [
                ADDRESS_ID,
                ADDRESS_TYPE,
                FULL_NAME,
                MOBILE_NUMBER,
                ADDRESS_LINE_1,
                ADDRESS_LINE_2 || null,
                LANDMARK || null,
                CITY,
                STATE,
                COUNTRY,
                PINCODE,
                DEFAULT_ADDRESS ?? 0,
                CUSTOMER_ID,
                UPDATED_BY || null
            ]
        );

        return res.status(200).json({
            status: "SUCCESS",
            message: "Customer address updated successfully"
        });

    } catch (error) {

        console.error("Customer Address Update Error:", error);

        return res.status(500).json({
            status: "FAILED",
            message: error.sqlMessage || error.message
        });

    }
});


// ==========================================
// GET CUSTOMER ADDRESSES
// GET /api/customer_addresses/get
// ==========================================

router.get("/get", async (req, res) => {
    try {

        const {
            ADDRESS_ID = "-1",
            CUSTOMER_ID = "-1"
        } = req.query;

        // Validate numeric filters before calling dynamic SQL procedure

        const filters = {
            ADDRESS_ID,
            CUSTOMER_ID
        };

        for (const [key, value] of Object.entries(filters)) {
            if (
                !/^-1$|^[0-9]+$/.test(String(value))
            ) {
                return res.status(400).json({
                    status: "FAILED",
                    message: `Invalid ${key}`
                });
            }
        }

        const [result] = await db.query(
            "CALL sp_o_customer_addresses_get(?, ?)",
            [
                ADDRESS_ID,
                CUSTOMER_ID
            ]
        );

        return res.status(200).json({
            status: "SUCCESS",
            message: "Customer addresses fetched successfully",
            total_records: result[0].length,
            data: result[0]
        });

    } catch (error) {

        console.error("Customer Address GET Error:", error);

        return res.status(500).json({
            status: "FAILED",
            message: error.sqlMessage || error.message
        });

    }
});


// ==========================================
// DELETE CUSTOMER ADDRESS
// DELETE /api/customer_addresses/delete
// ==========================================

router.delete("/delete", async (req, res) => {
    try {

        const {
            ADDRESS_ID,
            CUSTOMER_ID
        } = req.body || {};

        if (
            ADDRESS_ID == null ||
            CUSTOMER_ID == null ||
            !/^[0-9]+$/.test(String(ADDRESS_ID)) ||
            !/^[0-9]+$/.test(String(CUSTOMER_ID))
        ) {
            return res.status(400).json({
                status: "FAILED",
                message: "Valid ADDRESS_ID and CUSTOMER_ID are required"
            });
        }

        const [result] = await db.query(
            "CALL sp_o_customer_addresses_delete(?, ?)",
            [
                ADDRESS_ID,
                CUSTOMER_ID
            ]
        );

        return res.status(200).json({
            status: "SUCCESS",
            message: "Customer address deleted successfully"
        });

    } catch (error) {

        console.error("Customer Address Delete Error:", error);

        return res.status(500).json({
            status: "FAILED",
            message: error.sqlMessage || error.message
        });

    }
});

module.exports = router;
