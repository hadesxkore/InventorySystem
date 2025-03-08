const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  type: {
    type: String,
    enum: ['stock-in', 'stock-out', 'adjustment', 'return'],
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  previousQuantity: {
    type: Number,
    required: true
  },
  newQuantity: {
    type: Number,
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  reference: {
    type: String,
    default: ''
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Static method to create a stock-in transaction
TransactionSchema.statics.createStockIn = async function(productId, quantity, reason, reference, userId) {
  const Product = mongoose.model('Product');
  const product = await Product.findById(productId);
  
  if (!product) {
    throw new Error('Product not found');
  }
  
  const previousQuantity = product.quantity;
  const newQuantity = previousQuantity + quantity;
  
  // Update product quantity
  await Product.findByIdAndUpdate(productId, { quantity: newQuantity });
  
  // Create transaction record
  return this.create({
    product: productId,
    type: 'stock-in',
    quantity,
    previousQuantity,
    newQuantity,
    reason,
    reference,
    performedBy: userId
  });
};

// Static method to create a stock-out transaction
TransactionSchema.statics.createStockOut = async function(productId, quantity, reason, reference, userId) {
  const Product = mongoose.model('Product');
  const product = await Product.findById(productId);
  
  if (!product) {
    throw new Error('Product not found');
  }
  
  if (product.quantity < quantity) {
    throw new Error('Insufficient stock');
  }
  
  const previousQuantity = product.quantity;
  const newQuantity = previousQuantity - quantity;
  
  // Update product quantity
  await Product.findByIdAndUpdate(productId, { quantity: newQuantity });
  
  // Create transaction record
  return this.create({
    product: productId,
    type: 'stock-out',
    quantity,
    previousQuantity,
    newQuantity,
    reason,
    reference,
    performedBy: userId
  });
};

module.exports = mongoose.model('Transaction', TransactionSchema); 