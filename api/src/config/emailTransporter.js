const nodemailer = require('nodemailer');

//with nodemailer-stub
// const nodemailerStub = require('nodemailer-stub');
// const transporter = nodemailer.createTransport(nodemailerStub.stubTransport);

//with SMTPServer
const transporter = nodemailer.createTransport({
  host: 'localhost',
  port: 465,
  secure: false,
  tls: {
    rejectUnauthorized: false,
  },
});

module.exports = transporter;

// const yourEmail = 'f.batzoni@gmail.com';
// const yourPass = 'tddcdklrokotihqg';
// const mailHost = 'smpt.gmail.com';
// const mailPort = 587;
// const senderEmail = 'antoniosbalis@hotmail.com';

// /**
//  * Send mail
//  * @param {string} to
//  * @param {string} subject
//  * @param {string[html]} htmlContent
//  * @returns
//  */

// const sendEmail = async () => {
//   let transporter = nodemailer.createTransport({
//     host: mailHost,
//     port: mailPort,
//     secure: false, // use SSL - TLS
//     auth: {
//       user: yourEmail,
//       pass: yourPass,
//     },
//   });
//   let mailOptions = {
//     from: senderEmail,
//     to: 'antoniosbalis@hotmail.com',
//     subject: 'hi',
//     html: 'token',
//   };
//   return transporter.sendMail(mailOptions); // promise
// };

// module.exports = sendEmail;
