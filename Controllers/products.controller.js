const { Product, getAllProducts, getProductByID, getMostLikedProducts, getMostCommentedProducts, getNewestProducts, 
  getRandomProduct, getAllProductsMixed, getMainProducts, getDistinctProductsCategoriesWithCounts, 
  getDistinctColorsWithCounts, getSuggestionsProducts, getTotalCount, getRelatedProducts, 
  toggleLikeProduct, toggleDislikeProduct, getWinterProductsData, getSummerAndSpringProductsData 
} = require('../Models/products.model');

exports.createProduct = async (req, res, next) => {
  try {
    req.body.image = req.file.filename;
    const { name, color, price, description, category, gender, season } = req.body;
    const newProduct = new Product({
      name,
      color,
      price,
      description,
      category,
      gender,
      season,
      image: req.body.image
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

exports.getFeaturedCollections = async (req, res, next) => {
  try {
    const { gender = 'all' } = req.query;
    const normalizedGender = gender;
    console.log('Backend Received Gender:', normalizedGender);

    let carouselProducts = [];
    if (normalizedGender !== 'all') {
      try {
        const mostLiked = await getMostLikedProducts(normalizedGender, 1);
        const mostCommented = await getMostCommentedProducts(normalizedGender, 1);
        const newest = await getNewestProducts(normalizedGender, 1);
        const random = await getRandomProduct(normalizedGender);
        carouselProducts = [...mostLiked, ...mostCommented, ...newest, random].filter(Boolean);
        console.log(`Carousel for ${normalizedGender}:`, carouselProducts);

        if (carouselProducts.length < 4) {
          const additional = await getNewestProducts(normalizedGender, 4 - carouselProducts.length);
          carouselProducts = [...carouselProducts, ...additional].slice(0, 4);
        }
      } catch (error) {
        console.error(`Error fetching carousel for ${normalizedGender}:`, error);
        carouselProducts = await getNewestProducts(normalizedGender, 4) || [];
      }
    } else {
      try {
        carouselProducts = await getAllProductsMixed();
        console.log('Mixed carousel products:', carouselProducts);
      } catch (error) {
        console.error('Error fetching mixed carousel products:', error);
        carouselProducts = await getNewestProducts('all', 4) || [];
      }
    }

    let mostLikedProducts = [];
    try {
      mostLikedProducts = await getMostLikedProducts(normalizedGender, 4);
      console.log(`mostLikedProducts for ${normalizedGender}:`, mostLikedProducts);
    } catch (error) {
      console.error(`Error fetching mostLikedProducts for ${normalizedGender}:`, error);
      mostLikedProducts = [];
    }

    let mostRecentProducts = [];
    try {
      mostRecentProducts = await getNewestProducts(normalizedGender, 4);
      console.log(`mostRecentProducts for ${normalizedGender}:`, mostRecentProducts);
    } catch (error) {
      console.error(`Error fetching mostRecentProducts for ${normalizedGender}:`, error);
      mostRecentProducts = [];
    }

    let winterCollection = [];
    try {
      winterCollection = await getWinterProductsData(normalizedGender);
      console.log(`winterCollection for ${normalizedGender}:`, winterCollection);
    } catch (error) {
      console.error(`Error fetching winterCollection for ${normalizedGender}:`, error);
      winterCollection = [];
    }

    let summerCollection = [];
    try {
      summerCollection = await getSummerAndSpringProductsData(normalizedGender);
      console.log(`summerCollection for ${normalizedGender}:`, summerCollection);
    } catch (error) {
      console.error(`Error fetching summerCollection for ${normalizedGender}:`, error);
      summerCollection = [];
    }

    res.status(200).json({
      mostLikedProducts,
      mostRecentProducts,
      carouselProducts,
      winterCollection,
      summerCollection
    });
  } catch (error) {
    console.error('Error in getFeaturedCollections:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.fetchMainProducts = async (req, res, next) => {
  try {
    // Extract query parameters with defaults
    const { 
      gender = 'all', 
      category, 
      page = 1, 
      limit = 4, 
      sort, 
      search, 
      color 
    } = req.query;
    console.log('Backend Received Gender:', gender);
    const skip = (page - 1) * limit; // Calculate skip value for pagination

    // Build query object for mains products based on filters
    let query = {};
    if (gender && gender !== 'all') query.gender = { $in: [gender] }; // Match array, keep case
    if (color) query.colors = { $in: [new RegExp(`^${color.trim()}$`, 'i')] }; // Filter by colors array
    if (category) query.category = { $regex: new RegExp(`^${category.trim()}$`, 'i') };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Define sorting options based on query parameter
    let sortOptions = {};
    switch (sort) {
      case 'newest': sortOptions = { _id: -1 }; break;
      case 'price_asc': sortOptions = { price: 1 }; break;
      case 'price_desc': sortOptions = { price: -1 }; break;
      case 'oldest': sortOptions = { _id: 1 }; break;
      default: sortOptions = { _id: 1 };
    }

    // Fetch main products with pagination, total count, and apply filters/sort
    let mainProducts = [];
    let total = 0;
    try {
      const result = await getMainProducts(query, sortOptions, skip, limit);
      mainProducts = result.mainProducts;
      total = result.total;
    } catch (error) {
      console.error('Error fetching main products from model:', error);
      mainProducts = [];
      total = 0;
    }

    // Fetch distinct categories and their counts based on the same query
    let categoriesWithCounts = [];
    try {
      categoriesWithCounts = await getDistinctProductsCategoriesWithCounts(query);
    } catch (error) {
      console.error('Error fetching categories with counts:', error);
      categoriesWithCounts = [];
    }

    // Fetch distinct colors and their counts based on the same query
    let colorsWithCounts = [];
    try {
      colorsWithCounts = await getDistinctColorsWithCounts(query);
    } catch (error) {
      console.error('Error fetching colors with counts:', error);
      colorsWithCounts = [];
    }

    // Send response with fetched data
    res.status(200).json({
      products: mainProducts,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
      categoriesWithCounts,
      colorsWithCounts
    });
  } catch (error) {
    console.error('Error fetching main products:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
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

      let filters;
      try {
          // Parse filters from query parameters, splitting comma-separated values
          filters = {
              color: req.query.color ? req.query.color.split(',') : null,     // e.g., "black,red" -> ["black", "red"]
              category: req.query.category ? req.query.category.split(',') : null, // e.g., "jacket,tops"
              gender: req.query.gender ? req.query.gender.split(',') : null,  // e.g., "Male,Female"
              sort: req.query.sort                                           // e.g., "newest"
          };
      } catch (error) {
          console.error("Error parsing filters:", error);
          return res.status(400).json({ message: 'Invalid filter parameters' });
      }

      let filterConditions;
      try {
          // Build filter conditions for MongoDB query
          filterConditions = { 
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
      } catch (error) {
          console.error("Error building filter conditions:", error);
          return res.status(400).json({ message: 'Invalid filter conditions' });
      }

      let page, limit;
      try {
          // Parse pagination parameters with defaults
          page = parseInt(req.query.page, 10) || 1;   // Current page, default 1
          limit = parseInt(req.query.limit, 10) || 10; // Items per page, default 10
      } catch (error) {
          console.error("Error parsing pagination parameters:", error);
          return res.status(400).json({ message: 'Invalid pagination parameters' });
      }

      let sortOptions;
      try {
          // Define sorting options based on filter parameter
          sortOptions = {};
          switch (filters.sort) {
              case 'price_asc': sortOptions = { price: 1 }; break;   // Sort by price ascending
              case 'price_desc': sortOptions = { price: -1 }; break; // Sort by price descending
              case 'newest': sortOptions = { _id: -1 }; break;       // Sort by newest first
              case 'oldest': sortOptions = { _id: 1 }; break;        // Sort by oldest first
              default: sortOptions = { _id: -1 };                    // Default to newest first
          }
      } catch (error) {
          console.error("Error setting sort options:", error);
          return res.status(400).json({ message: 'Invalid sort parameter' });
      }

      let suggestions, totalCount, categoriesWithCounts, colorsWithCounts;
      try {
          // Fetch suggestions, total count, and category/color counts
          suggestions = await getSuggestionsProducts(filterConditions, page, limit, sortOptions); // Suggested products
          totalCount = await getTotalCount(filterConditions); // Total matching products
          categoriesWithCounts = await getDistinctProductsCategoriesWithCounts(filterConditions); // Category counts
          colorsWithCounts = await getDistinctColorsWithCounts(filterConditions); // Color counts
      } catch (error) {
          console.error("Error fetching data from database:", error);
          return res.status(500).json({ message: 'Database error' });
      }

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
    const gender = req.query.gender || 'all';
    const categories = await getDistinctProductsCategoriesWithCounts(gender);
    return res.status(200).json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getRelatedProductsExcludingSelectedProduct = async (req, res, next) => {
  try {
    const id = req.params.id;
    const product = await getProductByID(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    const relatedProducts = await getRelatedProducts(product.category, product._id);
    res.status(200).json({
      relatedProducts,
      user: req.session.user || null,
    });
  } catch (error) {
    console.error('Error fetching Related Products:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

exports.toggleLikeProduct = async (req, res, next) => {
  try {
    const productId = req.params.id;
    const userId = req.session.user?.id || req.body.userId;
    const result = await toggleLikeProduct(productId, userId);
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