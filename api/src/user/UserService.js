const User = require('./User');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const EmailService = require('../email/EmailService');
const sequelize = require('../config/database');
const EmailException = require('../email/EmailException');
// const sendEmail = require('../config/emailTransporter');

const generateToken = (length) => {
  return crypto.randomBytes(length).toString('hex').substring(0, length);
};

const save = async (body) => {
  const { username, email, password } = body;
  const hash = await bcrypt.hash(password, 10);
  //const user = Object.assign({}, req.body, { password: hash });
  //or
  const user = { username, email, password: hash, activationToken: generateToken(16) };
  //or
  // const user = {
  //   username: req.body.username,
  //   email: req.body.email,
  //   password: hash,
  // };
  const transaction = await sequelize.transaction();
  await User.create(user, { transaction });
  //if email is successfully send save the user to Database (try)
  //else rollback (catch)
  try {
    await EmailService.sendAccountActivation(email, user.activationToken);
    await transaction.commit();
  } catch (err) {
    await transaction.rollback();
    throw new EmailException();
  }
};

const findByEmail = async (email) => {
  return await User.findOne({ where: { email: email } });
};

const activate = async (token) => {
  const user = await User.findOne({ where: { activationToken: token } });
  user.inactive = false;
  await user.save();
};

module.exports = { save, findByEmail, activate };
