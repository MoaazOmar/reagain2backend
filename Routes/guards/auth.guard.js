exports.preventAccessLogin = (req, res, next) => {
    if (!req.session.user) next();
    else res.redirect('/');
};

exports.isLoggedIn = (req, res, next) => {
    if (req.session.user) {
        console.log('User authenticated:', req.session.user);
        next();
    } else {
        console.log('User not authenticated, blocking access');
        res.status(401).json({ message: 'Unauthorized, please log in' });
    }
};