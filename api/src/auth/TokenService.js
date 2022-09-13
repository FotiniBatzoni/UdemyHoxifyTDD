const jwt = require('jsonwebtoken');
const secret = 'this-is-secret-key'
const { randomString } = require('../shared/generator');
const Token = require('./Token');

const createToken = async (user) => {
        //return jwt.sign( { id:user.id }, secret, {expiresIn : 10}); //expires in 10 seconds
    const token = randomString(32);
 
    await Token.create({
        token: token,
        userId: user.id
    })
    return token;
};

const verify = async (token) => {
    //return jwt.verify(token, secret);
  
    const tokenInDb = await Token.findOne({ where : { token : token}});
    const userId = tokenInDb.userId;
    return { id : userid };
}

module.exports = {
    createToken,
    verify
}