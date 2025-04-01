const express = require('express');
const router = express.Router();

const productController = require('../Controllers/products.controller');

router.get('/products/carousel', productController.getProductsAndCarouselProducts);
router.get('/categories', productController.getDistinctCategoriesWithCounts);
router.get('/search', productController.getSuggestionsProducts);

router.get('/test', (req, res) => {
    res.status(200).json({ message: 'Products route is working' });
});

module.exports = router;