// Import core modules and libraries
const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose'); // If needed
const app = express();
const port = process.env.PORT || 8000;
console.log('Using port:', port);

// Import routers and other modules
const homeRouter = require('./Routes/home.route');
const connectToDB = require('./Config/database.config');
const productRouter = require('./Routes/singleProduct.route');
const allProductRouter = require('./Routes/products.route');
const authRouter = require('./Routes/auth.route');
const cartRouter = require('./Routes/cart.route');
const adminRouter = require('./Routes/admin.route');
const formRouter = require('./Routes/form.route');
const orderRouter = require('./Routes/order.route');

// Middleware for parsing URL-encoded and JSON bodies
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Serve static files from multiple folders
app.use(express.static(path.join(__dirname, 'assets')));
app.use(express.static(path.join(__dirname, 'images')));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use(express.static(path.join(__dirname, 'public')));

// Set up CORS with the required options
app.use(cors({
    origin: 'https://moaazomar.github.io',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Authorization']
}));

// Middleware to log requests for debugging
app.use((req, res, next) => {
    console.log('Request URL:', req.url);
    console.log('Request Headers:', req.headers);
    next();
});

// Set view engine and directory for views
app.set('view engine', 'ejs');
app.set('views', 'views');

// Create an HTTP server using the Express app
const http = require('http');
const server = http.createServer(app);

// Initialize Socket.IO with the HTTP server and proper CORS options
const { Server } = require('socket.io');
const io = new Server(server, {
    cors: {
        origin: 'https://moaazomar.github.io',
        methods: ['GET', 'POST'],
        credentials: true
    }
});

// Import and initialize your socket events after 'io' is created
// Adjust the path if your newComment.socket file is in a different directory
const newCommentSocket = require('./public/newComment.socket');
newCommentSocket(io);

// Optionally, set up any additional basic socket connections (e.g., for joining rooms)
io.on('connection', (socket) => {
    socket.on('joinRoom', (roomId) => {
        console.log('Socket joining room:', roomId);
        socket.join(roomId);
    });
});

// Register application routes
app.use('/cart', cartRouter);
app.use('/auth', authRouter);
app.use('/product', productRouter);
app.use('/products', allProductRouter);
app.use('/admin', adminRouter);
app.use('/form', formRouter);
app.use('/order', orderRouter);
app.use('/', homeRouter);

// Connect to your database
connectToDB.connectDB();

// Start the server and listen on the specified port
server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
