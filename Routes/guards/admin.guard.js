const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) {
        console.log('No token provided');
        return res.redirect('/');
    }

    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, decoded) => {
        if (err || !decoded.isAdmin) {
            console.log('Not an admin or invalid token');
            return res.redirect('/');
        }
        req.user = decoded; // Attach user data
        next();
    });
};