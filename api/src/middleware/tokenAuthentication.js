const TokenService = require('../auth/TokenService');

const tokenAuthentication = async (req, res, next) =>{
    const authorization = req.headers.authorization;
    console.log(authorization)

    if(authorization){
      const token = authorization.substring(7); ////because is Bearer
      const userToken = await TokenService.verify(token);

      req.authenticatedUser = userToken;
      console.log(req.authenticatedUser)
    }
 
    next();
}

module.exports = tokenAuthentication;