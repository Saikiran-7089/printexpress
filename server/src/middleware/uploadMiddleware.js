const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure local uploads directory exists
const UPLOADS_DIR = path.join(__dirname, '../../uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Setup storage engine
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    // Generate unique name keeping extension intact
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const extension = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + extension);
  }
});

// Setup file filters
const fileFilter = (req, file, cb) => {
  const allowedExtensions = ['.pdf', '.docx', '.png', '.jpg', '.jpeg', '.gif'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type: ${ext}. Supported files: PDF, DOCX, and Images.`), false);
  }
};

// Standard Multer instance (Max size per file: 15MB)
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 15 * 1024 * 1024 }
});

/**
 * Simulates mapping a local uploaded disk file to a secure Amazon S3 Bucket URL.
 * @param {Object} file - Express Multer file object
 */
function getMockS3Url(file) {
  const cleanName = encodeURIComponent(file.filename);
  // Returns a premium S3 link mockup
  return `https://s3.ap-south-1.amazonaws.com/printexpress-bucket/documents/${cleanName}`;
}

module.exports = {
  upload,
  getMockS3Url,
  UPLOADS_DIR
};
