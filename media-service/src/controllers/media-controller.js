
const logger = require('../utils/logger')
const {uploadMediaCloudinary} = require('../utils/cloudinary')
const Media = require('../models/Media')



const uploadMedia = async (req, res) => {
    logger.info('Starting the media upload');
    try{
        console.log(req.file)
        if(!req.file){
            logger.error('No file found, please add the file')
            return res.status(400).json({
                success: false,
                message: 'No file found please add the file',
            })
        }

        const {originalname, mimetype, buffer} = req.file
        const userId = req.user.userId

        logger.info(`File details : name=${originalname}, type=${mimetype}`);
        logger.info('uploading to cloudinary starting.....');

        const cloudinaryUpload = await uploadMediaCloudinary(req.file);
        logger.info(`Cloudinary upload successfully, Public Id : ${cloudinaryUpload.publicId}`);

        const newlycreatedMedia  = new Media({
            publicId: cloudinaryUpload.public_id,
            originalName : originalname,
            mimeType : mimetype,
            url : cloudinaryUpload.url,
            userId
        })

        await newlycreatedMedia.save();

        res.status(201).json({
            success: true,
            mediaId : newlycreatedMedia.id,
            url : newlycreatedMedia.url,
            message: 'Media upload is successfully completed'
        });

    }catch(err){
        logger.error("Error uploading media", err);
        res.status(500).json({
            success: false,
            message: 'Error uploading media',
        })

    }

}


const getAllmedia = async (req, res)=>{
    try {
        const result = await Media.find({})
        res.json({result})
    }catch(err){
        logger.error("Error getting media", err);
        res.status(500).json({
            success: false,
            message: 'Error getting media',
        })
    }
}

module.exports = { uploadMedia, getAllmedia }