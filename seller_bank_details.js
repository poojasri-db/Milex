
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
            SELLER_ID
        } = req.body || {};

        if (!SELLER_ID) {
            return res.status(400).json({
                status: false,
                message: "SELLER_ID is required"
            });
        }

        // Seller ownership validation
        const userType = String(req.user.USER_TYPE || "").toUpperCase();

        if (
            userType === "SELLER" &&
            Number(req.user.SELLER_ID) !== Number(SELLER_ID)
        ) {
            return res.status(403).json({
                status: false,
                message: "You can only add your own bank details"
            });
        }

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
                req.user.USER_ID
            ]
        );

        const response = results[0][0];

        return res.status(200).json({
            status: true,
            message: "Seller bank details inserted successfully",
            BANK_DETAIL_ID: response.BANK_DETAIL_ID
        });

    } catch (err) {
        console.error("BANK DETAILS INSERT ERROR:", err);

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
            SELLER_ID
        } = req.body || {};

        if (!BANK_DETAIL_ID || !SELLER_ID) {
            return res.status(400).json({
                status: false,
                message: "BANK_DETAIL_ID and SELLER_ID are required"
            });
        }

        const userType = String(req.user.USER_TYPE || "").toUpperCase();

        if (
            userType === "SELLER" &&
            Number(req.user.SELLER_ID) !== Number(SELLER_ID)
        ) {
            return res.status(403).json({
                status: false,
                message: "You can only update your own bank details"
            });
        }

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
                req.user.USER_ID
            ]
        );

        return res.status(200).json({
            status: true,
            message: "Seller bank details updated successfully",
            data: result[0]
        });

    } catch (error) {
        console.error("BANK DETAILS UPDATE ERROR:", error);

        return res.status(error.errno === 1644 ? 404 : 500).json({
            status: false,
            message: error.sqlMessage || error.message
        });
    }
});


// ==========================================
// GET SELLER BANK DETAILS
// GET /api/seller-bank-details/get
// ==========================================

router.get("/get", async (req, res) => {
    try {
        let {
            BANK_DETAIL_ID = "",
            SELLER_ID = "",
            LIMIT = 10,
            OFFSET = 0
        } = req.query;

        const userType = String(req.user.USER_TYPE || "").toUpperCase();

        if (userType === "SELLER") {
            SELLER_ID = req.user.SELLER_ID;

            if (!SELLER_ID) {
                return res.status(403).json({
                    status: false,
                    message: "Seller account is not linked"
                });
            }
        } else if (!["ADMIN"].includes(userType)) {
            return res.status(403).json({
                status: false,
                message: "You are not authorized to view bank details"
            });
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
            "CALL sp_o_seller_bank_details_get(?,?,?,?)",
            [
                BANK_DETAIL_ID,
                SELLER_ID,
                LIMIT,
                OFFSET
            ]
        );

        return res.status(200).json({
            status: true,
            message: "Seller bank details retrieved successfully",
            data: result[0]
        });

    } catch (error) {
        console.error("BANK DETAILS GET ERROR:", error);

        return res.status(500).json({
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
        } = req.body || {};

        if (!BANK_DETAIL_ID || !SELLER_ID) {
            return res.status(400).json({
                status: false,
                message: "BANK_DETAIL_ID and SELLER_ID are required"
            });
        }

        const userType = String(req.user.USER_TYPE || "").toUpperCase();

        if (
            userType === "SELLER" &&
            Number(req.user.SELLER_ID) !== Number(SELLER_ID)
        ) {
            return res.status(403).json({
                status: false,
                message: "You can only delete your own bank details"
            });
        }

        if (!["ADMIN", "SELLER"].includes(userType)) {
            return res.status(403).json({
                status: false,
                message: "You are not authorized to delete bank details"
            });
        }

        const [result] = await db.query(
            "CALL sp_o_seller_bank_details_delete(?,?)",
            [
                BANK_DETAIL_ID,
                SELLER_ID
            ]
        );

        return res.status(200).json({
            status: true,
            message: "Seller bank details deleted successfully",
            data: result[0]
        });

    } catch (error) {
        console.error("BANK DETAILS DELETE ERROR:", error);

        return res.status(error.errno === 1644 ? 404 : 500).json({
            status: false,
            message: error.sqlMessage || error.message
        });
    }
});

module.exports = router;
