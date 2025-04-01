const orderController = require('../Controllers/orders.controller');
const router = require('express').Router();
const { check } = require('express-validator');
const authGuard = require('./guards/auth.guard');

router.get('/', orderController.getOrderUser);
router.post(
    '/create', 
    authGuard.isLoggedIn, 
    [
        check('customerName').notEmpty().withMessage('Customer name is required').trim(),
        check('address').notEmpty().withMessage('Address is required').trim()
    ], 
    orderController.placeOrder
);

router.get('/test', (req, res) => {
    res.status(200).json({ message: 'Order route is working!' });
});

router.post('/cart/clear', (req, res) => {
    res.status(200).json({ message: 'Cart cleared successfully' });
});

module.exports = router;