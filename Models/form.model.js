const mongoose = require('mongoose');
const { connectDB, disconnectDB } = require('../Config/database.config');

// create form schema

const formSchema = mongoose.Schema({
    custmorName:String,
    address:String,
    userID: String
})

// create Model

const formModel = mongoose.mongoose.model('form' , formSchema)

// Retrive all formModel

const getTheForm = async () => {
    await connectDB()
    try{
        const forms = await formModel.find()
        return forms
    }catch (error) {
        console.error('Error fetching Forms:', error);
        throw error;
    } 
}