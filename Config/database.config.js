const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    console.log('Attempting to connect to MongoDB with URI:', uri);
    if (!uri) {
      throw new Error("MONGODB_URI environment variable is not set");
    }
    await mongoose.connect(uri, {
      tls: true,
      tlsAllowInvalidCertificates: false,
      serverSelectionTimeoutMS: 5000,
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully');

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });
  } catch (error) {
    console.error('MongoDB connection error:', error);
    console.warn('Failed to connect to MongoDB. Continuing without database connection...');
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