const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoDB_URL = process.env.MONGODB_URI;

    if (!mongoDB_URL) {
      throw new Error('MongoDB connection string is missing from environment variables');
    }

    console.log('Attempting to connect to MongoDB...');
    
    await mongoose.connect(mongoDB_URL);
    console.log('Successfully connected to MongoDB Atlas');
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
