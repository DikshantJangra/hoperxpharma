const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { sanitizeFilename, validateFile } = require('../utils/fileValidator');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../../public/uploads/prescriptions');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Sanitize the original filename to prevent path traversal attacks
        const sanitized = sanitizeFilename(file.originalname);
        const ext = path.extname(sanitized);
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);

        // Create a safe filename with sanitized original name
        const safeFilename = 'prescription-' + uniqueSuffix + ext;
        cb(null, safeFilename);
    }
});

const fileFilter = (req, file, cb) => {
    // Accept images and PDFs (MIME type check)
    const allowedMimeTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
        'application/pdf'
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(`Invalid file type: ${file.mimetype}. Only images and PDF files are allowed!`), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

/**
 * Middleware to validate file content after upload
 * Checks magic numbers to ensure file type matches extension
 */
const validateUploadedFile = (req, res, next) => {
    if (!req.file) {
        return next();
    }

    try {
        const filePath = req.file.path;
        const buffer = fs.readFileSync(filePath);

        // Validate file content matches its extension
        const validation = validateFile(buffer, req.file.originalname, [req.file.mimetype]);

        if (!validation.valid) {
            // Delete the invalid file
            fs.unlinkSync(filePath);
            return res.status(400).json({
                success: false,
                message: validation.error || 'Invalid file content'
            });
        }

        next();
    } catch (error) {
        console.error('File validation error:', error);

        // Clean up file on error
        if (req.file && req.file.path && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        return res.status(500).json({
            success: false,
            message: 'Failed to validate uploaded file'
        });
    }
};

module.exports = upload;
module.exports.validateUploadedFile = validateUploadedFile;
