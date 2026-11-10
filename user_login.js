
const express = require("express");
const router = express.Router();
const db = require("./db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const authenticateToken = require("./auth_middleware");

// ==========================================
// USER LOGIN
// POST /api/user/login
// ==========================================

router.post("/login", async (req, res) => {
    try {

        const { USER_NAME, USER_PASSWORD } = req.body || {};

        // ==========================================
        // VALIDATION
        // ==========================================

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

        // ==========================================
        // CHECK JWT CONFIGURATION
        // ==========================================

        if (!process.env.JWT_SECRET) {
            throw new Error("JWT_SECRET is missing in .env");
        }

        if (!process.env.JWT_ISSUER || !process.env.JWT_AUDIENCE) {
            throw new Error("JWT issuer or audience is missing in .env");
        }

        // ==========================================
        // GET USER DETAILS
        // ==========================================

        const [result] = await db.query(
            "CALL sp_m_user_get_by_username(?)",
            [USER_NAME.trim()]
        );

        const user = result?.[0]?.[0];

        if (!user) {
            return res.status(401).json({
                status: "FAILED",
                message: "Invalid username or password"
            });
        }

        // ==========================================
        // CHECK ACTIVE STATUS
        // ==========================================

        if (String(user.ACTIVE_STATUS).toUpperCase() !== "YES") {
            return res.status(403).json({
                status: "FAILED",
                message: "User account is inactive"
            });
        }

        // ==========================================
        // CHECK BCRYPT HASH
        // ==========================================

        if (
            typeof user.USER_PASSWORD !== "string" ||
            !/^\$2[aby]\$\d{2}\$/.test(user.USER_PASSWORD)
        ) {
            throw new Error("Stored password is not a valid bcrypt hash");
        }

        // ==========================================
        // VERIFY PASSWORD
        // ==========================================

        const isPasswordValid = await bcrypt.compare(
            USER_PASSWORD,
            user.USER_PASSWORD
        );

        if (!isPasswordValid) {
            return res.status(401).json({
                status: "FAILED",
                message: "Invalid username or password"
            });
        }

        // ==========================================
        // GENERATE SESSION ID
        // ==========================================

        const sessionId = crypto.randomUUID();

        // ==========================================
        // GENERATE ACCESS TOKEN
        // ==========================================

        const accessToken = jwt.sign(
            {
                sid: sessionId,
                role: user.USER_TYPE
            },
            process.env.JWT_SECRET,
            {
                subject: String(user.USER_ID),
                expiresIn: process.env.JWT_EXPIRES_IN || "10m",
                issuer: process.env.JWT_ISSUER,
                audience: process.env.JWT_AUDIENCE,
                algorithm: "HS256"
            }
        );

        // ==========================================
        // GENERATE REFRESH TOKEN
        // ==========================================

        const refreshToken = crypto.randomBytes(64).toString("hex");

        // ==========================================
        // HASH REFRESH TOKEN USING SHA-256
        // ==========================================

        const hashedRefreshToken = crypto
            .createHash("sha256")
            .update(refreshToken)
            .digest("hex");

        // ==========================================
        // REFRESH TOKEN EXPIRY - 7 DAYS
        // ==========================================

        const refreshExpiry = new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000
        );

        // ==========================================
        // STORE REFRESH SESSION IN MYSQL
        // ==========================================

        await db.query(
            `INSERT INTO refresh_sessions
            (
                session_id,
                user_id,
                token_hash,
                expires_at,
                ip_address
            )
            VALUES (?, ?, ?, ?, ?)`,
            [
                sessionId,
                user.USER_ID,
                hashedRefreshToken,
                refreshExpiry,
                req.ip || null
            ]
        );

        // ==========================================
        // SET HTTP-ONLY REFRESH TOKEN COOKIE
        // ==========================================

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/api/user",
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        // ==========================================
        // SUCCESS RESPONSE
        // ==========================================

        return res.status(200).json({
            status: "SUCCESS",
            message: "Login successful",
            data: {
                USER_ID: user.USER_ID,
                USER_NAME: user.USER_NAME,
                USER_TYPE: user.USER_TYPE,
                USER_TYPE_ID: user.USER_TYPE_ID,
                ACCESSTOKEN: accessToken
            }
        });

    } catch (error) {

        // ==========================================
        // ERROR HANDLING
        // ==========================================

        console.error("LOGIN API ERROR:", error);

        return res.status(500).json({
            status: "FAILED",
            message: "Internal server error"
        });
    }
});



// ==========================================
// REFRESH ACCESS TOKEN WITH ROTATION
// POST /api/user/refresh
// ==========================================

router.post("/refresh", async (req, res) => {

    let connection;
    let transactionStarted = false;

    try {

        // ==========================================
        // GET REFRESH TOKEN FROM COOKIE
        // ==========================================

        const cookieHeader = req.headers.cookie || "";

        const refreshCookie = cookieHeader
            .split(";")
            .map(cookie => cookie.trim())
            .find(cookie => cookie.startsWith("refreshToken="));

        if (!refreshCookie) {
            return res.status(401).json({
                status: "FAILED",
                message: "Refresh token is missing"
            });
        }

        const refreshToken = decodeURIComponent(
            refreshCookie.substring("refreshToken=".length)
        );

        if (!refreshToken) {
            return res.status(401).json({
                status: "FAILED",
                message: "Invalid refresh token"
            });
        }

        // ==========================================
        // CHECK JWT CONFIGURATION
        // ==========================================

        if (!process.env.JWT_SECRET) {
            throw new Error("JWT_SECRET is missing in .env");
        }

        if (!process.env.JWT_ISSUER || !process.env.JWT_AUDIENCE) {
            throw new Error("JWT issuer or audience is missing in .env");
        }

        // ==========================================
        // HASH OLD REFRESH TOKEN
        // ==========================================

        const hashedRefreshToken = crypto
            .createHash("sha256")
            .update(refreshToken)
            .digest("hex");

        // ==========================================
        // START DATABASE TRANSACTION
        // ==========================================

        connection = await db.getConnection();

        await connection.beginTransaction();
        transactionStarted = true;

        // ==========================================
        // VERIFY OLD REFRESH SESSION
        // ==========================================

        const [sessions] = await connection.query(
            `SELECT
                session_id,
                user_id
             FROM refresh_sessions
             WHERE token_hash = ?
             AND revoked_at IS NULL
             AND expires_at > NOW()
             LIMIT 1
             FOR UPDATE`,
            [hashedRefreshToken]
        );

        const oldSession = sessions[0];

        if (!oldSession) {

            await connection.rollback();
            transactionStarted = false;

            return res.status(401).json({
                status: "FAILED",
                message: "Refresh token is invalid, expired or revoked"
            });
        }

        // ==========================================
        // GET USER DETAILS
        // ==========================================

        const [users] = await connection.query(
            `SELECT
                USER_ID,
                USER_NAME,
                USER_TYPE,
                USER_TYPE_ID,
                ACTIVE_STATUS
             FROM m_user
             WHERE USER_ID = ?
             LIMIT 1`,
            [oldSession.user_id]
        );

        const user = users[0];

        if (!user) {

            await connection.rollback();
            transactionStarted = false;

            return res.status(401).json({
                status: "FAILED",
                message: "User not found"
            });
        }

        // ==========================================
        // CHECK ACTIVE STATUS
        // ==========================================

        if (String(user.ACTIVE_STATUS).toUpperCase() !== "YES") {

            await connection.rollback();
            transactionStarted = false;

            return res.status(403).json({
                status: "FAILED",
                message: "User account is inactive"
            });
        }

        // ==========================================
        // GENERATE NEW SESSION ID
        // ==========================================

        const newSessionId = crypto.randomUUID();

        // ==========================================
        // GENERATE NEW REFRESH TOKEN
        // ==========================================

        const newRefreshToken = crypto.randomBytes(64).toString("hex");

        // ==========================================
        // HASH NEW REFRESH TOKEN
        // ==========================================

        const newHashedRefreshToken = crypto
            .createHash("sha256")
            .update(newRefreshToken)
            .digest("hex");

        // ==========================================
        // NEW REFRESH TOKEN EXPIRY - 7 DAYS
        // ==========================================

        const refreshExpiry = new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000
        );

        // ==========================================
        // REVOKE OLD REFRESH SESSION
        // ==========================================

        const [updateResult] = await connection.query(
            `UPDATE refresh_sessions
             SET revoked_at = NOW()
             WHERE session_id = ?
             AND revoked_at IS NULL`,
            [oldSession.session_id]
        );

        if (updateResult.affectedRows !== 1) {
            throw new Error("Unable to revoke old refresh session");
        }

        // ==========================================
        // INSERT NEW REFRESH SESSION
        // ==========================================

        await connection.query(
            `INSERT INTO refresh_sessions
            (
                session_id,
                user_id,
                token_hash,
                expires_at,
                ip_address
            )
            VALUES (?, ?, ?, ?, ?)`,
            [
                newSessionId,
                user.USER_ID,
                newHashedRefreshToken,
                refreshExpiry,
                req.ip || null
            ]
        );

        // ==========================================
        // GENERATE NEW ACCESS TOKEN
        // ==========================================

        const accessToken = jwt.sign(
            {
                sid: newSessionId,
                role: user.USER_TYPE
            },
            process.env.JWT_SECRET,
            {
                subject: String(user.USER_ID),
                expiresIn: process.env.JWT_EXPIRES_IN || "10m",
                issuer: process.env.JWT_ISSUER,
                audience: process.env.JWT_AUDIENCE,
                algorithm: "HS256"
            }
        );

        // ==========================================
        // COMMIT TRANSACTION
        // ==========================================

        await connection.commit();
        transactionStarted = false;

        // ==========================================
        // SET NEW HTTP-ONLY REFRESH TOKEN COOKIE
        // ==========================================

        res.cookie("refreshToken", newRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/api/user",
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        // ==========================================
        // SUCCESS RESPONSE
        // ==========================================

        return res.status(200).json({
            status: "SUCCESS",
            message: "Access token refreshed successfully",
            data: {
                USER_ID: user.USER_ID,
                USER_NAME: user.USER_NAME,
                USER_TYPE: user.USER_TYPE,
                USER_TYPE_ID: user.USER_TYPE_ID,
                ACCESSTOKEN: accessToken
            }
        });

    } catch (error) {

        // ==========================================
        // ROLLBACK TRANSACTION
        // ==========================================

        if (connection && transactionStarted) {
            await connection.rollback();
        }

        console.error("REFRESH TOKEN API ERROR:", error);

        return res.status(500).json({
            status: "FAILED",
            message: "Internal server error"
        });

    } finally {

        if (connection) {
            connection.release();
        }
    }
});



// ==========================================
// USER LOGOUT
// POST /api/user/logout
// ==========================================

router.post("/logout", async (req, res) => {

    try {

        // ==========================================
        // GET REFRESH TOKEN FROM COOKIE
        // ==========================================

        const cookieHeader = req.headers.cookie || "";

        const refreshCookie = cookieHeader
            .split(";")
            .map(cookie => cookie.trim())
            .find(cookie => cookie.startsWith("refreshToken="));

        // ==========================================
        // IF COOKIE EXISTS, REVOKE SESSION
        // ==========================================

        if (refreshCookie) {

            const refreshToken = decodeURIComponent(
                refreshCookie.substring("refreshToken=".length)
            );

            if (refreshToken) {

                // ==========================================
                // HASH REFRESH TOKEN USING SHA-256
                // ==========================================

                const hashedRefreshToken = crypto
                    .createHash("sha256")
                    .update(refreshToken)
                    .digest("hex");

                // ==========================================
                // REVOKE REFRESH SESSION
                // ==========================================

                await db.query(
                    `UPDATE refresh_sessions
                     SET revoked_at = NOW()
                     WHERE token_hash = ?
                     AND revoked_at IS NULL`,
                    [hashedRefreshToken]
                );
            }
        }

        // ==========================================
        // CLEAR REFRESH TOKEN COOKIE
        // ==========================================

        res.clearCookie("refreshToken", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/api/user"
        });

        // ==========================================
        // SUCCESS RESPONSE
        // ==========================================

        return res.status(200).json({
            status: "SUCCESS",
            message: "Logout successful"
        });

    } catch (error) {

        // ==========================================
        // ERROR HANDLING
        // ==========================================

        console.error("LOGOUT API ERROR:", error);

        return res.status(500).json({
            status: "FAILED",
            message: "Internal server error"
        });
    }
});


// TEST PROTECTED PROFILE API
router.get("/profile", authenticateToken, async (req, res) => {
    return res.status(200).json({
        status: "SUCCESS",
        message: "Authentication successful",
        data: req.user
    });
});


module.exports = router;
