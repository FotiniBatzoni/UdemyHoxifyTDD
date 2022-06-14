const express = require(`express`);

const app = express();

const UserRouter = require('./user/UserRouter');

app.use(express.json());

app.use(UserRouter);

//to use it to our tests
module.exports = app;
