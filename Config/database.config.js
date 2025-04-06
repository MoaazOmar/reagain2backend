const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    console.log('Attempting to connect to MongoDB with URI:', uri?.replace(/:([^:@]+)@/, ':****@'));
    if (!uri) {
      throw new Error('MONGODB_URI environment variable is not set');
    }

    if (mongoose.connection.readyState === 1) {
      console.log('Using existing MongoDB connection');
      return;
    }

    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      keepAlive: true,
      // Keep your options if they’re intentional
      tls: true,
      tlsAllowInvalidCertificates: false,
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    throw error; // Fail fast
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
  } catch (err) {
    console.error('MongoDB disconnection error:', err.message);
  }
};

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err.message);
});

mongoose.connection.on('connected', () => {
  console.log('MongoDB reconnected');
});

module.exports = { connectDB, disconnectDB };