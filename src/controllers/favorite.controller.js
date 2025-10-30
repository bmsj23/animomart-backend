import asyncHandler from '../utils/asyncHandler.js';
import Favorite from '../models/Favorite.model.js';
import { successResponse } from '../utils/response.js';
import AppError from '../utils/AppError.js';
import Product from '../models/Product.model.js';

// get user's favorites

export const getFavorites = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { page = 1, limit = 20 } = req.query;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  // get all favorites for the user
  const favorites = await Favorite.find({ user: userId })
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

  const total = await Favorite.countDocuments({ user: userId });

  successResponse(res, {
    products: favorites.map(fav => fav.product),
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      totalFavorites: total,
    },
  }, 'Favorites retrieved successfully', 200);
});

// add product to favorites

export const addFavorite = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { productId } = req.body;

  if (!productId) {
    throw new AppError('Product is required', 400);
  }

  // validation for already favorited products
  const existingFavorite = await Favorite.findOne({
    user: userId,
    product: productId
  });
const product = await Product.findById(productId);

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  if (product.seller.toString() === userId) {
    throw new AppError('You cannot favorite your own product', 400);
  }

  // prevent duplicate favorites
  if (existingFavorite) {
    throw new AppError('Product already in favorites', 400);
  }

  // create new favorite document
  const favorite = await Favorite.create({
    user: userId,
    product: productId
  });

  await Product.findByIdAndUpdate(productId, { $inc: { favoriteCount: 1 } });

  await favorite.populate('product', 'name price images status seller');

  successResponse(res, favorite, 'Product added to favorites successfully', 200);
});

// remove product from favorites

export const removeFavorite = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { productId } = req.params;

  const favorite = await Favorite.findOneAndDelete({
    user: userId,
    product: productId
  });

  if (!favorite) {
    throw new AppError('Favorite not found', 404);
  }

  await Product.findByIdAndUpdate(productId, { $inc: { favoriteCount: -1 } });

  successResponse(res, favorite, 'Product removed from favorites successfully', 200);
});

// check if product is favorited

export const checkFavorite = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { productId } = req.params;

  const favorite = await Favorite.findOne({ user: userId });

  const isFavorited = favorite && favorite.products.includes(productId);

  successResponse(res, { isFavorited }, 'Favorite status retrieved successfully', 200);
});

export default {
  getFavorites,
  addFavorite,
  removeFavorite,
  checkFavorite,
};