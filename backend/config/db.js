const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Remove deprecated options for newer Mongoose versions
    const conn = await mongoose.connect(process.env.MONGO_URI);
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log(`Database Name: ${conn.connection.name}`);
    
    // Attempt to create a basic document in the products collection to verify write access
    try {
      const db = conn.connection.db;
      const productsCollection = db.collection('products');
      
      // Count existing documents
      const count = await productsCollection.countDocuments();
      console.log(`Current products count: ${count}`);
      
      // List all collections
      const collections = await db.listCollections().toArray();
      console.log('Available collections:', collections.map(c => c.name).join(', '));
      
    } catch (collectionError) {
      console.warn('Could not access collections:', collectionError.message);
    }
    
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB; 