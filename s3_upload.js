const express = require("express");
const multer = require("multer");
const crypto = require("crypto");

const {
    PutObjectCommand,
    GetObjectCommand,
    DeleteObjectCommand,
    ListObjectsV2Command
} = require("@aws-sdk/client-s3");

const {
    getSignedUrl
} = require("@aws-sdk/s3-request-presigner");

const s3 = require("./s3");

const router = express.Router();

const BUCKET = process.env.AWS_S3_BUCKET || "test-s3-shiftfls";

// Image upload configuration
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp"
        ];

        if (!allowedTypes.includes(file.mimetype)) {
            return cb(new Error("Only JPG, PNG and WEBP images are allowed"));
        }

        cb(null, true);
    }
});

// ============================================
// 1. UPLOAD IMAGE
// POST /api/s3/upload
// ============================================

router.post("/upload", upload.single("image"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Please select an image"
            });
        }

        const path = require("path");

        // Get original filename and extension
        const originalName = path.basename(req.file.originalname);
        const originalExtension = path.extname(originalName);

        // Get custom filename if provided
        let fileName = req.body.fileName
            ? path.basename(req.body.fileName.trim())
            : originalName;

        // Add original extension if custom filename has no extension
        if (!path.extname(fileName)) {
            fileName += originalExtension;
        }

        // Validate filename
        if (!fileName || fileName === originalExtension) {
            return res.status(400).json({
                success: false,
                message: "Invalid filename"
            });
        }

        const imageKey = `images/${fileName}`;

        await s3.send(new PutObjectCommand({
            Bucket: BUCKET,
            Key: imageKey,
            Body: req.file.buffer,
            ContentType: req.file.mimetype
        }));

        console.log("Image uploaded:", imageKey);

        return res.status(201).json({
            success: true,
            message: "Image uploaded successfully",
            bucket: BUCKET,
            originalFileName: originalName,
            uploadedFileName: fileName,
            imageKey: imageKey
        });

    } catch (error) {
        console.error("S3 Upload Error:", error);

        return res.status(500).json({
            success: false,
            message: "Image upload failed",
            error: error.name
        });
    }
});

// ============================================
// 2. GET IMAGE URL
// GET /api/s3/image/:key
// ============================================

router.get("/image/:key", async (req, res) => {
    try {
        const key = `images/${req.params.key}`;

        const command = new GetObjectCommand({
            Bucket: BUCKET,
            Key: key
        });

        const imageUrl = await getSignedUrl(s3, command, {
            expiresIn: 3600
        });

        return res.json({
            success: true,
            imageKey: key,
            imageUrl: imageUrl,
            expiresIn: 3600
        });

    } catch (error) {
        console.error("S3 Get Image Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to generate image URL",
            error: error.name
        });
    }
});

// ============================================
// 3. LIST IMAGES
// GET /api/s3/images
// ============================================

router.get("/images", async (req, res) => {
    try {
        const result = await s3.send(new ListObjectsV2Command({
            Bucket: BUCKET,
            Prefix: "images/",
            MaxKeys: 100
        }));

        const images = (result.Contents || []).map(item => ({
            imageKey: item.Key,
            size: item.Size,
            lastModified: item.LastModified
        }));

        return res.json({
            success: true,
            count: images.length,
            images: images,
            nextContinuationToken: result.NextContinuationToken || null
        });

    } catch (error) {
        console.error("S3 List Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to list images",
            error: error.name
        });
    }
});

// ============================================
// 4. DELETE IMAGE
// DELETE /api/s3/image/:key
// ============================================

router.delete("/image/:key", async (req, res) => {
    try {
        const key = `images/${req.params.key}`;

        await s3.send(new DeleteObjectCommand({
            Bucket: BUCKET,
            Key: key
        }));

        return res.json({
            success: true,
            message: "Image delete request completed",
            imageKey: key
        });

    } catch (error) {
        console.error("S3 Delete Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to delete image",
            error: error.name
        });
    }
});

// ============================================
// UPLOAD ERROR HANDLER
// ============================================

router.use((error, req, res, next) => {
    console.error("Upload Validation Error:", error);

    return res.status(400).json({
        success: false,
        message: error.message
    });
});

module.exports = router;
