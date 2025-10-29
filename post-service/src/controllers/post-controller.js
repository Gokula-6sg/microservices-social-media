const logger = require('../utils/logger')
const Post = require("../models/Post");
const {validateCreatepost} = require("../utils/validation");
const {publishEvent} = require("../utils/rabbitmq");


async function invalidPostcache(req, input){

    const cachedKey = `post:${input}`
    await req.redisClient.del(cachedKey);

    const keys = await req.redisClient.keys("posts:*");
    if(keys.length > 0){
        await req.redisClient.del(keys);
    }
}

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


        await publishEvent('post.created',{
            postId : newPost._id.toString(),
            userId : newPost.user.toString(),
            content : newPost.content,
            createdAt : newPost.createdAt
        })


        await invalidPostcache(req, newPost._id.toString())
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

        await req.redisClient.setex(cacheKey, 300, JSON.stringify(result))

        res.json(result)




    }catch(err){
        logger.error("Error fetching post post", err);
        res.status(500).json({
            success: false,
            message: 'Error fetching post',
        })
    }
}

const getPost = async (req, res) => {
    logger.info("Fetching single post endpoint hitt...");
    try{
        const postId  = req.params.id;
        const cachekey = `post:${postId}`
        const cachedPost = await req.redisClient.get(cachekey);

        if(cachedPost){
            return res.json(JSON.parse(cachedPost));
        }

        const PostById = await Post.findById(postId);



        if(!PostById){
            return res.status(404).json({
                success: false,
                message: 'Post not found'
            })
        }

        await req.redisClient.setex(cachedPost, 36000, JSON.stringify(PostById));

        res.json(PostById);


    }catch(err){
        logger.error("Error creating post post", err);
        res.status(500).json({
            success: false,
            message: 'Error creating post by id',
        })
    }
}


//Deleting the post

const deletePost = async (req, res) => {
    try{

        const post = await Post.findOneAndDelete({
            _id : req.params.id,
            user : req.user.userId
        })
        if(!post){
            return res.status(404).json({
                success: false,
                message: 'Post not found'
            })
        }
        
        //publish post delete method ->

        await publishEvent('post.deleted', {
            postId: post._id.toString(),
            userId: req.user.userId,
            mediaIds : post.mediaIds
        })


        await invalidPostcache(req, req.params.id);
        res.json({
            success: true,
            message: 'Post successfully deleted',
        })

    }catch(err){
        logger.error("Error deleting post post", err);
        res.status(500).json({
            success: false,
            message: 'Error deleting post',
        })
    }
}


module.exports = {createPost, getAllPost, getPost, deletePost}