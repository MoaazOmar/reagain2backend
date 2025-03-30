const { validationResult } = require('express-validator');
const { addNewItem, getItemsByUser, editItem, deleteProduct } = require('../Models/cart.model');
const { Product } = require('../Models/products.model');
const {deleteAllCartProducts} = require('../Models/cart.model')


exports.getCart = async (req, res, next) => {
    try {
        const items = await getItemsByUser(req.session.user.id) || [];
        res.status(200).json({
            messages: {
                error: req.flash('error'),
                success: req.flash('success')
            },
            items: items,
            isUser: true,
            Userid: req.session.user ? req.session.user.id : null,
            isAdmin: req.session.user ? req.session.user.isAdmin : false
        });
    } catch (error) {
        console.error('Error fetching cart items', error);
        res.status(500).json({ message: 'Failed to fetch cart items' });
    }
};exports.postCart = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: 'Validation failed',
            errors: errors.array().map(error => error.msg)
        });
    }
    try {
        const newItem = await addNewItem({
            amount: req.body.amount,
            name: req.body.name,
            price: req.body.price,
            productID: req.body.productID,
            userID: req.session.user.id,
            color: req.body.color,
            image: req.body.image,
            timestamp: Date.now()
        });

        res.status(201).json({ message: 'The product was added to the cart successfully', item: newItem });
    } catch (error) {
        console.error('An error occurred while adding item to cart', error);
        res.status(500).json({ message: 'Failed to add item to cart. Please try again.' });
    }
};


exports.postSave = async (req, res, next) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
        try {
            const result = await editItem(req.body.cartId, { amount: req.body.amount, timestamp: Date.now() });
            res.status(200).json({ message: 'Item updated successfully', result });
            console.log('Received cartId:', req.body.cartId, 'amount:', req.body.amount);

        } catch (error) {
            console.error('Error updating item:', error);
            res.status(500).json({ message: 'Failed to update item. Please try again.' });
        }
    } else {
        res.status(400).json({
            message: 'Validation failed',
            errors: errors.array().map(error => error.msg)
        });
    }
};

exports.postDelete = async (req, res, next) => {
    try {
        const cartId = req.body.cartId;
        await deleteProduct(cartId);
        res.status(200).json({ message: 'Item deleted successfully' });
    } catch (error) {
        console.error('Failed to delete the item', error);
        res.status(500).json({ message: 'Failed to delete item. Please try again.' });
    }
};

exports.getCheckout = async (req, res) => {
    try {
        const items = await getItemsByUser(req.session.user.id) || [];
        res.status(200).json({
            items: items,
            messages: {
                error: req.flash('error'),
                success: req.flash('success')
            },
            isUser: true,
            Userid: req.session.user.id
        });
    } catch (error) {
        console.error('Error fetching checkout items:', error);
        res.status(500).json({ message: 'Failed to load checkout page.' });
    }
};

exports.postClearItems = async (req, res) => {
    try {
        const userId = req.session.user.id;
        const result = await deleteAllCartProducts(userId);
        
        if (result.deletedCount > 0) {
            res.status(200).json({ message: 'All cart items have been removed successfully' });
        } else {
            res.status(404).json({ message: 'No items found in the cart' });
        }
    } catch (error) {
        console.error('Failed to clear the cart:', error);
        res.status(500).json({ message: 'Failed to clear cart. Please try again.' });
    }
};