
const express = require("express");
const router = express.Router();
const db = require("./db");
const authenticateToken = require("./auth_middleware");

router.get("/", authenticateToken, async (req, res) => {
    try {
        const SHIPPING_ID = Number(req.query.SHIPPING_ID ?? -1);
        const SHIPPING_PROVIDER_ID = Number(req.query.SHIPPING_PROVIDER_ID ?? -1);
        const LIMIT = Number(req.query.LIMIT ?? 10);
        const OFFSET = Number(req.query.OFFSET ?? 0);

        const [result] = await db.query(
            "CALL sp_o_shipping_get(?, ?, ?, ?)",
            [SHIPPING_ID, SHIPPING_PROVIDER_ID, LIMIT, OFFSET]
        );

        if (result[0]?.[0]?.STATUS === "ERROR") {
            return res.status(400).json(result[0][0]);
        }

        return res.status(200).json({
            STATUS: "SUCCESS",
            DATA: result[0]
        });

    } catch (error) {
        console.error("SHIPPING GET ERROR:", error);

        return res.status(500).json({
            STATUS: "ERROR",
            ERROR_MESSAGE: error.message
        });
    }
});


router.post("/insert", authenticateToken, async (req, res) => {
    try {
        const CREATED_BY = req.user.USER_ID || req.user.sub;

        const {
            ORDER_ID,
            SHIPPING_PROVIDER_ID,
            SHIPPING_DATE,
            EXPECTED_DELIVERY_DATE,
            CURRENT_STATUS,
            CURRENT_LOCATION
        } = req.body;

        const [result] = await db.query(
            "CALL sp_o_shipping_insert(?, ?, ?, ?, ?, ?, ?)",
            [
                ORDER_ID,
                SHIPPING_PROVIDER_ID,
                SHIPPING_DATE,
                EXPECTED_DELIVERY_DATE,
                CURRENT_STATUS,
                CURRENT_LOCATION,
                CREATED_BY
            ]
        );

        const response = result[0][0];

        if (response.STATUS === "ERROR") {
            return res.status(400).json(response);
        }

        return res.status(200).json(response);

    } catch (error) {
        console.error("SHIPPING INSERT ERROR:", error);

        return res.status(500).json({
            STATUS: "ERROR",
            ERROR_MESSAGE: error.message
        });
    }
});


// UPDATE SHIPPING DETAILS
router.put("/update/:SHIPPING_ID", authenticateToken, async (req, res) => {
    try {
        const SHIPPING_ID = Number(req.params.SHIPPING_ID);

        const {
            SHIPPING_PROVIDER_ID,
            SHIPPING_DATE,
            EXPECTED_DELIVERY_DATE,
            SHIPPING_STATUS,
            CURRENT_STATUS,
            CURRENT_LOCATION
        } = req.body;

        const UPDATED_BY = req.user.USER_ID || req.user.sub;

        if (!Number.isInteger(SHIPPING_ID) || SHIPPING_ID <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid SHIPPING_ID"
            });
        }

        if (
            SHIPPING_PROVIDER_ID === undefined ||
            SHIPPING_STATUS === undefined
        ) {
            return res.status(400).json({
                success: false,
                message: "SHIPPING_PROVIDER_ID and SHIPPING_STATUS are required"
            });
        }

        const providerId = Number(SHIPPING_PROVIDER_ID);
        const shippingStatus = Number(SHIPPING_STATUS);

        if (
            !Number.isInteger(providerId) || providerId <= 0 ||
            !Number.isInteger(shippingStatus) || shippingStatus <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid SHIPPING_PROVIDER_ID or SHIPPING_STATUS"
            });
        }

        const [result] = await db.query(
            "CALL sp_o_shipping_update(?, ?, ?, ?, ?, ?, ?, ?)",
            [
                SHIPPING_ID,
                providerId,
                SHIPPING_DATE || null,
                EXPECTED_DELIVERY_DATE || null,
                shippingStatus,
                CURRENT_STATUS || null,
                CURRENT_LOCATION || null,
                UPDATED_BY
            ]
        );

        const response = result[0]?.[0];

        if (!response || response.STATUS === "ERROR") {
            return res.status(400).json({
                success: false,
                message: response?.MESSAGE || "Failed to update shipping details"
            });
        }

        return res.status(200).json({
            success: true,
            message: response.MESSAGE
        });

    } catch (error) {
        console.error("UPDATE SHIPPING ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update shipping details",
            error: error.message
        });
    }
});

module.exports = router;
