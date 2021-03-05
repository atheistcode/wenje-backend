/* DEPENDENCIES */
const nodemailer = require("nodemailer");

const sendEmail = async (messageOptions) => {
  /* (1) create nodemailer transporter */
  const transporter = nodemailer.createTransport({
    host: process.env.NODEMAILER_HOST,
    port: process.env.NODEMAILER_PORT,
    auth: {
      user: process.env.NODEMAILER_USER,
      pass: process.env.NODEMAILER_PASSWORD,
    },
  });

  /* (2) define nodemailer message configuration */
  const message = {
    from: "WENJE Admin <security@wenje.com>",
    to: messageOptions.to,
    subject: messageOptions.subject,
    text: messageOptions.text,
  };

  /* (3) send nodemailer email */
  await transporter.sendMail(message);
};

/* DEFAULT EXPORT */
// module.exports = sendEmail;
