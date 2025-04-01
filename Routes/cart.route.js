const router = require('express').Router();
const { check } = require('express-validator');
const cartController = require('../Controllers/cart.controller');
const authGuard = require('./guards/auth.guard');

router.get('/', authGuard.isLoggedIn, cartController.getCart);

router.post('/', 
    authGuard.isLoggedIn,
    check("amount").not().isEmpty().withMessage("The amount is required").isInt({ min: 1 }).withMessage("The minimum amount must be at least 1"),
    cartController.postCart
);

router.post('/save', 
    authGuard.isLoggedIn,
    check("amount").not().isEmpty().withMessage("The amount is required").isInt({ min: 1 }).withMessage("The minimum amount must be at least 1"),
    cartController.postSave
);

router.post('/delete', authGuard.isLoggedIn, cartController.postDelete);

router.post('/clear', authGuard.isLoggedIn, (req, res, next) => {
    console.log('Session user when clearing cart:', req.session.user);
    if (!req.session.user) {
        return res.status(401).send({ message: 'Unauthorized access, please log in.' });
    }
    next();
}, cartController.postClearItems);

router.get('/checkout', authGuard.isLoggedIn, cartController.getCheckout);

router.get('/test', (req, res) => {
    res.status(200).json({ message: 'Cart route is working' });
});

module.exports = router;