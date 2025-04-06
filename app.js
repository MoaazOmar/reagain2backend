// Import core modules and libraries
const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const connectToDB = require('./Config/database.config');

// Initialize Express app and HTTP server
const app = express();
const server = http.createServer(app);

// Initialize Socket.IO with CORS options
const io = new Server(server, {
  cors: {
    origin: 'https://moaazomar.github.io', // Your production frontend origin
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Import routers and other modules
const homeRouter = require('./Routes/home.route');
const productRouter = require('./Routes/singleProduct.route');
const allProductRouter = require('./Routes/products.route');
const authRouter = require('./Routes/auth.route');
const cartRouter = require('./Routes/cart.route');
const adminRouter = require('./Routes/admin.route');
const formRouter = require('./Routes/form.route');
const orderRouter = require('./Routes/order.route');
const newCommentSocket = require('./public/newComment.socket');

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

// Socket.io setup
newCommentSocket(io);

// Optionally, set up basic socket connections (e.g., for joining rooms)
// This duplicates logic in newComment.socket.js, so you can remove it if not needed elsewhere
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

// Start the server after MongoDB connection
const port = process.env.PORT || 8000;
console.log('Using port:', port);

connectToDB.connectDB()
  .then(() => {
    server.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  })
  .catch(err => {
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1);
  });

// Optional: Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

module.exports = app;