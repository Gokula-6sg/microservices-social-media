const logger = require("../utils/logger");
const Search = require("../models/Search");


async function hadlePostcreated(event ){
    try{

        const newSearchPost = new Search({
            postId : event.postId,
            userId : event.userId,
            content : event.content,
            createdAt : event.createdAt

        })


        await newSearchPost.save()
        logger.info(`search Post created ${event.postId}`)


    }catch(e){
        logger.error(e, 'Error hadling post creation  event');
    }
}

async function postdeleted(event ){
    try{
        await Search.findOneAndDelete({
            postId : event.postId,

        })

        logger.info( `search Post deleted ${event.postId}`)

    }catch(e){
        logger.error(e, 'Error hadling post deleted  event');
    }

}


module.exports = { hadlePostcreated, postdeleted};