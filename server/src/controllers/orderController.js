const { PrismaClient } = require('@prisma/client');
const { calculateInvoice, estimatePageCount } = require('../services/pricingService');
const { getFileUrl } = require('../middleware/uploadMiddleware');
const { sendOrderStatusUpdate, notifyAdminNewOrder } = require('../services/socketService');
const { sendSimulatedStatusEmail } = require('../services/notificationService');
const { sendPrintReadyEmail } = require('../services/emailService');
const { sendPushNotification } = require('../services/pushService');
const { PDFDocument } = require('pdf-lib');
const fs = require('fs');

const prisma = new PrismaClient();

/**
 * Handle document attachments. Automatically detects exact PDF pages and returns mock S3 links.
 */
async function uploadDocuments(req, res) {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No files were uploaded." });
    }

    const processedFiles = await Promise.all(req.files.map(async (file) => {
      const extension = file.originalname.split('.').pop().toLowerCase();
      let estimatedPages = 1;

      if (extension === 'pdf') {
        try {
          const bytes = fs.readFileSync(file.path);
          const pdfDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
          estimatedPages = pdfDoc.getPageCount();
        } catch (pdfErr) {
          console.error(`[uploadDocuments] Error parsing PDF ${file.originalname}:`, pdfErr);
          throw new Error(`Failed to read exact pages for ${file.originalname}. Please ensure the PDF is valid and not corrupted.`);
        }
      } else {
        estimatedPages = estimatePageCount(file.originalname, file.size);
      }

      const s3Url = getFileUrl(file, req);

      return {
        originalName: file.originalname,
        fileSize: file.size,
        estimatedPages,
        fileUrl: s3Url,
        tempDiskPath: file.filename
      };
    }));

    return res.status(200).json({
      message: "Files uploaded and processed successfully.",
      files: processedFiles
    });
  } catch (error) {
    console.error("[OrderController.uploadDocuments] Error:", error);
    return res.status(500).json({ error: error.message || "Failed to process uploaded files." });
  }
}

/**
 * Create Order Checkout (Calculates official pricing and stores PENDING payment order)
 */
async function checkout(req, res) {
  try {
    const { documents, binding, copies, paperSize, printType, sides } = req.body;

    if (!documents || !Array.isArray(documents) || documents.length === 0) {
      return res.status(400).json({ error: "Checkout requires at least one document configuration." });
    }

    // Prepare config options to store
    const configOptions = {
      paperSize: paperSize || 'A4',
      printType: printType || 'BW',
      sides: sides || 'single',
      binding: binding || 'NONE',
      copies: parseInt(copies) || 1,
      isEmergency: req.body.isEmergency || false
    };

    // Construct pricing documents payload matching the rules
    const pricingPayload = documents.map(doc => ({
      printType: configOptions.printType,
      paperSize: configOptions.paperSize,
      sides: configOptions.sides,
      binding: configOptions.binding,
      copies: configOptions.copies,
      isEmergency: configOptions.isEmergency,
      totalPages: parseInt(doc.totalPages) || 1,
      originalName: doc.originalName
    }));

    // Calculate dynamic cost breakdown
    const invoice = calculateInvoice(pricingPayload);

    // Create Order with PENDING state
    const order = await prisma.order.create({
      data: {
        userId: req.user.id,
        totalPages: pricingPayload.reduce((sum, d) => sum + (d.totalPages * configOptions.copies), 0),
        totalCost: invoice.total,
        paymentStatus: 'PENDING',
        orderStatus: 'PAID', // Stays as 'PAID' (Pending Approval) after payment is processed
        configOptions: JSON.stringify(configOptions),
        documents: {
          create: documents.map(doc => ({
            fileUrl: doc.fileUrl,
            originalName: doc.originalName,
            fileSize: parseInt(doc.fileSize) || 0,
            totalPages: parseInt(doc.totalPages) || 1
          }))
        }
      },
      include: {
        documents: true,
        user: true
      }
    });

    return res.status(201).json({
      message: "Checkout invoice generated. Order prepared for payment routing.",
      order,
      invoice
    });
  } catch (error) {
    console.error("[OrderController.checkout] Error:", error);
    return res.status(500).json({ error: "Failed to generate print checkout invoice." });
  }
}

/**
 * Simulate Payment Gateway Callback (Razorpay/Stripe look-alike callback)
 */
async function processPayment(req, res) {
  try {
    const { orderId } = req.params;
    const { simulatedCardNumber } = req.body; // Mock payment parameters

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true, documents: true }
    });

    if (!order) {
      return res.status(404).json({ error: "Order details not found." });
    }

    if (order.paymentStatus === 'PAID') {
      return res.status(400).json({ error: "This order has already been paid." });
    }

    // Use uploaded screenshot file name or generate fallback mock transaction reference
    const transactionId = req.file 
      ? req.file.filename 
      : 'pay_' + Math.random().toString(36).substring(2, 15) + Date.now();

    // Begin atomic transaction updates
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: 'PAID',
        orderStatus: 'PAID', // Initial stage post-payment is PAID (Pending Approval)
        transactions: {
          create: {
            gatewayTransactionId: transactionId,
            amount: order.totalCost,
            status: 'SUCCESS'
          }
        }
      },
      include: {
        documents: true,
        user: true,
        transactions: true
      }
    });

    // 1. Alert administrator queue dynamically via Socket.io
    notifyAdminNewOrder(updatedOrder);

    // 2. Alert customer visual tracking client via Socket.io
    sendOrderStatusUpdate(order.userId, order.id, 'PAID', updatedOrder);

    // 3. Log a detailed transactional mail representation
    sendSimulatedStatusEmail(order.user.registrationNumber, order.user.name, updatedOrder, 'PAID');

    return res.status(200).json({
      message: "Simulated payment transaction approved!",
      transactionId,
      order: updatedOrder
    });
  } catch (error) {
    console.error("[OrderController.processPayment] Error:", error);
    return res.status(500).json({ error: "Simulated transaction processing failed." });
  }
}

/**
 * Fetch orders for the logged-in customer
 */
async function getCustomerOrders(req, res) {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.user.id },
      include: {
        documents: true,
        transactions: true
      },
      orderBy: { createdAt: 'desc' }
    });

    const shopQueueCount = await prisma.order.count({
      where: {
        paymentStatus: 'PAID',
        orderStatus: {
          in: ['PAID', 'PRINTING']
        }
      }
    });

    return res.status(200).json({ orders, shopQueueCount });
  } catch (error) {
    console.error("[OrderController.getCustomerOrders] Error:", error);
    return res.status(500).json({ error: "Failed to load customer orders." });
  }
}

/**
 * Fetch all incoming orders for Administrator dashboard queue
 */
async function getAdminQueue(req, res) {
  try {
    const orders = await prisma.order.findMany({
      include: {
        user: {
          select: { name: true, registrationNumber: true }
        },
        documents: true,
        transactions: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.status(200).json({ orders });
  } catch (error) {
    console.error("[OrderController.getAdminQueue] Error:", error);
    return res.status(500).json({ error: "Failed to load admin queue." });
  }
}

/**
 * Update Order status (Admin action). Emits WebSocket status change and logs mock emails.
 */
async function updateOrderStatus(req, res) {
  try {
    const { orderId } = req.params;
    const { status } = req.body; // PAID, PRINTING, READY, COMPLETED

    const allowedStatuses = ['PAID', 'PRINTING', 'READY', 'COMPLETED'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ 
        error: `Invalid status: ${status}. Must be one of: ${allowedStatuses.join(', ')}` 
      });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true }
    });

    if (!order) {
      return res.status(404).json({ error: "Order details not found." });
    }

    // Update database state
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { orderStatus: status },
      include: {
        documents: true,
        user: true,
        transactions: true
      }
    });

    // 1. Broadcast Socket.io event alert
    sendOrderStatusUpdate(order.userId, order.id, status, updatedOrder);

    // 2. Output email log to system console
    sendSimulatedStatusEmail(order.user.registrationNumber, order.user.name, updatedOrder, status);
    
    // 2.5 Send email and push notification if manually set to READY
    if (status === 'READY') {
      if (updatedOrder.user.email) {
        sendPrintReadyEmail(updatedOrder.user.email, updatedOrder.user.name, updatedOrder.id);
      }
      sendPushNotification(
        updatedOrder.userId,
        'Your Print is Ready! 🎉',
        `Hi ${updatedOrder.user.name}, your print order is ready for pickup. Thank you for choosing PrintExpress!`,
        '/dashboard'
      );
    }

    // 3. Automated 5-minute update to READY
    if (status === 'PRINTING') {
      setTimeout(async () => {
        try {
          const autoUpdatedOrder = await prisma.order.update({
            where: { id: orderId },
            data: { orderStatus: 'READY' },
            include: { user: true }
          });
          sendOrderStatusUpdate(autoUpdatedOrder.userId, autoUpdatedOrder.id, 'READY', autoUpdatedOrder);
          sendSimulatedStatusEmail(autoUpdatedOrder.user.registrationNumber, autoUpdatedOrder.user.name, autoUpdatedOrder, 'READY');
          if (autoUpdatedOrder.user.email) {
            sendPrintReadyEmail(autoUpdatedOrder.user.email, autoUpdatedOrder.user.name, autoUpdatedOrder.id);
          }
          sendPushNotification(
            autoUpdatedOrder.userId,
            'Your Print is Ready! 🎉',
            `Hi ${autoUpdatedOrder.user.name}, your print order is ready for pickup. Thank you for choosing PrintExpress!`,
            '/dashboard'
          );
          console.log(`[OrderController.updateOrderStatus] Automatically updated order ${orderId} to READY after 5 minutes`);
        } catch (autoErr) {
          console.error(`[OrderController.updateOrderStatus] Error auto-updating order ${orderId}:`, autoErr);
        }
      }, 5 * 60 * 1000); // 5 minutes
    }

    return res.status(200).json({
      message: `Order status changed successfully to ${status}.`,
      order: updatedOrder
    });
  } catch (error) {
    console.error("[OrderController.updateOrderStatus] Error:", error);
    return res.status(500).json({ error: "Failed to update order status." });
  }
}

/**
 * Update dynamic printjob specifications for PENDING orders
 */
async function updateOrderConfig(req, res) {
  try {
    const { orderId } = req.params;
    const { binding, copies, paperSize, printType, sides } = req.body;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { documents: true }
    });

    if (!order) {
      return res.status(404).json({ error: "Order details not found." });
    }

    if (order.userId !== req.user.id) {
      return res.status(403).json({ error: "Access denied. Order belongs to another account." });
    }

    if (order.paymentStatus !== 'PENDING') {
      return res.status(400).json({ error: "Only unpaid, pending orders can have their configurations edited." });
    }

    // Merge new config options
    const existingConfig = JSON.parse(order.configOptions || "{}");
    const updatedConfig = {
      paperSize: paperSize || existingConfig.paperSize || 'A4',
      printType: printType || existingConfig.printType || 'BW',
      sides: sides || existingConfig.sides || 'single',
      binding: binding || existingConfig.binding || 'NONE',
      copies: copies !== undefined ? parseInt(copies) : (existingConfig.copies || 1),
      isEmergency: req.body.isEmergency !== undefined ? req.body.isEmergency : (existingConfig.isEmergency || false)
    };

    // Calculate recalculated total pages and cost invoice
    const pricingPayload = order.documents.map(doc => ({
      printType: updatedConfig.printType,
      paperSize: updatedConfig.paperSize,
      sides: updatedConfig.sides,
      binding: updatedConfig.binding,
      copies: updatedConfig.copies,
      isEmergency: updatedConfig.isEmergency,
      totalPages: doc.totalPages || 1,
      originalName: doc.originalName
    }));

    const invoice = calculateInvoice(pricingPayload);

    // Save updated values to database
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        totalPages: pricingPayload.reduce((sum, d) => sum + (d.totalPages * updatedConfig.copies), 0),
        totalCost: invoice.total,
        configOptions: JSON.stringify(updatedConfig)
      },
      include: {
        documents: true,
        transactions: true,
        user: true
      }
    });

    // Broadcast the configuration changes to the admin dashboard and customer in real-time
    sendOrderStatusUpdate(order.userId, order.id, order.orderStatus, updatedOrder);


    return res.status(200).json({
      message: "Print job specifications updated successfully!",
      order: updatedOrder,
      invoice
    });
  } catch (error) {
    console.error("[OrderController.updateOrderConfig] Error:", error);
    return res.status(500).json({ error: "Failed to update print job specifications." });
  }
}

module.exports = {
  uploadDocuments,
  checkout,
  processPayment,
  getCustomerOrders,
  getAdminQueue,
  updateOrderStatus,
  updateOrderConfig
};
