const TokenService = require('../auth/TokenService');

const tokenAuthentication = async (req, res, next) =>{
    const authorization = req.headers.authorization;

    if(authorization){
      const token = authorization.substring(7); ////because is Bearer

      try{
        const userToken = await TokenService.verify(token);

        req.authenticatedUser = userToken;
      }catch(err){

      }

    }
 
    next();
}

module.exports = tokenAuthentication;