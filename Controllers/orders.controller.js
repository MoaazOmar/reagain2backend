const { ordersUser , createOrder } = require('../Models/order.model');
const {getItemsByUser , deleteAllCartProducts } = require('../Models/cart.model')

exports.getOrderUser = async (req, res, next) => {
    try {
        if (!req.session.user || !req.session.user.id) {
            return res.status(401).json({ message: 'User not logged in' }); // Return error if no user in session
        }
        
        let user = req.session.user.id;
        let orderUser = await ordersUser(user);
        res.status(200).json({ orders: orderUser }); // Make sure to return data in the correct format
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ message: 'Failed to fetch orders' });
        next(error);
    }
};


exports.placeOrder = async (req, res, next) => {
    try {
        console.log('Request body:', req.body); // Debug request body
        const userID = req.session.user.id;
        console.log('the new user after modification for code' , userID)
        // Fetch cart items
        const cartItems = await getItemsByUser(userID);
        console.log('Cart items from database:', cartItems);

        if (!cartItems || cartItems.length === 0) {
            return res.status(400).json({ message: 'Cart is empty' });
        }

        // Validate required fields
        if (!req.body.customerName || !req.body.address) {
            return res.status(400).json({ message: 'Customer name and address are required' });
        }

        const totalPrice = cartItems.reduce((sum, item) => sum + (item.price * item.amount), 0);

        const orderData = {
            userID: userID,
            customerName: req.body.customerName,
            address: req.body.address,
            totalPrice: totalPrice,
            status: 'Pending',  // Overall order status
            timestamp: new Date(),
            items: cartItems.map(item => ({
                productID: item.productID,
                name: item.name,
                price: item.price,
                amount: item.amount,
                image:item.image,
                color:item.color,
                status: 'Pending' // Status for each item
            }))
        };        
        const newOrder = await createOrder(orderData);
        await deleteAllCartProducts(userID); // Clear the cart after successful order creation

        return res.status(201).json({
            message: 'Order created successfully',
            order: newOrder
        });
    } catch (error) {
        console.error('Order creation failed:', error);
        return res.status(500).json({ message: 'Failed to create order' });
    }
};