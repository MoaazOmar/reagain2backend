const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        const dest = path.join(__dirname, '../images');
        console.log('Multer destination:', dest);
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, { recursive: true });
            console.log('Created directory:', dest);
        }
        cb(null, dest);
    },
    filename: function(req, file, cb) {
        const filename = Date.now() + '_' + path.extname(file.originalname);
        const fullPath = path.join(__dirname, '../images', filename);
        console.log('Saving file as:', fullPath);
        cb(null, filename);
        // Verify file exists after save (async, so delayed)
        setTimeout(() => {
            fs.access(fullPath, fs.constants.F_OK, (err) => {
                if (err) console.error('File not found after save:', err);
                else console.log('File confirmed saved:', fullPath);
            });
        }, 1000);
    }
});

const upload = multer({ storage });
module.exports = upload;