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
 * Helper to check whether we should use SMTP or Resend/SendGrid APIs
 */
function shouldUseSMTP() {
  if (process.env.FORCE_SMTP === 'true') return true;
  // Use SMTP locally if credentials are provided
  return transporter && process.env.NODE_ENV !== 'production';
}

const resendSender = process.env.RESEND_SENDER_EMAIL || 'onboarding@resend.dev';
const sendgridSender = process.env.SENDGRID_SENDER_EMAIL || process.env.EMAIL_USER || '';

/**
 * Centralized email sending router.
 * Routes email through local SMTP, SendGrid API, or Resend API.
 */
async function sendEmail({ to, subject, html }) {
  if (!to) return;

  // 1. SMTP route (Localhost default)
  if (shouldUseSMTP()) {
    try {
      await transporter.sendMail({
        from: `PrintExpress <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html
      });
      console.log(`Email sent to ${to} via Gmail SMTP.`);
      return;
    } catch (error) {
      console.error('Error sending email via Gmail SMTP:', error);
      // Fallback to HTTP APIs if SMTP fails
    }
  }

  // 2. SendGrid REST API route (Free Single Sender Verification, works on Render)
  if (process.env.SENDGRID_API_KEY && sendgridSender) {
    try {
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: to }] }],
          from: { email: sendgridSender, name: 'PrintExpress' },
          subject: subject,
          content: [{ type: 'text/html', value: html }]
        })
      });

      if (response.ok) {
        console.log(`Email sent to ${to} via SendGrid API.`);
        return;
      } else {
        const errText = await response.text();
        console.error('SendGrid API returned error:', errText);
      }
    } catch (error) {
      console.error('Error sending email via SendGrid API:', error);
    }
  }

  // 3. Resend REST API route (Default fallback, works on Render)
  try {
    const data = await resend.emails.send({
      from: `PrintExpress <${resendSender}>`,
      to,
      subject,
      html
    });
    console.log(`Email sent to ${to} via Resend. ID: ${data.id}`);
  } catch (error) {
    console.error('Error sending email via Resend:', error);
  }
}

async function sendWelcomeEmail(userEmail, userName) {
  await sendEmail({
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
}

async function sendPrintReadyEmail(userEmail, userName, orderId) {
  await sendEmail({
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
}

async function sendPasswordResetEmail(userEmail, userName, resetLink) {
  await sendEmail({
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
}

module.exports = {
  sendWelcomeEmail,
  sendPrintReadyEmail,
  sendPasswordResetEmail
};
