const express = require(`express`);

const app = express();

app.post('/api/1.0/users', (req, res) => {
  return res.send({message:'User Created'});
});

//to use it to our tests
module.exports = app;
