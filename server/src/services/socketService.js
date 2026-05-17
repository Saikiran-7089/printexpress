const { Server } = require('socket.io');

let io = null;

/**
 * Initialize Socket.io Server
 * @param {Object} httpServer - HTTP Server instance
 * @param {string} clientUrl - Frontend client CORS origin URL
 */
function init(httpServer, clientUrl) {
  io = new Server(httpServer, {
    cors: {
      origin: clientUrl || "http://localhost:3000",
      methods: ["GET", "POST", "PATCH"],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log(`[Socket.io] Client connected: ${socket.id}`);

    // Join room for a specific customer's profile alerts
    socket.on('join_user', (userId) => {
      if (userId) {
        socket.join(userId);
        console.log(`[Socket.io] Client ${socket.id} joined user channel: ${userId}`);
      }
    });

    // Join room for an individual order tracking details
    socket.on('join_order', (orderId) => {
      if (orderId) {
        socket.join(orderId);
        console.log(`[Socket.io] Client ${socket.id} joined order channel: ${orderId}`);
      }
    });

    // Join admin broadcast alerts channel
    socket.on('join_admin', () => {
      socket.join('admin_channel');
      console.log(`[Socket.io] Administrator client ${socket.id} joined admin room.`);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.io] Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

/**
 * Expose initialized socket instance
 */
function getIO() {
  if (!io) {
    throw new Error("[Socket.io] Server was not initialized!");
  }
  return io;
}

/**
 * Send real-time order status update to matching customer channels
 * @param {string} userId - ID of the order creator
 * @param {string} orderId - ID of the order being processed
 * @param {string} status - New order status string
 * @param {Object} updatedOrder - Complete updated order database payload
 */
function sendOrderStatusUpdate(userId, orderId, status, updatedOrder) {
  if (!io) return;
  console.log(`[Socket.io] Broadcasting status '${status}' for order ${orderId} to user ${userId}`);
  
  // Broadcast to matching customer and order rooms
  io.to(userId).emit('order_status_updated', { orderId, status, order: updatedOrder });
  io.to(orderId).emit('order_status_updated', { orderId, status, order: updatedOrder });
  
  // Inform admin clients for dashboard sync
  io.to('admin_channel').emit('admin_order_updated', { orderId, status, order: updatedOrder });
}

/**
 * Notify all admins of a new order entry
 * @param {Object} order - Created order payload
 */
function notifyAdminNewOrder(order) {
  if (!io) return;
  console.log(`[Socket.io] Broadcasting incoming order entry: ${order.id}`);
  io.to('admin_channel').emit('new_order_received', order);
}

module.exports = {
  init,
  getIO,
  sendOrderStatusUpdate,
  notifyAdminNewOrder
};
