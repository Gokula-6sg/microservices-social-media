const amqp = require('amqplib')
const logger = require('../utils/logger')
const {handle} = require("express/lib/application");


let connection = null;
let channel = null;

const EXCHANGE_NAME = 'facebook_events';

async function connectRabbitMQ() {
    try{

        connection = await amqp.connect(process.env.RABBITMQ_URL)
        channel =  await connection.createChannel()

        await channel.assertExchange(EXCHANGE_NAME, 'topic', {durable: false})
        logger.info('Connecteed to the RabbitMQ');
        return channel;


    }catch(err){
        logger.error(`Error connecting Rabbitmq server: `,err);
    }
}


async function consumeEvent(routingKey, callback) {
    if(!channel){
        await connectRabbitMQ();
    }
    const q = await channel.assertQueue("", {exclusive : true})
    await channel.bindQueue(q.queue, EXCHANGE_NAME, routingKey)
    channel.consume(q.queue, (msg) => {
        if (msg !== null) {
            const content = JSON.parse(msg.content.toString())
            callback(content)
            channel.ack(msg)

        }
    })
    logger.info(`Subscribed to event : ${routingKey}`)
}


module.exports = { connectRabbitMQ,  consumeEvent };