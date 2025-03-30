const mongoose = require('mongoose')

const connectDB = async () => {
    await mongoose.connect('mongodb://127.0.0.1:27017/online-shops');
}

const disconnectDB = async () => {
    try {
        // await mongoose.disconnect();
        console.log('MongoDB disconnected');
    } catch (err) {
        console.error('MongoDB disconnection error', err);
    }
};

module.exports = { connectDB, disconnectDB };
