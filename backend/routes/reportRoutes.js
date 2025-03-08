const express = require('express');
const router = express.Router();
const { 
  getInventorySummary,
  getTransactionHistory,
  getProductMovement,
  getLowStockAlerts
} = require('../controllers/reportController');
const { 
  authenticateUser, 
  authorizeAdmin,
  authorizeStaffOrAdmin
} = require('../middleware/auth');

// Get inventory summary
router.get('/inventory-summary', authenticateUser, (req, res, next) => {
  // In development mode, bypass staff/admin check if email is provided
  if (process.env.NODE_ENV === 'development' && (req.query.email || req.body.email)) {
    console.log('DEVELOPMENT: Bypassing staff/admin check for inventory summary');
    return next();
  }
  // Otherwise, enforce staff/admin check
  return authorizeStaffOrAdmin(req, res, next);
}, getInventorySummary);

// Get transaction history
router.get('/transaction-history', authenticateUser, (req, res, next) => {
  // In development mode, bypass staff/admin check if email is provided
  if (process.env.NODE_ENV === 'development' && (req.query.email || req.body.email)) {
    console.log('DEVELOPMENT: Bypassing staff/admin check for transaction history');
    return next();
  }
  // Otherwise, enforce staff/admin check
  return authorizeStaffOrAdmin(req, res, next);
}, getTransactionHistory);

// Get product movement report
router.get('/product-movement', authenticateUser, authorizeStaffOrAdmin, getProductMovement);

// Get low stock alerts report
router.get('/low-stock-alerts', authenticateUser, authorizeStaffOrAdmin, getLowStockAlerts);

module.exports = router; 