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
  limits: { fileSize: 20 * 1024 * 1024 }
});

/**
 * Maps a local uploaded disk file to its accessible server URL.
 * @param {Object} file - Express Multer file object
 * @param {Object} [req] - Express request object
 */
function getFileUrl(file, req) {
  const cleanName = encodeURIComponent(file.filename);
  
  if (process.env.BACKEND_URL) {
    return `${process.env.BACKEND_URL}/uploads/${cleanName}`;
  }
  if (process.env.RENDER_EXTERNAL_URL) {
    return `${process.env.RENDER_EXTERNAL_URL}/uploads/${cleanName}`;
  }
  
  if (req) {
    const protocol = req.protocol;
    const host = req.get('host');
    return `${protocol}://${host}/uploads/${cleanName}`;
  }
  
  return `http://localhost:5000/uploads/${cleanName}`;
}

const MAX_DIR_SIZE = 400 * 1024 * 1024; // 400 MB soft limit

function ensureFreeSpace(req, res, next) {
  if (!fs.existsSync(UPLOADS_DIR)) {
    return next();
  }
  
  fs.readdir(UPLOADS_DIR, (err, files) => {
    if (err) return next();
    
    let totalSize = 0;
    const fileStats = [];
    
    files.forEach(file => {
      const filePath = path.join(UPLOADS_DIR, file);
      try {
        const stats = fs.statSync(filePath);
        totalSize += stats.size;
        fileStats.push({ filePath, ctimeMs: stats.ctimeMs, size: stats.size });
      } catch (e) {
        // ignore
      }
    });
    
    if (totalSize > MAX_DIR_SIZE) {
      console.log(`Uploads directory size (${(totalSize / 1024 / 1024).toFixed(2)} MB) exceeds 400 MB limit. Evicting old files to make room...`);
      // Sort oldest first
      fileStats.sort((a, b) => a.ctimeMs - b.ctimeMs);
      
      let freedSpace = 0;
      const targetFreedSpace = totalSize - (MAX_DIR_SIZE * 0.8); // free up space so we are at 80% capacity
      
      for (const fileStat of fileStats) {
        if (freedSpace >= targetFreedSpace) break;
        try {
          fs.unlinkSync(fileStat.filePath);
          freedSpace += fileStat.size;
          console.log(`Evicted old file to free space: ${path.basename(fileStat.filePath)}`);
        } catch (e) {
          console.error(`Failed to evict file: ${fileStat.filePath}`);
        }
      }
    }
    
    next();
  });
}

// Automated Cleanup: Delete files older than 12 hours
function cleanupOldFiles() {
  if (!fs.existsSync(UPLOADS_DIR)) return;
  
  const now = Date.now();
  const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;
  
  fs.readdir(UPLOADS_DIR, (err, files) => {
    if (err) {
      console.error('Error reading uploads directory for cleanup:', err);
      return;
    }
    
    files.forEach(file => {
      const filePath = path.join(UPLOADS_DIR, file);
      fs.stat(filePath, (err, stats) => {
        if (err) return;
        
        // If file creation time is older than 12 hours, delete it
        if (now - stats.ctimeMs > TWELVE_HOURS_MS) {
          fs.unlink(filePath, err => {
            if (err) console.error(`Failed to delete old file: ${filePath}`, err);
            else console.log(`Automatically deleted old upload: ${file}`);
          });
        }
      });
    });
  });
}

// Run cleanup immediately on startup, and then every 1 hour
cleanupOldFiles();
setInterval(cleanupOldFiles, 60 * 60 * 1000);

module.exports = {
  upload,
  getFileUrl,
  UPLOADS_DIR,
  ensureFreeSpace
};
