require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const helmet = require('helmet')
const postRoutes = require('../src/routes/post-route')
const errorHandler = require('../src/middleware/errorHandler')
const logger = require('../src/utils/logger')
const Redis = require("ioredis");
const {RedisStore}= require("rate-limit-redis");
const rateLimit = require("express-rate-limit");
const {connectRabbitMQ} = require("./utils/rabbitmq");




const app = express()
const PORT = process.env.PORT || 3002


mongoose.connect(process.env.DB_URI)
    .then(() => {logger.info('Connected to the database')})
    .catch((err) => {logger.error('mongo connection error:', err)})


const redisClient = new Redis(process.env.REDIS_URL);


//middlewares

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
    logger.info(`Received ${req.method} request to ${req.url}`)
    logger.info(`Request body, ${req.body}`);
    next();
})



///implement ip based limiting for sensituve points
const postCreationLimit = rateLimit({
    windowMs : 15*60*1000,
    max: 1000,
    standardHeaders : true,
    legacyHeaders : false,
    handler : (req, res) => {
        logger.warn(`Sensitive endpoint rate limit for IP: ${req.ip}}`)
        res.status(404).json({
            success: false,
            message: 'TPost limit exceeded. Please wait before creating more posts.'
        })
    },
    store : new RedisStore({
        sendCommand: (...args)=> redisClient.call(...args),
    })
});

app.use('/api/posts/create-post', postCreationLimit)


//


app.use("/api/posts", (req, res, next) => {
    req.redisClient = redisClient;
    next()
}, postRoutes);



//Error Handler-----------------

app.use(errorHandler);

async function startServer() {
    try{
        await connectRabbitMQ();
        app.listen(process.env.PORT, () => {
            logger.info(`Post service is running on the port ${PORT}`)
        })

    }catch(err){
        logger.error('Failed to connect the server', err)
        process.exit(1);
    }
}

startServer()




//Unhandled promise Rejection


process.on('unhandledRejection', (reason,promise) => {
    logger.error('Unhandled Rejection at:',promise, "reason:", reason)
})

