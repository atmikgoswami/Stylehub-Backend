const nodemailer = require("nodemailer");


const mailHelper = async (options) =>{
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

    const message = {
        from: 'goswamiatmik@gmail.com', // sender address
        to: options.email, // list of receivers
        subject: options.subject, // Subject line
        text: options.message, // plain text body
    }
    
    await transporter.sendMail(message);
}

module.exports = mailHelper