const nodemailer = require('nodemailer');

//with nodemailer-stub
const nodemailerStub = require('nodemailer-stub');
const transporter = nodemailer.createTransport(nodemailerStub.stubTransport);

// //with mock SMTPServer
// const transporter = nodemailer.createTransport({
//   host: 'localhost',
//   port: 8587,
//   secure: false,
//   tls: {
//     rejectUnauthorized: false,
//   },
// });

// //with real SMTPServer
// const transporter = nodemailer.createTransport({
//   host: 'smpt.gmail.com',
//   port: 587,
//   secure: false,
//   // tls: {
//   //   rejectUnauthorized: false,
//   // },
//   auth: {
//     user: 'f.batzoni@gmail.com',
//     pass: 'tddcdklrokotihqg',
//   },
// });

// const yourEmail = 'f.batzoni@gmail.com';
// const yourPass = 'tddcdklrokotihqg';
// const mailHost = 'smtp.gmail.com';
// const mailPort = 587;

// const transporter = nodemailer.createTransport({
//   host: mailHost,
//   port: mailPort,
//   secure: false, // use SSL - TLS
//   auth: {
//     user: yourEmail,
//     pass: yourPass,
//   },
// });

module.exports = {
  transporter,
};
