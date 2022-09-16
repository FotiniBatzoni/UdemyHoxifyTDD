// const jwt = require('jsonwebtoken');
// const secret = 'this-is-secret-key'
const { randomString } = require('../shared/generator');
const Token = require('./Token');
const Sequelize = require('sequelize');
const ONE_WEEK_IN_MILIS = 7*24*60*60*1000


const createToken = async (user) => {
        //return jwt.sign( { id:user.id }, secret, {expiresIn : 10}); //expires in 10 seconds
    const token = randomString(32);
 
    await Token.create({
        token: token,
        userId: user.id,
        lastUsedAt : new Date()
    })
    return token;
};

const verify = async (token) => {
    //return jwt.verify(token, secret);
  
    
    const oneWeekAgo = new Date(Date.now() - ONE_WEEK_IN_MILIS)
    const tokenInDb = await Token.findOne({ 
        where : { 
            token : token,
            lastUsedAt:{
                [Sequelize.Op.gt]: oneWeekAgo //gr = greater than
        }
    }});
    tokenInDb.lastUsedAt = new Date();

    await tokenInDb.save();
    const userId = tokenInDb.userId;
    return { id : userId };
};

const deleteToken = async (token) =>{
    await Token.destroy({ where : { token:token }})
}

// const deleteTokensOfUser = async (userId) => {
//     await Token.destroy({ where : { userId : userId }})
// }

const scheduleCleanup = () => {
    setInterval ( async () =>
    {
        const oneWeekAgo = new Date(Date.now() - ONE_WEEK_IN_MILIS);
        await Token.destroy({
            where: {
                lastUsedAt: {
                    [Sequelize.Op.lt] : oneWeekAgo
                }
            }
        })
    }, (60*60*1000));

}

const clearTokens = async (userId) =>{
    await Token.destroy({ where: { userId: userId}})
}

module.exports = {
    createToken,
    verify,
    deleteToken,
    scheduleCleanup,
    clearTokens
}