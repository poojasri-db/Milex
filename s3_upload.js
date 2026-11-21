
const express = require("express");
const multer = require("multer");
const path = require("path");

const {
    PutObjectCommand,
    GetObjectCommand,
    DeleteObjectCommand,
    ListObjectsV2Command,
    HeadObjectCommand
} = require("@aws-sdk/client-s3");

const {
    getSignedUrl
} = require("@aws-sdk/s3-request-presigner");

const s3 = require("./s3");

const router = express.Router();

const BUCKET = process.env.AWS_S3_BUCKET || "test-s3-shiftfls";

// ============================================
// IMAGE UPLOAD CONFIGURATION
// ============================================

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
// COMMON VALIDATION
// ============================================

function validateFolderName(folderName) {
    return (
        typeof folderName === "string" &&
        folderName.length <= 100 &&
        /^[a-zA-Z0-9_-]+$/.test(folderName)
    );
}

function validateFileName(fileName) {
    return (
        typeof fileName === "string" &&
        fileName.length <= 255 &&
        fileName !== "." &&
        fileName !== ".." &&
        /^[a-zA-Z0-9._-]+$/.test(fileName) &&
        /\.(jpg|jpeg|png|webp)$/i.test(fileName)
    );
}

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

        // Folder name (default: images)
        const folderName = (req.body.folderName || "images").trim();

        if (!validateFolderName(folderName)) {
            return res.status(400).json({
                success: false,
                message: "Invalid folder name. Use letters, numbers, underscore or hyphen."
            });
        }

        // Original filename or custom filename
        let fileName = req.body.fileName && req.body.fileName.trim() !== ""
            ? req.body.fileName.trim()
            : path.basename(req.file.originalname);

        // Prevent directory traversal
        fileName = path.basename(fileName);

        // Preserve original extension if custom extension is missing
        if (!path.extname(fileName)) {
            fileName += path.extname(req.file.originalname);
        }

        if (!validateFileName(fileName)) {
            return res.status(400).json({
                success: false,
                message: "Invalid filename. Only JPG, JPEG, PNG and WEBP files are allowed."
            });
        }

        // Check filename extension matches actual image MIME type
        const allowedExtensions = {
            "image/jpeg": [".jpg", ".jpeg"],
            "image/png": [".png"],
            "image/webp": [".webp"]
        };

        const extension = path.extname(fileName).toLowerCase();

        if (!allowedExtensions[req.file.mimetype].includes(extension)) {
            return res.status(400).json({
                success: false,
                message: "Filename extension does not match uploaded image type."
            });
        }

        const imageKey = `${folderName}/${fileName}`;

        // Check if file already exists
        let fileExists = false;

        try {
            await s3.send(new HeadObjectCommand({
                Bucket: BUCKET,
                Key: imageKey
            }));

            fileExists = true;

        } catch (error) {
            if (error.name !== "NotFound" &&
                error.$metadata?.httpStatusCode !== 404) {
                throw error;
            }
        }

        if (fileExists) {
            return res.status(409).json({
                success: false,
                message: "File already exists. Please use another filename.",
                imageKey: imageKey
            });
        }

        await s3.send(new PutObjectCommand({
            Bucket: BUCKET,
            Key: imageKey,
            Body: req.file.buffer,
            ContentType: req.file.mimetype
        }));

        return res.status(201).json({
            success: true,
            message: "Image uploaded successfully",
            bucket: BUCKET,
            folderName: folderName,
            originalFileName: req.file.originalname,
            fileName: fileName,
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
// GET /api/s3/image/:folderName/:fileName
// ============================================

router.get("/image/:folderName/:fileName", async (req, res) => {
    try {
        const { folderName, fileName } = req.params;

        if (!validateFolderName(folderName) ||
            !validateFileName(fileName)) {
            return res.status(400).json({
                success: false,
                message: "Invalid folder name or filename"
            });
        }

        const key = `${folderName}/${fileName}`;

        const command = new GetObjectCommand({
            Bucket: BUCKET,
            Key: key
        });

        const imageUrl = await getSignedUrl(s3, command, {
            expiresIn: 3600
        });

        return res.json({
            success: true,
            folderName: folderName,
            fileName: fileName,
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
// GET /api/s3/images?folderName=products
// ============================================

router.get("/images", async (req, res) => {
    try {
        const folderName = (req.query.folderName || "images").trim();

        if (!validateFolderName(folderName)) {
            return res.status(400).json({
                success: false,
                message: "Invalid folder name"
            });
        }

        const limit = Math.min(
            Math.max(parseInt(req.query.limit) || 100, 1),
            1000
        );

        const continuationToken = req.query.continuationToken || undefined;

        const result = await s3.send(new ListObjectsV2Command({
            Bucket: BUCKET,
            Prefix: `${folderName}/`,
            MaxKeys: limit,
            ContinuationToken: continuationToken
        }));

        const images = (result.Contents || []).map(item => ({
            imageKey: item.Key,
            fileName: item.Key.split("/").pop(),
            size: item.Size,
            lastModified: item.LastModified
        }));

        return res.json({
            success: true,
            folderName: folderName,
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
// DELETE /api/s3/image/:folderName/:fileName
// ============================================

router.delete("/image/:folderName/:fileName", async (req, res) => {
    try {
        const { folderName, fileName } = req.params;

        if (!validateFolderName(folderName) ||
            !validateFileName(fileName)) {
            return res.status(400).json({
                success: false,
                message: "Invalid folder name or filename"
            });
        }

        const key = `${folderName}/${fileName}`;

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
    console.error("S3 Validation Error:", error);

    return res.status(400).json({
        success: false,
        message: error.message || "Invalid upload request"
    });
});

module.exports = router;
