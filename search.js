
const express = require("express");
const router = express.Router();

const db = require("./db");
const authenticateToken = require("./auth_middleware");

// ==========================================
// OPTIONAL AUTHENTICATION
// ==========================================

const optionalAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;

    // No token = GUEST
    if (!authHeader) {
        req.user = {
            USER_ID: null,
            USER_TYPE: "GUEST",
            SELLER_ID: null,
            CUSTOMER_ID: null,
            ADMIN_ID: null
        };

        return next();
    }

    // Token provided = verify normally
    // Invalid or expired token will return 401
    return authenticateToken(req, res, next);
};

// ==========================================
// GLOBAL SEARCH API
// ==========================================

router.get("/", optionalAuth, async (req, res) => {
    try {

        const { search } = req.query;

        // CHECK SEARCH KEYWORD
        if (!search || typeof search !== "string" || !search.trim()) {
            return res.status(400).json({
                status: "FAILED",
                message: "Search keyword is required"
            });
        }

        const keyword = search.trim();

        if (keyword.length > 255) {
            return res.status(400).json({
                status: "FAILED",
                message: "Search keyword cannot exceed 255 characters"
            });
        }

        // GET AUTHENTICATED USER DETAILS
        const {
            USER_TYPE,
            SELLER_ID,
            CUSTOMER_ID
        } = req.user;

        const userType = String(USER_TYPE || "")
            .trim()
            .toUpperCase();

        // VALIDATE USER TYPE
        if (!["ADMIN", "SELLER", "CUSTOMER", "GUEST"].includes(userType)) {
            return res.status(403).json({
                status: "FAILED",
                message: "Unauthorized user type"
            });
        }

        // SELLER VALIDATION
        if (userType === "SELLER" && !SELLER_ID) {
            return res.status(403).json({
                status: "FAILED",
                message: "Seller access not found"
            });
        }

        // CUSTOMER VALIDATION
        if (userType === "CUSTOMER" && !CUSTOMER_ID) {
            return res.status(403).json({
                status: "FAILED",
                message: "Customer access not found"
            });
        }

        // ==========================================
        // CALL GLOBAL SEARCH STORED PROCEDURE
        // ==========================================

        const [results] = await db.query(
            `CALL sp_global_search(?, ?, ?, ?)`,
            [
                keyword,
                userType,
                SELLER_ID || null,
                CUSTOMER_ID || null
            ]
        );

        // ==========================================
        // GROUP SEARCH RESULTS
        // ==========================================

        const moduleNames = [
            "PRODUCTS",
            "VARIANTS",
            "ORDERS",
            "SELLERS",
            "CUSTOMERS",
            "CATEGORIES",
            "BRANDS",
            "RETURNS",
            "REFUNDS",
            "SHIPMENTS"
        ];

        const groupedResults = {};

        moduleNames.forEach((module, index) => {
            groupedResults[module] = results[index] || [];
        });

        // ==========================================
        // GUEST RESPONSE RESTRICTION
        // ==========================================

        if (userType === "GUEST") {

            const publicModules = [
                "PRODUCTS",
                "VARIANTS",
                "CATEGORIES",
                "BRANDS"
            ];

            Object.keys(groupedResults).forEach(module => {
                if (!publicModules.includes(module)) {
                    groupedResults[module] = [];
                }
            });
        }

        // ==========================================
        // SUCCESS RESPONSE
        // ==========================================

        return res.status(200).json({
            status: "SUCCESS",
            message: "Global search completed successfully",
            search: keyword,
            userType,
            data: groupedResults
        });

    } catch (error) {

        console.error("GLOBAL SEARCH ERROR:", error);

        return res.status(500).json({
            status: "FAILED",
            message: "Global search failed"
        });
    }
});

module.exports = router;
