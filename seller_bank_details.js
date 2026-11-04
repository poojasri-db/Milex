
const express = require("express");
const router = express.Router();
const db = require("./db");

// ==========================================
// INSERT SELLER BANK DETAILS
// POST /api/seller-bank-details/insert
// ==========================================

router.post("/insert", async (req, res) => {
    let connection;

    try {
        const {
            ACCOUNT_HOLDER_NAME,
            BANK_NAME,
            BRANCH_NAME,
            ACCOUNT_NUMBER,
            CONFIRM_ACCOUNT_NUMBER,
            IFSC_CODE,
            ACCOUNT_TYPE,
            SELLER_ID,
            CREATED_BY
        } = req.body;

        connection = await db.getConnection();

        const [results] = await connection.query(
            "CALL sp_o_seller_bank_details_insert(?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [
                ACCOUNT_HOLDER_NAME,
                BANK_NAME,
                BRANCH_NAME,
                ACCOUNT_NUMBER,
                CONFIRM_ACCOUNT_NUMBER,
                IFSC_CODE,
                ACCOUNT_TYPE,
                SELLER_ID,
                CREATED_BY
            ]
        );

        // Get stored procedure output
        const response = results[0][0];

        return res.status(200).json({
            status: true,
            message: "Seller bank details inserted successfully",
            BANK_DETAIL_ID: response.BANK_DETAIL_ID
        });

    } catch (err) {
        return res.status(500).json({
            status: false,
            message: err.sqlMessage || err.message
        });

    } finally {
        if (connection) {
            connection.release();
        }
    }
});


// ==========================================
// UPDATE SELLER BANK DETAILS
// PUT /api/seller-bank-details/update
// ==========================================

router.put("/update", async (req, res) => {
    try {
        const {
            BANK_DETAIL_ID,
            ACCOUNT_HOLDER_NAME,
            BANK_NAME,
            BRANCH_NAME,
            ACCOUNT_NUMBER,
            CONFIRM_ACCOUNT_NUMBER,
            IFSC_CODE,
            ACCOUNT_TYPE,
            SELLER_ID,
            UPDATED_BY
        } = req.body;

        const [result] = await db.query(
            "CALL sp_o_seller_bank_details_update(?,?,?,?,?,?,?,?,?,?)",
            [
                BANK_DETAIL_ID,
                ACCOUNT_HOLDER_NAME,
                BANK_NAME,
                BRANCH_NAME,
                ACCOUNT_NUMBER,
                CONFIRM_ACCOUNT_NUMBER,
                IFSC_CODE,
                ACCOUNT_TYPE,
                SELLER_ID,
                UPDATED_BY
            ]
        );

        res.status(200).json({
            status: true,
            message: "Seller bank details updated successfully",
            data: result[0]
        });

    } catch (error) {
        console.error(error);

        res.status(error.errno === 1644 ? 404 : 500).json({
            status: false,
            message: error.sqlMessage || error.message
        });
    }
});


router.get("/get", async (req, res) => {
    try {
        const {
            BANK_DETAIL_ID = "",
            SELLER_ID = "",
            LIMIT = 10,
            OFFSET = 0
        } = req.query;

        const [result] = await db.query(
            "CALL sp_o_seller_bank_details_get(?,?,?,?)",
            [
                BANK_DETAIL_ID,
                SELLER_ID,
                LIMIT,
                OFFSET
            ]
        );

        res.status(200).json({
            status: true,
            message: "Seller bank details retrieved successfully",
            data: result[0]
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            status: false,
            message: error.sqlMessage || error.message
        });
    }
});

// ==========================================
// DELETE SELLER BANK DETAILS
// DELETE /api/seller-bank-details/delete
// ==========================================

router.delete("/delete", async (req, res) => {
    try {
        const {
            BANK_DETAIL_ID,
            SELLER_ID
        } = req.body;

        const [result] = await db.query(
            "CALL sp_o_seller_bank_details_delete(?,?)",
            [
                BANK_DETAIL_ID,
                SELLER_ID
            ]
        );

        res.status(200).json({
            status: true,
            message: "Seller bank details deleted successfully",
            data: result[0]
        });

    } catch (error) {
        console.error(error);

        res.status(error.errno === 1644 ? 404 : 500).json({
            status: false,
            message: error.sqlMessage || error.message
        });
    }
});

module.exports = router;
