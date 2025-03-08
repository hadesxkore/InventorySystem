const Product = require('../models/Product');
const Transaction = require('../models/Transaction');
const User = require('../models/User');

// Get all products with filtering and pagination
const getProducts = async (req, res) => {
  try {
    console.log('Getting products with query:', req.query);
    
    const { 
      search, 
      category, 
      minPrice, 
      maxPrice, 
      stockStatus,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1, 
      limit = 10 
    } = req.query;
    
    // Build filter object
    const filter = {};
    
    // Search by name or SKU
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Filter by category
    if (category && category !== 'undefined' && category !== 'all') {
      filter.category = category;
    }
    
    // Filter by price range
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }
    
    // Filter by stock status
    if (stockStatus && stockStatus !== 'undefined' && stockStatus !== 'all') {
      switch (stockStatus) {
        case 'out_of_stock':
          filter.quantity = 0;
          break;
        case 'low_stock':
          // Using $expr to compare fields within the same document
          filter.$expr = { 
            $and: [
              { $gt: ["$quantity", 0] },
              { $lte: ["$quantity", "$minStockLevel"] }
            ]
          };
          break;
        case 'in_stock':
          // Using $expr to compare fields within the same document
          filter.$expr = { $gt: ["$quantity", "$minStockLevel"] };
          break;
      }
    }
    
    console.log('Using filter:', JSON.stringify(filter));
    console.log('Sorting by:', sortBy, sortOrder);
    
    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    
    // Calculate pagination
    const skip = (Number(page) - 1) * Number(limit);
    
    // First, count all products in the database to debug
    const allProductsCount = await Product.countDocuments({});
    console.log('Total products in database:', allProductsCount);
    
    // Execute query with pagination
    const products = await Product.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(Number(limit))
      .populate('createdBy', 'name');
    
    console.log('Products found:', products.length);
    if (products.length > 0) {
      console.log('Sample product:', {
        id: products[0]._id,
        name: products[0].name,
        sku: products[0].sku
      });
    }
    
    // Get total count for pagination
    const total = await Product.countDocuments(filter);
    
    res.status(200).json({
      products,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
        limit: Number(limit)
      }
    });
  } catch (error) {
    console.error('Error getting products:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get a single product by ID
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('createdBy', 'name');
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Create a new product
const createProduct = async (req, res) => {
  try {
    console.log('Create product request:', req.body);
    
    // Process product data
    const productData = { ...req.body };
    
    // Set default values for any missing fields
    if (!productData.name) productData.name = 'Unnamed Product';
    if (!productData.description) productData.description = 'No description';
    if (!productData.category) productData.category = 'Uncategorized';
    if (!productData.price) productData.price = 0;
    if (!productData.quantity) productData.quantity = 0;
    if (!productData.unit) productData.unit = 'piece';
    if (!productData.minStockLevel) productData.minStockLevel = 0;
    if (!productData.location) productData.location = 'Main Warehouse';
    if (!productData.supplier) productData.supplier = 'Unknown Supplier';
    if (!productData.sku) productData.sku = `SKU-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // User identification logic
    let userId = null;
    
    // Check for user from Firebase auth (req.user from middleware)
    if (req.user && req.user._id) {
      console.log('Using authenticated user for product creation:', req.user.email);
      userId = req.user._id;
    } 
    // If no authenticated user, try to find or create by email
    else if (req.body.email) {
      const email = req.body.email;
      console.log('Attempting to find or create user by email:', email);
      
      // Look up user by email
      let user = await User.findOne({ email });
      
      // If user doesn't exist, create a new one
      if (!user) {
        console.log('User not found, creating new user with email:', email);
        user = await User.create({
          email,
          name: email.split('@')[0], // Simple default name from email
          password: Math.random().toString(36).slice(-10), // Random password
          role: 'staff'
        });
        console.log('Created new user:', user._id);
      } else {
        console.log('Found existing user:', user._id);
      }
      
      userId = user._id;
    }
    
    // If still no user, use admin 
    if (!userId) {
      console.log('No user identified, using default admin');
      const adminUser = await User.findOne({ role: 'admin' });
      if (adminUser) {
        userId = adminUser._id;
      } else {
        // Create admin if none exists
        const newAdmin = await User.create({
          email: 'admin@inventory.com',
          name: 'System Admin',
          password: 'admin123',
          role: 'admin'
        });
        userId = newAdmin._id;
        console.log('Created default admin user:', userId);
      }
    }
    
    // Add user to product data - using the correct field name
    productData.createdBy = userId;
    
    console.log('Creating product with final data:', { ...productData, createdBy: userId });
    
    // Create product
    const product = await Product.create(productData);
    
    console.log('Product created successfully:', product._id);
    res.status(201).json(product);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ message: 'Failed to create product', error: error.message });
  }
};

// Update a product
const updateProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      price,
      unit,
      minStockLevel,
      location,
      supplier,
      sku
    } = req.body;
    
    // Find product
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Check if SKU is being changed and already exists
    if (sku && sku !== product.sku) {
      const existingSku = await Product.findOne({ sku });
      if (existingSku) {
        return res.status(400).json({ message: 'SKU already exists' });
      }
    }
    
    // Update product fields
    if (name) product.name = name;
    if (description) product.description = description;
    if (category) product.category = category;
    if (price) product.price = price;
    if (unit) product.unit = unit;
    if (minStockLevel) product.minStockLevel = minStockLevel;
    if (location) product.location = location;
    if (supplier) product.supplier = supplier;
    if (sku) product.sku = sku;
    
    // Save updated product
    await product.save();
    
    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete a product
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Check if there are transactions for this product
    const transactions = await Transaction.countDocuments({ product: req.params.id });
    
    if (transactions > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete product with transaction history. Consider marking it as inactive instead.' 
      });
    }
    
    await product.deleteOne();
    
    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update product stock
const updateStock = async (req, res) => {
  try {
    const { quantity, type, reason, reference } = req.body;
    
    if (!quantity || !type || !reason) {
      return res.status(400).json({ message: 'Quantity, type, and reason are required' });
    }
    
    if (!['stock-in', 'stock-out', 'adjustment', 'return'].includes(type)) {
      return res.status(400).json({ message: 'Invalid transaction type' });
    }
    
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    let transaction;
    
    // Process based on transaction type
    switch (type) {
      case 'stock-in':
        transaction = await Transaction.createStockIn(
          product._id,
          quantity,
          reason,
          reference || '',
          req.user._id
        );
        break;
        
      case 'stock-out':
        transaction = await Transaction.createStockOut(
          product._id,
          quantity,
          reason,
          reference || '',
          req.user._id
        );
        break;
        
      case 'adjustment':
      case 'return':
        const previousQuantity = product.quantity;
        const newQuantity = type === 'adjustment' 
          ? Number(quantity) 
          : previousQuantity + Number(quantity);
        
        // Update product quantity
        product.quantity = newQuantity;
        await product.save();
        
        // Create transaction record
        transaction = await Transaction.create({
          product: product._id,
          type,
          quantity: Math.abs(newQuantity - previousQuantity),
          previousQuantity,
          newQuantity,
          reason,
          reference: reference || '',
          performedBy: req.user._id
        });
        break;
    }
    
    // Get updated product
    const updatedProduct = await Product.findById(req.params.id);
    
    res.status(200).json({
      product: updatedProduct,
      transaction
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get low stock products
const getLowStockProducts = async (req, res) => {
  try {
    const products = await Product.find({
      $expr: { $lte: ['$quantity', '$minStockLevel'] }
    }).populate('createdBy', 'name');
    
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  updateStock,
  getLowStockProducts
}; 