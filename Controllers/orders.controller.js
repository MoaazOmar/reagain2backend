const { ordersUser, createOrder } = require('../Models/order.model');
const { getItemsByUser, deleteAllCartProducts } = require('../Models/cart.model');

exports.getOrderUser = async (req, res, next) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: 'User not logged in' });
        }
        
        const userId = req.user.id;
        const orderUser = await ordersUser(userId);
        res.status(200).json({ orders: orderUser });
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ message: 'Failed to fetch orders' });
        next(error);
    }
};

exports.placeOrder = async (req, res, next) => {
    try {
        console.log('Request body:', req.body);
        const userId = req.user.id;
        console.log('User ID from token:', userId);

        const cartItems = await getItemsByUser(userId);
        console.log('Cart items from database:', cartItems);

        if (!cartItems || cartItems.length === 0) {
            return res.status(400).json({ message: 'Cart is empty' });
        }

        if (!req.body.customerName || !req.body.address) {
            return res.status(400).json({ message: 'Customer name and address are required' });
        }

        const totalPrice = cartItems.reduce((sum, item) => sum + (item.price * item.amount), 0);

        const orderData = {
            userID: userId,
            customerName: req.body.customerName,
            address: req.body.address,
            totalPrice: totalPrice,
            status: 'Pending',
            timestamp: new Date(),
            items: cartItems.map(item => ({
                productID: item.productID,
                name: item.name,
                price: item.price,
                amount: item.amount,
                image: item.image,
                status: 'Pending'
            }))
        };        
        const newOrder = await createOrder(orderData);
        await deleteAllCartProducts(userId);

        return res.status(201).json({
            message: 'Order created successfully',
            order: newOrder
        });
    } catch (error) {
        console.error('Order creation failed:', error);
        return res.status(500).json({ message: 'Failed to create order' });
    }
};