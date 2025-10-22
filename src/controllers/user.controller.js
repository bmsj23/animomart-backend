import asyncHandler from '../utils/asyncHandler.js';
import * as userService from '../services/user.service.js';
import { successResponse } from '../utils/response.js';

// get own profile

export const getMe = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const user = await userService.getUserById(userId);

  successResponse(res, user, 'Profile retrieved successfully', 200);
});

// update own profile

export const updateMe = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const updateData = req.body;

  const user = await userService.updateProfile(userId, updateData);

  successResponse(res, user, 'Profile updated successfully', 200);
});

// delete own account

export const deleteMe = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const result = await userService.deleteAccount(userId);

  successResponse(res, result, 'Account deleted successfully', 200);
});

// get public user profile

export const getUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const user = await userService.getUserById(userId);

  successResponse(res, user, 'User profile retrieved successfully', 200);
});

// get user's products

export const getUserProducts = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { page, limit, status } = req.query;

  const productService = await import('../services/product.service.js');
  const result = await productService.getSellerProducts(userId, {
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 20,
    status,
  });

  successResponse(res, result, 'User products retrieved successfully', 200);
});

// get reviews for user as seller

export const getUserReviews = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { page, limit } = req.query;

  const Review = (await import('../models/Review.model.js')).default;

  const reviews = await Review.find({ seller: userId })
    .populate('buyer', 'name profilePicture')
    .populate('product', 'name images')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit) || 20)
    .skip(((parseInt(page) || 1) - 1) * (parseInt(limit) || 20));

  const total = await Review.countDocuments({ seller: userId });

  successResponse(res, {
    reviews,
    pagination: {
      currentPage: parseInt(page) || 1,
      totalPages: Math.ceil(total / (parseInt(limit) || 20)),
      totalReviews: total,
    },
  }, 'User reviews retrieved successfully', 200);
});

// update seller info

export const updateSellerInfo = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const sellerData = req.body;

  const user = await userService.updateSellerInfo(userId, sellerData);

  successResponse(res, user, 'Seller info updated successfully', 200);
});

// get seller profile with products

export const getSellerProfile = asyncHandler(async (req, res) => {
  const { sellerId } = req.params;

  const seller = await userService.getSellerProfile(sellerId);

  successResponse(res, seller, 'Seller profile retrieved successfully', 200);
});

export default {
  getMe,
  updateMe,
  deleteMe,
  getUser,
  getUserProducts,
  getUserReviews,
  updateSellerInfo,
  getSellerProfile,
};