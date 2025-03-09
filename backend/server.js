const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/db');
const serverless = require('serverless-http');

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
  origin: '*', // Allow all origins in serverless environment
  credentials: true
}));
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/.netlify/functions/server/api/products', productRoutes);
app.use('/.netlify/functions/server/api/auth', authRoutes);
app.use('/.netlify/functions/server/api/reports', reportRoutes);

// Also support direct API paths for local development
app.use('/api/products', productRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/reports', reportRoutes);

// Base route
app.get('/.netlify/functions/server', (req, res) => {
  res.send('Inventory Management System API is running on Netlify Functions');
});

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

// Export the app and the serverless handler
module.exports = app;
module.exports.handler = serverless(app);
