const mongoose = require('mongoose');
const {
    connectDB,
    disconnectDB
} = require('../Config/database.config');

// create schema 
// Update the schema to include custmorName and address
const orderSchema = new mongoose.Schema({
    userID: String,
    orderID: String,
    status: { type: String, enum: ['Pending', 'Shipped', 'Delivered', 'Cancelled'], default: 'Pending' },
    timestamp: { type: Date, default: Date.now },
    totalPrice: Number,
    customerName: String,
    address: String,
    items: [{ 
        productID: String,
        name: String,
        price: Number,
        amount: Number,
        image:String,
        color: String,
        status: { type: String, enum: ['Pending', 'Shipped', 'Delivered', 'Cancelled'], default: 'Pending' } // Include status here
    }]
});
const Order = mongoose.model('Order', orderSchema);

// Function To get  the Orders 

const getOrders = async () => {
    await connectDB();
    try {
        const orders = await Order.find();
        return orders;
    } catch (error) {
        console.error('Error fetching orders:', error);
        throw error;
    }
};


const updateTheStatus = async (orderId, status) => {
    await connectDB();
    try {
        const updatedStatusOrder = await Order.findByIdAndUpdate(orderId, {
            status: status
        }, {
            new: true
        });
        return updatedStatusOrder;
    } catch (error) {
        console.error('Error occures during status update:', error);
        throw error;
    }
};

const getOrderByStatus = async (status) => {
    await connectDB()
    try {
        const filteredStatusOrders = await Order.find({
            status: status
        })
        return filteredStatusOrders
    } catch (error) {
        console.error('Error occures during filtering:', error);
        throw error;

    }
}

const getOrderByNameOfCustomer = async (name) => {
    await connectDB()
    try {
        const filteredNameOrders = await Order.find({
            custmorName: {
                $regex: `^${name}`,
                $options: 'i'
            }
        });
        return filteredNameOrders
    } catch {
        console.error('Error occures during Searching name:', error);
        throw error;
    }
}

// function to display orders by single user 
const ordersUser = async (userID) => {
    await connectDB();
    try {
        const userOrder = await Order.find({
            userID: userID
        });
        return userOrder;
    } catch (error) {
        console.error("Error occurs during getting order:", error);
        throw error;
    }
};

const createOrder = async (orderData) => {
    await connectDB();
    try {
        const order = new Order(orderData);
        return await order.save();
    } catch (error) {
        console.error('Error creating order:', error);
        throw error;
    } 
};




module.exports = {
    Order,
    getOrders,
    updateTheStatus,
    getOrderByStatus,
    getOrderByNameOfCustomer,
    ordersUser,
    createOrder,
};