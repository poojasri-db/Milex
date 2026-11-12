
const express = require("express");
const router = express.Router();
const db = require("./db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const authenticateToken = require("./auth_middleware");

// JWT CONFIGURATION
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "10m";
const REFRESH_TOKEN_DAYS = 7;

// COOKIE CONFIGURATION
const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/user",
    maxAge: REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000
};

// GET REFRESH TOKEN FROM COOKIE
function getRefreshToken(req) {
    const cookieHeader = req.headers.cookie || "";

    const refreshCookie = cookieHeader
        .split(";")
        .map(cookie => cookie.trim())
        .find(cookie => cookie.startsWith("refreshToken="));

    if (!refreshCookie) {
        return null;
    }

    try {
        return decodeURIComponent(
            refreshCookie.substring("refreshToken=".length)
        );
    } catch (error) {
        return null;
    }
}

// HASH REFRESH TOKEN
function hashRefreshToken(token) {
    return crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");
}

// CREATE ACCESS TOKEN
function createAccessToken(user, sessionId) {
    return jwt.sign(
        {
            sid: sessionId,
            role: user.USER_TYPE,
            USER_TYPE_ID: user.USER_TYPE_ID
        },
        process.env.JWT_SECRET,
        {
            subject: String(user.USER_ID),
            expiresIn: JWT_EXPIRES_IN,
            issuer: process.env.JWT_ISSUER,
            audience: process.env.JWT_AUDIENCE,
            algorithm: "HS256"
        }
    );
}

// CHECK JWT CONFIGURATION
function validateJwtConfig() {
    if (
        !process.env.JWT_SECRET ||
        !process.env.JWT_ISSUER ||
        !process.env.JWT_AUDIENCE
    ) {
        throw new Error("JWT configuration is missing in environment variables");
    }
}

// --------------------------------------------------
// LOGIN
// PUBLIC API
// --------------------------------------------------

router.post("/login", async (req, res) => {
    try {
        const { USER_NAME, USER_PASSWORD } = req.body;

        if (!USER_NAME || !USER_PASSWORD) {
            return res.status(400).json({
                success: false,
                message: "USER_NAME and USER_PASSWORD are required"
            });
        }

        validateJwtConfig();

        const [result] = await db.query(
            "CALL sp_m_user_get_by_username(?)",
            [USER_NAME]
        );

        const user = result?.[0]?.[0];

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid username or password"
            });
        }

        if (user.ACTIVE_STATUS !== "YES") {
            return res.status(403).json({
                success: false,
                message: "Your account is inactive"
            });
        }

        if (!user.USER_TYPE_ID) {
            return res.status(403).json({
                success: false,
                message: "User type is not assigned"
            });
        }

        const storedPassword = String(user.USER_PASSWORD || "");

        const isBcryptHash =
            /^\$2[aby]\$\d{2}\$/.test(storedPassword);

        if (!isBcryptHash) {
            return res.status(500).json({
                success: false,
                message: "Password is not stored in a valid encrypted format"
            });
        }

        const passwordMatch = await bcrypt.compare(
            USER_PASSWORD,
            storedPassword
        );

        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid username or password"
            });
        }

        // CREATE SESSION
        const sessionId = crypto.randomUUID();

        // CREATE ACCESS TOKEN
        const accessToken = createAccessToken(user, sessionId);

        // CREATE REFRESH TOKEN
        const refreshToken = crypto
            .randomBytes(64)
            .toString("hex");

        const refreshTokenHash = hashRefreshToken(refreshToken);

        // INSERT REFRESH SESSION
        await db.query(
            `INSERT INTO refresh_sessions
            (
                session_id,
                user_id,
                token_hash,
                expires_at,
                ip_address
            )
            VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL ? DAY), ?)`,
            [
                sessionId,
                user.USER_ID,
                refreshTokenHash,
                REFRESH_TOKEN_DAYS,
                req.ip
            ]
        );

        // SET REFRESH TOKEN COOKIE
        res.cookie(
            "refreshToken",
            refreshToken,
            COOKIE_OPTIONS
        );

        return res.status(200).json({
            success: true,
            message: "Login successful",
            USER_ID: user.USER_ID,
            USER_NAME: user.USER_NAME,
            USER_TYPE: user.USER_TYPE,
            USER_TYPE_ID: user.USER_TYPE_ID,
            ACCESSTOKEN: accessToken
        });

    } catch (error) {
        console.error("LOGIN ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Login failed",
            error: error.message
        });
    }
});

// --------------------------------------------------
// REFRESH ACCESS TOKEN
// PUBLIC API
// --------------------------------------------------

router.post("/refresh", async (req, res) => {
    let connection;

    try {
        validateJwtConfig();

        const refreshToken = getRefreshToken(req);

        if (!refreshToken) {
            return res.status(401).json({
                success: false,
                message: "Refresh token is missing"
            });
        }

        const tokenHash = hashRefreshToken(refreshToken);

        connection = await db.getConnection();

        await connection.beginTransaction();

        // FIND ACTIVE REFRESH SESSION
        const [sessions] = await connection.query(
            `SELECT *
             FROM refresh_sessions
             WHERE token_hash = ?
             AND revoked_at IS NULL
             AND expires_at > NOW()
             LIMIT 1
             FOR UPDATE`,
            [tokenHash]
        );

        const oldSession = sessions[0];

        if (!oldSession) {
            await connection.rollback();

            res.clearCookie("refreshToken", {
                ...COOKIE_OPTIONS,
                maxAge: undefined
            });

            return res.status(401).json({
                success: false,
                message: "Invalid or expired refresh token"
            });
        }

        // GET CURRENT USER DETAILS
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

        if (!user || user.ACTIVE_STATUS !== "YES") {
            await connection.query(
                `UPDATE refresh_sessions
                 SET revoked_at = NOW()
                 WHERE session_id = ?
                 AND revoked_at IS NULL`,
                [oldSession.session_id]
            );

            await connection.commit();

            res.clearCookie("refreshToken", {
                ...COOKIE_OPTIONS,
                maxAge: undefined
            });

            return res.status(403).json({
                success: false,
                message: "User account is inactive"
            });
        }

        if (!user.USER_TYPE_ID) {
            await connection.rollback();

            return res.status(403).json({
                success: false,
                message: "User type is not assigned"
            });
        }

        // CREATE NEW SESSION ID
        const newSessionId = crypto.randomUUID();

        // CREATE NEW ACCESS TOKEN WITH USER_TYPE_ID
        const accessToken = createAccessToken(
            user,
            newSessionId
        );

        // ROTATE REFRESH TOKEN
        const newRefreshToken = crypto
            .randomBytes(64)
            .toString("hex");

        const newRefreshTokenHash = hashRefreshToken(
            newRefreshToken
        );

        // REVOKE OLD REFRESH SESSION
        const [revokeResult] = await connection.query(
            `UPDATE refresh_sessions
             SET revoked_at = NOW()
             WHERE session_id = ?
             AND revoked_at IS NULL`,
            [oldSession.session_id]
        );

        if (revokeResult.affectedRows !== 1) {
            await connection.rollback();

            return res.status(401).json({
                success: false,
                message: "Refresh token has already been used"
            });
        }

        // INSERT NEW REFRESH SESSION
        await connection.query(
            `INSERT INTO refresh_sessions
            (
                session_id,
                user_id,
                token_hash,
                expires_at,
                ip_address
            )
            VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL ? DAY), ?)`,
            [
                newSessionId,
                user.USER_ID,
                newRefreshTokenHash,
                REFRESH_TOKEN_DAYS,
                req.ip
            ]
        );

        await connection.commit();

        // SET NEW REFRESH TOKEN COOKIE
        res.cookie(
            "refreshToken",
            newRefreshToken,
            COOKIE_OPTIONS
        );

        return res.status(200).json({
            success: true,
            message: "Token refreshed successfully",
            USER_ID: user.USER_ID,
            USER_NAME: user.USER_NAME,
            USER_TYPE: user.USER_TYPE,
            USER_TYPE_ID: user.USER_TYPE_ID,
            ACCESSTOKEN: accessToken
        });

    } catch (error) {
        if (connection) {
            await connection.rollback();
        }

        console.error("REFRESH ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Token refresh failed",
            error: error.message
        });

    } finally {
        if (connection) {
            connection.release();
        }
    }
});

// --------------------------------------------------
// LOGOUT
// PUBLIC API
// --------------------------------------------------

router.post("/logout", async (req, res) => {
    try {
        const refreshToken = getRefreshToken(req);

        if (refreshToken) {
            const tokenHash = hashRefreshToken(refreshToken);

            await db.query(
                `UPDATE refresh_sessions
                 SET revoked_at = NOW()
                 WHERE token_hash = ?
                 AND revoked_at IS NULL`,
                [tokenHash]
            );
        }

        res.clearCookie("refreshToken", {
            ...COOKIE_OPTIONS,
            maxAge: undefined
        });

        return res.status(200).json({
            success: true,
            message: "Logout successful"
        });

    } catch (error) {
        console.error("LOGOUT ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Logout failed",
            error: error.message
        });
    }
});

// --------------------------------------------------
// PROFILE
// PRIVATE API
// --------------------------------------------------

router.get("/profile", authenticateToken, async (req, res) => {
    try {
        return res.status(200).json({
            success: true,
            message: "Profile fetched successfully",
            user: req.user
        });

    } catch (error) {
        console.error("PROFILE ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch profile",
            error: error.message
        });
    }
});

module.exports = router;
