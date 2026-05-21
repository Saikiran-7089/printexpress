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
    const { Resend } = require('resend');
    const resend = new Resend('re_P9fppdrV_Uwthauzk91dD2NpegW2pPTG9');
    const data = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: 'saikirangoud152@gmail.com',
      subject: 'Test API Connection',
      html: '<p>API is working</p>'
    });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message, stack: error.stack });
  }
});

router.get('/reset-test-account', async (req, res) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    await prisma.user.deleteMany({
      where: { email: 'saikirangoud152@gmail.com' }
    });
    res.json({ success: true, message: 'Deleted saikirangoud152@gmail.com account so you can register again.' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
