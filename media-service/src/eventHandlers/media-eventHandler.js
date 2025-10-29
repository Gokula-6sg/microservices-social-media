const logger = require("../utils/logger");
const Media = require("../models/Media");
const {deleteMedia} = require("../utils/cloudinary");

const hadlePostDelted = async (event) => {

    console.log(event, "event evnet")
    const {postId,  mediaIds} = event;
    try{
        const mediaTodel = await Media.find({_id: {$in: mediaIds}});


        for(const media of mediaTodel){
            await deleteMedia(media.publicId)
            await Media.findByIdAndDelete(media._id)

            logger.info(`deleted media ${Media._id} associated with the deleted post ${postId}`)
        }
        logger.info(`Processed deletion of media for the post id ${postId} `)

    }catch(e){
        logger.error(e,'Error occured media deletion')
    }

}



module.exports = hadlePostDelted