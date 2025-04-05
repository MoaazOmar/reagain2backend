const mongoose = require('mongoose');
const { connectDB, disconnectDB } = require('../Config/database.config');
const bcrypt = require('bcrypt');
const ADMIN_USER_IDS = require('../Config/isAdmin');

const userSchema = mongoose.Schema({
    username: String,
    email: String,
    password: String,
    isAdmin: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
}, { collection: 'users' });

const User = mongoose.model("User", userSchema);

const createNewUser = async (username, email, password) => {
    try {
        await connectDB();
        const checkUserAndCreateIfValid = await User.findOne({ username: username });
        if (checkUserAndCreateIfValid) {
            throw new Error('Username already exists');
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({
            username: username,
            email: email,
            password: hashedPassword,
            isAdmin: ADMIN_USER_IDS.includes(username)
        });

        await newUser.save();
        if (ADMIN_USER_IDS.includes(newUser._id.toString())) {
            newUser.isAdmin = true;
            await newUser.save();
        }

        await disconnectDB();
        return newUser;
    } catch (error) {
        console.error(error.message);
        await disconnectDB();
        throw error;
    }
};

const loginForUser = async (username, password) => {
    try {
        await connectDB();
        const userLoggedin = await User.findOne({ username: username });
        if (!userLoggedin) {
            throw new Error("There's no user found with this username");
        }

        const comparePassword = await bcrypt.compare(password, userLoggedin.password);
        if (!comparePassword) {
            throw new Error("Sorry, the password you entered is invalid");
        }

        console.log('User logged in successfully');
        await disconnectDB();
        return userLoggedin;
    } catch (error) {
        console.error(error.message);
        await disconnectDB();
        throw error;
    }
};

module.exports = { User, createNewUser, loginForUser };