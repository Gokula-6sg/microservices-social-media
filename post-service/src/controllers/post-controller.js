const logger = require('../utils/logger')
const Post = require("../models/Post");
const {validateCreatepost} = require("../utils/validation");


//Creating New Post.....
//==================================


const createPost = async (req, res) => {
    logger.info("Creating post endpoint hitt...");
    try{
        //validate the schema ----- :

        const {error} = validateCreatepost(req.body);
        if(error){
            logger.warn('validation error', error.details[0].message);
            return res.status(400).json({
                success: false,
                message: error.details[0].message,
            })
        }

        const {content, mediaIds} = req.body;
        const newPost =  new Post({
            user : req.user.userId,
            content,
            mediaIds : mediaIds || [],
        })

        await newPost.save()
        logger.info('Post successfully created')
        res.status(201).json({
            success: true,
            message: 'Post successfully created',
        })


    }catch(err){
        logger.error("Error creating post post", err);
        res.status(500).json({
            success: false,
            message: 'Error creating post',
        })
    }
}


//GetAllPosts.....
//==============================


const getAllPost = async (req, res) => {
    try{
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const startIndex = (page - 1) * limit;

        const cacheKey = `posts:${page}:${limit}`;
        const cachedPosts = await req.redisClient.get(cacheKey);

        if(cachedPosts){
            return res.json(JSON.parse(cachedPosts));
        }

        const posts = await Post.find({})
            .sort({createdAt : -1})
            .skip(startIndex)
            .limit(limit);

        const totalNoOfPosts = await Post.countDocuments()

        const result = {
            posts,
            currentpage : page,
            totalPages : Math.ceil(totalNoOfPosts / limit),
            totalPosts : totalNoOfPosts,
        }


        // Save your posts in redis cache




    }catch(err){
        logger.error("Error fetching post post", err);
        res.status(500).json({
            success: false,
            message: 'Error fetching post',
        })
    }
}

const getPost = async (req, res) => {
    try{

    }catch(err){
        logger.error("Error creating post post", err);
        res.status(500).json({
            success: false,
            message: 'Error creating post by id',
        })
    }
}

const deletePost = async (req, res) => {
    try{

    }catch(err){
        logger.error("Error deleting post post", err);
        res.status(500).json({
            success: false,
            message: 'Error deleting post',
        })
    }
}


module.exports = {createPost}