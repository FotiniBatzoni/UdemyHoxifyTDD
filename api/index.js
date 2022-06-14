const app = require('./src/app');
const sequelize = require('./src/config/database');

sequelize.sync();

app.listen(3200, () => console.log(`app is running`));
