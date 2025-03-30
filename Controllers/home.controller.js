const { getAllProducts, getProductsByCategory } = require('../Models/products.model');

exports.getHome = async (req, res, next) => {
    try {
      const limit = parseInt(req.query.limit) || 3; 
      const skip = parseInt(req.query.skip) || 0;   
      const gender = req.query.gender || ''; // Use gender instead of category
      console.log('Gender from request:', gender); // Debugging: Log the gender from the request
      console.log('Skip from request:', skip); // Debugging: Log the skip value
  
      const validGenders = ['Male', 'Female', 'Special'];
  
      let products;
      if (gender && validGenders.includes(gender)) {
        products = await getProductsByCategory(gender, limit, skip);
        console.log('Filtered Products:', products); // Debugging: Log the filtered products
      } else {
        products = await getAllProducts(limit, skip);
        console.log('All Products:', products); // Debugging: Log all products
      }
  
      res.status(200).json(products); 
      console.log('Products:', products); // Debugging: Log the final products
    } catch (err) {
      console.error('Failed to fetch products', err); // Debugging: Log any errors
      res.status(500).json({ message: 'Internal Server Error' });
    }
  };