//const transporter = require('../config/emailTransporter');
const nodemailer = require('nodemailer');

// const sendAccountActivation = async (email, token) => {
//   await transporter.sendMail({
//     from: 'My App <f.batzoni@gmail.com>',
//     to: email,
//     subject: 'Account Activation',
//     html: `Token is ${token}`,
//   });
// };

/**
 * Send mail
 * @param {string} to
 * @param {string} subject
 * @param {string[html]} htmlContent
 * @returns
 */

const yourEmail = 'f.batzoni@gmail.com';
const yourPass = 'tddcdklrokotihqg';
const mailHost = 'smtp.gmail.com';
const mailPort = 587;

const transporter = nodemailer.createTransport({
  host: mailHost,
  port: mailPort,
  secure: false, // use SSL - TLS
  auth: {
    user: yourEmail,
    pass: yourPass,
  },
});

const sendAccountActivation = async (email, token) => {
  await transporter.sendMail({
    from: 'My App <f.batzoni@gmail.com>',
    to: email,
    subject: 'Account Activation',
    html: `
    <div>
      <b>
        Please click below link to activate your account
      </b>
    </div>
    <div>
      <a href = "http://localhost:3200/#/login?token=${token}>Activate</a>
    </div>`
  });
};


//with https://ethereal.email/create

// const sendAccountActivation = async (email, token) => {
//   const info = await transporter.sendMail({
//     from: 'My App <f.batzoni@gmail.com>',
//     to: email,
//     subject: 'Account Activation',
//     html: `
//        <div>
//             <b>Please click below link to activate your account</b>
//        </div>
//        <div>
//             <a href = "http://localhost:3200/#/login?token=${token}>Activate</a>
//        </div>`
//   });
//    if(process.env.NODE_ENV === 'development'){
//      console.log('url: ' + nodemailer.getTestMessageUrl(info));
//      }
// };

module.exports = {
  sendAccountActivation,
};
