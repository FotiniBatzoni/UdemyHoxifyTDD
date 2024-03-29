const express = require('express');
const router = express.Router();
const UserService = require('./UserService');
const { check, validationResult } = require('express-validator');
const ValidationException = require('../error/ValidationException');
const pagination = require('../middleware/pagination');
const ForbiddenException = require('../error/ForbiddenException');
const FileService = require('../file/FileService');


// const validateUsername = (req, res, next) => {
//   const user = req.body;
//   if (user.username === null) {
//     req.validationErrors = {
//       username: 'Username cannot be null',
//     };
//   }
//   next();
// };

// const validateEmail = (req, res, next) => {
//   const user = req.body;
//   if (user.email === null) {
//     req.validationErrors = {
//       ...req.validationErrors,
//       email: 'Email cannot be null',
//     };
//   }
//   next();
// };

router.post(
  '/api/1.0/users',
  check('username')
    .notEmpty()
    .withMessage('username_null')
    .bail() // it's something like stop
    .isLength({ min: 4, max: 32 })
    .withMessage('username_size'),
  check('email')
    .notEmpty()
    .withMessage('email_null')
    .bail()
    .isEmail()
    .withMessage('email_invalid')
    .bail()
    .custom(async (email) => {
      const user = await UserService.findByEmail(email);
      if (user) {
        throw new Error('email_inuse');
      }
    }),
  check('password')
    .notEmpty()
    .withMessage('password_null')
    .bail()
    .isLength({ min: 6 })
    .withMessage('password_size')
    .bail()
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/)
    .withMessage('password_pattern'),
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    try {
      await UserService.save(req.body);
      
      return res.send({ message: req.t('user_create_success') });
    } catch (err) {
        //return res.status(502).send({ message: req.t(err.message) });
        next(err);
    }
  }
);

router.post('/api/1.0/users/token/:token', async (req, res,next) => {
  const token = req.params.token;
  try {
    await UserService.activate(token);
    return res.send({ message: req.t('account_activation_success') });
  } catch (err) {
    //return res.status(400).send({ message: req.t(err.message) });
    next(err);
  }  
});




router.get('/api/1.0/users', pagination,  async(req,res) => {
  //console.log(req)
  const authenticatedUser = req.authenticatedUser;

  const { page, size } = req.pagination;
  const users = await UserService.getUsers(page,size, authenticatedUser);

  res.send(users);
});

router.get('/api/1.0/users/:id', async (req, res, next) => {
  try {
    const user = await UserService.getUser(req.params.id);
    res.send(user);
  } catch (err) {
    next(err);
  }
});



router.put('/api/1.0/users/:id',  
check('username')
  .notEmpty()
  .withMessage('username_null')
  .bail() // it's something like stop
  .isLength({ min: 4, max: 32 })
  .withMessage('username_size'), 
check('image')
.custom( async ( imageAsbase64String ) => {

  if(!imageAsbase64String){
    return true;
  }
  const buffer = Buffer.from( imageAsbase64String.base64, 'base64' );

  if( !FileService.isLessThan2MB(buffer) ){
    throw new Error('profile_image_size')
  }

  const supportedType = await FileService.isSupportedFileType(imageAsbase64String.ext[1]);
  if(!supportedType){
    throw new Error('unsupported_image_file');
  }

  return true;
}),
async (req,res,next) => {

  if(req.body.image){
    req.body.image = req.body.image.base64
  }

  const authedicatedUser = req.authenticatedUser;

  if(!authedicatedUser || authedicatedUser.id != req.params.id ){
    return next(new ForbiddenException('unauthorised_user_update'));
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new ValidationException(errors.array()));
  }

  const user = await UserService.updateUser(req.params.id, req.body);

  return res.send(user);

});


router.delete('/api/1.0/users/:id', async (req,res,next) => {
  const authenticatedUser = req.authenticatedUser;
  if(!authenticatedUser || authenticatedUser.id != req.params.id ){
    return next(new ForbiddenException('unauthorised_user_delete'));
  }
  await UserService.deleteUser(req.params.id);

  return res.send();
});


router.post('/api/1.0/user/password', check('email').isEmail().withMessage('email_invalid'), async (req,res,next) =>{
  const errors = validationResult(req);
  if(!errors.isEmpty()){
    return next( new ValidationException(errors.array()))
  }
  try{
    await UserService.passwordResetRequest(req.body.email);
    return res.send({ message: req.t('password_reset_request_success')});
  }catch(err){
    next(err);
  }
});

const passwordResetTokenValidator = async(req,res,next) =>{
  const user = await UserService.findByPasswordResetToken(req.body.passwordResetToken)
  if(!user){
   return next(new ForbiddenException('unauthorized_password_reset')) ;
  }
  next();
};


router.put('/api/1.0/user/password',  passwordResetTokenValidator,
check('password')
.notEmpty()
.withMessage('password_null')
.bail()
.isLength({ min: 6 })
.withMessage('password_size')
.bail()
.matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/)
.withMessage('password_pattern'), async (req,res, next) =>{
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new ValidationException(errors.array()));
  }
  await UserService.updatePassword(req.body);
  res.send();
})

module.exports = router;
