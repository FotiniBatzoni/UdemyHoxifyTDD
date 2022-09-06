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
    html: `Token is ${token}`,
  });
};

module.exports = {
  sendAccountActivation,
};
