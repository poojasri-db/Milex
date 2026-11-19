
const express = require("express");
const router = express.Router();
const db = require("./db");
const ExcelJS = require("exceljs");
const authenticateToken = require("./auth_middleware");

// ==========================================
// GET SELLER VERIFICATION DETAILS
// GET /api/seller-verification/get
// ADMIN ONLY
// ==========================================

router.get("/get", authenticateToken, async (req, res) => {
    try {

        const userType = String(
            req.user.USER_TYPE || ""
        ).trim().toUpperCase();

        if (userType !== "ADMIN") {
            return res.status(403).json({
                success: false,
                message: "Only admin users can access seller verification details"
            });
        }

        const {
            BUSINESS_TYPE_ID = "-1",
            SELLER_ID = "-1",
            DOCUMENT_VERIFICATION_STATUS = "-1",
            DAYS = 7,
            LIMIT = 10,
            OFFSET = 0
        } = req.query;

        const days = Number(DAYS);
        const limit = Number(LIMIT);
        const offset = Number(OFFSET);

        if (
            !Number.isInteger(days) || days <= 0 ||
            !Number.isInteger(limit) || limit <= 0 ||
            !Number.isInteger(offset) || offset < 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid DAYS, LIMIT or OFFSET"
            });
        }

        const [result] = await db.query(
            "CALL sp_o_seller_verification_get(?,?,?,?,?,?)",
            [
                BUSINESS_TYPE_ID,
                SELLER_ID,
                DOCUMENT_VERIFICATION_STATUS,
                days,
                limit,
                offset
            ]
        );

        return res.status(200).json({
            success: true,
            message: "Seller verification details fetched successfully",
            data: result[0] || []
        });

    } catch (error) {

        console.error("SELLER VERIFICATION GET ERROR:", error);

        return res.status(500).json({
            success: false,
            message: error.sqlMessage || "Failed to fetch seller verification details"
        });
    }
});


// ==========================================
// EXPORT SELLER VERIFICATION DETAILS
// GET /api/seller-verification/export
// ADMIN ONLY
// EXPORT ALL FILTERED RECORDS TO EXCEL
// ==========================================

router.get("/export", authenticateToken, async (req, res) => {
    try {

        // ADMIN AUTHORIZATION

        const userType = String(
            req.user.USER_TYPE || ""
        ).trim().toUpperCase();

        if (userType !== "ADMIN") {
            return res.status(403).json({
                success: false,
                message: "Only admin users can export seller verification details"
            });
        }

        const {
            BUSINESS_TYPE_ID = "-1",
            SELLER_ID = "-1",
            DOCUMENT_VERIFICATION_STATUS = "-1",
            DAYS = 7
        } = req.query;

        const days = Number(DAYS);

        // DAYS VALIDATION

        if (![7, 30, 60, 90, 180].includes(days)) {
            return res.status(400).json({
                success: false,
                message: "DAYS must be 7, 30, 60, 90 or 180"
            });
        }

        // FETCH ALL FILTERED RECORDS
        // SAME FILTERS AS STORED PROCEDURE
        // NO LIMIT / OFFSET

        const sql = `
            SELECT
                s.SELLER_ID,
                s.BUSINESS_NAME,
                s.SELLER_NAME,
                s.BUSINESS_TYPE,
                s.EMAIL,
                s.MOBILE_NUMBER,
                s.BUSINESS_ADDRESS,
                s.CITY,
                s.STATE,
                s.COUNTRY,
                s.PINCODE,
                s.GST_NUMBER,
                s.PAN_NUMBER,
                s.BUSINESS_REGISTRATION_NUMBER,
                s.CONTACT_PERSON_NAME,
                s.CONTACT_PERSON_MOBILE,
                s.CONTACT_PERSON_EMAIL,
                s.STATUS AS SELLER_STATUS,
                s.DOCUMENT_VERIFICATION_STATUS,
                s.VERIFICATION_REMARKS,
                s.VERIFIED_BY,
                s.VERIFIED_AT,

                d.DOCUMENT_ID,
                d.GST_CERTIFICATE,
                d.GST_CERTIFICATION_STATUS,
                d.PAN_CARD,
                d.PAN_CARD_STATUS,
                d.BUSINESS_REGISTRATION_CERTIFICATE,
                d.BUSINESS_REGISTRATION_CERTIFICATE_STATUS,
                d.ADDRESS_PROOF,
                d.ADDRESS_PROOF_STATUS,
                d.OWNER_DIRECTOR_ID_PROOF,
                d.OWNER_DIRECTOR_ID_PROOF_STATUS,
                d.BANK_PROOF,
                d.BANK_PROOF_STATUS,
                d.OTHER_SUPPORTING_DOCUMENT,
                d.OTHER_SUPPORTING_DOCUMENT_STATUS,
                d.STATUS AS DOCUMENT_STATUS,
                d.REJECTION_REASON,

                -- SELLER BANK DETAILS
                b.BANK_DETAIL_ID,
                b.ACCOUNT_HOLDER_NAME,
                b.BANK_NAME,
                b.BRANCH_NAME,
                b.ACCOUNT_NUMBER,
                b.CONFIRM_ACCOUNT_NUMBER,
                b.IFSC_CODE,
                b.ACCOUNT_TYPE,
                bat.ACCOUNT_TYPE AS ACCOUNT_TYPE_NAME

            FROM m_seller_onboarding s

            LEFT JOIN o_seller_documents d
                ON d.SELLER_ID = s.SELLER_ID
                AND d.STATUS != 'ACTIVE'

            LEFT JOIN o_seller_bank_details b
                ON b.SELLER_ID = s.SELLER_ID

            LEFT JOIN m_bank_account_type bat
                ON bat.ACCOUNT_TYPE_ID = b.ACCOUNT_TYPE

            WHERE
                (
                    (
                        UPPER(TRIM(?)) = 'APPROVED'
                        AND UPPER(TRIM(s.STATUS)) = 'ACTIVE'
                    )

                    OR

                    (
                        UPPER(TRIM(?)) IN ('PENDING', 'REJECTED')
                        AND UPPER(TRIM(s.STATUS)) = 'INACTIVE'
                    )

                    OR

                    ? = '-1'
                )

                AND s.CREATED_AT >= DATE_SUB(
                    NOW(),
                    INTERVAL ? DAY
                )

                AND s.CREATED_AT <= NOW()

                AND (
                    ? = '-1'
                    OR s.BUSINESS_TYPE = ?
                )

                AND (
                    ? = '-1'
                    OR s.SELLER_ID = ?
                )

                AND (
                    ? = '-1'
                    OR UPPER(TRIM(s.DOCUMENT_VERIFICATION_STATUS)) =
                       UPPER(TRIM(?))
                )

            ORDER BY s.SELLER_ID DESC
        `;

        const params = [
            DOCUMENT_VERIFICATION_STATUS,
            DOCUMENT_VERIFICATION_STATUS,
            DOCUMENT_VERIFICATION_STATUS,

            days,

            BUSINESS_TYPE_ID,
            BUSINESS_TYPE_ID,

            SELLER_ID,
            SELLER_ID,

            DOCUMENT_VERIFICATION_STATUS,
            DOCUMENT_VERIFICATION_STATUS
        ];

        const [sellers] = await db.query(sql, params);

        // CREATE EXCEL WORKBOOK

        const workbook = new ExcelJS.Workbook();

        workbook.creator = "Ecom Milex";
        workbook.created = new Date();

        const worksheet = workbook.addWorksheet(
            "Seller Verification"
        );

        worksheet.columns = [
            { header: "Seller ID", key: "SELLER_ID", width: 12 },
            { header: "Business Name", key: "BUSINESS_NAME", width: 25 },
            { header: "Seller Name", key: "SELLER_NAME", width: 22 },
            { header: "Business Type", key: "BUSINESS_TYPE", width: 15 },
            { header: "Email", key: "EMAIL", width: 28 },
            { header: "Mobile Number", key: "MOBILE_NUMBER", width: 18 },
            { header: "Business Address", key: "BUSINESS_ADDRESS", width: 30 },
            { header: "City", key: "CITY", width: 18 },
            { header: "State", key: "STATE", width: 15 },
            { header: "Country", key: "COUNTRY", width: 15 },
            { header: "Pincode", key: "PINCODE", width: 12 },
            { header: "GST Number", key: "GST_NUMBER", width: 20 },
            { header: "PAN Number", key: "PAN_NUMBER", width: 18 },
            { header: "Business Registration Number", key: "BUSINESS_REGISTRATION_NUMBER", width: 28 },
            { header: "Contact Person Name", key: "CONTACT_PERSON_NAME", width: 22 },
            { header: "Contact Person Mobile", key: "CONTACT_PERSON_MOBILE", width: 20 },
            { header: "Contact Person Email", key: "CONTACT_PERSON_EMAIL", width: 28 },
            { header: "Seller Status", key: "SELLER_STATUS", width: 16 },
            { header: "Document Verification Status", key: "DOCUMENT_VERIFICATION_STATUS", width: 25 },
            { header: "Verification Remarks", key: "VERIFICATION_REMARKS", width: 30 },
            { header: "Verified By", key: "VERIFIED_BY", width: 15 },
            { header: "Verified At", key: "VERIFIED_AT", width: 22 },

            { header: "Document ID", key: "DOCUMENT_ID", width: 14 },
            { header: "GST Certificate", key: "GST_CERTIFICATE", width: 30 },
            { header: "GST Certificate Status", key: "GST_CERTIFICATION_STATUS", width: 22 },
            { header: "PAN Card", key: "PAN_CARD", width: 30 },
            { header: "PAN Card Status", key: "PAN_CARD_STATUS", width: 18 },
            { header: "Business Registration Certificate", key: "BUSINESS_REGISTRATION_CERTIFICATE", width: 35 },
            { header: "Business Registration Status", key: "BUSINESS_REGISTRATION_CERTIFICATE_STATUS", width: 28 },
            { header: "Address Proof", key: "ADDRESS_PROOF", width: 30 },
            { header: "Address Proof Status", key: "ADDRESS_PROOF_STATUS", width: 22 },
            { header: "Owner Director ID Proof", key: "OWNER_DIRECTOR_ID_PROOF", width: 30 },
            { header: "Owner Director ID Proof Status", key: "OWNER_DIRECTOR_ID_PROOF_STATUS", width: 30 },
            { header: "Bank Proof", key: "BANK_PROOF", width: 30 },
            { header: "Bank Proof Status", key: "BANK_PROOF_STATUS", width: 20 },
            { header: "Other Supporting Document", key: "OTHER_SUPPORTING_DOCUMENT", width: 30 },
            { header: "Other Supporting Document Status", key: "OTHER_SUPPORTING_DOCUMENT_STATUS", width: 32 },
            { header: "Document Status", key: "DOCUMENT_STATUS", width: 18 },
            { header: "Rejection Reason", key: "REJECTION_REASON", width: 30 },

            // BANK DETAILS
            { header: "Bank Detail ID", key: "BANK_DETAIL_ID", width: 15 },
            { header: "Account Holder Name", key: "ACCOUNT_HOLDER_NAME", width: 25 },
            { header: "Bank Name", key: "BANK_NAME", width: 22 },
            { header: "Branch Name", key: "BRANCH_NAME", width: 22 },
            { header: "Account Number", key: "ACCOUNT_NUMBER", width: 22 },
            { header: "Confirm Account Number", key: "CONFIRM_ACCOUNT_NUMBER", width: 25 },
            { header: "IFSC Code", key: "IFSC_CODE", width: 18 },
            { header: "Account Type ID", key: "ACCOUNT_TYPE", width: 15 },
            { header: "Account Type", key: "ACCOUNT_TYPE_NAME", width: 20 }
        ];

        // HEADER STYLE

        worksheet.getRow(1).font = {
            bold: true,
            color: { argb: "FFFFFFFF" }
        };

        worksheet.getRow(1).fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FF1F4E78" }
        };

        worksheet.getRow(1).alignment = {
            vertical: "middle",
            horizontal: "center"
        };

        // ADD ALL SELLER RECORDS

        sellers.forEach(seller => {
            worksheet.addRow(seller);
        });

        // DATE FORMATTING

        ["VERIFIED_AT"].forEach(key => {
            worksheet.getColumn(key).numFmt = "yyyy-mm-dd hh:mm:ss";
        });

        // FREEZE HEADER

        worksheet.views = [
            {
                state: "frozen",
                ySplit: 1
            }
        ];

        // EXCEL FILTER

        worksheet.autoFilter = {
            from: "A1",
            to: `${worksheet.getColumn(worksheet.columnCount).letter}1`
        };

        // GENERATE FILE

        const buffer = await workbook.xlsx.writeBuffer();

        const fileName = `Seller_Verification_${new Date()
            .toISOString()
            .slice(0, 10)}.xlsx`;

        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );

        res.setHeader(
            "Content-Disposition",
            `attachment; filename="${fileName}"`
        );

        res.setHeader("Content-Length", buffer.length);

        return res.status(200).send(Buffer.from(buffer));

    } catch (error) {

        console.error("SELLER VERIFICATION EXPORT ERROR:", error);

        return res.status(500).json({
            success: false,
            message: error.sqlMessage || "Failed to export seller verification details"
        });
    }
});

module.exports = router;
