require('dotenv').config();
const nodemailer = require('nodemailer');

console.log("Using EMAIL_USER:", process.env.EMAIL_USER);
console.log("Using EMAIL_PASS:", process.env.EMAIL_PASS);

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

async function run() {
  try {
    let info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: "Test Email",
      text: "This is a test."
    });
    console.log("Message sent successfully!");
  } catch (err) {
    console.error("Failed to send message:", err.message);
  }
}

run();
