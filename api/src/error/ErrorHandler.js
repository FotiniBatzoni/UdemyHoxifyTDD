//eslint-disable-next-line on-used-vars
module.exports = ((err,req,res,next) =>{
    const { status, message, errors} = err;
    let validationErrors;
    if(errors){
      validationErrors = {};
      errors.forEach((error) => (validationErrors[error.param] = req.t(error.msg))); //req.t(error.msg) from t18next middleware
    }
    res.status(status).send({ 
      path: req.originalUrl,
      timestamp :'',
      message: req.t(message), 
      validationErrors });
  });