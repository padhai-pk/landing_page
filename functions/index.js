// functions/index.js
const functions = require('firebase-functions');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.sendgrid.net',
  port: 465,
  secure: true,
  auth: { user: 'apikey', pass: functions.config().sendgrid.key },
});

exports.sendWaitlistMail = functions.firestore
  .document('mail/{docId}')
  .onCreate(async (snap) => {
    const { to, message } = snap.data();
    await transporter.sendMail({
      from: 'Padhai.pk <hello@padhai.pk>',
      to,
      subject: message.subject,
      text: message.text,
    });
  });