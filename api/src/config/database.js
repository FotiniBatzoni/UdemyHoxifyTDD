const Sequelize = require('sequelize');
const config = require('config');

const dbConfig = config.get('database');

//1st parameter - Db name ("hoxify")
//2nd parameter - user-name
//3rd paramater - Db password
//4th parameter - an object
const sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, {
  dialect: dbConfig.dialect,
  storage: dbConfig.storage,
  logging: dbConfig.logging,
});

module.exports = sequelize;
