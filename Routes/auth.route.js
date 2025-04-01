const router = require('express').Router();
const { check } = require('express-validator');
const authController = require('../Controllers/auth.controller');
const authGuard = require('./guards/auth.guard');
const bodyParser = require('body-parser');

const bodyParserMW = bodyParser.urlencoded({ extended: true });

router.get('/signup', authController.getSignup);
router.post('/signup',
    bodyParserMW,
    [
        check('username').notEmpty().withMessage('Username is required'),
        check('email').isEmail().withMessage('Enter a valid email'),
        check('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
        check('confirmPassword').custom((value, { req }) => {
            if (value !== req.body.password) {
                throw new Error("Passwords don't match");
            }
            return true;
        })
    ],
    authController.postSignup
);

router.get('/login', authController.getLogin);
router.post('/login', bodyParserMW, authController.postLogin);

router.all('/logout', authController.logout);

router.get('/test', (req, res) => {
    res.status(200).json({ message: 'Auth route is working' });
});

module.exports = router;