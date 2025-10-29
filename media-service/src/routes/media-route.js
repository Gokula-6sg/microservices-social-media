const express = require ('express');
const multer = require('multer');

const {uploadMedia, getAllmedia} = require('../controllers/media-controller')
const {authenticateRequest} = require('../middleware/authMiddle');
const logger = require('../utils/logger')

const router = express.Router();

//configure multer for file upload

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024,

    }
}).single('file');


router.post('/upload', authenticateRequest, (req, res, next) => {
    upload(req, res, function(err){
        if(err instanceof multer.MulterError){
            logger.error('multer error while uploading media',err);
            return res.status(400).json({
                message: "Multer error while uploading media",
                error: err.message,
                stack: err.stack,
            })
        }else if(err){

                return res.status(400).json({
                    message: "Unknown error while uploading media",
                    error: err.message,
                    stack: err.stack,
                })


        }
        if(!req.file){
            return res.status(400).json({
                message: "File not found",

            })
        }

        next();

    } )

}, uploadMedia);

router.get('/get', authenticateRequest, getAllmedia)


module.exports = router;




