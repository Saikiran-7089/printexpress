require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const path = require('path');
const socketService = require('./services/socketService');
const authRoutes = require('./routes/authRoutes');
const orderRoutes = require('./routes/orderRoutes');

const app = express();
const server = http.createServer(app);

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

const PORT = process.env.PORT || 5000;
const CLIENT_URL = (process.env.CLIENT_URL || "http://localhost:3000").replace(/\/$/, "");

// Seeder for sandbox accounts
async function seedDefaultUsers() {
  try {
    const adminExists = await prisma.user.findUnique({
      where: { registrationNumber: 'admin' }
    });
    if (!adminExists) {
      const salt = await bcrypt.genSalt(10);
      const adminHash = await bcrypt.hash('password123', salt);
      await prisma.user.create({
        data: {
          name: 'Express Admin (Manager)',
          registrationNumber: 'admin',
          passwordHash: adminHash,
          role: 'ADMIN'
        }
      });
      console.log('🌱 [Seeder] Seeded default ADMIN user: registrationNumber "admin" / password123');
    }

    const customerExists = await prisma.user.findUnique({
      where: { registrationNumber: 'customer' }
    });
    if (!customerExists) {
      const salt = await bcrypt.genSalt(10);
      const customerHash = await bcrypt.hash('password123', salt);
      await prisma.user.create({
        data: {
          name: 'Alex Customer',
          registrationNumber: 'customer',
          passwordHash: customerHash,
          role: 'CUSTOMER'
        }
      });
      console.log('🌱 [Seeder] Seeded default CUSTOMER user: registrationNumber "customer" / password123');
    }
  } catch (err) {
    console.error('❌ [Seeder] Failed to seed default users:', err.message);
  }
}

// Enable CORS
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or server-to-server)
    if (!origin) return callback(null, true);
    
    // Dynamic matching for development, LAN testing, and public tunnels
    if (
      origin.startsWith('http://localhost:') ||
      origin.startsWith('http://127.0.0.1:') ||
      origin.startsWith('http://192.168.') ||
      origin.endsWith('.loca.lt') ||
      origin.endsWith('.ngrok-free.app') ||
      origin === CLIENT_URL
    ) {
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}));

// Express Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve local uploads folder as static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health Check
app.get('/health', (req, res) => {
  return res.status(200).json({ status: "ok", service: "PrintExpress Server" });
});

// Mounting API Routes
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);

// Socket.io initialization
socketService.init(server, CLIENT_URL);

// Base Error Handler
app.use((err, req, res, next) => {
  console.error("[Server Error Handler] Captured:", err.message);
  return res.status(500).json({ 
    error: err.message || "An unexpected error occurred on the print server." 
  });
});

// Launch server listener
server.listen(PORT, async () => {
  console.log(`========================================================`);
  console.log(`🚀 PRINTEXPRESS SERVER INITIALIZED ON PORT: ${PORT}`);
  console.log(`💻 Local Sandbox Origin Allowed: ${CLIENT_URL}`);
  console.log(`📁 Upload Documents Path: ${path.join(__dirname, '../uploads')}`);
  console.log(`========================================================`);
  await seedDefaultUsers();
});
