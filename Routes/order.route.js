const orderController = require('../Controllers/orders.controller');
const router = require('express').Router();
const { check } = require('express-validator');
const authGuard = require('./guards/auth.guard');

// Correct way to reference the controller function
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
// order.route.js
router.get('/test', (req, res) => {
    res.status(200).json({ message: 'Route is working!' });
});
router.post('/cart/clear', (req, res) => {
    // Logic to clear the cart
    res.status(200).json({ message: 'Cart cleared successfully' });
});

module.exports = router;
