const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/db');

// Import routes
const productRoutes = require('./routes/productRoutes');
const authRoutes = require('./routes/authRoutes');
const reportRoutes = require('./routes/reportRoutes');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

// Initialize express app
const app = express();

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://inventory-system-vmms.vercel.app'] // Change this to your Vercel domain
    : ['http://localhost:3000'],
  credentials: true
}));
app.use(express.json());
app.use(morgan('dev'));

// Log requests for debugging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  console.log('Headers:', req.headers.authorization ? 
    { ...req.headers, authorization: 'Bearer [TOKEN]' } : 
    req.headers);
  
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Body:', { ...req.body, password: req.body.password ? '[REDACTED]' : undefined });
  }
  
  next();
});

// Routes
app.use('/api/products', productRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/reports', reportRoutes);

// Base route
app.get('/', (req, res) => {
  res.send('Inventory Management System API is running');
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    message: 'An unexpected error occurred',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Find an available port
const startServer = async () => {
  // Start with the configured port
  let PORT = process.env.PORT || 3001;
  const initialPort = PORT;
  let server;
  let attempts = 0;
  
  while (attempts < 10) {
    try {
      server = await new Promise((resolve, reject) => {
        const srv = app.listen(PORT, () => {
          console.log(`\n=== SERVER STARTED SUCCESSFULLY ===`);
          console.log(`Server running on port ${PORT}`);
          console.log(`Environment: ${process.env.NODE_ENV}`);
          console.log(`MongoDB URI: ${process.env.MONGO_URI.substring(0, 20)}...`);
          console.log(`API URL: http://localhost:${PORT}/api`);
          console.log(`=== REMEMBER TO UPDATE YOUR FRONTEND ENV ===`);
          console.log(`If the frontend is still using port ${initialPort} but the server started on port ${PORT},`);
          console.log(`update your frontend/.env.local NEXT_PUBLIC_API_URL to http://localhost:${PORT}/api`);
          console.log(`================================================\n`);
          resolve(srv);
        }).on('error', (err) => {
          if (err.code === 'EADDRINUSE') {
            console.log(`Port ${PORT} is in use, trying next port...`);
            reject(err);
          } else {
            reject(err);
          }
        });
      });
      return server;
    } catch (error) {
      PORT++;
      attempts++;
      if (attempts >= 10) {
        console.error('Could not find an available port after 10 attempts');
        process.exit(1);
      }
    }
  }
};

// Start the server
startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
}); 