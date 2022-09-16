const User = require('./User');
const bcrypt = require('bcrypt');
const EmailService = require('../email/EmailService');
const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const EmailException = require('../email/EmailException');
// const sendEmail = require('../config/emailTransporter');
const InvalidTokenException = require('./InvalidTokenException');
const NotFoundException = require('../error/NotFoundException')
const { randomString } =require('../shared/generator');



const save = async (body) => {
  const { username, email, password } = body;
  const hash = await bcrypt.hash(password, 10);
  //const user = Object.assign({}, req.body, { password: hash });
  //or
  const user = { username, email, password: hash, activationToken: randomString(16) };
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
};

const deleteUser = async(id) =>{
  await User.destroy({ where : { id: id}});
 
}

const passwordResetRequest = async (email) =>{
  const user = await findByEmail(email)
  if(!user){
   throw new NotFoundException('email_not_inuse');
  }
  user.passwordResetToken = randomString(16);
  await user.save();
  try{
    await EmailService.sendPasswordReset(email, user.passwordResetToken)
  }catch(err){
    throw new EmailException();
  }
  
}

const updatePassword = async (updateRequest) =>{
  const user = await findByPasswordResetToken(updateRequest.passwordResetToken)

  const hash = await bcrypt.hash(updateRequest.password, 10);
  user.password = hash;
  await user.save();
};


const findByPasswordResetToken = (token) =>{
 return  User.findOne({ where : { passwordResetToken:token}});
}

module.exports = { 
  save, 
  findByEmail, 
  activate, 
  getUsers, 
  getUser, 
  updateUser,
  deleteUser,
  passwordResetRequest,
  updatePassword,
  findByPasswordResetToken
};
