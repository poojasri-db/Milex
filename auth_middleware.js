
const jwt = require("jsonwebtoken");
const db = require("./db");


// ==========================================
// JWT AUTHENTICATION MIDDLEWARE
// ==========================================

const authenticateToken = async (req, res, next) => {

    try {

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
        // GET ACCESS TOKEN FROM HEADER
        // ==========================================

        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                status: "FAILED",
                message: "Access token is required"
            });
        }

        const accessToken = authHeader.split(" ")[1];

        if (!accessToken) {
            return res.status(401).json({
                status: "FAILED",
                message: "Access token is required"
            });
        }

        // ==========================================
        // VERIFY JWT SIGNATURE
        // ==========================================

        let decoded;

        try {

            decoded = jwt.verify(
                accessToken,
                process.env.JWT_SECRET,
                {
                    algorithms: ["HS256"],
                    issuer: process.env.JWT_ISSUER,
                    audience: process.env.JWT_AUDIENCE
                }
            );

        } catch (error) {

            return res.status(401).json({
                status: "FAILED",
                message: "Access token is invalid or expired"
            });
        }

        // ==========================================
        // CHECK REQUIRED JWT PAYLOAD
        // ==========================================

        if (!decoded.sid || !decoded.sub) {
            return res.status(401).json({
                status: "FAILED",
                message: "Invalid access token payload"
            });
        }

        // ==========================================
        // VERIFY SESSION IN MYSQL
        // ==========================================

        const [sessions] = await db.query(
            `SELECT
                rs.session_id,
                rs.user_id,
                u.USER_NAME,
                u.USER_TYPE,
                u.USER_TYPE_ID
             FROM refresh_sessions rs
             INNER JOIN m_user u
                ON u.USER_ID = rs.user_id
             WHERE rs.session_id = ?
             AND rs.user_id = ?
             AND rs.revoked_at IS NULL
             AND rs.expires_at > NOW()
             AND UPPER(TRIM(IFNULL(u.ACTIVE_STATUS, ''))) = 'YES'
             LIMIT 1`,
            [
                decoded.sid,
                decoded.sub
            ]
        );

        const session = sessions[0];

        if (!session) {
            return res.status(401).json({
                status: "FAILED",
                message: "Session is invalid, expired or revoked"
            });
        }

        // ==========================================
        // ATTACH USER DETAILS TO REQUEST
        // ==========================================

        req.user = {
            USER_ID: session.user_id,
            USER_NAME: session.USER_NAME,
            USER_TYPE: session.USER_TYPE,
            USER_TYPE_ID: session.USER_TYPE_ID,
            SESSION_ID: session.session_id
        };

        // ==========================================
        // ALLOW REQUEST
        // ==========================================

        next();

    } catch (error) {

        console.error("AUTH MIDDLEWARE ERROR:", error);

        return res.status(500).json({
            status: "FAILED",
            message: "Internal server error"
        });
    }
};

module.exports = authenticateToken;
