const express = require("express");
const router = express.Router();
const db = require("./db");

// ==========================================
// ORDER MANAGEMENT INSERT
// POST /api/order-management/insert
// ==========================================

router.post("/insert", async (req, res) => {
    try {
        const {
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
            CREATED_BY
        } = req.body || {};

        const [result] = await db.query(
            "CALL sp_m_order_management_insert(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [
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
                CREATED_BY
            ]
        );

        res.status(200).json({
            status: "SUCCESS",
            message: "Order inserted successfully",
            data: result[0]
        });

    } catch (error) {
        res.status(400).json({
            status: "FAILED",
            message: error.sqlMessage || error.message
        });
    }
});

// ==========================================
// ORDER MANAGEMENT UPDATE
// PUT /api/order-management/update
// ==========================================

router.put("/update", async (req, res) => {
    try {
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
            DELIVERY_ADDRESS_ID,
            UPDATED_BY
        } = req.body || {};

        const [result] = await db.query(
            "CALL sp_m_order_management_update(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
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
                UPDATED_BY
            ]
        );

        res.status(200).json({
            status: "SUCCESS",
            message: "Order updated successfully",
            data: result[0]
        });

    } catch (error) {
        res.status(400).json({
            status: "FAILED",
            message: error.sqlMessage || error.message
        });
    }
});

// ==========================================
// ORDER MANAGEMENT GET
// GET /api/order-management/get?ORDER_ID=-1
// ==========================================

router.get("/get", async (req, res) => {
    try {
        const ORDER_ID =
            req.query.ORDER_ID !== undefined
                ? req.query.ORDER_ID
                : -1;

        const [result] = await db.query(
            "CALL sp_m_order_management_get(?)",
            [ORDER_ID]
        );

        res.status(200).json({
            status: "SUCCESS",
            data: result[0]
        });

    } catch (error) {
        res.status(400).json({
            status: "FAILED",
            message: error.sqlMessage || error.message
        });
    }
});

// ==========================================
// ORDER MANAGEMENT DELETE
// DELETE /api/order-management/delete
// ==========================================

router.delete("/delete", async (req, res) => {
    try {
        const { ORDER_ID } = req.body || {};

        const [result] = await db.query(
            "CALL sp_m_order_management_delete(?)",
            [ORDER_ID]
        );

        res.status(200).json({
            status: "SUCCESS",
            message: "Order deleted successfully",
            data: result[0]
        });

    } catch (error) {
        res.status(400).json({
            status: "FAILED",
            message: error.sqlMessage || error.message
        });
    }
});

module.exports = router;