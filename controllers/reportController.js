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
      if (search) {
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
      if (type && type !== 'undefined') {
        filter.type = type;
      }
      
      // Filter by date range
      if (startDate || endDate) {
        filter.timestamp = {};
        if (startDate && startDate !== 'undefined') {
          filter.timestamp.$gte = new Date(startDate);
        }
        if (endDate && endDate !== 'undefined') {
          const endDateObj = new Date(endDate);
          endDateObj.setHours(23, 59, 59, 999);
          filter.timestamp.$lte = endDateObj;
        }
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
      
      if (!transactions) {
        console.log('No transactions found');
        return res.status(200).json(emptyResponse);
      }
      
      // Get total count for pagination
      const total = await Transaction.countDocuments(filter);
      
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
      
      console.log(`Found ${formattedTransactions.length} transactions`);
      
      res.status(200).json({
        transactions: formattedTransactions,
        summary,
        pagination: {
          total,
          page: Number(page),
          pages: Math.ceil(total / Number(limit)),
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