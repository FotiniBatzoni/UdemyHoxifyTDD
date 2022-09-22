const express = require('express');
const router = express.Router();
const AuthenticationException = require('../auth/AuthenticationException');
const NotFoundException = require('../error/NotFoundException');
const HoaxService = require('./HoaxService');
const { check, validationResult } = require('express-validator');
const ValidationException = require('../error/ValidationException');


router.post('/api/1.0/hoaxes', check('content').isLength({ min: 10 }),
async (req,res, next) =>{
  if(!req.authenticatedUser){
    return next(new AuthenticationException('unauthorized_hoax_submit')) ;
  }

  const errors = validationResult(req);
  if(!errors.isEmpty()){
    console.log('errors')
    return next(new ValidationException(errors.array()))
  }
  await HoaxService.save(req.body);
  return  res.send({ message : req.t('hoax_submit_success') });
  
   
})

module.exports = router;