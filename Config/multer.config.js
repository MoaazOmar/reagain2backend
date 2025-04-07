const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure the 'images' folder exists
const imagesPath = path.join(__dirname, '../images');
if (!fs.existsSync(imagesPath)) {
    fs.mkdirSync(imagesPath);
    console.log('Created "images" folder at:', imagesPath);
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        console.log('Saving file to:', imagesPath); // Debugging log
        cb(null, imagesPath);
    },
    filename: function (req, file, cb) {
        const uniqueName = Date.now() + path.extname(file.originalname);
        console.log('Generated filename:', uniqueName); // Debugging log
        cb(null, uniqueName);
    }
});

const upload = multer({ storage });

module.exports = upload;