const mongoose = require('mongoose');
const { connectDB, disconnectDB } = require('../Config/database.config');

const cartSchema = mongoose.Schema({
    name: String,
    price: Number,
    amount: Number,
    userID: String,
    productID: String,
    image: String,
    timestamp: {
        type: Date,
        default: Date.now // Use Date type for timestamp
    }
});

const CartItem = mongoose.model('Cart', cartSchema);

const addNewItem = async (data) => {
    try {
        await connectDB();
        
        const item = new CartItem(data);
        await item.save();
        return item
    } catch (error) {
        console.error('an error takes place during placing the order',error);
    } finally {
        await disconnectDB();
    }
}


const getItemsByUser = async (userID) => {
    try{
        await connectDB();
        const items = await  CartItem.find({userID:userID} ,{} ,{sort : {timestamp:1}})
        return items
    } catch (error){
        console.error('an error takes place during retrieving the data', error);
        throw error; 
    } finally{
        await disconnectDB();
    }
}


const editItem = async (id, newData) => {
    try {
        await connectDB();
        const checkItemAndUpdate = await CartItem.updateOne(
            { _id: id },          // Filter: find by _id
            { $set: newData }     // Update: set new data
        );
        return checkItemAndUpdate;
    } catch (error) {
        console.error('An error occurred during updating the data', error);
    } finally {
        await disconnectDB();
    }
};


const deleteProduct = async (id) => {
    try{
        await connectDB();
        const updateAndDeleteCartProducts = await CartItem.findByIdAndDelete(id)
        return updateAndDeleteCartProducts
    }catch (error) {
        console.error('An error occurred during deleting the data', error);
    } finally {
        await disconnectDB();
    }
}

const deleteAllCartProducts = async(userID) => {
    await connectDB()
    try{
        const clearProducts = await CartItem.deleteMany({ userID: userID });
        return clearProducts;
    
    }
    catch(error){
        console.error('An error occurred while clearing the cart', error)
        throw new Error('Failed to clear cart items');
    }finally{
        await disconnectDB();
    }

}



module.exports = {addNewItem , getItemsByUser , editItem , deleteProduct , deleteAllCartProducts}