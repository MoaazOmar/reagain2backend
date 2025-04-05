const jwt = require('jsonwebtoken');
const { loginForUser } = require('../Models/auth.model');
const { validationResult } = require('express-validator');
const ADMIN_USER_IDS = require('../Config/isAdmin');

exports.postLogin = async (req, res, next) => {
    const { username, password } = req.body;

    try {
        const isValidUser = await loginForUser(username, password);
        if (isValidUser) {
            const isAdminUser = ADMIN_USER_IDS.includes(isValidUser._id.toString());
            const user = {
                id: isValidUser._id,
                username: isValidUser.username,
                email: isValidUser.email,
                isAdmin: isAdminUser
            };
            const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '1h' });
            return res.status(200).json({
                message: 'Logged in successfully!',
                token: token,
                user: user
            });
        }
        res.status(400).json({ message: 'Invalid credentials' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.postSignup = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: 'Validation failed',
            errors: errors.array().map(error => error.msg)
        });
    }

    const { username, email, password, confirmPassword } = req.body;
    if (password !== confirmPassword) {
        return res.status(400).json({ message: 'Passwords do not match!' });
    }

    try {
        const newUser = await createNewUser(username, email, password);
        const user = {
            id: newUser._id,
            username: newUser.username,
            email: newUser.email,
            isAdmin: ADMIN_USER_IDS.includes(newUser._id.toString())
        };
        const token = jwt.sign(user, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '1h' });
        res.status(201).json({ message: 'Signup successful!', token: token, user: user });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.logout = (req, res, next) => {
    // With JWT, logout is client-side only (clear token)
    res.status(200).json({ message: 'Logged out successfully' });
};