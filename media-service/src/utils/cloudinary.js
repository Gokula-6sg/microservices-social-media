const cloudinary = require('cloudinary').v2;
const logger = require('../utils/logger')
require('dotenv').config();


cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

console.log({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET ? '✔️ loaded' : '❌ missing'
});



const uploadMediaCloudinary = (file)=>{
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream({
            resource_type : 'auto',
        },
            (error, result) => {
            if (error) {
                logger.error('Error while uploading file', error)
            }
            else{
                resolve(result)
            }
            } )

        uploadStream.end(file.buffer);
    })
}


const deleteMedia = async (publicId)=>{
    try{
        const result = await cloudinary.uploader.destroy(publicId)
        logger.info('Successfully deleting media from cloud strorage', publicId)
        return result

    }catch(err){
        logger.error('Error deleting media', err)
        throw err;
    }

}

module.exports = {uploadMediaCloudinary, deleteMedia}


