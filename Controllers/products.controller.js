const { Product, getAllProducts, getProductByID , getMostLikedProducts,getMostCommentedProducts,getNewestProducts,getRandomProduct,getAllProductsMixed 
,getMainProducts , getDistinctProductsCategoriesWithCounts , getDistinctColorsWithCounts ,  getSuggestionsProducts , getTotalCount , getRelatedProducts , toggleLikeProduct,
toggleDislikeProduct , getWinterProductsData,
        getSummerAndSpringProductsData} = require('../Models/products.model');

exports.createProduct = async (req, res, next) => {
    try {
        req.body.image = req.file.filename;
        const { name, color, price, description, category, gender,season } = req.body;
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

exports.getProductsAndCarouselProducts = async (req, res, next) => {
  try {
    const { gender, category, page = 1, limit = 4, sort, search, color } = req.query;
    const skip = (page - 1) * limit;

    let products = [];
    if (gender && gender !== 'all') {
      try {
        const mostLiked = await getMostLikedProducts(gender, 1);
        const mostCommented = await getMostCommentedProducts(gender, 1);
        const newest = await getNewestProducts(gender, 1);
        const random = await getRandomProduct(gender);
        products = [...mostLiked, ...mostCommented, ...newest, random].filter(Boolean);
        if (products.length < 4) {
          console.log(`Falling back to newest for ${gender}`);
          const additional = await getNewestProducts(gender, 4 - products.length);
          products = [...products, ...additional].slice(0, 4);
        }
      } catch (error) {
        console.error(`Error fetching carousel products for ${gender}:`, error);
        products = await getNewestProducts(gender, 4).catch(err => {
          console.error('Fallback failed:', err);
          return [];
        });
      }
    } else {
      try {
        products = await getAllProductsMixed();
      } catch (error) {
        console.error('Error fetching mixed products:', error);
        products = await getNewestProducts('all', 4).catch(err => []);
      }
    }

    let mostLikedProducts, mostRecentProducts;
    try {
      mostLikedProducts = await getMostLikedProducts(gender || 'all', 4);
      mostRecentProducts = await getNewestProducts(gender || 'all', 4);
    } catch (error) {
      console.error('Error fetching most liked/recent products:', error);
      mostLikedProducts = [];
      mostRecentProducts = [];
    }

    let query = {};
    if (gender && gender !== 'all') query.gender = gender;
    if (color) query.color = { $regex: new RegExp(`^${color.trim()}$`, 'i') };
    if (category) query.category = { $regex: new RegExp(`^${category.trim()}$`, 'i') };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    let sortOptions = {};
    switch (sort) {
      case 'newest': sortOptions = { _id: -1 }; break;
      case 'price_asc': sortOptions = { price: 1 }; break;
      case 'price_desc': sortOptions = { price: -1 }; break;
      case 'oldest': sortOptions = { _id: 1 }; break;
      default: sortOptions = { _id: 1 };
    }

    let mainProducts, total;
    try {
      const result = await getMainProducts(query, sortOptions, skip, limit);
      mainProducts = result.mainProducts;
      total = result.total;
    } catch (error) {
      console.error('Error fetching main products:', error);
      mainProducts = [];
      total = 0;
    }

    let categoriesWithCounts, colorsWithCounts;
    try {
      categoriesWithCounts = await getDistinctProductsCategoriesWithCounts(query);
      colorsWithCounts = await getDistinctColorsWithCounts(query);
    } catch (error) {
      console.error('Error fetching categories/colors:', error);
      categoriesWithCounts = [];
      colorsWithCounts = [];
    }
    let winterCollection , summerCollection; 
    try{
      winterCollection =await getWinterProductsData(gender || 'all')
      summerCollection = await getSummerAndSpringProductsData(gender || 'all')
    }
    catch(error){
      console.error('Error fetching winterCollection , summerCollection:', error);
      winterCollection = [];
      summerCollection = [];
    }
    res.status(200).json({
      mostLikedProducts,
      mostRecentProducts,
      carouselProducts: products,
      products: mainProducts,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
      categoriesWithCounts,
      colorsWithCounts,
      user: req.session.user || null,
      isAdmin: req.session.user?.isAdmin || false,
      winterCollection:winterCollection,
      summerCollection:summerCollection,
    });
  } catch (error) {
    console.error('Error fetching carousel products:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
exports.getSuggestionsProducts = async (req, res, next) => {
  try {
    const query = req.query.query;
    console.log('Received filters:', {
      color: req.query.color,
      category: req.query.category,
      gender: req.query.gender,
      sort: req.query.sort
    });

    const filters = {
      color: req.query.color ? req.query.color.split(',') : null,
      category: req.query.category ? req.query.category.split(',') : null,
      gender: req.query.gender ? req.query.gender.split(',') : null,
      sort: req.query.sort
    };

    const filterConditions = { name: { $regex: query || '', $options: 'i' } };
    if (filters.color) {
      filterConditions.color = { $in: filters.color.map(c => new RegExp(c, 'i')) };
    }
    if (filters.category) {
      filterConditions.category = { $in: filters.category.map(c => new RegExp(c, 'i')) };
    }
    if (filters.gender) {
      filterConditions.gender = { $in: filters.gender.map(g => new RegExp(`^${g}$`, 'i')) };
    }

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;

    let sortOptions = {};
    switch (filters.sort) {
      case 'price_asc': sortOptions = { price: 1 }; break;
      case 'price_desc': sortOptions = { price: -1 }; break;
      case 'newest': sortOptions = { _id: -1 }; break;
      case 'oldest': sortOptions = { _id: 1 }; break;
      default: sortOptions = { _id: -1 };
    }

    const suggestions = await getSuggestionsProducts(filterConditions, page, limit, sortOptions).catch(err => {
      console.error('Error fetching suggestions:', err);
      return [];
    });
    const totalCount = await getTotalCount(filterConditions).catch(err => {
      console.error('Error fetching total count:', err);
      return 0;
    });
    const categoriesWithCounts = await getDistinctProductsCategoriesWithCounts(filterConditions).catch(err => {
      console.error('Error fetching categories with counts:', err);
      return [];
    });
    const colorsWithCounts = await getDistinctColorsWithCounts(filterConditions).catch(err => {
      console.error('Error fetching colors with counts:', err);
      return [];
    });

    return res.status(200).json({
      suggestions,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
      categoriesWithCounts,
      colorsWithCounts
    });
  } catch (error) {
    console.error("Unexpected error in getSuggestionsProducts:", error);
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
  