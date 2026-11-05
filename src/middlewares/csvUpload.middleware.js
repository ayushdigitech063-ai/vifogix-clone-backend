const multer = require('multer');
const path = require('path');
const fs = require('fs');

const tempDir = path.join(process.cwd(), 'public', 'temp');
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, tempDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, `bulk-${uniqueSuffix}.csv`);
    }
});

const csvFileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.csv' || file.mimetype === 'text/csv' || file.mimetype === 'application/vnd.ms-excel') {
        cb(null, true);
    } else {
        cb(new Error('Sirf .csv file upload karna allowed hai!'), false);
    }
};

const uploadCsv = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB CSV support
    fileFilter: csvFileFilter
});

module.exports = { uploadCsv };