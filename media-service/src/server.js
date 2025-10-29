require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const helmet = require('helmet')
const errorHandler = require('../src/middleware/errorHandler')
const logger = require('../src/utils/logger')
const Redis = require("ioredis");
const {RedisStore}= require("rate-limit-redis");
const rateLimit = require("express-rate-limit");
const mediaRoutes = require('../src/routes/media-route')
const {connectRabbitMQ, consumeEvent} = require("./utils/rabbitmq");
const hadlePostDelted = require("./eventHandlers/media-eventHandler");


const app = express()
const PORT = process.env.PORT || 3003;

mongoose.connect(process.env.DB_URI)
    .then(() => {logger.info('Connected to the database')})
    .catch((err) => {logger.error('mongo connection error:', err)})

const redisClient = new Redis(process.env.REDIS_URL);


app.use(cors())
app.use(helmet())
app.use(express.json())

app.use((req, res, next) => {
    logger.info(`Received ${req.method} request to ${req.url}`)
    logger.info(`Request body, ${req.body}`);
    next();
})


///implement ip based limiting for sensituve points
const mediaUploadLimit = rateLimit({
    windowMs : 15*60*1000,
    max: 100,
    standardHeaders : true,
    legacyHeaders : false,
    handler : (req, res) => {
        logger.warn(`Sensitive endpoint rate limit for IP: ${req.ip}}`)
        res.status(404).json({
            success: false,
            message: 'media limit exceeded. Please wait before upload more media.'
        })
    },
    store : new RedisStore({
        sendCommand: (...args)=> redisClient.call(...args),
    })
});

app.use('/api/media/upload', mediaUploadLimit)

app.use('/api/media', mediaRoutes)

//Error Handler

app.use(errorHandler);


//Listening port



async function startServer() {
    try{
        await connectRabbitMQ();

        //consume all the events
        await consumeEvent('post.deleted', hadlePostDelted);

        app.listen(process.env.PORT, () => {
            logger.info(`Media service is running on the port ${PORT}`)
        })

    }catch(err){
        logger.error('Failed to connect the server', err)
        process.exit(1);
    }
}

startServer()


//Unhandled promise Rejection


process.on('unhandledRejection', (reason, promise) => {
    logger.error(
        `Unhandled Rejection at: ${promise} - reason: ${reason instanceof Error ? reason.stack : JSON.stringify(reason)}`
    );
});

