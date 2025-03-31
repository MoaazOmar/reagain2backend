const router = require('express').Router();
const { getSingleProduct, getRelatedProductsExcludingSelectedProduct, toggleDislikeProduct, toggleLikeProduct } = require('../Controllers/products.controller');
const { authGuard } = require('./guards/auth.guard');

router.get('/:id', getSingleProduct);
router.get('/:id/related', getRelatedProductsExcludingSelectedProduct);
router.post('/:id/like', toggleLikeProduct);
router.post('/:id/dislike', toggleDislikeProduct);

module.exports = router;