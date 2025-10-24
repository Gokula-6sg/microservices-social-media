require('dotenv').config()
const mongoose = require('mongoose')
const logger = require('../src/utils/logger')
const express = require('express')
const helmet = require('helmet')
const cors = require('cors')
const {RateLimiterRedis} = require('rate-limiter-flexible')
const Redis = require("ioredis");
const rateLimit = require("express-rate-limit");
const {RedisStore}= require("rate-limit-redis");
const {} = require('rate-limit-redis')
const router = require('../src/routes/identity-service')
const errorHandler = require("./middleware/errorHandler");
const app = express()

const port = process.env.PORT || 3001

//connect to db --------------


mongoose.connect(process.env.DB_URI).then(() => {
        logger.info('Connected to the database')
}).catch((err) => {logger.error('mongo connection error:', err)})



// Redis Initialization

const redisClient = new Redis(process.env.REDIS_URL)



//middleware ---------------

app.use(helmet())  //using helmet security headers
app.use(cors())    // using cross-origin control
app.use(express.json())

app.use((req, res, next) => {
    logger.info(`Received ${req.method} request to ${req.url}`)
    logger.info(`Request body, ${req.body}`);
    next();
})


//DDOS Protection and ip based rate limiting ----------

//Layer 1


const rateLimiter = new RateLimiterRedis({
    storeClient : redisClient,    // redis connection----

    keyPrefix : 'middleware',
    points : 10,
    duration : 1  //request in 10 seconds
})


app.use((req,res , next)=>{
    rateLimiter
        .consume(req.ip)
        .then(()=> next())
        .catch(()=>{
        logger.warn(`Rate limit exceeeded for IP: ${req.ip}`)
        res.status(404).json({
            success: false,
            message: 'too many requests....'
        })
    })
})


//IP based rate-limiting and Layer 2
// Prevents brute force attacks
// --------------------------------

const sensitiveratelimit = rateLimit({
    windowMs : 15*60*1000,
    max: 50,
    standardHeaders : true,
    legacyHeaders : false,
    handler : (req, res) => {
        logger.warn(`Sensitive endpoint rate limit for IP: ${req.ip}}`)
        res.status(404).json({
            success: false,
            message: 'Too many requests...'
        })
    },
    store : new RedisStore({
        sendCommand: (...args)=> redisClient.call(...args),
    })
});

//apply these sensitive rate limiter ------

app.use('/api/auth/register', sensitiveratelimit)


//Routess--------------

app.use('/api/auth', router);

//Error Handler-----------------

app.use(errorHandler);


app.listen(process.env.PORT, () => {
    logger.info(`Identity service is running on the port ${port}`)
})


//Unhandled promise Rejection
process.on('unhandledRejection', (reason,promise) => {
    logger.error('Unhandled Rejection at:',promise, "reason:", reason)
})

