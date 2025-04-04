const express = require('express');
const router = express.Router();

const productController = require('../Controllers/products.controller');

// Add this route to handle GET /products
router.get('/', productController.getAllProducts);

// Existing routes
router.get('/featured', productController.getFeaturedCollections);
router.get('/main', productController.fetchMainProducts);
router.get('/categories', productController.getDistinctCategoriesWithCounts);
router.get('/search', productController.getSuggestionsProducts);

module.exports = router;