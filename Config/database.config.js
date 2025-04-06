const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Check if already connected
    if (mongoose.connection.readyState === 1) {
      console.log('Using existing MongoDB connection');
      return;
    }

    const uri = process.env.MONGODB_URI;
    console.log('Attempting to connect to MongoDB with URI:', uri.replace(/:([^:@]+)@/, ':****@')); // Mask password
    if (!uri) {
      throw new Error('MONGODB_URI environment variable is not set');
    }

    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000, // Timeout for initial connection
      maxPoolSize: 10,               // Connection pool size
      keepAlive: true,               // Prevent disconnection
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    throw error; // Fail fast - let the app crash if DB isn’t available
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
  } catch (err) {
    console.error('MongoDB disconnection error:', err);
  }
};

module.exports = { connectDB, disconnectDB };