
const express = require("express");
const router = express.Router();
const db = require("./db");

// ==========================================
// SELLER VERIFICATION INSERT
// POST /api/seller-verification/insert
// ==========================================

router.post("/insert", async (req, res) => {
    try {
        const {
            SELLER_ID,
            SUBMITTED_DOCUMENTS,
            VERIFICATION_STATUS,
            VERIFICATION_REMARKS,
            STATUS,
            CREATED_BY
        } = req.body;

        const [result] = await db.query(
            "CALL sp_o_admin_seller_verification_insert(?, ?, ?, ?, ?, ?)",
            [
                SELLER_ID,
                SUBMITTED_DOCUMENTS,
                VERIFICATION_STATUS,
                VERIFICATION_REMARKS,
                STATUS,
                CREATED_BY
            ]
        );

        res.status(200).json({
            STATUS: "SUCCESS",
            MESSAGE: "Seller verification inserted successfully",
            DATA: result[0]
        });

    } catch (error) {
        res.status(400).json({
            STATUS: "FAILURE",
            MESSAGE: error.sqlMessage || error.message
        });
    }
});


// ==========================================
// SELLER VERIFICATION UPDATE
// POST /api/seller-verification/update
// ==========================================

router.put("/update", async (req, res) => {
    try {
        const {
            VERIFICATION_ID,
            SELLER_ID,
            SELLER_NAME,
            BUSINESS_NAME,
            SELLER_CODE,
            EMAIL,
            MOBILE_NUMBER,
            GST_NUMBER,
            PAN_NUMBER,
            SUBMITTED_DOCUMENTS,
            VERIFICATION_STATUS,
            VERIFICATION_REMARKS,
            STATUS,
            UPDATED_BY
        } = req.body;

        const [result] = await db.query(
            "CALL sp_o_admin_seller_verification_update(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [
                VERIFICATION_ID,
                SELLER_ID,
                SELLER_NAME,
                BUSINESS_NAME,
                SELLER_CODE,
                EMAIL,
                MOBILE_NUMBER,
                GST_NUMBER,
                PAN_NUMBER,
                SUBMITTED_DOCUMENTS,
                VERIFICATION_STATUS,
                VERIFICATION_REMARKS,
                STATUS,
                UPDATED_BY
            ]
        );

        res.status(200).json({
            STATUS: "SUCCESS",
            MESSAGE: "Seller verification updated successfully",
            DATA: result[0]
        });

    } catch (error) {
        res.status(400).json({
            STATUS: "FAILURE",
            MESSAGE: error.sqlMessage || error.message
        });
    }
});


// ==========================================
// SELLER VERIFICATION GET
// GET /api/seller-verification/get
// ==========================================

router.get("/get", async (req, res) => {
    try {

        const {
            SELLER_ID = -1,
            VERIFICATION_ID = -1,
            LIMIT = 10,
            OFFSET = 0
        } = req.query;

        const [result] = await db.query(
            "CALL sp_o_admin_seller_verification_get(?, ?, ?, ?)",
            [
                SELLER_ID,
                VERIFICATION_ID,
                LIMIT,
                OFFSET
            ]
        );

        res.status(200).json({
            status: "SUCCESS",
            message: "Seller verification details fetched successfully",
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
// SELLER VERIFICATION DELETE
// POST /api/seller-verification/delete
// ==========================================

router.delete("/delete", async (req, res) => {
    try {
        const {
            SELLER_ID,
            VERIFICATION_ID
        } = req.body;

        const [result] = await db.query(
            "CALL sp_o_admin_seller_verification_delete(?, ?)",
            [
                SELLER_ID,
                VERIFICATION_ID
            ]
        );

        res.status(200).json({
            STATUS: "SUCCESS",
            MESSAGE: "Seller verification deleted successfully",
            DATA: result[0]
        });

    } catch (error) {
        res.status(400).json({
            STATUS: "FAILURE",
            MESSAGE: error.sqlMessage || error.message
        });
    }
});

module.exports = router;
