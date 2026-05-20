const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || "saikiranguest1@gmail.com",
    pass: process.env.EMAIL_PASS || "pmasirjjcdsorzpl"
  }
});

async function sendWelcomeEmail(userEmail, userName) {
  if (!userEmail) return;
  try {
    const fromEmail = process.env.EMAIL_USER || "saikiranguest1@gmail.com";
    const mailOptions = {
      from: `"PrintExpress" <${fromEmail}>`,
      to: userEmail,
      subject: 'Welcome to PrintExpress!',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: #0ea5e9;">Welcome to PrintExpress, ${userName}!</h2>
          <p>Your account has been successfully created.</p>
          <p>You can now log in and place print orders.</p>
          <br/>
          <p>Best regards,<br/>The PrintExpress Team</p>
        </div>
      `
    };
    await transporter.sendMail(mailOptions);
    console.log(`Welcome email sent to ${userEmail}`);
  } catch (error) {
    console.error('Error sending welcome email:', error);
  }
}

async function sendPrintReadyEmail(userEmail, userName, orderId) {
  if (!userEmail) return;
  try {
    const fromEmail = process.env.EMAIL_USER || "saikiranguest1@gmail.com";
    const mailOptions = {
      from: `"PrintExpress" <${fromEmail}>`,
      to: userEmail,
      subject: 'Your Print Order is Ready!',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: #10b981;">Your Print is Ready for Pickup!</h2>
          <p>Hi ${userName},</p>
          <p>Your order (ID: ${orderId}) is completed and ready to be picked up.</p>
          <p>Please collect it at your earliest convenience.</p>
          <br/>
          <p>Best regards,<br/>The PrintExpress Team</p>
        </div>
      `
    };
    await transporter.sendMail(mailOptions);
    console.log(`Print ready email sent to ${userEmail}`);
  } catch (error) {
    console.error('Error sending print ready email:', error);
  }
}

module.exports = {
  sendWelcomeEmail,
  sendPrintReadyEmail
};
