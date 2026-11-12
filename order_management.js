
const express = require("express");
const router = express.Router();
const db = require("./db");
const authenticateToken = require("./auth_middleware");

// ==========================================
// INSERT ORDER
// CUSTOMER ONLY
// ==========================================

router.post("/insert", authenticateToken, async (req, res) => {
    try {
        const USER_ID = req.user.USER_ID;
        const USER_TYPE = String(req.user.USER_TYPE).toUpperCase();

        if (USER_TYPE !== "CUSTOMER") {
            return res.status(403).json({
                status: "FAILED",
                message: "Only customers can place orders"
            });
        }

        const {
            ORDER_DATE,
            PRODUCT_ID,
            QUANTITY,
            ORDER_AMOUNT,
            PAYMENT_STATUS,
            ORDER_STATUS,
            SHIPPING_STATUS,
            DELIVERY_ADDRESS_ID
        } = req.body || {};

        if (!PRODUCT_ID || !QUANTITY || !ORDER_AMOUNT) {
            return res.status(400).json({
                status: "FAILED",
                message: "Product, quantity and order amount are required"
            });
        }

        // GET CUSTOMER USING LOGGED-IN USER ID

        const [customers] = await db.query(
            `SELECT CUSTOMER_ID, FIRST_NAME, LAST_NAME, MOBILE_NUMBER
             FROM m_customer_registration
             WHERE USER_ID = ?
             LIMIT 1`,
            [USER_ID]
        );

        const customer = customers[0];

        if (!customer) {
            return res.status(404).json({
                status: "FAILED",
                message: "Customer profile not found"
            });
        }

        // VERIFY PRODUCT

        const [products] = await db.query(
            `SELECT PRODUCT_ID
             FROM m_products
             WHERE PRODUCT_ID = ?
             AND IS_ACTIVE = 'ACTIVE'
             LIMIT 1`,
            [PRODUCT_ID]
        );

        if (!products.length) {
            return res.status(404).json({
                status: "FAILED",
                message: "Product not found or inactive"
            });
        }

        const CUSTOMER_NAME =
            `${customer.FIRST_NAME || ""} ${customer.LAST_NAME || ""}`.trim();

        const [result] = await db.query(
            `CALL sp_m_order_management_insert(?,?,?,?,?,?,?,?,?,?,?,?)`,
            [
                ORDER_DATE,
                customer.CUSTOMER_ID,
                CUSTOMER_NAME,
                customer.MOBILE_NUMBER,
                PRODUCT_ID,
                QUANTITY,
                ORDER_AMOUNT,
                PAYMENT_STATUS,
                ORDER_STATUS,
                SHIPPING_STATUS,
                DELIVERY_ADDRESS_ID,
                USER_ID
            ]
        );

        return res.status(200).json({
            status: "SUCCESS",
            message: "Order inserted successfully",
            data: result[0]
        });

    } catch (error) {
        console.error("ORDER INSERT ERROR:", error);

        return res.status(400).json({
            status: "FAILED",
            message: error.sqlMessage || error.message
        });
    }
});


// ==========================================
// UPDATE ORDER
// ADMIN ONLY
// ==========================================

router.put("/update", authenticateToken, async (req, res) => {
    try {
        const USER_ID = req.user.USER_ID;
        const USER_TYPE = String(req.user.USER_TYPE).toUpperCase();

        if (USER_TYPE !== "ADMIN") {
            return res.status(403).json({
                status: "FAILED",
                message: "Only admin can update orders"
            });
        }

        const {
            ORDER_ID,
            ORDER_DATE,
            CUSTOMER_ID,
            CUSTOMER_NAME,
            CUSTOMER_MOBILE,
            PRODUCT_ID,
            QUANTITY,
            ORDER_AMOUNT,
            PAYMENT_STATUS,
            ORDER_STATUS,
            SHIPPING_STATUS,
            DELIVERY_ADDRESS_ID
        } = req.body || {};

        if (!ORDER_ID) {
            return res.status(400).json({
                status: "FAILED",
                message: "ORDER_ID is required"
            });
        }

        const [result] = await db.query(
            `CALL sp_m_order_management_update(?,?,?,?,?,?,?,?,?,?,?,?,?)`,
            [
                ORDER_ID,
                ORDER_DATE,
                CUSTOMER_ID,
                CUSTOMER_NAME,
                CUSTOMER_MOBILE,
                PRODUCT_ID,
                QUANTITY,
                ORDER_AMOUNT,
                PAYMENT_STATUS,
                ORDER_STATUS,
                SHIPPING_STATUS,
                DELIVERY_ADDRESS_ID,
                USER_ID
            ]
        );

        return res.status(200).json({
            status: "SUCCESS",
            message: "Order updated successfully",
            data: result[0]
        });

    } catch (error) {
        console.error("ORDER UPDATE ERROR:", error);

        return res.status(400).json({
            status: "FAILED",
            message: error.sqlMessage || error.message
        });
    }
});


// ==========================================
// GET ORDERS
// CUSTOMER: OWN ORDERS
// SELLER: OWN PRODUCT ORDERS
// ADMIN: ALL ORDERS
// ==========================================

router.get("/get", authenticateToken, async (req, res) => {
    try {
        const USER_ID = req.user.USER_ID;
        const USER_TYPE = String(req.user.USER_TYPE).toUpperCase();

        const {
            ORDER_ID = "-1",
            DAYS = 30,
            ORDER_STATUS = "-1",
            PAYMENT_STATUS = "-1",
            SHIPPING_STATUS = "-1",
            LIMIT = 10,
            OFFSET = 0
        } = req.query;

        const days = Number(DAYS);
        const limit = Number(LIMIT);
        const offset = Number(OFFSET);

        if (![7, 30, 60, 90, 180].includes(days)) {
            return res.status(400).json({
                status: "FAILED",
                message: "Invalid DAYS"
            });
        }

        if (!Number.isInteger(limit) || limit <= 0 ||
            !Number.isInteger(offset) || offset < 0) {
            return res.status(400).json({
                status: "FAILED",
                message: "Invalid LIMIT or OFFSET"
            });
        }

        let where = `
            WHERE o.ORDER_DATE >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
            AND o.ORDER_DATE < DATE_ADD(CURDATE(), INTERVAL 1 DAY)
        `;

        const params = [days];

        if (ORDER_ID !== "-1") {
            where += " AND o.ORDER_ID = ?";
            params.push(ORDER_ID);
        }

        if (ORDER_STATUS !== "-1") {
            where += " AND o.ORDER_STATUS = ?";
            params.push(ORDER_STATUS);
        }

        if (PAYMENT_STATUS !== "-1") {
            where += " AND o.PAYMENT_STATUS = ?";
            params.push(PAYMENT_STATUS);
        }

        if (SHIPPING_STATUS !== "-1") {
            where += " AND o.SHIPPING_STATUS = ?";
            params.push(SHIPPING_STATUS);
        }

        // ROLE-BASED DATA FILTERING

        if (USER_TYPE === "CUSTOMER") {

            const [customers] = await db.query(
                `SELECT CUSTOMER_ID
                 FROM m_customer_registration
                 WHERE USER_ID = ?
                 LIMIT 1`,
                [USER_ID]
            );

            if (!customers.length) {
                return res.status(404).json({
                    status: "FAILED",
                    message: "Customer profile not found"
                });
            }

            where += " AND o.CUSTOMER_ID = ?";
            params.push(customers[0].CUSTOMER_ID);

        } else if (USER_TYPE === "SELLER") {

            const [sellers] = await db.query(
                `SELECT SELLER_ID
                 FROM m_seller_onboarding
                 WHERE USER_ID = ?
                 LIMIT 1`,
                [USER_ID]
            );

            if (!sellers.length) {
                return res.status(404).json({
                    status: "FAILED",
                    message: "Seller profile not found"
                });
            }

            where += `
                AND EXISTS (
                    SELECT 1
                    FROM m_products p
                    WHERE p.PRODUCT_ID = o.PRODUCT_ID
                    AND p.SELLER_ID = ?
                )
            `;

            params.push(sellers[0].SELLER_ID);

        } else if (USER_TYPE !== "ADMIN") {

            return res.status(403).json({
                status: "FAILED",
                message: "You are not authorized to view orders"
            });
        }

        // FETCH ORDERS

        const [orders] = await db.query(
            `SELECT o.*
             FROM m_order_management o
             ${where}
             ORDER BY o.ORDER_ID DESC
             LIMIT ? OFFSET ?`,
            [...params, limit, offset]
        );

        // TOTAL RECORDS

        const [countResult] = await db.query(
            `SELECT COUNT(*) AS TOTAL_RECORDS
             FROM m_order_management o
             ${where}`,
            params
        );

        return res.status(200).json({
            status: "SUCCESS",
            message: "Orders fetched successfully",
            data: orders,
            pagination: {
                TOTAL_RECORDS: countResult[0].TOTAL_RECORDS,
                LIMIT: limit,
                OFFSET: offset
            }
        });

    } catch (error) {
        console.error("ORDER GET ERROR:", error);

        return res.status(500).json({
            status: "FAILED",
            message: error.sqlMessage || error.message
        });
    }
});


// ==========================================
// DELETE ORDER
// ADMIN ONLY
// ==========================================

router.delete("/delete", authenticateToken, async (req, res) => {
    try {
        const USER_TYPE = String(req.user.USER_TYPE).toUpperCase();

        if (USER_TYPE !== "ADMIN") {
            return res.status(403).json({
                status: "FAILED",
                message: "Only admin can delete orders"
            });
        }

        const { ORDER_ID } = req.body || {};

        if (!ORDER_ID) {
            return res.status(400).json({
                status: "FAILED",
                message: "ORDER_ID is required"
            });
        }

        const [result] = await db.query(
            "CALL sp_m_order_management_delete(?)",
            [ORDER_ID]
        );

        return res.status(200).json({
            status: "SUCCESS",
            message: "Order deleted successfully",
            data: result[0]
        });

    } catch (error) {
        console.error("ORDER DELETE ERROR:", error);

        return res.status(400).json({
            status: "FAILED",
            message: error.sqlMessage || error.message
        });
    }
});

module.exports = router;
