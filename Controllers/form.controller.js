const { formModel } = require('../Models/form.model');
const { connectDB } = require('../Config/database.config');

// GET /api/form - Fetch form setup info
exports.getForm = async (req, res, next) => {
    try {
        res.status(200).json({
            message: 'Form data fetched successfully',
            isAdmin: req.session.user ? req.session.user.isAdmin : false,
            userId: req.session.user ? req.session.user.id : null
        });
    } catch (error) {
        console.error('Error fetching form data:', error);
        res.status(500).json({ message: 'Failed to load form data' });
    }
};

// POST /api/form - Submit form data
exports.postForm = async (req, res, next) => {
    try {
        await connectDB();
        const { custmorName, address } = req.body;

        if (!custmorName || !address) {
            return res.status(400).json({ message: 'Customer name and address are required.' });
        }

        const order = new formModel({
            custmorName,
            address,
            userID: req.session.user.id
        });
        await order.save();
        console.log('Order placed successfully!');

        res.status(201).json({ message: 'Order placed successfully!' });
    } catch (error) {
        console.error('Error during order placement:', error);
        res.status(500).json({ message: 'Failed to place the order. Please try again.' });
    }
};
