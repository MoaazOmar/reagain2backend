const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;
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
        ssl: true,
        tls: true,
        tlsAllowInvalidCertificates: false,
        serverSelectionTimeoutMS: 5000
    }
});

STORE.on('error', (error) => {
    console.error('Session store error:', error);
    console.warn('Falling back to in-memory session store due to MongoDB connection failure');
});

const sessionMiddleware = session({
    secret: process.env.SESSION_SECRET || 'this my secret hash express sessions to encrypt......',
    saveUninitialized: false,
    resave: false,
    store: STORE,
    cookie: { secure: process.env.NODE_ENV === 'production' }
});
app.use((req, res, next) => {
    console.log('Applying session middleware for:', req.url);
    sessionMiddleware(req, res, next);
});

app.use(express.json());

app.use(cors({
    origin: 'https://moaazomar.github.io',
    credentials: true
}));

app.use(flash());

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

console.log('Registering routes...');
app.use('/cart', cartRouter);
console.log('Cart route registered');
app.use('/auth', authRouter);
console.log('Auth route registered');
app.use('/product', productRouter);
console.log('Product route registered');
app.use('/products', allProductRouter);
console.log('Products route registered');
app.use('/admin', adminRouter);
console.log('Admin route registered');
app.use('/form', formRouter);
console.log('Form route registered');
app.use('/order', orderRouter);
console.log('Order route registered');
app.use('/', homeRouter);
console.log('Home route registered');

app.use((req, res, next) => {
    console.log('Route not found:', req.url);
    res.status(404).json({ message: `Cannot ${req.method} ${req.url}` });
});

app.use((err, req, res, next) => {
    console.error('Global error handler:', err.stack);
    res.status(500).json({ message: 'Internal Server Error', error: err.message });
});

connectToDB.connectDB();

server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});