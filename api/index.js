const app = require('./src/app');
const sequelize = require('./src/config/database');
const TokenService = require('./src/auth/TokenService');
const logger = require('./src/shared/logger');


///now its in seeders file '20220920120122-add-users.js'
// const bcrypt = require('bcrypt');
// const TokenService = require('./src/auth/TokenService');

// const addUsers = async (activeUserCount, inactiveUserCount = 0) => {
//      const hash = await bcrypt.hash('P4ssword', 10);
//      for (let i = 0; i < activeUserCount + inactiveUserCount; i++) {
//        await User.create({
//          username: `user${i + 1}`,
//          email: `user${i + 1}@mail.com`,
//          inactive: i >= activeUserCount,
//          password: hash,
//        });
//      }
//    };



//force the database to synchronise with the changes in models
// sequelize.sync().then( async () => {
//     await addUsers(25)
// });


sequelize.sync();


TokenService.scheduleCleanup();

app.listen(3200, () => logger.info(`app is running `));
