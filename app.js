const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
const port = process.env.PORT || 8000; // Updated to match logs
console.log('Using port:', port);
const fs = require('fs');

const homeRouter = require('./Routes/home.route');
const connectToDB = require('./Config/database.config');
const productRouter = require('./Routes/singleProduct.route');
const allProductRouter = require('./Routes/products.route');
const authRouter = require('./Routes/auth.route');
const cartRouter = require('./Routes/cart.route');
const adminRouter = require('./Routes/admin.route');
const formRouter = require('./Routes/form.route');
const orderRouter = require('./Routes/order.route');

const session = require('express-session');
const sessionStore = require('connect-mongodb-session')(session);
const flash = require('connect-flash');

app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'assets')));
app.use(express.static(path.join(__dirname, 'images')));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use(express.static(path.join(__dirname, 'public')));

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/online-shops';
console.log('Session store URI:', uri);
const STORE = new sessionStore({
    uri: uri,
    collection: 'sessions',
    connectionOptions: {
        tls: true,
        tlsAllowInvalidCertificates: false,
        serverSelectionTimeoutMS: 5000
    }
});

STORE.on('error', (error) => {
    console.error('Session store error:', error);
    console.warn('Falling back to in-memory session store due to MongoDB connection failure');
});
STORE.on('connected', () => {
    console.log('MongoDB session store connected successfully');
});
STORE.on('sessionSaved', (sid) => {
    console.log('Session saved to store:', sid);
});
STORE.on('sessionRetrieved', (sid) => {
    console.log('Session retrieved from store:', sid);
});

// Update session configuration
const sessionMiddleware = session({
    secret: process.env.SESSION_SECRET || 'this my secret hash express sessions to encrypt......',
    saveUninitialized: false,
    resave: false,
    store: STORE,
    cookie: {
        secure: true, // Required for HTTPS on Koyeb
        sameSite: 'none', // Required for cross-origin from GitHub Pages
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week
        // Removed domain to test exact host match
    }
});

// Add trust proxy setting at top of app.js
app.set('trust proxy', 1);

app.use(sessionMiddleware);

app.use(express.json());

app.use(cors({
    origin: 'https://moaazomar.github.io',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
    exposedHeaders: ['set-cookie']
}));

app.use(flash());
app.use((req, res, next) => {
    console.log('Session ID:', req.sessionID);
    console.log('Session Status:', req.session ? 'Exists' : 'Missing');
    console.log('Session User:', req.session?.user || 'Unauthenticated');
    console.log('Cookies:', req.headers.cookie || 'No cookies received');
    next();
});

app.set('view engine', 'ejs');
app.set('views', 'views');

const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server, {
    cors: {
        origin: 'https://moaazomar.github.io',
        methods: ['GET', 'POST'],
        credentials: true
    }
});

require('./public/newComment.socket')(io, sessionMiddleware);

io.on('connection', (socket) => {
    socket.on('joinRoom', (roomId) => {
        console.log('Socket joining room:', roomId);
        socket.join(roomId);
    });
});

app.use('/cart', cartRouter);
app.use('/auth', authRouter);
app.use('/product', productRouter);
app.use('/products', allProductRouter);
app.use('/admin', adminRouter);
app.use('/form', formRouter);
app.use('/order', orderRouter);
app.use('/', homeRouter);

connectToDB.connectDB();

server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});