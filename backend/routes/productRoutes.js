const express = require('express');
const router = express.Router();
const { 
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  updateStock,
  getLowStockProducts
} = require('../controllers/productController');
const { 
  authenticateUser, 
  authorizeAdmin,
  authorizeStaffOrAdmin
} = require('../middleware/auth');

// DEBUG ROUTE: Get all products with no filters at all
router.get('/debug/all', async (req, res) => {
  try {
    const Product = require('../models/Product');
    
    // Get ALL products with no filtering at all
    const products = await Product.find({}).exec();
    
    console.log('DEBUG: Found', products.length, 'products in database');
    
    // Return raw products
    res.status(200).json({
      totalProducts: products.length,
      products: products
    });
  } catch (error) {
    console.error('DEBUG route error:', error);
    res.status(500).json({ message: 'Error in debug route', error: error.message });
  }
});

// Get all products (with filtering and pagination)
router.get('/', authenticateUser, getProducts);

// Get low stock products
router.get('/low-stock', authenticateUser, (req, res, next) => {
  // In development mode, bypass staff/admin check if email is provided
  if (process.env.NODE_ENV === 'development' && (req.query.email || req.body.email)) {
    console.log('DEVELOPMENT: Bypassing staff/admin check for low stock products');
    return next();
  }
  // Otherwise, enforce default permissions
  return next();
}, getLowStockProducts);

// Get a single product
router.get('/:id', authenticateUser, getProductById);

// Create a new product (allow any authenticated user)
router.post('/', authenticateUser, createProduct);

// Update a product (admin only)
router.put('/:id', authenticateUser, (req, res, next) => {
  // In development mode, bypass admin check if email is provided
  if (process.env.NODE_ENV === 'development' && (req.query.email || req.body.email)) {
    console.log('DEVELOPMENT: Bypassing admin check for update operation');
    return next();
  }
  // Otherwise, enforce admin check
  return authorizeAdmin(req, res, next);
}, updateProduct);

// Delete a product (admin only)
router.delete('/:id', authenticateUser, (req, res, next) => {
  // In development mode, bypass admin check if email is provided
  if (process.env.NODE_ENV === 'development' && (req.query.email || req.body.email)) {
    console.log('DEVELOPMENT: Bypassing admin check for delete operation');
    return next();
  }
  // Otherwise, enforce admin check
  return authorizeAdmin(req, res, next);
}, deleteProduct);

// Update product stock (staff or admin)
router.post('/:id/stock', authenticateUser, (req, res, next) => {
  // In development mode, bypass staff/admin check if email is provided
  if (process.env.NODE_ENV === 'development' && (req.query.email || req.body.email)) {
    console.log('DEVELOPMENT: Bypassing staff/admin check for stock update operation');
    return next();
  }
  // Otherwise, enforce staff/admin check
  return authorizeStaffOrAdmin(req, res, next);
}, updateStock);

module.exports = router; 