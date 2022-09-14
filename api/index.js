const app = require('./src/app');
const sequelize = require('./src/config/database');
const User = require('./src/user/User');
const bcrypt = require('bcrypt');
const TokenService = require('./src/auth/TokenService');

const addUsers = async (activeUserCount, inactiveUserCount = 0) => {
     const hash = await bcrypt.hash('P4ssword', 10);
     for (let i = 0; i < activeUserCount + inactiveUserCount; i++) {
       await User.create({
         username: `user${i + 1}`,
         email: `user${i + 1}@mail.com`,
         inactive: i >= activeUserCount,
         password: hash,
       });
     }
   };

//force the database to synchronise with the changes in models
sequelize.sync({ force: true }).then( async () => {
    await addUsers(25)
});


const winston = require('winston')
const remoteLog = new winston.transports.Http({
    host: "localhost",
    port: 3001,
    path: "/errors"
})

const consoleLog = new winston.transports.Console()

module.exports = {
    requestLogger: createRequestLogger([consoleLog]),
    errorLogger: createErrorLogger([remoteLog, consoleLog])
}

function createRequestLogger(transports) {
    const requestLogger = winston.createLogger({
        format: getRequestLogFormatter(),
        transports: transports
    })

    return function logRequest(req, res, next) {
        requestLogger.info({req, res})
        next()
    }
}

function createErrorLogger(transports) {
    const errLogger = winston.createLogger({
        level: 'error',
        transports: transports
    })

    return function logError(err, req, res, next) {
        errLogger.error({err, req, res})
        next()
    }
}

function getRequestLogFormatter() {
    const {combine, timestamp, printf} = winston.format;

    return combine(
        timestamp(),
        printf(info => {
            const {req, res} = info.message;
            return `${info.timestamp} ${info.level}: ${req.hostname}${req.port || ''}${req.originalUrl}`;
        })
    );
}


TokenService.scheduleCleanup();

app.listen(3200, () => console.log(`app is running `));
