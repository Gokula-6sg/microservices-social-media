require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Redis = require('ioredis');
const helmet = require("helmet");
const {rateLimit} = require('express-rate-limit');
const {RedisStore} = require('rate-limit-redis')
const logger = require('../src/utils/logger')
const proxy = require('express-http-proxy')
const errorHandler = require('../src/middleware/errorHandler')
const {validateToken} = require("./middleware/authMiddleware");




const app = express();
const PORT = process.env.PORT || 3000;

const redisClient = new Redis(process.env.REDIS_URL);


app.use(helmet());
app.use(cors());
app.use(express.json());


//rate-limiting



const ratelimitOptions = rateLimit({
    windowMs : 15*60*1000,
    max: 100,
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

app.use(ratelimitOptions);

app.use((req, res, next) => {
    logger.info(`Received ${req.method} request to ${req.url}`)
    logger.info(`Request body, ${req.body}`);
    next();
})



const proxyOptions = {
    proxyReqPathResolver: (req)=>{
        return req.originalUrl.replace(/^\/v1/,'/api')
    },
    proxyErrorHandler: (err, res, next)=>{
        logger.error(`Proxy error: ${err.message}`)
        console.log(err)
        res.status(500).json({
            message : "Internal server error", error: err.message,
        })
    }
}

/////>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

//Setting up proxy for the identoty service   this is more importnant=-------

app.use('/v1/auth', proxy(process.env.IDENTITY_SERVICE, {
    ...proxyOptions,
    proxyReqOptDecorator : (proxyReqOpts, srcReq)=>{
        proxyReqOpts.headers["Content-Type"] = "application/json"
        return proxyReqOpts
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes)=>{
        logger.info(`Respose received from the Identity Service: ${proxyRes.statusCode}`)
        return proxyResData

    }
}))

//Setting up proxy for the post service   this is more importnant=-------
app.use('/v1/posts', validateToken, proxy(process.env.POST_SERVICE, {
    ...proxyOptions,
    proxyReqOptDecorator : (proxyReqOpts, srcReq) =>{
        proxyReqOpts.headers["Content-Type"] = "application/json"
        proxyReqOpts.headers['x-user-id'] = srcReq.user.userId

        return proxyReqOpts
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes)=>{
        logger.info(`Respose received from the Post-Service: ${proxyRes.statusCode}`)
        return proxyResData

    }
}))

//Setting up proxy for the media service   this is more importnant=-------
app.use('/v1/media', validateToken, proxy(process.env.MEDIA_SERVICE, {
    ...proxyOptions,
    proxyReqOptDecorator : (proxyReqOpts, srcReq) =>{

        proxyReqOpts.headers['x-user-id'] = srcReq.user.userId
        if(!srcReq.headers['content-type'].startsWith('multipart/form-data')) {
            proxyReqOpts.headers["Content-Type"] = "application/json"
        }

        return proxyReqOpts
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes)=>{
        logger.info(`Respose received from the media-Service: ${proxyRes.statusCode}`)
        return proxyResData

    },

    parseReqBody: false
}))

//Setting up proxy for the Search service   this is more importnant=-------

app.use('/v1/search', validateToken, proxy(process.env.SEARCH_SERVICE, {
    ...proxyOptions,
    proxyReqOptDecorator : (proxyReqOpts, srcReq) =>{
        proxyReqOpts.headers["Content-Type"] = "application/json"
        proxyReqOpts.headers['x-user-id'] = srcReq.user.userId

        return proxyReqOpts
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes)=>{
        logger.info(`Respose received from the Search-Service: ${proxyRes.statusCode}`)
        return proxyResData

    }
}))







app.use(errorHandler);



app.listen(PORT, () => {
    logger.info(`Api Gateway is running in the ${PORT}`);
    logger.info(`Identity Service is running in ${process.env.IDENTITY_SERVICE}`);
    logger.info(`Post Service is running in ${process.env.POST_SERVICE}`);
    logger.info(`Media Service is running in ${process.env.MEDIA_SERVICE}`);
    logger.info(`Search Service is running in ${process.env.SEARCH_SERVICE}`);
    logger.info(`Redis Url is  ${process.env.REDIS_URL}`)
})




