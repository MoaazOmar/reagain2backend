const mongoose = require('mongoose');
const {
    connectDB,
    disconnectDB
} = require('../Config/database.config');

const commentSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    text: String,
    date: {
        type: Date,
        default: Date.now
    },
    edited: {
        type: Boolean,
        default: false
    },
    likes: {
        type: Number,
        default: 0
    },
    likers: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'User',
        default: []
    },
    dislikes: {
        type: Number,
        default: 0
    },
    dislikers: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'User',
        default: []
    },
    loves: {
        type: Number,
        default: 0
    },
    lovers: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'User',
        default: []
    },
    parentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'commentSchema', // Self-reference to the comment schema
        default: null
    },
    rating: {
        type: Number,
        default: null
    }

});

const productSchema = mongoose.Schema({
    name: String,
    image: [String], // Path to the uploaded image
    colors: [String],
    price: Number,
    description: String,
    descriptionDetailed:String,
    category: String,
    season: String,
    gender: {
        type: [String],
        enum: ['Male', 'Female', 'Special', 'all']
    },
    likes: {
        type: Number,
        default: 0
    },
    likedBy: {
        type: [mongoose.Schema.Types.ObjectId], // Changed from [String]
        ref: 'User',                            // Reference to User model
        default: []
    },
    dislikes: {
        type: Number,
        default: 0
    },
    dislikedBy: {
        type: [mongoose.Schema.Types.ObjectId], // Changed from [String]
        ref: 'User',                            // Reference to User model
        default: []
    },
    sizes: [String],

    stock: {
        type: Number,
        required: true,
        default: 0,
        min: 0, // Prevent negative numbers
        validate: {
          validator: Number.isInteger, // Force integer values
          message: 'Stock must be an integer number'
        }
      },
      brand:String,
    // quantity: {
    //     type: Number,
    //     default: 0 // Add quantity field
    //   },        
    comments: [commentSchema],
    ratings: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        value: {
            type: Number,
            min: 1,
            max: 5
        }
    }],
    // averageRating: { type: Number, default: 0 },

}, {
    timestamps: true,
    collection: 'products'
} ) ;

// Create the model
const Product = mongoose.model('product', productSchema);

// Standalone method to fetch all products
const getAllProducts = async (limit, skip) => {
    try {
        await connectDB(); // Ensure the database is connected
        const products = await Product.find().limit(limit).skip(skip);
        await disconnectDB(); // Disconnect after fetching
        return products;
    } catch (err) {
        console.error('An error occurred while fetching products:', err);
        throw err;
    }
};
// get products Suggestions Based on Search 
const getSuggestionsProducts = async (
    filterConditions, // ✅ Receives pre-built filter object
    page = 1,
    limit = 10,
    sortOptions = {
        _id: -1
    } // ✅ Valid default sort
) => {
    try {
        await connectDB();
        // Remove manual filterConditions logic (already built in controller)
        const skip = (page - 1) * limit;
        const suggestions = await Product.find(filterConditions)
            .sort(sortOptions)
            .skip(skip)
            .limit(limit);
        await disconnectDB();
        return suggestions;
    } catch (error) {
        console.error('Error fetching suggestions:', error);
        throw error;
    }
};
// get products number Suggestions Based on Search 
const getTotalCount = async (filterConditions) => { // ✅ Accept filterConditions directly
    try {
        await connectDB();
        // No need to rebuild filterConditions here! Use the one passed from the controller.
        const totalCount = await Product.countDocuments(filterConditions);
        await disconnectDB();
        return totalCount;
    } catch (error) {
        console.error('Error fetching total count:', error);
        throw error;
    }
};
// get the product based on catagory

const getProductsByCategory = async (gender, limit, skip) => {
    try {
        await connectDB(); // Ensure DB connection
        const filteredProducts = await Product.find({
            gender: gender
        }).limit(limit).skip(skip); // Filtering by gender
        await disconnectDB(); // Disconnect after fetching
        return filteredProducts;
    } catch (error) {
        console.error('Error fetching filtered products:', error);
        throw error;
    }
};
const getProductByID = async (id) => {
    try {
        await connectDB()
        const productID = await Product.findById(id).populate('comments.user', 'username');
        await disconnectDB()
        return productID

    } catch (err) {
        console.error('Error fetching SingleProductID:', error);
        throw error;
    }
}
const getMostLikedProducts = async (gender, limit = 3) => {
    try {
        await connectDB();

        const filter = {};
        if (gender !== 'all') {
            filter.gender = gender;
        }

        const products = await Product.find(filter)
            .sort({
                likes: -1
            })
            .limit(limit);

        await disconnectDB();
        return products;
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
};
// Get most commented products for a specific gender
const getMostCommentedProducts = async (gender, limit = 3) => {
    try {
        await connectDB();
        const products = await Product.find({
                gender: {
                    $in: [gender]
                }
            })
            .sort({
                'comments.length': -1
            })
            .limit(limit);
        await disconnectDB();
        return products;
    } catch (error) {
        console.error('Error fetching most commented products:', error);
        throw error;
    }
};
// Get newest products for a specific gender



const getNewestProducts = async (gender, limit = 3) => {
    try {
        const filter = {};
        if (gender !== 'all') {
            filter.gender = gender;
        }
        await connectDB();
        const products = await Product.find(filter)
            .sort({
                _id: -1
            })
            .limit(limit);
        await disconnectDB();
        return products;
    } catch (error) {
        console.error('Error fetching newest products:', error);
        throw error;
    }
};

// Get a random product for a specific gender
const getRandomProduct = async (gender) => {
    try {
        await connectDB(); // Connect to the database
        const count = await Product.countDocuments({
            gender: {
                $in: [gender]
            }
        }); // Count the number of products for the specified gender
        const randomIndex = Math.floor(Math.random() * count); // Generate a random index between 0 and count - 1
        const product = await Product.findOne({
            gender: {
                $in: [gender]
            }
        }).skip(randomIndex); // Find a product with the random index
        await disconnectDB(); // Disconnect from the database
        return product; // Return the random product
    } catch (error) {
        console.error('Error fetching random product:', error); // Log any errors
        throw error; // Re-throw the error
    }
};
// if the products selected with no gender specify 
const getAllProductsMixed = async () => {
    try {
        await connectDB();
        const mostLiked = await Product.find().sort({
            likes: -1
        }).limit(1);
        const mostCommented = await Product.find().sort({
            'comments.length': -1
        }).limit(1);
        const newest = await Product.find().sort({
            _id: -1
        }).limit(1);
        const random = await Product.findOne().skip(Math.floor(Math.random() * await Product.countDocuments()));
        const products = [...mostLiked, ...mostCommented, ...newest, random];
        await disconnectDB();
        return products;
    } catch (error) {
        console.error('Error fetching mixed products:', error);
        throw error;
    }
};
const getMainProducts = async (query, sortOptions, skip, limit) => {
    try {
        await connectDB();
        const mainProducts = await Product.find(query).sort(sortOptions).skip(skip).limit(limit)
        const total = await Product.countDocuments(query);
        await disconnectDB();
        return {
            mainProducts,
            total
        };
    } catch {
        console.error('Error occuring during fetching products:', error);
        throw error;

    }
}
// gets Distinct products Categories 
const getDistinctProductsCategoriesWithCounts = async (filterQuery) => {
    try {
        const categories = await Product.aggregate([{
                $match: filterQuery
            },
            {
                $group: {
                    _id: {
                        $toLower: "$category"
                    },
                    count: {
                        $sum: 1
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    name: "$_id",
                    count: "$count"
                }
            }
        ]);
        return categories;
    } catch (error) {
        console.error('Error fetching categories:', error);
        throw error;
    }
};

const getDistinctColorsWithCounts = async (filterQuery) => {
    try {
        const colors = await Product.aggregate([
            { $match: filterQuery }, // Apply the filter query (e.g., gender, category)
            { $unwind: "$colors" }, // Unwind the colors array
            {
                $group: {
                    _id: { $toLower: "$colors" }, // Group by each color, case-insensitive
                    count: { $sum: 1 }
                }
            },
            {
                $project: {
                    _id: 0,
                    name: "$_id",
                    count: "$count"
                }
            }
        ]);
        return colors;
    } catch (error) {
        console.error('Error fetching colors:', error);
        throw error;
    }
};    const pushTheCommentToProduct = async (productId, userId, commentText, parentId = null, rating = null) => {
    try {
        await connectDB();
        const newComment = {
            user: userId,
            text: commentText,
            date: new Date(),
            parentId: parentId,
            rating: rating
        }
        const updatedProduct = await Product.findByIdAndUpdate(
            productId, {
                $push: {
                    comments: newComment
                }
            }, {
                new: true
            } // Return the updated document
        ).populate('comments.user', 'username'); // Populate user info
        console.log('Newly added comment:', updatedProduct.comments[updatedProduct.comments.length - 1]);
        return updatedProduct.comments[updatedProduct.comments.length - 1] // return the last comment

    } catch (error) {
        console.error('Error adding comment:', error);
        throw error;
    }
}
const editComment = async (productId, commentId, userId, newText, isAdmin) => {
    try {
        await connectDB();
        const product = await Product.findById(productId);
        if (!product) throw new Error('Product not found');
        const comment = product.comments.id(commentId);
        if (!comment) throw new Error('Comment not found');
        const isOwner = comment.user.equals(userId);
        if (!isOwner && !isAdmin) throw new Error('Unauthorized');
        comment.text = newText;
        comment.edited = true;
        await product.save();
        await disconnectDB();
        return comment; // Return the updated comment
    } catch (error) {
        console.error('Error editing comment:', error);
        throw error;
    }
};

const deleteComment = async (productId, commentId, userId, isAdmin) => {
    try {
        await connectDB();
        const product = await Product.findById(productId);
        if (!product) throw new Error('Product not found');
        const comment = product.comments.id(commentId);
        if (!comment) throw new Error('Comment not found');
        const isOwner = comment.user.equals(userId);
        if (!isOwner && !isAdmin) throw new Error('Unauthorized');

        // Remove the comment and all its descendants
        const removeComments = (comments, id) => {
            for (let i = comments.length - 1; i >= 0; i--) {
                if (comments[i].parentId && comments[i].parentId.toString() === id) {
                    removeComments(comments, comments[i]._id.toString());
                }
                if (comments[i]._id.toString() === id) {
                    comments.splice(i, 1);
                }
            }
        };
        removeComments(product.comments, commentId);
        await product.save();
        await disconnectDB();
        return {
            productId,
            commentId
        }; // Return minimal data for frontend
    } catch (error) {
        console.error('Error deleting comment:', error);
        throw error;
    }
};
const getCommentById = async (productId, commentId) => {
    try {
        await connectDB();
        // Find the product by its ID
        const product = await Product.findById(productId);
        if (!product) {
            throw new Error('Product not found');
        }
        // Use Mongoose's subdocument method 'id()' to get the comment from the embedded array
        const comment = product.comments.id(commentId);
        return comment;
    } catch (error) {
        throw error;
    } finally {
        await disconnectDB();
    }
};
const toggleLikeComment = async (productId, commentId, userId) => {
    try {
        const product = await Product.find({
            _id: productId
        });
        const comment = product[0].comments.id(commentId);
        if (!comment) throw new Error('Comment not found');

        if (comment.likers.includes(userId)) {
            comment.likers = comment.likers.filter(user => user.toString() != userId);
        } else {
            comment.likers.push(userId);
            comment.dislikers = comment.dislikers.filter(user => user.toString() != userId);
            comment.lovers = comment.lovers.filter(user => user.toString() != userId);
        }

        comment.likes = comment.likers.length;
        comment.dislikes = comment.dislikers.length;
        comment.loves = comment.lovers.length;

        await product[0].save();
        return comment;
    } catch (error) {
        console.error('Error toggling like:', error);
        throw error;
    }
};
const toggleDislikeComment = async (productId, commentId, userId) => {
    try {
        const product = await Product.find({
            _id: productId
        });
        const comment = product[0].comments.id(commentId);
        if (!comment) throw new Error('Comment not found');

        if (comment.dislikers.includes(userId)) {
            comment.dislikers = comment.dislikers.filter(user => user.toString() != userId);
        } else {
            comment.dislikers.push(userId);
            comment.likers = comment.likers.filter(user => user.toString() != userId);
            comment.lovers = comment.lovers.filter(user => user.toString() != userId);
        }

        comment.likes = comment.likers.length;
        comment.dislikes = comment.dislikers.length;
        comment.loves = comment.lovers.length;

        await product[0].save();
        return comment;
    } catch (error) {
        console.error('Error toggling like:', error);
        throw error;
    }
};

const toggleLoveComment = async (productId, commentId, userId) => {
    try {
        await connectDB()
        const product = await Product.find({
            _id: productId
        });
        const comment = product[0].comments.id(commentId);
        if (!comment) throw new Error('Comment not found');

        // Convert userId to string for comparison
        const userIdStr = userId.toString();

        if (comment.lovers.some(lover => lover.toString() === userIdStr)) {
            // Remove from lovers
            comment.lovers = comment.lovers.filter(user => user.toString() !== userIdStr);
        } else {
            // Add to lovers and remove from other reactions
            comment.lovers.push(userId);
            comment.likers = comment.likers.filter(user => user.toString() !== userIdStr);
            // Fix this line (was using lovers instead of dislikers):
            comment.dislikers = comment.dislikers.filter(user => user.toString() !== userIdStr);
        }

        // Update counts
        comment.likes = comment.likers.length;
        comment.dislikes = comment.dislikers.length;
        comment.loves = comment.lovers.length;

        await product[0].save();
        return comment;
    } catch (error) {
        console.error('Error toggling love:', error);
        throw error;
    }
}
const getRelatedProducts = async (category, excludeId) => {
    try {
        await connectDB()
        const products = await Product.find({
                category: category,
                _id: {
                    $ne: excludeId
                }, // Exclude the current product

            }).sort({
                createdAt: -1
            }) // Sort by latest
            .limit(8)
        return products
    } catch (error) {
        console.error('Error occures during Retreving Related Products:', error);
        throw error;
    } finally {
        await disconnectDB()
    }
}

const toggleLikeProduct = async (productId, userId) => {
    try {
      await connectDB();
      const products = await Product.find({ _id: productId });
      if (!products || products.length === 0) {
        throw new Error('Product not found');
      }
      const product = products[0];
      const userIdStr = userId.toString();
  
      // Check if the user already liked the product
      if (product.likedBy.some(id => id.toString() === userIdStr)) {
        // Remove from likedBy if already liked
        product.likedBy = product.likedBy.filter(id => id.toString() !== userIdStr);
      } else {
        // Add to likedBy and remove from dislikedBy if present
        product.likedBy.push(userId);
        product.dislikedBy = product.dislikedBy.filter(id => id.toString() !== userIdStr);
      }
      
      // Update counts
      product.likes = product.likedBy.length;
      product.dislikes = product.dislikedBy.length;
      
      await product.save();
      return product;
    } catch (error) {
      console.error('Error toggling like:', error);
      throw error;
    }
  };
  const toggleDislikeProduct = async (productId, userId) => {
    try {
      await connectDB();
      const products = await Product.find({ _id: productId });
      if (!products || products.length === 0) {
        throw new Error('Product not found');
      }
      const product = products[0];
      const userIdStr = userId.toString();
  
      // Check if the user already disliked the product
      if (product.dislikedBy.some(id => id.toString() === userIdStr)) {
        // Remove from dislikedBy if already disliked
        product.dislikedBy = product.dislikedBy.filter(id => id.toString() !== userIdStr);
      } else {
        // Add to dislikedBy and remove from likedBy if present
        product.dislikedBy.push(userId);
        product.likedBy = product.likedBy.filter(id => id.toString() !== userIdStr);
      }
      
      // Update counts
      product.likes = product.likedBy.length;
      product.dislikes = product.dislikedBy.length;
      
      await product.save();
      return product;
    } catch (error) {
      console.error('Error toggling dislike:', error);
      throw error;
    }
  };
  const getWinterProductsData = async (gender) => {
    try {
        const filter = { season: 'Winter' };
        if (gender && gender !== 'all') {
            filter.gender = gender;
        }
        await connectDB()
        const products = await Product.find(filter)
            .sort({ _id: 1 })
            .limit(10);
        return products;
    } catch (error) {
        console.error('Error fetching winter products:', error)
        throw new Error(error.message); // Proper error construction
    } finally {
        await disconnectDB()
    }
}
const getSummerAndSpringProductsData = async (gender) =>{
    try{
        await connectDB()
        const filter = { season: { $in: ['Summer', 'Spring'] } };
        if(gender && gender !== 'all') {
            filter.gender = gender;
        }
        const products = await Product.find(filter).sort({_id: -1}).limit(15)
        return products
    }
    catch(error){
        console.error('Error fetching Summer products:', error)
        throw new Error(error.message); // Proper error construction

    }finally {
        await disconnectDB()
    }
}


module.exports = {
    Product,
    getAllProducts,
    getProductsByCategory,
    getProductByID,
    getMostLikedProducts,
    getMostCommentedProducts,
    getNewestProducts,
    getRandomProduct,
    getAllProductsMixed,
    getMainProducts,
    getDistinctProductsCategoriesWithCounts,
    getDistinctColorsWithCounts,
    getSuggestionsProducts,
    getTotalCount,
    pushTheCommentToProduct,
    deleteComment,
    editComment,
    getCommentById,
    toggleLikeComment,
    toggleDislikeComment,
    toggleLoveComment,
    getRelatedProducts,
    toggleLikeProduct,
    toggleDislikeProduct,
    getWinterProductsData,
    getSummerAndSpringProductsData
};