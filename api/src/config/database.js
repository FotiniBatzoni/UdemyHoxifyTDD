const Sequelize = require('sequelize');

//1st parameter - Db name ("hoxify")
//2nd parameter - user-name
//3rd paramater - Db password
//4th parameter - an object
const sequelize = new Sequelize('hoxify', 'my-db-user', 'db-p4ss', {
  dialect: 'sqlite',
  storage: './database.sqlite',
});

module.exports = sequelize;
