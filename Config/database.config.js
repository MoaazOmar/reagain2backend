const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Keep trying for 5 seconds
      socketTimeoutMS: 45000 // Close sockets after 45 seconds of inactivity
    });
    console.log('MongoDB connected');
    
    // Add event listeners for connection health
    mongoose.connection.on('connected', () => {
      console.log('MongoDB connection re-established');
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected! Attempting to reconnect...');
      setTimeout(connectDB, 5000); // Reconnect after 5 seconds
    });

  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};

const disconnectDB = async () => {
  try {
    // await mongoose.disconnect();
    console.log('MongoDB disconnected');
  } catch (err) {
    console.error('MongoDB disconnection error:', err);
  }
};

module.exports = { connectDB, disconnectDB };