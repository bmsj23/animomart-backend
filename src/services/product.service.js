import Product from '../models/Product.model.js';
import User from '../models/User.model.js';
import AppError from '../utils/AppError.js';


// create a new product
// param {string} sellerId - seller user ID
// param {Object} productData - product data
// returns {Object} created product

export const createProduct = async (sellerId, productData) => {
  // verify seller exists
  const seller = await User.findById(sellerId);
  if (!seller) {
    throw new AppError('Seller not found', 404);
  }

  // create product
  const product = await Product.create({
    ...productData,
    seller: sellerId,
  });

  await product.populate('seller', 'name profilePicture sellerInfo');

  return product;
};


// get product by ID
// param {string} productId - product ID
// param {boolean} incrementView - whether to increment view count
// returns {Object} product data

export const getProductById = async (productId, incrementView = false) => {
  const product = await Product.findById(productId)
    .populate('seller', 'name profilePicture sellerInfo contactNumber');

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  // increment views if requested
  if (incrementView && product.status === 'active') {
    await product.incrementViews();
  }

  return product;
};


// update product
// param {string} productId - product ID
// param {string} sellerId - seller user ID
// param {Object} updateData - data to update
// returns {Object} updated product

export const updateProduct = async (productId, sellerId, updateData) => {
  const product = await Product.findById(productId);

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  if (product.seller.toString() !== sellerId) {
    throw new AppError('You can only update your own products', 403);
  }

  // fields that can be updated
  const allowedUpdates = [
    'name',
    'description',
    'price',
    'stock',
    'images',
    'category',
    'condition',
    'shippingAvailable',
    'status',
  ];

  // update only allowed fields
  allowedUpdates.forEach((field) => {
    if (updateData[field] !== undefined) {
      product[field] = updateData[field];
    }
  });

  await product.save();
  await product.populate('seller', 'name profilePicture');

  return product;
};


// delete product
// param {string} productId - product ID
// param {string} sellerId - seller user ID
// returns {Object} success message

export const deleteProduct = async (productId, sellerId) => {
  const product = await Product.findById(productId);

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  // verify ownership
  if (product.seller.toString() !== sellerId) {
    throw new AppError('You can only delete your own products', 403);
  }

  // soft delete by changing status
  product.status = 'deleted';
  await product.save();

  return {
    message: 'Product deleted successfully',
  };
};


// get all products with filters
// param {Object} filters - filter options
// returns {Object} products and pagination

export const getAllProducts = async (filters = {}) => {
  const {
    category,
    condition,
    minPrice,
    maxPrice,
    search,
    sellerId,
    status = 'active',
    page = 1,
    limit = 20,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = filters;

  const query = {};

  // apply filters
  if (status) query.status = status;
  if (category) query.category = category;
  if (condition) query.condition = condition;
  if (sellerId) query.seller = sellerId;

  // price range
  if (minPrice !== undefined || maxPrice !== undefined) {
    query.price = {};
    if (minPrice !== undefined) query.price.$gte = Number(minPrice);
    if (maxPrice !== undefined) query.price.$lte = Number(maxPrice);
  }

  // text search
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }

  // pagination
  const skip = (page - 1) * limit;

  // sorting
  const sort = {};
  sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

  const products = await Product.find(query)
    .populate('seller', '_id name profilePicture sellerInfo')
    .sort(sort)
    .limit(limit)
    .skip(skip);

  const total = await Product.countDocuments(query);

  return {
    products,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalProducts: total,
      hasMore: page * limit < total,
    },
  };
};


// get products by seller
// param {string} sellerId - seller user ID
// param {Object} options - filter options
// returns {Array} seller's products

export const getSellerProducts = async (sellerId, options = {}) => {
  const { status, page = 1, limit = 20 } = options;

  const query = { seller: sellerId };
  if (status) query.status = status;

  const skip = (page - 1) * limit;

  const products = await Product.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip);

  const total = await Product.countDocuments(query);

  return {
    products,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalProducts: total,
    },
  };
};


// search products with full-text search
// param {string} searchTerm - search term
// param {Object} options - search options
// returns {Object} search results

export const searchProducts = async (searchTerm, options = {}) => {
  const { category, minPrice, maxPrice, page = 1, limit = 20 } = options;

  const searchOptions = {
    limit,
    skip: (page - 1) * limit,
    category,
    minPrice,
    maxPrice,
  };

  const products = await Product.searchProducts(searchTerm, searchOptions);

  return {
    products,
    searchTerm,
  };
};


// get featured/recommended products
// param {Object} options
// returns {Array} featured products

export const getFeaturedProducts = async (options = {}) => {
  const { limit = 10 } = options;

  // get products with high ratings and sales
  const products = await Product.find({
    status: 'active',
    stock: { $gt: 0 },
  })
    .populate('seller', 'name profilePicture')
    .sort({ totalSales: -1, averageRating: -1, views: -1 })
    .limit(limit);

  return products;
};


// get low stock products for seller
// param {string} sellerId - seller user ID
// param {number} threshold - stock threshold
// returns {Array} low stock products

export const getLowStockProducts = async (sellerId, threshold = 5) => {
  const products = await Product.find({
    seller: sellerId,
    status: 'active',
    stock: { $lte: threshold, $gt: 0 },
  }).sort({ stock: 1 });

  return products;
};


// update product stock
// param {string} productId - product ID
// param {number} quantity - quantity to add/remove
// param {string} operation - 'add' or 'remove'
// returns {Object} updated product

export const updateStock = async (productId, quantity, operation = 'add') => {
  const product = await Product.findById(productId);

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  if (operation === 'add') {
    await product.incrementStock(quantity);
  } else if (operation === 'remove') {
    await product.decrementStock(quantity);
  } else {
    throw new AppError('Invalid operation. Use "add" or "remove"', 400);
  }

  return product;
};


// get product categories with counts
// returns {Array} categories with product counts

export const getCategoryCounts = async () => {
  const counts = await Product.aggregate([
    { $match: { status: 'active' } },
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
  ]);

  return counts;
};

export default {
  createProduct,
  getProductById,
  updateProduct,
  deleteProduct,
  getAllProducts,
  getSellerProducts,
  searchProducts,
  getFeaturedProducts,
  getLowStockProducts,
  updateStock,
  getCategoryCounts,
};