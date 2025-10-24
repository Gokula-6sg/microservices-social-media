const winston = require('winston');

const logger = winston.createLogger({
    level : process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: winston.format.combine(     //format for the logging files
        winston.format.timestamp(),
        winston.format.errors({stack: true}),
        winston.format.splat(),
        winston.format.json()  //these are the template and the structuruing the logg
    ),
    defaultMeta : {service : 'identity-service'}, //what sevice we, using
    transports : [    // the transports tellign that outpput destination for log
        new winston.transports.Console({
            // the logs are appear in the terminal
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )
        }),// these logs are appears in the file as the copy of the log
        new winston.transports.File({filename : "error.log", level : 'error'}),
        new winston.transports.File({filename : "combine.log"})
    ]

})

module.exports = logger;
