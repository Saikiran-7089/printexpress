const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendWelcomeEmail } = require('../services/emailService');

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

module.exports = {
  register,
  login,
  getMe,
  logout
};
