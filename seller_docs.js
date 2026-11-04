
const express = require("express");
const router = express.Router();
const db = require("./db");

// ==========================================
// INSERT SELLER DOCUMENTS
// POST /api/seller-documents/insert
// ==========================================

router.post("/insert", async (req, res) => {
    try {
        const {
            GST_CERTIFICATE,
            PAN_CARD,
            BUSINESS_REGISTRATION_CERTIFICATE,
            ADDRESS_PROOF,
            OWNER_DIRECTOR_ID_PROOF,
            BANK_PROOF,
            OTHER_SUPPORTING_DOCUMENT,
            SELLER_ID,
            CREATED_BY
        } = req.body;

        const [result] = await db.query(
            "CALL sp_o_seller_documents_insert(?,?,?,?,?,?,?,?,?)",
            [
                GST_CERTIFICATE,
                PAN_CARD,
                BUSINESS_REGISTRATION_CERTIFICATE,
                ADDRESS_PROOF,
                OWNER_DIRECTOR_ID_PROOF,
                BANK_PROOF,
                OTHER_SUPPORTING_DOCUMENT,
                SELLER_ID,
                CREATED_BY
            ]
        );
        const response = result[0][0];

        return res.status(200).json({
    status: true,
    message: "Seller documents inserted successfully",
    DOCUMENT_ID: response.DOCUMENT_ID
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
// UPDATE SELLER DOCUMENTS
// PUT /api/seller-documents/update
// ==========================================

router.put("/update", async (req, res) => {
    try {
        const {
            DOCUMENT_ID,
            GST_CERTIFICATE,
            PAN_CARD,
            BUSINESS_REGISTRATION_CERTIFICATE,
            ADDRESS_PROOF,
            OWNER_DIRECTOR_ID_PROOF,
            BANK_PROOF,
            OTHER_SUPPORTING_DOCUMENT,
            SELLER_ID,
            UPDATED_BY
        } = req.body;

        const [result] = await db.query(
            "CALL sp_o_seller_documents_update(?,?,?,?,?,?,?,?,?,?)",
            [
                DOCUMENT_ID,
                GST_CERTIFICATE,
                PAN_CARD,
                BUSINESS_REGISTRATION_CERTIFICATE,
                ADDRESS_PROOF,
                OWNER_DIRECTOR_ID_PROOF,
                BANK_PROOF,
                OTHER_SUPPORTING_DOCUMENT,
                SELLER_ID,
                UPDATED_BY
            ]
        );

        res.status(200).json({
            status: true,
            message: "Seller documents updated successfully",
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
// GET SELLER DOCUMENTS
// GET /api/seller-documents/get
// ==========================================

router.get("/get", async (req, res) => {
    try {

        const {
            DOCUMENT_ID = "-1",
            LIMIT = 10,
            OFFSET = 0
        } = req.query;

        const limit = Math.max(1, parseInt(LIMIT, 10) || 10);
        const offset = Math.max(0, parseInt(OFFSET, 10) || 0);

        const [result] = await db.query(
            "CALL sp_o_seller_documents_get(?, ?, ?)",
            [
                DOCUMENT_ID,
                limit,
                offset
            ]
        );

        res.status(200).json({
            success: true,
            message: "Seller documents fetched successfully",
            data: result[0]
        });

    } catch (error) {

        console.error("Get Seller Documents Error:", error);

        res.status(500).json({
            success: false,
            message: error.message
        });

    }
});


// ==========================================
// DELETE SELLER DOCUMENTS
// DELETE /api/seller-documents/delete
// ==========================================

router.delete("/delete", async (req, res) => {
    try {
        const {
            DOCUMENT_ID
        } = req.body;

        const [result] = await db.query(
            "CALL sp_o_seller_documents_delete(?)",
            [DOCUMENT_ID]
        );

        res.status(200).json({
            status: true,
            message: "Seller documents deleted successfully",
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

module.exports = router;
