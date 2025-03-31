const router = require('express').Router();
const adminController = require('../Controllers/admin.controller');
const adminGuard = require('./guards/admin.guard');

// Protect the add-product route with adminGuard
router.get('/add', adminGuard, adminController.getAdd);
router.post('/add', adminGuard, adminController.postAdd);
router.get('/orders', adminGuard, adminController.getOrders);
router.post('/orders', adminController.postOrders);
router.post('/orders/update', adminController.updateOrderStatus);
router.get('/productList', adminGuard, adminController.getProductList);
router.post('/productList/update', adminGuard, adminController.updateProduct);
router.get('/dashboard-stats', adminGuard, adminController.getDashboardStats);
router.get('/top-selling-products', adminGuard, adminController.getTopSellingProducts);
module.exports = router;