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
        isAdmin: req.user ? req.user.isAdmin : false,
        Userid: req.user ? req.user.id : null
    });
};

exports.postAdd = [
    upload.array('image', 10),
    async (req, res) => {
        try {
            if (!req.files || req.files.length === 0) {
                return res.status(400).json({
                    message: 'At least one image is required'
                });
            }

            const images = req.files.map(file => file.filename);
            const {
                name,
                category,
                brand,
                price,
                season,
                gender,
                description,
                descriptionDetailed,
                sizes,
                colors,
                stock
            } = req.body;

            const newProduct = new Product({
                name,
                image: images,
                category,
                brand,
                price: Number(price),
                season,
                gender: JSON.parse(gender),
                description,
                descriptionDetailed,
                sizes: JSON.parse(sizes),
                colors: JSON.parse(colors),
                stock: Number(stock)
            });

            await newProduct.save();
            res.status(201).json({
                message: 'Product created successfully',
                product: newProduct
            });
        } catch (error) {
            console.error('Error Creating Product:', error);
            res.status(500).json({
                message: 'Internal server error'
            });
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
            })
        }

        res.status(200).json(orders);    
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
                userID: req.user.id,
                username: req.user.username,
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
        await connectDB()
    const products = await getAllProducts();
      console.log('Fetched products:', products);
      res.status(200).json({ products });
    } catch (error) {
      console.error('Error fetching products:', error);
      res.status(500).json({ message: 'Failed to fetch product list', error: error.message });
    }
  };

exports.updateProduct = [
    upload.array('image', 10),
    async (req, res, next) => {
        const {
            productId,
            name,
            colors,
            price,
            description,
            category,
            season,
            gender,
            sizes,
            stock
        } = req.body;
        try {
            await connectDB();

            let imagesToDelete = [];
            if (req.body.imagesToDelete) {
                imagesToDelete = JSON.parse(req.body.imagesToDelete);
                await Promise.all(imagesToDelete.map(filename =>
                    fs.promises.unlink(path.join(__dirname, '../images', filename)).catch(err => console.error(`Failed to delete ${filename}:`, err))
                ));
            }

            const updateData = {
                name,
                colors: colors ? JSON.parse(colors) : undefined,
                price: Number(price),
                description,
                category,
                season,
                gender: gender ? JSON.parse(gender) : undefined,
                sizes: sizes ? JSON.parse(sizes) : undefined,
                stock: Number(stock)
            };

            const product = await Product.findById(productId);
            if (!product) {
                return res.status(404).json({
                    message: 'Product not found'
                });
            }

            if (imagesToDelete.length > 0) {
                product.image = product.image.filter(img => !imagesToDelete.includes(img));
                updateData.image = product.image;
            }

            if (req.files && req.files.length > 0) {
                const newImages = req.files.map(file => file.filename);
                updateData.image = [...(updateData.image || product.image), ...newImages];
            }

            const updatedProduct = await Product.findByIdAndUpdate(productId, updateData, {
                new: true
            });

            res.status(200).json({
                message: 'Product updated successfully',
                product: updatedProduct
            });
        } catch (error) {
            console.error('Error updating product:', error);
            res.status(500).json({
                message: 'Failed to update product'
            });
        }
    }
];
exports.updateProductStock = async (req, res, next) => {
    try {
        const {
            productID,
            amount
        } = req.body;
        // Find the product by its ID
        const product = await Product.findById(productID);
        if (!product) {
            return res.status(404).json({
                message: 'Product not found'
            });
        }
        // Reduce the stock by the amount ordered
        product.stock = product.stock - Number(amount);
        await product.save();
        res.status(200).json({
            message: 'Product stock updated successfully',
            product
        });
    } catch (error) {
        console.error('Error updating product stock:', error);
        res.status(500).json({
            message: 'Failed to update product stock'
        });
    }
};

exports.getDashboardStats = async (req, res, next) => {
    try {
        // 1. Total Sales (sum of totalPrice for Delivered orders)
        const deliveredOrders = await Order.find({
            status: 'Delivered'
        });
        console.log('Delivered Orders:', deliveredOrders);
        const totalSales = deliveredOrders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
        console.log('Total Sales:', totalSales);

        // Total Sales for the current week
        const startOfThisWeek = new Date();
        startOfThisWeek.setHours(0, 0, 0, 0);
        startOfThisWeek.setDate(startOfThisWeek.getDate() - startOfThisWeek.getDay());
        const endOfThisWeek = new Date(startOfThisWeek);
        endOfThisWeek.setDate(startOfThisWeek.getDate() + 6);
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

        // Debug: Verify ALL product stock values
        const allProducts = await Product.find({}, 'name stock -_id'); // Only get name & stock
        console.log('All Products Stock Verification:', allProducts);

        // Count low stock items (stock > 0 and <= 20)
        const lowStockItems = await Product.countDocuments({
            stock: {
                $gt: 0, // Explicitly greater than 0
                $lte: 20 // Less than or equal to 20
            }
        });
        console.log('Corrected Low Stock Count:', lowStockItems);

        // Debug: Show ACTUAL low stock items
        const lowStockProducts = await Product.find({
            stock: {
                $gt: 0,
                $lte: 20
            }
        }, 'name stock -_id');
        console.log('Low Stock Products Verification:', lowStockProducts);

        // =========================================================================
        // Final Response (Rest remains same)
        // =========================================================================
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
            lowStockItems // Now using corrected count
        };

        res.status(200).json(response);

    } catch (error) {
        console.error('Error in getDashboardStats:', error);
        res.status(500).json({
            message: 'Failed to load dashboard stats'
        });
    }
};

exports.getTopSellingProducts = async (req, res, next) => {
    try {
        await connectDB();

        // Step 1: Aggregate delivered orders
        const productsSales = await Order.aggregate([{
                $match: {
                    status: 'Delivered'
                }
            },
            {
                $unwind: "$items"
            },
            // Removed: { $match: { "items.status": "Delivered" } },
            {
                $group: {
                    _id: '$items.productID',
                    productName: {
                        $first: '$items.name'
                    },
                    totalUnitsSold: {
                        $sum: '$items.amount'
                    },
                    totalRevenue: {
                        $sum: {
                            $multiply: ['$items.price', '$items.amount']
                        }
                    }
                }
            },
            {
                $sort: {
                    totalUnitsSold: -1
                }
            },
            {
                $limit: 5
            }
        ]);
        console.log('Products Sales Aggregation Result:', productsSales);

        // Date ranges
        const startOfThisWeek = new Date();
        startOfThisWeek.setHours(0, 0, 0, 0);
        startOfThisWeek.setDate(startOfThisWeek.getDate() - startOfThisWeek.getDay());
        const endOfThisWeek = new Date(startOfThisWeek);
        endOfThisWeek.setDate(startOfThisWeek.getDate() + 6);

        const startOfLastWeek = new Date(startOfThisWeek);
        startOfLastWeek.setDate(startOfThisWeek.getDate() - 7);
        const endOfLastWeek = new Date(startOfLastWeek);
        endOfLastWeek.setDate(startOfLastWeek.getDate() + 6);

        // Step 2: This week's sales
        const thisWeekSales = await Order.aggregate([{
                $match: {
                    status: 'Delivered',
                    timestamp: {
                        $gte: startOfThisWeek,
                        $lte: endOfThisWeek
                    }
                }
            },
            {
                $unwind: "$items"
            },
            // Removed: { $match: { "items.status": "Delivered" } },
            {
                $group: {
                    _id: '$items.productID',
                    totalUnitsSold: {
                        $sum: '$items.amount'
                    }
                }
            }
        ]);
        console.log('This Week Sales:', thisWeekSales);

        // Step 3: Last week's sales
        const lastWeekSales = await Order.aggregate([{
                $match: {
                    status: 'Delivered',
                    timestamp: {
                        $gte: startOfLastWeek,
                        $lte: endOfLastWeek
                    }
                }
            },
            {
                $unwind: "$items"
            },
            // Removed: { $match: { "items.status": "Delivered" } },
            {
                $group: {
                    _id: '$items.productID',
                    totalUnitsSold: {
                        $sum: '$items.amount'
                    }
                }
            }
        ]);
        console.log('Last Week Sales:', lastWeekSales);

        // Step 4: Map products with trend
        const topProducts = await Promise.all(
            productsSales.map(async (product) => {
                const productDetails = await Product.findOne({
                    _id: product._id
                });
                const price = productDetails ? productDetails.price : 0;
                const image = productDetails ? productDetails.image : '';

                const thisWeek = thisWeekSales.find(sale => sale._id?.toString() === product._id ?.toString());
                const lastWeek = lastWeekSales.find(sale => sale._id?.toString() === product._id ?.toString());
                const thisWeekUnits = thisWeek ? thisWeek.totalUnitsSold : 0;
                const lastWeekUnits = lastWeek ? lastWeek.totalUnitsSold : 0;

                const trend = lastWeekUnits > 0 ?
                    ((thisWeekUnits - lastWeekUnits) / lastWeekUnits) * 100 :
                    (thisWeekUnits > 0 ? 100 : 0);
                const trendDirection = trend >= 0 ? 'up' : 'down';

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

        console.log('Top Selling Products:', topProducts);
        res.status(200).json(topProducts);
    } catch (error) {
        console.error('Error fetching top selling products:', error);
        res.status(500).json({
            message: 'Failed to fetch top selling products'
        });
    }
};