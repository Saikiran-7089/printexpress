const { Resend } = require('resend');
const nodemailer = require('nodemailer');

const resend = new Resend(process.env.RESEND_API_KEY || 're_P9fppdrV_Uwthauzk91dD2NpegW2pPTG9');

// Create Nodemailer Transporter for Gmail SMTP (local/development usage)
let transporter = null;
if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
}

/**
 * Helper to check whether we should use SMTP or Resend
 */
function shouldUseSMTP() {
  // Use SMTP locally if credentials are provided
  return transporter && process.env.NODE_ENV !== 'production';
}

const resendSender = process.env.RESEND_SENDER_EMAIL || 'onboarding@resend.dev';

async function sendWelcomeEmail(userEmail, userName) {
  if (!userEmail) return;
  
  if (shouldUseSMTP()) {
    try {
      await transporter.sendMail({
        from: `PrintExpress <${process.env.EMAIL_USER}>`,
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
      });
      console.log(`Welcome email sent to ${userEmail} via Gmail SMTP.`);
      return;
    } catch (error) {
      console.error('Error sending welcome email via Gmail SMTP:', error);
      // Fallback to Resend
    }
  }

  // Resend Fallback
  try {
    const data = await resend.emails.send({
      from: `PrintExpress <${resendSender}>`,
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
    });
    console.log(`Welcome email sent to ${userEmail} via Resend. ID: ${data.id}`);
  } catch (error) {
    console.error('Error sending welcome email via Resend:', error);
  }
}

async function sendPrintReadyEmail(userEmail, userName, orderId) {
  if (!userEmail) return;

  if (shouldUseSMTP()) {
    try {
      await transporter.sendMail({
        from: `PrintExpress <${process.env.EMAIL_USER}>`,
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
      });
      console.log(`Print ready email sent to ${userEmail} via Gmail SMTP.`);
      return;
    } catch (error) {
      console.error('Error sending print ready email via Gmail SMTP:', error);
      // Fallback to Resend
    }
  }

  // Resend Fallback
  try {
    const data = await resend.emails.send({
      from: `PrintExpress <${resendSender}>`,
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
    });
    console.log(`Print ready email sent to ${userEmail} via Resend. ID: ${data.id}`);
  } catch (error) {
    console.error('Error sending print ready email via Resend:', error);
  }
}

async function sendPasswordResetEmail(userEmail, userName, resetLink) {
  if (!userEmail) return;

  if (shouldUseSMTP()) {
    try {
      await transporter.sendMail({
        from: `PrintExpress <${process.env.EMAIL_USER}>`,
        to: userEmail,
        subject: 'Reset Your PrintXpress Password',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; color: #1e293b;">
            <h2 style="color: #0ea5e9; margin-bottom: 20px;">Reset Your PrintXpress Password</h2>
            <p>Hello ${userName || 'User'},</p>
            <p>We received a request to reset your password for your PrintXpress account.</p>
            <p style="margin: 24px 0;">
              <a href="${resetLink}" style="display: inline-block; background-color: #0ea5e9; color: #ffffff; font-weight: bold; text-decoration: none; padding: 12px 24px; border-radius: 8px;">Reset Password</a>
            </p>
            <p style="color: #64748b; font-size: 14px;">This link will expire in 15 minutes.</p>
            <p style="color: #64748b; font-size: 14px;">If you didn't request this, please ignore this email.</p>
            <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
            <p style="color: #94a3b8; font-size: 12px;">Best regards,<br/>The PrintXpress Team</p>
          </div>
        `
      });
      console.log(`Password reset email sent to ${userEmail} via Gmail SMTP.`);
      return;
    } catch (error) {
      console.error('Error sending password reset email via Gmail SMTP:', error);
      // Fallback to Resend
    }
  }

  // Resend Fallback
  try {
    const data = await resend.emails.send({
      from: `PrintExpress <${resendSender}>`,
      to: userEmail,
      subject: 'Reset Your PrintXpress Password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; color: #1e293b;">
          <h2 style="color: #0ea5e9; margin-bottom: 20px;">Reset Your PrintXpress Password</h2>
          <p>Hello ${userName || 'User'},</p>
          <p>We received a request to reset your password for your PrintXpress account.</p>
          <p style="margin: 24px 0;">
            <a href="${resetLink}" style="display: inline-block; background-color: #0ea5e9; color: #ffffff; font-weight: bold; text-decoration: none; padding: 12px 24px; border-radius: 8px;">Reset Password</a>
          </p>
          <p style="color: #64748b; font-size: 14px;">This link will expire in 15 minutes.</p>
          <p style="color: #64748b; font-size: 14px;">If you didn't request this, please ignore this email.</p>
          <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
          <p style="color: #94a3b8; font-size: 12px;">Best regards,<br/>The PrintXpress Team</p>
        </div>
      `
    });
    console.log(`Password reset email sent to ${userEmail} via Resend. ID: ${data.id}`);
  } catch (error) {
    console.error('Error sending password reset email via Resend:', error);
  }
}

module.exports = {
  sendWelcomeEmail,
  sendPrintReadyEmail,
  sendPasswordResetEmail
};
