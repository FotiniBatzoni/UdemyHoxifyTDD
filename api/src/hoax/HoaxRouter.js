const express = require('express');
const router = express.Router();
const AuthenticationException = require('../auth/AuthenticationException');
const NotFoundException = require('../error/NotFoundException');
const HoaxService = require('./HoaxService');

router.post('/api/1.0/hoaxes', async (req,res) =>{
    if(req.authenticatedUser){
        await HoaxService.save(req.body);
      return  res.send({ message : req.t('hoax_submit_success') });
    }
    NotFoundException(new AuthenticationException('unauthorized_hoax_submit')) ;
})

module.exports = router;