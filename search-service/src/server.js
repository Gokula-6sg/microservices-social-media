require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const helmet = require('helmet')
const errorHandler = require('../src/middleware/errorHandler')
const logger = require('../src/utils/logger')
const {consumeEvent,connectRabbitMQ} = require('../src/utils/rabbitmq')
const searchroutes = require('../src/routes/search-routes')
const {hadlePostcreated, postdeleted} = require('../src/eventHandler/search-handler')


const app = express()
const PORT = process.env.PORT || 3004


mongoose.connect(process.env.DB_URI)
    .then(() => {logger.info('Connected to the database')})
    .catch((err) => {logger.error('mongo connection error:', err)})



app.use(helmet())
//lih
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
    logger.info(`Received ${req.method} request to ${req.url}`)
    logger.info(`Request body, ${req.body}`);
    next();
})


app.use('/api/search', searchroutes);



app.use(errorHandler);

async function startServer() {
    try{
        await connectRabbitMQ();


        //consume the eventd  or subscribe to the events
        await consumeEvent('post.created',hadlePostcreated)
        await consumeEvent('post.deleted',postdeleted)

        app.listen(process.env.PORT, () => {
            logger.info(`Search service is running on the port ${PORT}`)
        })
    }catch(e){
        logger.error(`Error starting server: ${e}`);
        process.exit(1);
    }
}

startServer()

