// Simulated Email Notification Service

/**
 * Log a premium email layout to the server console simulating transactional mails
 * @param {string} userEmail - Destination recipient
 * @param {string} userName - Customer's name
 * @param {Object} order - Full database order model details
 * @param {string} status - New updated state
 */
function sendSimulatedStatusEmail(userEmail, userName, order, status) {
  const border = "==========================================================================";
  const logo = "                       🖨️  PRINTEXPRESS NOTIFICATIONS                     ";
  
  let customMessage = "";
  switch(status.toUpperCase()) {
    case 'PAID':
      customMessage = "Your payment was processed successfully! Your print order is queued for review.";
      break;
    case 'PRINTING':
      customMessage = "Good news! Our print operators have started printing your documents.";
      break;
    case 'READY':
      customMessage = "Your prints are ready! Please visit the pickup desk at our store to collect them.";
      break;
    case 'COMPLETED':
      customMessage = "Thank you for printing with PrintExpress! We hope you love the quality.";
      break;
    default:
      customMessage = `Your order status has been updated to: ${status}.`;
  }

  const parsedConfig = JSON.parse(order.configOptions || "{}");

  const emailBody = `
${border}
${logo}
${border}

Hi ${userName},

${customMessage}

Order Reference Details:
----------------------------------
Order ID:       ${order.id}
Pages:          ${order.totalPages}
Total Cost:     ₹${order.totalCost}
Payment Status: ${order.paymentStatus}
Order Status:   ${order.orderStatus}

Print Details:
- Sizing Option: ${parsedConfig.paperSize || 'A4'}
- Print Style:   ${parsedConfig.printType === 'COLOR' ? 'Color' : 'Black & White'}
- Layout:        ${parsedConfig.sides === 'double' ? 'Double-Sided' : 'Single-Sided'}
- Binding Type:  ${parsedConfig.binding || 'None'}
- Copies Ordered: ${parsedConfig.copies || 1}

If you have any questions, please contact our support team at support@printexpress.com.

Best Regards,
The PrintExpress Operations Team
${border}
`;

  console.log(emailBody);
}

module.exports = {
  sendSimulatedStatusEmail
};
