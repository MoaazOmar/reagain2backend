const multer = require('multer');
const path  = require('path');

const storage = multer.diskStorage({
    destination: function(req , file , cb) {
        cb(null , path.join(__dirname , '../images'))
    },
    filename:   function(req , file , cb) {
        cb(null , Date.now() + '_' + path.extname(file.originalname))
    }
})
const upload = multer({storage})

module.exports = upload