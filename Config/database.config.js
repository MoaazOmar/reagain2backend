const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    console.log('Attempting to connect to MongoDB with URI:', uri); // Debug log
    if (!uri) {
      throw new Error("MONGODB_URI environment variable is not set");
    }
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
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