const express = require('express');
const router = express.Router();

const productController = require('../Controllers/products.controller')
router.get('/products/carousel', productController.getProductsAndCarouselProducts);
router.get('/categories' , productController.getDistinctCategoriesWithCounts)
router.get('/search' , productController.getSuggestionsProducts)
module.exports = router;