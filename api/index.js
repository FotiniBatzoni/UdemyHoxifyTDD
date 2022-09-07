const app = require('./src/app');
const sequelize = require('./src/config/database');

//force the database to synchronise with the changes in models
sequelize.sync({ force: true });

app.listen(3200, () => console.log(`app is running `));
