const mongoose = require('mongoose');
const {
    connectDB,
    disconnectDB
} = require('../Config/database.config');
const bcrypt = require('bcrypt');
const ADMIN_USER_IDS = require('../Config/isAdmin')

const userSchema = mongoose.Schema({
    username: String,
    email: String,
    password: String,
    isAdmin: {
        type: Boolean,
        default: false
    },
    createdAt: { type: Date, default: Date.now } 
}, { collection: 'users' }); // ← EXPLICITLY SET COLLECTION NAME



const User = mongoose.model("User", userSchema);

const createNewUser = async (username, email, password) => {
    try {
        await connectDB();
        const checkUserAndCreateIfValid = await User.findOne({ username: username });

        if (checkUserAndCreateIfValid) {
            throw new Error('Username already exists');
        } else {
            const hashedPassword = await bcrypt.hash(password, 10);
            const newUser = new User({
                username: username,
                email: email,
                password: hashedPassword,
                isAdmin: ADMIN_USER_IDS.includes(username)
            });

            // Check if the new user's ID is in ADMIN_USER_IDS
            await newUser.save();

            if (ADMIN_USER_IDS.includes(newUser._id.toString())) {
                newUser.isAdmin = true;
                await newUser.save();
            }

            return newUser;
        }
    } catch (error) {
        console.error(error.message);
        throw error;
    } finally {
        await disconnectDB();
    }
};



// check if the username valid or not 
// if not exist shows an error 
// check the password if it's valid or not
// if not show an error
// Set a cookies 
// bcrypt the cookies to prevent the user to take over cookies (security)


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
        return userLoggedin;

    } catch (error) {
        console.error(error.message);
        throw error;
    } finally {
        await disconnectDB();
    }
};
module.exports = {
    User,
    createNewUser,
    loginForUser
};