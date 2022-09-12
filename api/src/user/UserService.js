const User = require('./User');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const EmailService = require('../email/EmailService');
const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const EmailException = require('../email/EmailException');
// const sendEmail = require('../config/emailTransporter');
const InvalidTokenException = require('./InvalidTokenException');
const NotFoundException = require('./UserNotFoundException');

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
   // await EmailService.sendAccountActivation(email, user.activationToken);
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
  if(!user){
    throw new InvalidTokenException();
  }
  user.inactive = false;
  user.activationToken = null;
  await user.save();
};

const getUsers = async ( page, size, authedicatedUser = {} ) =>{
  const usersWithCount = await User.findAndCountAll({
    where: { 
      inactive: false,
      id :{ 
        [Sequelize.Op.not] : authedicatedUser.id ? authedicatedUser.id : 0 
      }
    },
    attributes: ['id', 'username', 'email'],
    limit: size,
    offset: page * size
  });

  return {
    content: usersWithCount.rows,
    page,
    size,
    totalPages: Math.ceil( usersWithCount.count / size),
  }
}

const getUser = async (id) => {
  const user = await User.findOne({
    where: {
      id: id,
      inactive: false,
    },
    attributes: ['id', 'username', 'email'],
  });
  if (!user) {
    throw new NotFoundException('user_not_found');
  }
  return user;
};

const updateUser = async (id, updatedBody) => {
  const user = await User.findOne({ where : { id : id}});
  user.username = updatedBody.username;

  await user.save();
}


module.exports = { save, findByEmail, activate, getUsers, getUser, updateUser};
