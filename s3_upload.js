const express = require("express");
const multer = require("multer");
const crypto = require("crypto");

const {
    PutObjectCommand,
    GetObjectCommand
} = require("@aws-sdk/client-s3");

const { getSignedUrl } =
    require("@aws-sdk/s3-request-presigner");

const s3 = require("./s3");

const router = express.Router();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }
});

const BUCKET = process.env.AWS_S3_BUCKET;

// Upload image
router.post("/upload", upload.single("image"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                message: "Please select an image"
            });
        }

        const key = `images/${crypto.randomUUID()}`;

        await s3.send(new PutObjectCommand({
            Bucket: BUCKET,
            Key: key,
            Body: req.file.buffer,
            ContentType: req.file.mimetype
        }));

        res.json({
            message: "Image uploaded successfully",
            imageKey: key
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Image upload failed"
        });
    }
});

// Generate image retrieval URL
router.get("/image/:key", async (req, res) => {
    try {
        const command = new GetObjectCommand({
            Bucket: BUCKET,
            Key: `images/${req.params.key}`
        });

        const url = await getSignedUrl(s3, command, {
            expiresIn: 3600
        });

        res.json({ imageUrl: url });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Unable to retrieve image"
        });
    }
});

module.exports = router;