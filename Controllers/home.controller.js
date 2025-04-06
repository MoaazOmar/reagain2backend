const {
    getAllProducts,
    getProductsByCategory
} = require('../Models/products.model');
const mongoose = require('mongoose');

exports.getHome = async (req, res, next) => {
    try {
        const limit = parseInt(req.query.limit) || 3;
        const skip = parseInt(req.query.skip) || 0;
        const gender = req.query.gender || '';
        console.log('Gender from request:', gender);
        console.log('Skip from request:', skip);
        console.log('MongoDB readyState before query:', mongoose.connection.readyState);

        const validGenders = ['Male', 'Female', 'Special'];
        let products;
        if (gender && validGenders.includes(gender)) {
            products = await getProductsByCategory(gender, limit, skip);
            console.log('Filtered Products:', products.length);
        } else {
            products = await getAllProducts(limit, skip);
            console.log('All Products:', products.length);
        }
        console.log('Sending response with products:', products.length);
        res.status(200).json(products);
    } catch (err) {
        console.error('Failed to fetch products:', err.message, err.stack);
        res.status(500).json({
            message: 'Failed to fetch products',
            error: err.message
        });
    }
};