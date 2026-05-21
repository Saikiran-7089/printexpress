const express = require('express');
const { register, login, getMe, logout } = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', verifyToken, getMe);
router.post('/logout', logout);

router.get('/test-email', async (req, res) => {
  try {
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: "saikiranguest1@gmail.com",
        pass: "pmasirjjcdsorzpl"
      }
    });
    await transporter.verify();
    res.json({ success: true, message: "SMTP connection successful!" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message, stack: error.stack, code: error.code });
  }
});

module.exports = router;
