import asyncHandler from '../utils/asyncHandler.js';
import Wishlist from '../models/Wishlist.model.js';
import { successResponse } from '../utils/response.js';
import AppError from '../utils/AppError.js';
import Product from '../models/Product.model.js';

// get user's wishlist

export const getWishlist = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { page = 1, limit = 20 } = req.query;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  // get all wishlist items for the user
  const wishlistItems = await Wishlist.find({ user: userId })
    .populate({
      path: 'product',
      select: 'name price images status seller',
      populate: {
        path: 'seller',
        select: 'name profilePicture',
      },
    })
    .sort('-createdAt')
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Wishlist.countDocuments({ user: userId });

  successResponse(res, {
    products: wishlistItems.map(item => item.product),
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      totalItems: total,
    },
  }, 'wishlist retrieved successfully', 200);
});

// add product to wishlist

export const addToWishlist = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { productId } = req.body;

  if (!productId) {
    throw new AppError('product is required', 400);
  }

  // validation for already added products
  const existingItem = await Wishlist.findOne({
    user: userId,
    product: productId
  });
const product = await Product.findById(productId);

  if (!product) {
    throw new AppError('product not found', 404);
  }

  if (product.seller.toString() === userId) {
    throw new AppError('you cannot add your own product to wishlist', 400);
  }

  // prevent duplicates
  if (existingItem) {
    throw new AppError('product already in wishlist', 400);
  }

  // create new wishlist item
  const wishlistItem = await Wishlist.create({
    user: userId,
    product: productId
  });

  await Product.findByIdAndUpdate(productId, { $inc: { wishlistCount: 1 } });

  await wishlistItem.populate('product', 'name price images status seller');

  successResponse(res, wishlistItem, 'product added to wishlist successfully', 200);
});

// remove product from wishlist

export const removeFromWishlist = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { productId } = req.params;

  const wishlistItem = await Wishlist.findOneAndDelete({
    user: userId,
    product: productId
  });

  if (!wishlistItem) {
    throw new AppError('wishlist item not found', 404);
  }

  await Product.findByIdAndUpdate(productId, { $inc: { wishlistCount: -1 } });

  successResponse(res, wishlistItem, 'product removed from wishlist successfully', 200);
});

// check if product is in wishlist

export const checkWishlist = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { productId } = req.params;

  const wishlistItem = await Wishlist.findOne({ user: userId, product: productId });

  const isInWishlist = !!wishlistItem;

  successResponse(res, { isInWishlist }, 'wishlist status retrieved successfully', 200);
});

export default {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  checkWishlist,
};