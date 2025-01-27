import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
dotenv.config();

export const sesTransport = nodemailer.createTransport({
  host: process.env.AWS_SMTP_ENDPOINT,
  port: 587,
  secure: false,
  auth: {
    user: process.env.AWS_SMTP_USERNAME,
    pass: process.env.AWS_SMTP_PASSWORD,
  },
});

export const sendEmail = async (to, subject, html) => {
  try {
    const mailOptions = {
      from: process.env.AWS_SMTP_MAIL,
      to,
      subject,
      html,
    };
    console.log(process.env.AWS_SMTP_MAIL);
    const info = await sesTransport.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send email');
  }
};
