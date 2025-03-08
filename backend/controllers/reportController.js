const Product = require('../models/Product');
const Transaction = require('../models/Transaction');
const mongoose = require('mongoose');

// Generate inventory summary report
const getInventorySummary = async (req, res) => {
  try {
    // Get total products count
    const totalProducts = await Product.countDocuments();
    
    // Get total inventory value
    const inventoryValue = await Product.aggregate([
      {
        $group: {
          _id: null,
          totalValue: { $sum: { $multiply: ['$price', '$quantity'] } }
        }
      }
    ]);
    
    // Get stock status counts
    const outOfStock = await Product.countDocuments({ quantity: 0 });
    const lowStock = await Product.countDocuments({
      $expr: { 
        $and: [
          { $gt: ['$quantity', 0] },
          { $lte: ['$quantity', '$minStockLevel'] }
        ]
      }
    });
    const inStock = totalProducts - outOfStock - lowStock;
    
    // Get category distribution
    const categoryDistribution = await Product.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          value: { $sum: { $multiply: ['$price', '$quantity'] } }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);
    
    res.status(200).json({
      totalProducts,
      totalValue: inventoryValue.length > 0 ? inventoryValue[0].totalValue : 0,
      stockStatus: {
        outOfStock,
        lowStock,
        inStock
      },
      categoryDistribution
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Generate transaction history report
const getTransactionHistory = async (req, res) => {
  try {
    console.log('Fetching transaction history with params:', req.query);
    
    const { 
      search,
      type, 
      startDate, 
      endDate, 
      sortBy = 'timestamp', 
      sortOrder = 'desc',
      page = 1, 
      limit = 10 
    } = req.query;
    
    // Build filter object
    const filter = {};
    
    // Create empty response in case of errors
    const emptyResponse = {
      transactions: [],
      summary: [],
      pagination: {
        total: 0,
        page: Number(page),
        pages: 0,
        limit: Number(limit)
      }
    };
    
    try {
      // Search by product name or reference
      if (search && search !== 'undefined' && search.trim() !== '') {
        // First find products matching the search
        const products = await Product.find({
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { sku: { $regex: search, $options: 'i' } }
          ]
        });
        
        const productIds = products.map(p => p._id);
        
        // Search for either product IDs or reference matching search
        filter.$or = [
          { product: { $in: productIds } },
          { reference: { $regex: search, $options: 'i' } },
          { reason: { $regex: search, $options: 'i' } }
        ];
      }
      
      // Filter by transaction type
      if (type && type !== 'undefined' && type !== 'all' && type.trim() !== '') {
        filter.type = type;
      }
      
      // Filter by date range - ONLY add timestamp filter if we have valid dates
      if (startDate && startDate !== 'undefined' && startDate !== '') {
        // Initialize timestamp filter if not already done
        filter.timestamp = filter.timestamp || {};
        filter.timestamp.$gte = new Date(startDate);
      }
      
      if (endDate && endDate !== 'undefined' && endDate !== '') {
        // Initialize timestamp filter if not already done
        filter.timestamp = filter.timestamp || {};
        const endDateObj = new Date(endDate);
        endDateObj.setHours(23, 59, 59, 999);
        filter.timestamp.$lte = endDateObj;
      }
      
      // Don't add timestamp filter if it's empty
      if (filter.timestamp && Object.keys(filter.timestamp).length === 0) {
        delete filter.timestamp;
      }
      
      console.log('Using filter:', JSON.stringify(filter));
      
      // Calculate pagination
      const skip = (Number(page) - 1) * Number(limit);
      
      // Determine sort order
      const sort = {};
      sort[sortBy || 'timestamp'] = sortOrder === 'asc' ? 1 : -1;
      
      // Check if Transaction model exists
      if (!Transaction) {
        console.error('Transaction model not found');
        return res.status(200).json(emptyResponse);
      }
      
      // Execute query with pagination
      const transactions = await Transaction.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(Number(limit))
        .populate('product', 'name sku')
        .populate('performedBy', 'name email');
      
      if (!transactions || transactions.length === 0) {
        console.log('No transactions found');
        return res.status(200).json(emptyResponse);
      }
      
      console.log(`Found ${transactions.length} transactions`);
      
      // Format transactions for frontend
      const formattedTransactions = transactions.map(t => ({
        _id: t._id,
        productId: {
          _id: t.product?._id || '',
          name: t.product?.name || 'Unknown Product',
          sku: t.product?.sku || 'N/A'
        },
        type: t.type,
        quantity: t.quantity,
        previousQuantity: t.previousQuantity,
        currentQuantity: t.newQuantity,
        reason: t.reason,
        reference: t.reference,
        createdBy: {
          _id: t.performedBy?._id || '',
          name: t.performedBy?.name || 'System'
        },
        createdAt: t.timestamp
      }));
      
      // Get transaction summary by type
      const summary = await Transaction.aggregate([
        { $match: filter },
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 },
            totalQuantity: { $sum: '$quantity' }
          }
        }
      ]);
      
      console.log(`Successfully formatted ${formattedTransactions.length} transactions`);
      
      res.status(200).json({
        transactions: formattedTransactions,
        summary,
        pagination: {
          total: transactions.length,
          page: Number(page),
          pages: Math.ceil(transactions.length / Number(limit)),
          limit: Number(limit)
        }
      });
    } catch (innerError) {
      console.error('Database error in getTransactionHistory:', innerError);
      // Still return a 200 with empty data to avoid breaking the frontend
      res.status(200).json(emptyResponse);
    }
  } catch (error) {
    console.error('Error in getTransactionHistory:', error);
    // Return empty data structure instead of error
    res.status(200).json({
      transactions: [],
      summary: [],
      pagination: {
        total: 0,
        page: Number(req.query.page || 1),
        pages: 0,
        limit: Number(req.query.limit || 10)
      }
    });
  }
};

// Generate product movement report
const getProductMovement = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Build date filter
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.timestamp = {};
      if (startDate) dateFilter.timestamp.$gte = new Date(startDate);
      if (endDate) {
        const endDateObj = new Date(endDate);
        endDateObj.setHours(23, 59, 59, 999);
        dateFilter.timestamp.$lte = endDateObj;
      }
    }
    
    // Get product movement data
    const productMovement = await Transaction.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: {
            product: '$product',
            type: '$type'
          },
          totalQuantity: { $sum: '$quantity' },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.product',
          movements: {
            $push: {
              type: '$_id.type',
              quantity: '$totalQuantity',
              count: '$count'
            }
          }
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'productInfo'
        }
      },
      {
        $unwind: '$productInfo'
      },
      {
        $project: {
          _id: 1,
          name: '$productInfo.name',
          sku: '$productInfo.sku',
          currentStock: '$productInfo.quantity',
          movements: 1
        }
      }
    ]);
    
    res.status(200).json(productMovement);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Generate low stock alert report
const getLowStockAlerts = async (req, res) => {
  try {
    // Get low stock products
    const lowStockProducts = await Product.find({
      $expr: { $lte: ['$quantity', '$minStockLevel'] }
    })
    .sort({ quantity: 1 })
    .select('name sku category quantity minStockLevel price');
    
    // Calculate restock value
    let totalRestockValue = 0;
    const productsWithRestockInfo = lowStockProducts.map(product => {
      const quantityToRestock = product.minStockLevel * 2 - product.quantity;
      const restockValue = quantityToRestock * product.price;
      totalRestockValue += restockValue;
      
      return {
        _id: product._id,
        name: product.name,
        sku: product.sku,
        category: product.category,
        currentQuantity: product.quantity,
        minStockLevel: product.minStockLevel,
        quantityToRestock,
        restockValue
      };
    });
    
    res.status(200).json({
      products: productsWithRestockInfo,
      totalProducts: productsWithRestockInfo.length,
      totalRestockValue
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getInventorySummary,
  getTransactionHistory,
  getProductMovement,
  getLowStockAlerts
}; 