const express = require('express');
const router = express.Router();

const productController = require('../Controllers/products.controller')
// const upload            = require('../Config/multer.config')

// router.get('/' ,productController.getAllProducts)
// router.post('/' , upload.single('image') ,productController.createProduct)

router.get('/products/carousel', productController.getProductsAndCarouselProducts);
router.get('/categories' , productController.getDistinctCategoriesWithCounts)
router.get('/search' , productController.getSuggestionsProducts)
module.exports = router;