const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a product name'],
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please provide a product description'],
    maxlength: [1000, 'Description cannot be more than 1000 characters']
  },
  category: {
    type: String,
    required: [true, 'Please provide a category'],
    enum: ['Electronics', 'Office Supplies', 'Furniture', 'Kitchen', 'Other'],
  },
  price: {
    type: Number,
    required: [true, 'Please provide a price'],
    min: [0, 'Price cannot be negative']
  },
  quantity: {
    type: Number,
    required: [true, 'Please provide quantity'],
    min: [0, 'Quantity cannot be negative'],
    default: 0
  },
  unit: {
    type: String,
    required: [true, 'Please provide a unit'],
    enum: ['piece', 'box', 'kg', 'liter', 'meter', 'set'],
    default: 'piece'
  },
  minStockLevel: {
    type: Number,
    default: 10,
    min: [0, 'Minimum stock level cannot be negative']
  },
  location: {
    type: String,
    default: 'Main Warehouse'
  },
  supplier: {
    type: String,
    default: 'Default Supplier'
  },
  sku: {
    type: String,
    required: [true, 'Please provide a SKU'],
    unique: true,
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update updatedAt when document is modified
ProductSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual for stock status
ProductSchema.virtual('stockStatus').get(function() {
  if (this.quantity <= 0) {
    return 'Out of Stock';
  } else if (this.quantity <= this.minStockLevel) {
    return 'Low Stock';
  } else {
    return 'In Stock';
  }
});

// Method to check if product is low in stock
ProductSchema.methods.isLowStock = function() {
  return this.quantity <= this.minStockLevel;
};

module.exports = mongoose.model('Product', ProductSchema); 