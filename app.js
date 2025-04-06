const express = require('express');
const cors = require('cors');
const path = require('path');
const { connectDB } = require('./Config/database.config');
const app = express();
const port = process.env.PORT || 8000;
console.log('Using port:', port);

const homeRouter = require('./Routes/home.route');
const productRouter = require('./Routes/singleProduct.route');
const allProductRouter = require('./Routes/products.route');
const authRouter = require('./Routes/auth.route');
const cartRouter = require('./Routes/cart.route');
const adminRouter = require('./Routes/admin.route');
const formRouter = require('./Routes/form.route');
const orderRouter = require('./Routes/order.route');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'assets')));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use(express.static(path.join(__dirname, 'public')));

app.use(cors({
  origin: 'https://moaazomar.github.io',
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Authorization']
}));
app.set('trust proxy', 1);

app.use((req, res, next) => {
  console.log('Request URL:', req.url);
  console.log('Request Headers:', req.headers);
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

const startServer = async () => {
  try {
    await connectDB(); // Single connection at startup
    server.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();