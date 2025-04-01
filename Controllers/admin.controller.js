const upload = require('../Config/multer.config');
const {
    getOrders,
    Order,
    updateTheStatus,
    getOrderByStatus,
    getOrderByNameOfCustomer,
} = require('../Models/order.model');
const {
    User
} = require('../Models/auth.model');
const {
    connectDB
} = require('../Config/database.config')
const {
    getAllProducts,
    Product
} = require('../Models/products.model');
const fs = require('fs');
const path = require('path'); 


exports.getAdd = (req, res, next) => {
    res.status(200).json({
        messages: {
            error: req.flash('error'),
            success: req.flash('success')
        },
        isAdmin: req.session.user ? req.session.user.isAdmin : false,
        Userid: req.session.user ? req.session.user.id : null
    });
};

exports.postAdd = [
    upload.array('image', 10), // Allow up to 10 images
    async (req, res) => {
      try {
        if (!req.files || req.files.length === 0) {
          return res.status(400).json({ message: 'At least one image is required' });
        }
  
        const images = req.files.map(file => file.filename);
        const { name, category, brand, price, quantity, season, gender, description, descriptionDetailed, sizes, colors } = req.body;
  
        const newProduct = new Product({
          name,
          image: images, // Array of image filenames
          category,
          brand,
          price: Number(price),
          quantity: Number(quantity),
          season,
          gender: JSON.parse(gender), // Parse JSON string to array
          description,
          descriptionDetailed,
          sizes: JSON.parse(sizes), // Parse JSON string to array
          colors: JSON.parse(colors), // Parse JSON string to array
          stock: quantity > 0 // Set stock based on quantity
        });
  
        await newProduct.save();
        res.status(201).json({ message: 'Product created successfully', product: newProduct });
      } catch (error) {
        console.error('Error Creating Product:', error);
        res.status(500).json({ message: 'Internal server error' });
      }
    }
  ];
  
    
exports.getOrders = async (req, res, next) => {
    try {
        let status = req.query.status;
        let validCategories = ['Pending', 'Shipped', 'Delivered', 'Cancelled'];
        let orders;
        let nameOfCustomer = req.query.custmorName;

        if (nameOfCustomer) {
            orders = await getOrderByNameOfCustomer(nameOfCustomer);
        } else if (status && validCategories.includes(status) && status !== 'All') {
            orders = await getOrderByStatus(status);
        } else {
            // We use .find() as it's sepcify for object so we can use .sort()
            orders = await Order.find().sort({
                timestamp: -1
            }).limit(5);
        }

        res.status(200).json({
            orders,
            messages: {
                error: req.flash('error'),
                success: req.flash('success')
            },
            isAdmin: req.session.user ? req.session.user.isAdmin : false,
            Userid: req.session.user ? req.session.user.id : null
        });
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({
            message: 'Failed to fetch orders'
        });
    }
};

exports.postOrders = async (req, res, next) => {
    try {
        const {
            custmorName,
            address,
            name,
            price,
            productID,
            amount
        } = req.body;

        if (!custmorName || !address || !name || !price || !productID || !amount) {
            return res.status(400).json({
                message: 'Invalid order data. Please try again.'
            });
        }

        await connectDB();

        const itemsCount = Array.isArray(name) ? name.length : 1;

        for (let i = 0; i < itemsCount; i++) {
            const order = new Order({
                userID: req.session.user.id,
                username: req.session.user.username,
                custmorName,
                address,
                name: Array.isArray(name) ? name[i] : name,
                price: Array.isArray(price) ? price[i] : price,
                productID: Array.isArray(productID) ? productID[i] : productID,
                amount: Array.isArray(amount) ? amount[i] : amount,
                timestamp: Date.now()
            });
            await order.save();
        }

        res.status(201).json({
            message: 'Order placed successfully'
        });
    } catch (error) {
        console.error("Error during order placement:", error);
        res.status(500).json({
            message: 'Failed to place the order'
        });
    }
};

exports.updateOrderStatus = async (req, res, next) => {
    try {
        const {
            orderId,
            status
        } = req.body;

        const updatedStatusOrder = await updateTheStatus(orderId, status);

        res.status(200).json({
            message: 'Status of order has been updated',
            updatedStatusOrder
        });
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({
            message: 'Failed to update order status'
        });
    }
};

exports.getProductList = async (req, res, next) => {
    try {
        const products = await getAllProducts();
        res.status(200).json({
            products,
            messages: {
                error: req.flash('error'),
                success: req.flash('success')
            },
            isAdmin: req.session.user ? req.session.user.isAdmin : false,
            Userid: req.session.user ? req.session.user.id : null
        });
    } catch (error) {
        console.error("Error fetching products:", error);
        res.status(500).json({
            message: 'Failed to fetch product list'
        });
    }
};

exports.updateProduct = [
    upload.array('image', 10),
    async (req, res, next) => {
      const { productId, name, colors, price, description, category, season, gender, sizes, quantity, stock } = req.body;
      try {
        await connectDB();
  
        // Parse imagesToDelete if provided
        let imagesToDelete = [];
        if (req.body.imagesToDelete) {
          imagesToDelete = JSON.parse(req.body.imagesToDelete);
          // Delete files from filesystem
          await Promise.all(imagesToDelete.map(filename => 
            fs.promises.unlink(path.join(__dirname, '../images', filename)).catch(err => console.error(`Failed to delete ${filename}:`, err))
          ));
        }
  
        // Prepare update data
        const updateData = {
          name,
          colors: colors ? JSON.parse(colors) : undefined,
          price: Number(price),
          description,
          category,
          season,
          gender: gender ? JSON.parse(gender) : undefined,
          sizes: sizes ? JSON.parse(sizes) : undefined,
          quantity: Number(quantity),
          stock: stock === 'true'
        };
  
        // Fetch the current product
        const product = await Product.findById(productId);
        if (!product) {
          return res.status(404).json({ message: 'Product not found' });
        }
  
        // Remove deleted images from the existing image array
        if (imagesToDelete.length > 0) {
          product.image = product.image.filter(img => !imagesToDelete.includes(img));
          updateData.image = product.image; // Update the image array in updateData
        }
  
        // Add new images if uploaded
        if (req.files && req.files.length > 0) {
            const newImages = req.files.map(file => file.filename);
            updateData.image = [...(updateData.image || product.image), ...newImages]; // Append new images
          }
          
            
        // Update the product
        const updatedProduct = await Product.findByIdAndUpdate(productId, updateData, { new: true });
  
        res.status(200).json({ message: 'Product updated successfully', product: updatedProduct });
      } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ message: 'Failed to update product' });
      } 
    }
  ];  
  
exports.getDashboardStats = async (req, res, next) => {
    try {
        // 1. Total Sales (sum of totalPrice for Delivered orders)
        const deliveredOrders = await Order.find({
            status: 'Delivered'
        });
        console.log('Delivered Orders:', deliveredOrders); // Log the delivered orders
        const totalSales = deliveredOrders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
        console.log('Total Sales:', totalSales);

        // Total Sales for the current week
        const startOfThisWeek = new Date();
        startOfThisWeek.setHours(0, 0, 0, 0);
        startOfThisWeek.setDate(startOfThisWeek.getDate() - startOfThisWeek.getDay()); // Start of this week (Sunday)
        const endOfThisWeek = new Date(startOfThisWeek);
        endOfThisWeek.setDate(startOfThisWeek.getDate() + 6); // End of this week (Saturday)
        console.log('This Week Range:', startOfThisWeek, 'to', endOfThisWeek);

        const thisWeekSales = await Order.find({
            status: 'Delivered',
            timestamp: {
                $gte: startOfThisWeek,
                $lte: endOfThisWeek
            }
        });
        console.log('This Week Sales Orders:', thisWeekSales);
        const totalSalesThisWeek = thisWeekSales.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
        console.log('Total Sales This Week:', totalSalesThisWeek);

        // Total Sales for the previous week
        const startOfLastWeek = new Date(startOfThisWeek);
        startOfLastWeek.setDate(startOfThisWeek.getDate() - 7);
        const endOfLastWeek = new Date(startOfLastWeek);
        endOfLastWeek.setDate(startOfLastWeek.getDate() + 6);
        console.log('Last Week Range:', startOfLastWeek, 'to', endOfLastWeek);

        const lastWeekSales = await Order.find({
            status: 'Delivered',
            timestamp: {
                $gte: startOfLastWeek,
                $lte: endOfLastWeek
            }
        });
        console.log('Last Week Sales Orders:', lastWeekSales);
        const totalSalesLastWeek = lastWeekSales.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
        console.log('Total Sales Last Week:', totalSalesLastWeek);

        // Calculate sales trend and direction
        const salesTrend = totalSalesLastWeek > 0 ?
            ((totalSalesThisWeek - totalSalesLastWeek) / totalSalesLastWeek) * 100 :
            totalSalesThisWeek > 0 ? 100 : 0;
        const salesTrendDirection = salesTrend >= 0 ? 'up' : 'down';
        console.log('Sales Trend:', salesTrend, 'Direction:', salesTrendDirection);

        // 2. New Orders (orders created today)
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const endOfToday = new Date(startOfToday);
        endOfToday.setHours(23, 59, 59, 999);
        console.log('Today Range:', startOfToday, 'to', endOfToday);

        const newOrdersToday = await Order.countDocuments({
            timestamp: {
                $gte: startOfToday,
                $lte: endOfToday
            }
        });
        console.log('New Orders Today:', newOrdersToday);

        // New Orders yesterday
        const startOfYesterday = new Date(startOfToday);
        startOfYesterday.setDate(startOfToday.getDate() - 1);
        const endOfYesterday = new Date(startOfYesterday);
        endOfYesterday.setHours(23, 59, 59, 999);
        console.log('Yesterday Range:', startOfYesterday, 'to', endOfYesterday);

        const newOrdersYesterday = await Order.countDocuments({
            timestamp: {
                $gte: startOfYesterday,
                $lte: endOfYesterday
            }
        });
        console.log('New Orders Yesterday:', newOrdersYesterday);

        // Calculate new orders trend and direction
        const ordersTrend = newOrdersYesterday > 0 ?
            ((newOrdersToday - newOrdersYesterday) / newOrdersYesterday) * 100 :
            newOrdersToday > 0 ? 100 : 0;
        const ordersTrendDirection = ordersTrend >= 0 ? 'up' : 'down';
        console.log('Orders Trend:', ordersTrend, 'Direction:', ordersTrendDirection);

        // 3. Visitors (total users and trend vs last week)
        const totalVisitors = await User.countDocuments();
        console.log('Total Visitors (Users):', totalVisitors);

        const thisWeekVisitors = await User.countDocuments({
            createdAt: {
                $gte: startOfThisWeek,
                $lte: endOfThisWeek
            }
        });
        console.log('This Week Visitors:', thisWeekVisitors);

        const lastWeekVisitors = await User.countDocuments({
            createdAt: {
                $gte: startOfLastWeek,
                $lte: endOfLastWeek
            }
        });
        console.log('Last Week Visitors:', lastWeekVisitors);

        const visitorsTrend = lastWeekVisitors > 0 ?
            ((thisWeekVisitors - lastWeekVisitors) / lastWeekVisitors) * 100 :
            thisWeekVisitors > 0 ? 100 : 0;
        const visitorsTrendDirection = visitorsTrend >= 0 ? 'up' : 'down';
        console.log('Visitors Trend:', visitorsTrend, 'Direction:', visitorsTrendDirection);

        // 4. Inventory and Low Stock Items
        const totalInventory = await Product.countDocuments();
        console.log('Total Inventory (Products):', totalInventory);

        const lowStockItems = await Product.countDocuments({
            stock: false
        });
        console.log('Low Stock Items:', lowStockItems);

        // Final response
        const response = {
            totalSales,
            salesTrend: Number(salesTrend.toFixed(1)),
            salesTrendDirection,
            newOrders: newOrdersToday,
            ordersTrend: Number(ordersTrend.toFixed(1)),
            ordersTrendDirection,
            totalVisitors,
            visitorsTrend: Number(visitorsTrend.toFixed(1)),
            visitorsTrendDirection,
            totalInventory,
            lowStockItems
        };
        console.log('Final Dashboard Stats Response:', response);

        res.status(200).json(response);
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({
            message: 'Failed to fetch dashboard stats'
        });
    }
};

exports.getTopSellingProducts = async (req, res, next) => {
    try {
        // 1. Ensure the database connection is established.
        await connectDB();

        // 2. Aggregate orders to calculate total units sold and total revenue per product for delivered orders.
        //    The aggregation groups by the productID, picks the first product name (assuming it's consistent)
        //    and sums up the 'amount' (units sold) and 'price' (revenue) fields.
        const productsSales = await Order.aggregate([
            {
                $match: {
                    status: 'Delivered' // Match delivered orders
                }
            },
            { $unwind: "$items" }, // Deconstruct the items array
            {
                $match: {
                    "items.status": "Delivered" // Ensure item status is Delivered (if applicable)
                }
            },
            {
                $group: {
                    _id: '$items.productID', // Group by productID from items
                    productName: { $first: '$items.name' },
                    totalUnitsSold: { $sum: '$items.amount' }, // Sum the quantity sold
                    totalRevenue: {
                        $sum: { $multiply: ['$items.price', '$items.amount'] } // Calculate revenue correctly
                    }
                }
            },
            { $sort: { totalUnitsSold: -1 } },
            { $limit: 5 }
        ]);
        // 5. Calculate date ranges for trend analysis.
        //    (a) This week range: from the start of the week (Sunday) to Saturday.
        const startOfThisWeek = new Date();
        startOfThisWeek.setHours(0, 0, 0, 0);
        startOfThisWeek.setDate(startOfThisWeek.getDate() - startOfThisWeek.getDay());
        const endOfThisWeek = new Date(startOfThisWeek);
        endOfThisWeek.setDate(startOfThisWeek.getDate() + 6);

        //    (b) Last week range: from the Sunday before this week to the following Saturday.
        const startOfLastWeek = new Date(startOfThisWeek);
        startOfLastWeek.setDate(startOfThisWeek.getDate() - 7);
        const endOfLastWeek = new Date(startOfLastWeek);
        endOfLastWeek.setDate(startOfLastWeek.getDate() + 6);

        // 6. Aggregate sales for this week by matching delivered orders within the calculated date range.
        const thisWeekSales = await Order.aggregate([
            {
                $match: {
                    status: 'Delivered',
                    timestamp: { $gte: startOfThisWeek, $lte: endOfThisWeek }
                }
            },
            {
                $group: {
                    _id: '$productID',
                    totalUnitsSold: { $sum: '$amount' }
                }
            }
        ]);

        // 7. Aggregate sales for last week using a similar approach.
        const lastWeekSales = await Order.aggregate([
            {
                $match: {
                    status: 'Delivered',
                    timestamp: { $gte: startOfLastWeek, $lte: endOfLastWeek }
                }
            },
            {
                $group: {
                    _id: '$productID',
                    totalUnitsSold: { $sum: '$amount' }
                }
            }
        ]);

        // 8. Map each product from the aggregated results to include additional details like product price,
        //    image, and calculate the sales trend between this week and last week.
        const topProducts = await Promise.all(
            productsSales.map(async (product) => {  // Correct variable name used here.
                // Fetch additional product details from the Product collection.
                const productDetails = await Product.findOne({ _id: product._id });
                const price = productDetails ? productDetails.price : 0;
                const image = productDetails ? productDetails.image : '';

                // Find the sales records for the current product in thisWeekSales and lastWeekSales.
                // Convert ObjectIds to strings for accurate comparison.
                const thisWeek = thisWeekSales.find(sale => sale._id.toString() === product._id.toString());
                const lastWeek = lastWeekSales.find(sale => sale._id.toString() === product._id.toString());
                const thisWeekUnits = thisWeek ? thisWeek.totalUnitsSold : 0;
                const lastWeekUnits = lastWeek ? lastWeek.totalUnitsSold : 0;

                // Calculate the sales trend as a percentage.
                // If last week had sales, compute the percentage change.
                // Otherwise, if there were any sales this week, set trend to 100.
                const trend = lastWeekUnits > 0
                    ? ((thisWeekUnits - lastWeekUnits) / lastWeekUnits) * 100
                    : (thisWeekUnits > 0 ? 100 : 0);
                const trendDirection = trend >= 0 ? 'up' : 'down';

                // Return the product details combined with aggregated data and trend info.
                return {
                    _id: product._id,
                    name: product.productName,
                    price: price,
                    image: image,
                    totalUnitsSold: product.totalUnitsSold,
                    trend: Number(trend.toFixed(1)),
                    trendDirection: trendDirection
                };
            })
        );

        // Log the result and send the top products as a JSON response.
        console.log('Top Selling Products:', topProducts);
        res.status(200).json(topProducts);
    } catch (error) {
        // Log the error and send a 500 response with a generic error message.
        console.error('Error fetching top selling products:', error);
        res.status(500).json({ message: 'Failed to fetch top selling products' });
    }
};
