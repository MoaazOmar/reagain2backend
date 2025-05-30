const jwt = require('jsonwebtoken');

exports.preventAccessLogin = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return next(); // No token, allow access to login/signup

    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, decoded) => {
        if (!err) return res.redirect('/'); // If token is valid, redirect
        next(); // Invalid token, proceed to login
    });
};

exports.isLoggedIn = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  console.log('AuthGuard - Token received:', token); // Debug
  if (!token) {
    console.log('No token provided for URL:', req.url);
    return res.status(401).json({ message: 'Unauthorized. Please log in.' });
  }
  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, decoded) => {
    if (err) {
      console.log('Token verification failed:', err.message);
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
    req.user = decoded;
    next();
  });
};  
  