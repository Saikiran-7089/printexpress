const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendWelcomeEmail, sendPasswordResetEmail } = require('../services/emailService');

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "printexpress_ultra_secret_key";

/**
 * Register a new User
 */
async function register(req, res) {
  try {
    const { name, email, registrationNumber, password, role } = req.body;

    if (!name || !registrationNumber || !password) {
      return res.status(400).json({ error: "Missing required fields (name, registrationNumber, password)." });
    }

    // Security check: Block anyone from registering with the username 'admin'
    if (registrationNumber.toLowerCase().trim() === 'admin') {
      return res.status(403).json({ error: "Reserved username. Cannot register as admin." });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { registrationNumber: registrationNumber.toLowerCase().trim() }
    });

    if (existingUser) {
      return res.status(400).json({ error: "A user with this registration number already exists." });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Force role to CUSTOMER - admins can only be created via backend seed script
    const userRole = 'CUSTOMER';

    // Save user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        registrationNumber: registrationNumber.toLowerCase().trim(),
        passwordHash,
        role: userRole
      }
    });

    // Send Welcome Email
    if (email) {
      sendWelcomeEmail(email, name);
    }

    // Sign Token
    const token = jwt.sign(
      { id: user.id, name: user.name, registrationNumber: user.registrationNumber, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Set secure cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    return res.status(201).json({
      message: "Registration successful!",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        registrationNumber: user.registrationNumber,
        role: user.role,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error("[AuthController.register] Error:", error);
    return res.status(500).json({ error: "Internal server error occurred during registration." });
  }
}

/**
 * Log in an existing User
 */
async function login(req, res) {
  try {
    const { registrationNumber, password, role } = req.body;

    if (!registrationNumber || !password) {
      return res.status(400).json({ error: "Missing registration number or password." });
    }

    // Find User
    const user = await prisma.user.findUnique({
      where: { registrationNumber: registrationNumber.toLowerCase().trim() }
    });

    if (!user) {
      return res.status(400).json({ error: "Invalid registration number or password credentials." });
    }

    // Optional explicit role check
    if (role && user.role !== role) {
      return res.status(403).json({ error: "Access denied. Insufficient privileges for this portal." });
    }

    // Check Password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid registration number or password credentials." });
    }

    // Sign Token
    const token = jwt.sign(
      { id: user.id, name: user.name, registrationNumber: user.registrationNumber, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Set secure cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    return res.status(200).json({
      message: "Login successful!",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        registrationNumber: user.registrationNumber,
        role: user.role,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error("[AuthController.login] Error:", error);
    return res.status(500).json({ error: "Internal server error occurred during login." });
  }
}

/**
 * Get current logged in user details
 */
async function getMe(req, res) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    if (!user) {
      return res.status(404).json({ error: "User profile not found." });
    }

    return res.status(200).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        registrationNumber: user.registrationNumber,
        role: user.role,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error("[AuthController.getMe] Error:", error);
    return res.status(500).json({ error: "Failed to fetch user profile." });
  }
}

/**
 * Log out user (Clear Cookie)
 */
async function logout(req, res) {
  res.clearCookie('token');
  return res.status(200).json({ message: "Successfully logged out." });
}

/**
 * Request Password Reset (Forgot Password)
 */
async function forgotPassword(req, res) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email address is required." });
    }

    // Check if user is registered with this email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    });

    if (!user) {
      return res.status(404).json({ error: "This email address is not registered." });
    }

    // Generate secure token and set 15 minute expiry
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Update user
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: token,
        resetPasswordExpires: expires
      }
    });

    // Send reset link email
    const clientUrl = (process.env.CLIENT_URL || "http://localhost:3000").replace(/\/$/, "");
    const resetLink = `${clientUrl}/reset-password/${token}`;
    
    // Print reset link directly in terminal for easy sandbox testing/recovery
    console.log(`\n==========================================================================`);
    console.log(`🔑 [AuthController] PASSWORD RESET LINK GENERATED FOR USER: ${user.name}`);
    console.log(`📧 Recipient Email: ${user.email}`);
    console.log(`🔗 Reset URL Link:  ${resetLink}`);
    console.log(`==========================================================================\n`);

    await sendPasswordResetEmail(user.email, user.name, resetLink);

    return res.status(200).json({
      message: "A password reset link has been sent to your email."
    });
  } catch (error) {
    console.error("[AuthController.forgotPassword] Error:", error);
    return res.status(500).json({ error: "Internal server error occurred." });
  }
}

/**
 * Reset Password using Token
 */
async function resetPassword(req, res) {
  try {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;

    if (!password || !confirmPassword) {
      return res.status(400).json({ error: "Please provide both new password and confirmation." });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: "Passwords do not match." });
    }

    // Password strength validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        error: "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character."
      });
    }

    // Find valid, non-expired token user
    const user = await prisma.user.findUnique({
      where: { resetPasswordToken: token }
    });

    if (!user || !user.resetPasswordExpires || new Date() > user.resetPasswordExpires) {
      return res.status(400).json({ error: "Invalid or expired password reset token." });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Update user password and clear token fields
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetPasswordToken: null,
        resetPasswordExpires: null
      }
    });

    return res.status(200).json({
      message: "Password reset successfully. Please log in with your new password."
    });
  } catch (error) {
    console.error("[AuthController.resetPassword] Error:", error);
    return res.status(500).json({ error: "Internal server error occurred during password reset." });
  }
}

module.exports = {
  register,
  login,
  getMe,
  logout,
  forgotPassword,
  resetPassword
};
