
const express = require("express");
const router = express.Router();
const db = require("./db");

// ==========================================
// USER LOGIN
// POST /api/user/login
// ==========================================

router.post("/login", async (req, res) => {
    try {
        const { USER_NAME, USER_PASSWORD } = req.body || {};

        if (
            typeof USER_NAME !== "string" ||
            typeof USER_PASSWORD !== "string" ||
            !USER_NAME.trim() ||
            !USER_PASSWORD
        ) {
            return res.status(400).json({
                status: "FAILED",
                message: "Username and password are required"
            });
        }

        const [result] = await db.query(
            "CALL sp_m_user_login(?, ?)",
            [
                USER_NAME,
                USER_PASSWORD
            ]
        );

        const data = result[0];

        if (data && data[0] && data[0].MESSAGE) {
            return res.status(401).json({
                status: "FAILED",
                message: data[0].MESSAGE
            });
        }

        if (data && data[0] && data[0].USER_ID) {
            return res.status(200).json({
                status: "SUCCESS",
                message: "Login successful",
                data: {
                    USER_ID: data[0].USER_ID,
                    USER_NAME: data[0].USER_NAME,
                    USER_TYPE: data[0].USER_TYPE,
                    USER_TYPE_ID: data[0].USER_TYPE_ID
                }
            });
        }

        return res.status(401).json({
            status: "FAILED",
            message: "Invalid username or password"
        });

    } catch (error) {
        res.status(500).json({
            status: "FAILED",
            message: error.message
        });
    }
});

module.exports = router;
