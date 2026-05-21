const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY || 're_P9fppdrV_Uwthauzk91dD2NpegW2pPTG9');

async function sendWelcomeEmail(userEmail, userName) {
  if (!userEmail) return;
  try {
    const data = await resend.emails.send({
      from: 'PrintExpress <onboarding@resend.dev>',
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
  try {
    const data = await resend.emails.send({
      from: 'PrintExpress <onboarding@resend.dev>',
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

module.exports = {
  sendWelcomeEmail,
  sendPrintReadyEmail
};
