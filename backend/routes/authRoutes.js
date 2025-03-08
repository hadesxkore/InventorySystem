const express = require('express');
const router = express.Router();
const { 
  register, 
  login, 
  getProfile, 
  updateProfile, 
  getAllUsers 
} = require('../controllers/authController');
const { 
  authenticateUser, 
  authorizeAdmin 
} = require('../middleware/auth');

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/profile', authenticateUser, getProfile);
router.put('/profile', authenticateUser, updateProfile);

// Admin routes
router.get('/users', authenticateUser, authorizeAdmin, getAllUsers);

module.exports = router; 