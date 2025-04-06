const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const uri = process.env.MONGODB_URI;
        if (!uri) {
            throw new Error('MONGODB_URI environment variable is not set');
        }
        console.log('Attempting to connect to MongoDB with URI:', uri);
        await mongoose.connect(uri, {
            tls: true,
            tlsAllowInvalidCertificates: false,
            serverSelectionTimeoutMS: 5000,
            useNewUrlParser: true,
            useUnifiedTopology: true,
            autoReconnect: true,           // Enable automatic reconnection
            reconnectTries: Number.MAX_VALUE, // Retry indefinitely
            reconnectInterval: 1000,       // Retry every 1 second
            maxPoolSize: 10                // Maintain a connection pool
        });
        console.log('MongoDB connected successfully');

        // Event listeners for connection state changes
        mongoose.connection.on('disconnected', () => {
            console.log('MongoDB disconnected');
        });
        mongoose.connection.on('error', (err) => {
            console.error('MongoDB connection error:', err);
        });
        mongoose.connection.on('reconnected', () => {
            console.log('MongoDB reconnected');
        });
    } catch (error) {
        console.error('MongoDB connection error:', error);
        throw error; // Rethrow the error to be caught in app.js
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