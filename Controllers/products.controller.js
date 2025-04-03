const { Product, getAllProducts, getProductByID , getMostLikedProducts,getMostCommentedProducts,getNewestProducts,getRandomProduct,getAllProductsMixed 
,getMainProducts , getDistinctProductsCategoriesWithCounts , getDistinctColorsWithCounts ,  getSuggestionsProducts , getTotalCount , getRelatedProducts , toggleLikeProduct,
toggleDislikeProduct} = require('../Models/products.model');

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
    console.log('Query params:', { gender, category, page, limit, sort, search, color });

    let products = [];
    if (gender && gender !== 'all') {
      console.log('Fetching gendered carousel products');
      const mostLiked = await getMostLikedProducts(gender, 1).catch(err => {
        console.error('Most liked failed:', err);
        return [];
      });
      const mostCommented = await getMostCommentedProducts(gender, 1).catch(err => {
        console.error('Most commented failed:', err);
        return [];
      });
      const newest = await getNewestProducts(gender, 1).catch(err => {
        console.error('Newest failed:', err);
        return [];
      });
      const random = await getRandomProduct(gender).catch(err => {
        console.error('Random failed:', err);
        return null;
      });
      products = [
        ...(mostLiked || []),
        ...(mostCommented || []),
        ...(newest || []),
        ...(random ? [random] : []),
      ].filter(Boolean); // Remove null/undefined
      console.log('Carousel products:', products.length);
    } else {
      console.log('Fetching mixed carousel products');
      products = await getAllProductsMixed().catch(err => {
        console.error('Mixed products failed:', err);
        return [];
      });
      console.log('Mixed products:', products.length);
    }

    const mostLikedProducts = await getMostLikedProducts(gender || 'all', 4).catch(err => {
      console.error('Most liked (4) failed:', err);
      return [];
    });
    const mostRecentProducts = await getNewestProducts(gender || 'all', 4).catch(err => {
      console.error('Most recent (4) failed:', err);
      return [];
    });

    let query = {};
    if (gender && gender !== 'all') query.gender = gender;
    if (color) query.color = { $regex: new RegExp(`^${color.trim()}$`, 'i') };
    if (category) query.category = { $regex: new RegExp(`^${category.trim()}$`, 'i') };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
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

    const { mainProducts, total } = await getMainProducts(query, sortOptions, skip, limit).catch(err => {
      console.error('Main products failed:', err);
      return { mainProducts: [], total: 0 };
    });
    const categoriesWithCounts = await getDistinctProductsCategoriesWithCounts(query).catch(err => {
      console.error('Categories failed:', err);
      return [];
    });
    const colorsWithCounts = await getDistinctColorsWithCounts(query).catch(err => {
      console.error('Colors failed:', err);
      return [];
    });

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
    });
  } catch (error) {
    console.error('Unexpected error in getProductsAndCarouselProducts:', error);
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
        case 'price_asc':
          sortOptions = { price: 1 };
          break;
        case 'price_desc':
          sortOptions = { price: -1 };
          break;
        case 'newest':
          sortOptions = { _id: -1 };
          break;
        case 'oldest':
          sortOptions = { _id: 1 };
          break;
        default:
          sortOptions = { _id: -1 };
      }
  
      const suggestions = await getSuggestionsProducts(filterConditions, page, limit, sortOptions);
      const totalCount = await getTotalCount(filterConditions);
      const categoriesWithCounts = await getDistinctProductsCategoriesWithCounts(filterConditions);
      const colorsWithCounts = await getDistinctColorsWithCounts(filterConditions);
  
      return res.status(200).json({
        suggestions,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
        categoriesWithCounts,
        colorsWithCounts
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
  