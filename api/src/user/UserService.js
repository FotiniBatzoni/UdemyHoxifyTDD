const User = require('./User');
const bcrypt = require('bcrypt');

const save = async (body) => {
  const hash = await bcrypt.hash(body.password, 10);
  //const user = Object.assign({}, req.body, { password: hash });
  //or
  const user = { ...body, password: hash };
  //or
  // const user = {
  //   username: req.body.username,
  //   email: req.body.email,
  //   password: hash,
  // };
  await User.create(user);
};

module.exports = { save };
