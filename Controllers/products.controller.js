const { Product, getAllProducts, getProductByID , getMostLikedProducts,getMostCommentedProducts,getNewestProducts,getRandomProduct,getAllProductsMixed 
,getMainProducts , getDistinctProductsCategoriesWithCounts , getDistinctColorsWithCounts ,  getSuggestionsProducts , getTotalCount , getRelatedProducts , toggleLikeProduct,
toggleDislikeProduct , getWinterProductsData , getSummerAndSpringProductsData} = require('../Models/products.model');

exports.createProduct = async (req, res, next) => {
  try {
      if (!req.file) {
          return res.status(400).json({ message: 'An image is required' });
      }
      const images = [req.file.filename]; // Use array for consistency
      const { name, colors, price, description, category, gender, season } = req.body;

      const newProduct = new Product({
          name,
          colors: JSON.parse(colors), // Expecting a JSON string like '["black", "red"]'
          price: Number(price),
          description,
          category,
          gender,
          season,
          image: images
      });
      await newProduct.save();
      res.status(201).json({ message: 'Product created successfully', product: newProduct });
  } catch (error) {
      console.error('Error Creating Product', error);
      res.status(500).json({ message: 'Internal server error' });
  }
};


exports.getAllProducts = async (req, res, next) => {
    try {
        const products = await getAllProducts();
        res.status(200).json(products);
    } catch (error) {
        console.error('Error fetching products', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

exports.getSingleProduct = async (req, res, next) => {
    try {
        const id = req.params.id;
        const product = await getProductByID(id);

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        res.status(200).json({
            product,
            user: req.session.user || null,
            isAdmin: req.session.user?.isAdmin || false
        });
    } catch (error) {
        console.error('Error fetching the product', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

exports.getProductsAndCarouselProducts = async (req, res, next) => {
  try {
      // Extract query parameters with defaults
      const { 
          gender,           // Filter by gender (e.g., "Male", "Female", "all")
          category,         // Filter by category (e.g., "jacket")
          page = 1,         // Pagination: current page number, default 1
          limit = 4,        // Pagination: items per page, default 4
          sort,             // Sort option (e.g., "newest", "price_asc")
          search,           // Search term for name or description
          color             // Filter by color (e.g., "black")
      } = req.query;
      console.log('Backend Received Gender:', gender);
      const skip = (page - 1) * limit; // Calculate skip value for pagination

      let products = []; // Array to hold carousel products
      // Populate carousel products based on gender
      if (gender && gender !== 'all') {
          const mostLiked = await getMostLikedProducts(gender, 1);      // Get 1 most liked product
          const mostCommented = await getMostCommentedProducts(gender, 1); // Get 1 most commented product
          const newest = await getNewestProducts(gender, 1);            // Get 1 newest product
          const random = await getRandomProduct(gender);                // Get 1 random product
          products = [...mostLiked, ...mostCommented, ...newest, random]; // Combine into carousel array
      } else {
          products = await getAllProductsMixed(); // If no gender filter, get mixed products
      }
      // Get the Winter Collection 
      const winterCollection = await getWinterProductsData(gender || 'all')  
      // Get the SUmmer Collection 
      const summerCollection = await getSummerAndSpringProductsData(gender || 'all')
      // Fetch additional product lists for display
      const mostLikedProducts = await getMostLikedProducts(gender || 'all', 4); // Top 4 most liked products
      const mostRecentProducts = await getNewestProducts(gender || 'all', 4);   // Top 4 most recent products

      // Build query object for main products based on filters
      let query = {};
      if (gender && gender !== 'all') query.gender = gender; // Filter by gender if specified
      if (color) query.colors = { $in: [new RegExp(`^${color.trim()}$`, 'i')] }; // Filter by colors array, case-insensitive
      if (category) query.category = { $regex: new RegExp(`^${category.trim()}$`, 'i') }; // Filter by category, case-insensitive
      if (search) {
          // Search across name and description fields, case-insensitive
          query.$or = [
              { name: { $regex: search, $options: 'i' } },
              { description: { $regex: search, $options: 'i' } }
          ];
      }

      // Define sorting options based on query parameter
      let sortOptions = {};
      switch (sort) {
          case 'newest': sortOptions = { _id: -1 }; break;      // Sort by newest first (descending ID)
          case 'price_asc': sortOptions = { price: 1 }; break;   // Sort by price ascending
          case 'price_desc': sortOptions = { price: -1 }; break; // Sort by price descending
          case 'oldest': sortOptions = { _id: 1 }; break;       // Sort by oldest first (ascending ID)
          default: sortOptions = { _id: 1 };                    // Default to oldest first
      }

      // Fetch main products with pagination, total count, and apply filters/sort
      const { mainProducts, total } = await getMainProducts(query, sortOptions, skip, limit);
      // Fetch distinct categories and their counts based on the same query
      const categoriesWithCounts = await getDistinctProductsCategoriesWithCounts(query);
      // Fetch distinct colors and their counts based on the same query
      const colorsWithCounts = await getDistinctColorsWithCounts(query);

      // Send response with all fetched data
      res.status(200).json({
          mostLikedProducts,        // Array of top 4 most liked products
          mostRecentProducts,       // Array of top 4 most recent products
          carouselProducts: products, // Array of carousel products
          products: mainProducts,    // Paginated main products
          totalPages: Math.ceil(total / limit), // Total number of pages
          currentPage: Number(page), // Current page number
          categoriesWithCounts,      // Array of categories with counts
          colorsWithCounts,          // Array of colors with counts
          user: req.session.user || null, // User session data, if available
          isAdmin: req.session.user?.isAdmin || false, // Admin status of user
          winterCollection,  //Winter Collection For The Products 
          summerCollection //   summerCollection
      });
  } catch (error) {
      console.error('Error fetching carousel products:', error);
      return res.status(500).json({ message: 'Internal server error' });
  }
};


// Fetch product suggestions based on search query and filters
exports.getSuggestionsProducts = async (req, res, next) => {
  try {
      const query = req.query.query; // Search term from query parameter
      // Log received filters for debugging
      console.log('Received filters:', {
          color: req.query.color,
          category: req.query.category,
          gender: req.query.gender,
          sort: req.query.sort
      });

      // Parse filters from query parameters, splitting comma-separated values
      const filters = {
          color: req.query.color ? req.query.color.split(',') : null,     // e.g., "black,red" -> ["black", "red"]
          category: req.query.category ? req.query.category.split(',') : null, // e.g., "jacket,tops"
          gender: req.query.gender ? req.query.gender.split(',') : null,  // e.g., "Male,Female"
          sort: req.query.sort                                           // e.g., "newest"
      };

      // Build filter conditions for MongoDB query
      const filterConditions = { 
          name: { $regex: query || '', $options: 'i' } // Search name, default to empty string if no query
      };
      if (filters.color) {
          // Filter by colors array, case-insensitive regex for each color
          filterConditions.colors = { $in: filters.color.map(c => new RegExp(c, 'i')) };
      }
      if (filters.category) {
          // Filter by category, case-insensitive regex for each category
          filterConditions.category = { $in: filters.category.map(c => new RegExp(c, 'i')) };
      }
      if (filters.gender) {
          // Filter by gender, exact match with case-insensitive regex
          filterConditions.gender = { $in: filters.gender.map(g => new RegExp(`^${g}$`, 'i')) };
      }

      // Parse pagination parameters with defaults
      const page = parseInt(req.query.page, 10) || 1;   // Current page, default 1
      const limit = parseInt(req.query.limit, 10) || 10; // Items per page, default 10

      // Define sorting options based on filter parameter
      let sortOptions = {};
      switch (filters.sort) {
          case 'price_asc': sortOptions = { price: 1 }; break;   // Sort by price ascending
          case 'price_desc': sortOptions = { price: -1 }; break; // Sort by price descending
          case 'newest': sortOptions = { _id: -1 }; break;       // Sort by newest first
          case 'oldest': sortOptions = { _id: 1 }; break;        // Sort by oldest first
          default: sortOptions = { _id: -1 };                    // Default to newest first
      }

      // Fetch suggestions, total count, and category/color counts
      const suggestions = await getSuggestionsProducts(filterConditions, page, limit, sortOptions); // Suggested products
      const totalCount = await getTotalCount(filterConditions); // Total matching products
      const categoriesWithCounts = await getDistinctProductsCategoriesWithCounts(filterConditions); // Category counts
      const colorsWithCounts = await getDistinctColorsWithCounts(filterConditions); // Color counts

      // Send response with suggestions and metadata
      return res.status(200).json({
          suggestions,           // Array of suggested products
          totalCount,            // Total number of matching products
          totalPages: Math.ceil(totalCount / limit), // Total pages
          currentPage: page,     // Current page number
          categoriesWithCounts,  // Array of categories with counts
          colorsWithCounts       // Array of colors with counts
      });
  } catch (error) {
      console.error("Error fetching suggestions", error);
      return res.status(500).json({ message: 'Internal server error' });
  }
};
exports.getDistinctCategoriesWithCounts = async (req, res, next) => {
    try {
        const gender = req.query.gender || 'all'; // Default to 'all' if not provided
        const categories = await getDistinctProductsCategoriesWithCounts(gender);
        
        return res.status(200).json(categories);
    } catch (error) {
        console.error('Error fetching categories:', error);
        return res.status(500).json({
            message: 'Internal server error'
        });
    }
};



exports.getRelatedProductsExcludingSelectedProduct = async (req , res , next) => {
    try{
        const id = req.params.id;
        const product = await getProductByID(id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        // Get related products
        const relatedProducts = await getRelatedProducts(
                    product.category, 
                    product._id
        );
        res.status(200).json({
            relatedProducts,
            user: req.session.user || null,
        })
    }
    catch(error){
        console.error('Error fetching Related Products:', error);
        return res.status(500).json({
            message: 'Internal server error'
        });
    }
}
exports.toggleLikeProduct = async (req, res, next) => {
    try {
      const productId = req.params.id;
      const userId = req.session.user?.id || req.body.userId;
      const result = await toggleLikeProduct(productId, userId);
      
      // Send full product data with arrays
      res.status(200).json({
        likedBy: result.likedBy,
        dislikedBy: result.dislikedBy,
        likes: result.likes,
        dislikes: result.dislikes
      });
    } catch (error) {
      console.error("Error toggling like:", error);
      res.status(500).json({ message: error.message });
    }
  };  
  exports.toggleDislikeProduct = async (req, res, next) => {
    try {
      const productId = req.params.id;
      const userId = req.session.user?.id || req.body.userId;
      const result = await toggleDislikeProduct(productId, userId);
      res.status(200).json({
        likedBy: result.likedBy,
        dislikedBy: result.dislikedBy,
        likes: result.likes,
        dislikes: result.dislikes
      });
    } catch (error) {
      console.error("Error toggling dislike:", error);
      res.status(500).json({ message: error.message });
    }
  };
  