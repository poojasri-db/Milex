
const express = require("express");
const router = express.Router();
const db = require("./db");
const authenticateToken = require("./auth_middleware");

// ==========================================
// JWT AUTHENTICATION
// ALL ROUTES REQUIRE LOGIN
// ==========================================
router.use(authenticateToken);


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
            SELLER_ID
        } = req.body || {};

        if (!SELLER_ID) {
            return res.status(400).json({
                status: false,
                message: "SELLER_ID is required"
            });
        }

        const userType = String(req.user.USER_TYPE || "").toUpperCase();

        if (!["ADMIN", "SELLER"].includes(userType)) {
            return res.status(403).json({
                status: false,
                message: "You are not authorized to insert seller documents"
            });
        }

        if (
            userType === "SELLER" &&
            Number(req.user.SELLER_ID) !== Number(SELLER_ID)
        ) {
            return res.status(403).json({
                status: false,
                message: "You can only insert your own documents"
            });
        }

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
                req.user.USER_ID
            ]
        );

        const response = result[0][0];

        return res.status(200).json({
            status: true,
            message: "Seller documents inserted successfully",
            DOCUMENT_ID: response.DOCUMENT_ID
        });

    } catch (error) {
        console.error("SELLER DOCUMENT INSERT ERROR:", error);

        return res.status(500).json({
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
            SELLER_ID
        } = req.body || {};

        if (!DOCUMENT_ID || !SELLER_ID) {
            return res.status(400).json({
                status: false,
                message: "DOCUMENT_ID and SELLER_ID are required"
            });
        }

        const userType = String(req.user.USER_TYPE || "").toUpperCase();

        if (!["ADMIN", "SELLER"].includes(userType)) {
            return res.status(403).json({
                status: false,
                message: "You are not authorized to update seller documents"
            });
        }

        if (
            userType === "SELLER" &&
            Number(req.user.SELLER_ID) !== Number(SELLER_ID)
        ) {
            return res.status(403).json({
                status: false,
                message: "You can only update your own documents"
            });
        }

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
                req.user.USER_ID
            ]
        );

        return res.status(200).json({
            status: true,
            message: "Seller documents updated successfully",
            data: result[0]
        });

    } catch (error) {
        console.error("SELLER DOCUMENT UPDATE ERROR:", error);

        return res.status(500).json({
            status: false,
            message: error.sqlMessage || error.message
        });
    }
});



router.get("/get", authenticateToken, async (req, res) => {
    try {
        let {
            DOCUMENT_ID = "-1",
            SELLER_ID = "-1",
            LIMIT = 10,
            OFFSET = 0
        } = req.query;

        const userType = String(req.user.USER_TYPE || "").toUpperCase();

        if (!["ADMIN", "SELLER"].includes(userType)) {
            return res.status(403).json({
                status: false,
                message: "Unauthorized access"
            });
        }

        // Seller can access only their own documents
        if (userType === "SELLER") {
            if (!req.user.SELLER_ID) {
                return res.status(403).json({
                    status: false,
                    message: "Seller account is not linked"
                });
            }

            SELLER_ID = req.user.SELLER_ID;
        }

        LIMIT = Number(LIMIT);
        OFFSET = Number(OFFSET);

        if (
            !Number.isInteger(LIMIT) ||
            !Number.isInteger(OFFSET) ||
            LIMIT <= 0 ||
            OFFSET < 0
        ) {
            return res.status(400).json({
                status: false,
                message: "Invalid LIMIT or OFFSET"
            });
        }

        const [result] = await db.query(
            "CALL sp_o_seller_documents_get(?,?,?,?)",
            [
                DOCUMENT_ID,
                SELLER_ID,
                LIMIT,
                OFFSET
            ]
        );

        return res.status(200).json({
            status: true,
            message: "Seller documents fetched successfully",
            data: result[0]
        });

    } catch (error) {
        console.error("SELLER DOCUMENT GET ERROR:", error);

        return res.status(500).json({
            status: false,
            message: error.sqlMessage || error.message
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
        } = req.body || {};

        if (!DOCUMENT_ID) {
            return res.status(400).json({
                status: false,
                message: "DOCUMENT_ID is required"
            });
        }

        const userType = String(req.user.USER_TYPE || "").toUpperCase();

        if (!["ADMIN", "SELLER"].includes(userType)) {
            return res.status(403).json({
                status: false,
                message: "You are not authorized to delete seller documents"
            });
        }

        if (userType === "SELLER") {
            if (!req.user.SELLER_ID) {
                return res.status(403).json({
                    status: false,
                    message: "Seller account is not linked"
                });
            }

            // Verify document ownership before deletion
            const [check] = await db.query(
                "CALL sp_o_seller_documents_get(?, ?, ?)",
                [DOCUMENT_ID, 1000, 0]
            );

            const document = check[0].find(
                item => Number(item.DOCUMENT_ID) === Number(DOCUMENT_ID)
            );

            if (
                !document ||
                Number(document.SELLER_ID) !== Number(req.user.SELLER_ID)
            ) {
                return res.status(403).json({
                    status: false,
                    message: "You can only delete your own documents"
                });
            }
        }

        const [result] = await db.query(
            "CALL sp_o_seller_documents_delete(?)",
            [DOCUMENT_ID]
        );

        return res.status(200).json({
            status: true,
            message: "Seller documents deleted successfully",
            data: result[0]
        });

    } catch (error) {
        console.error("SELLER DOCUMENT DELETE ERROR:", error);

        return res.status(500).json({
            status: false,
            message: error.sqlMessage || error.message
        });
    }
});

module.exports = router;
