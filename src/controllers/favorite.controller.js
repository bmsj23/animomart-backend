import asyncHandler from '../utils/asyncHandler.js';
import Favorite from '../models/Favorite.model.js';
import { successResponse } from '../utils/response.js';
import AppError from '../utils/AppError.js';

// get user's favorites

export const getFavorites = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { page, limit } = req.query;

  const skip = ((parseInt(page) || 1) - 1) * (parseInt(limit) || 20);

  let favorite = await Favorite.findOne({ user: userId })
    .populate({
      path: 'products',
      select: 'name price images status seller',
      populate: {
        path: 'seller',
        select: 'name profilePicture',
      },
    });

  if (!favorite) {
    favorite = await Favorite.create({ user: userId, products: [] });
  }

  const total = favorite.products.length;
  const paginatedProducts = favorite.products.slice(skip, skip + (parseInt(limit) || 20));

  successResponse(res, {
    products: paginatedProducts,
    pagination: {
      currentPage: parseInt(page) || 1,
      totalPages: Math.ceil(total / (parseInt(limit) || 20)),
      totalFavorites: total,
    },
  }, 'Favorites retrieved successfully', 200);
});

// add product to favorites

export const addFavorite = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { productId } = req.body;

  let favorite = await Favorite.findOne({ user: userId });

  if (!favorite) {
    favorite = await Favorite.create({ user: userId, products: [productId] });
  } else {
    if (favorite.products.includes(productId)) {
      throw new AppError('Product already in favorites', 400);
    }
    favorite.products.push(productId);
    await favorite.save();
  }

  successResponse(res, favorite, 'Product added to favorites successfully', 200);
});

// remove product from favorites

export const removeFavorite = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { productId } = req.params;

  const favorite = await Favorite.findOne({ user: userId });

  if (!favorite) {
    throw new AppError('Favorites not found', 404);
  }

  favorite.products = favorite.products.filter(
    (id) => id.toString() !== productId
  );
  await favorite.save();

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