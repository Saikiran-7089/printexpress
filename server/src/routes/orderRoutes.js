const express = require('express');
const { verifyToken, requireCustomer, requireAdmin } = require('../middleware/authMiddleware');
const { upload, ensureFreeSpace } = require('../middleware/uploadMiddleware');
const {
  uploadDocuments,
  checkout,
  processPayment,
  getCustomerOrders,
  getAdminQueue,
  updateOrderStatus,
  updateOrderConfig
} = require('../controllers/orderController');

const router = express.Router();

// Customer Endpoints
router.post('/upload', verifyToken, requireCustomer, ensureFreeSpace, upload.array('files', 10), uploadDocuments);
router.post('/checkout', verifyToken, requireCustomer, checkout);
router.post('/:orderId/pay', verifyToken, requireCustomer, ensureFreeSpace, upload.single('screenshot'), processPayment);
router.get('/my-orders', verifyToken, requireCustomer, getCustomerOrders);
router.patch('/:orderId/config', verifyToken, requireCustomer, updateOrderConfig);

// Admin Endpoints
router.get('/admin/queue', verifyToken, requireAdmin, getAdminQueue);
router.patch('/:orderId/status', verifyToken, requireAdmin, updateOrderStatus);

module.exports = router;
