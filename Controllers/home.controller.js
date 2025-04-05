const { getAllProducts, getProductsByCategory } = require('../Models/products.model');

exports.getHome = async (req, res, next) => {
    try {
        const limit = parseInt(req.query.limit) || 3;
        const skip = parseInt(req.query.skip) || 0;
        const gender = req.query.gender || '';
        console.log('Gender from request:', gender);
        console.log('Skip from request:', skip);

        const validGenders = ['Male', 'Female', 'Special'];
        let products;
        if (gender && validGenders.includes(gender)) {
            products = await getProductsByCategory(gender, limit, skip);
            console.log('Filtered Products:', products);
        } else {
            products = await getAllProducts(limit, skip);
            console.log('All Products:', products);
        }

        res.status(200).json(products);
    } catch (err) {
        console.error('Failed to fetch products', err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};