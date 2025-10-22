import asyncHandler from '../utils/asyncHandler.js';
import Review from '../models/Review.model.js';
import Order from '../models/Order.model.js';
import Product from '../models/Product.model.js';
import User from '../models/User.model.js';
import { successResponse } from '../utils/response.js';
import AppError from '../utils/AppError.js';
import { sendNewReviewEmail } from '../utils/emailService.js';

// get reviews for product

export const getProductReviews = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { page, limit, rating } = req.query;

  const query = { product: productId };
  if (rating) query.rating = parseInt(rating);

  const skip = ((parseInt(page) || 1) - 1) * (parseInt(limit) || 20);

  const reviews = await Review.find(query)
    .populate('buyer', 'name profilePicture')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit) || 20)
    .skip(skip);

  const total = await Review.countDocuments(query);

  // get average rating
  const avgRating = await Review.getAverageRating(productId);

  successResponse(res, {
    reviews,
    averageRating: avgRating.averageRating,
    totalReviews: avgRating.totalReviews,
    pagination: {
      currentPage: parseInt(page) || 1,
      totalPages: Math.ceil(total / (parseInt(limit) || 20)),
      totalReviews: total,
    },
  }, 'Product reviews retrieved successfully', 200);
});

// create review (must have completed order)

export const createReview = asyncHandler(async (req, res) => {
  const buyerId = req.user.id;
  const { productId, orderId, rating, reviewText, images } = req.body;

  // verify order exists and is completed
  const order = await Order.findById(orderId);
  if (!order) {
    throw new AppError('Order not found', 404);
  }

  if (order.buyer.toString() !== buyerId) {
    throw new AppError('You can only review your own orders', 403);
  }

  if (order.status !== 'completed') {
    throw new AppError('You can only review completed orders', 400);
  }

  // verify product is in order
  const orderItem = order.items.find(
    (item) => item.product.toString() === productId
  );

  if (!orderItem) {
    throw new AppError('Product not found in this order', 404);
  }

  // check if review already exists
  const existingReview = await Review.findOne({
    product: productId,
    buyer: buyerId,
    order: orderId,
  });

  if (existingReview) {
    throw new AppError('You have already reviewed this product', 400);
  }

  // create review
  const review = await Review.create({
    product: productId,
    seller: orderItem.seller,
    buyer: buyerId,
    order: orderId,
    rating,
    reviewText,
    images: images || [],
  });

  // update product rating
  const product = await Product.findById(productId);
  await product.updateRating();

  // update seller rating
  const seller = await User.findById(orderItem.seller);
  const sellerRating = await Review.getSellerRating(orderItem.seller);
  await seller.updateSellerRating(sellerRating.averageRating);

  // send email notification to seller about new review
  try {
    const buyer = await User.findById(buyerId);

    if (seller && seller.email && buyer) {
      await sendNewReviewEmail(
        seller.email,
        product.name,
        rating,
        reviewText,
        buyer.name
      );
    }
  } catch (emailError) {
    console.error('Failed to send review notification email:', emailError);
    // don't throw error - review was created successfully even if email fails
  }

  await review.populate([
    { path: 'buyer', select: 'name profilePicture' },
    { path: 'product', select: 'name images' },
  ]);

  successResponse(res, review, 'Review created successfully', 201);
});

// add seller response to review


export const addSellerResponse = asyncHandler(async (req, res) => {
  const sellerId = req.user.id;
  const { reviewId } = req.params;
  const { responseText } = req.body;

  const review = await Review.findById(reviewId);

  if (!review) {
    throw new AppError('Review not found', 404);
  }

  if (review.seller.toString() !== sellerId) {
    throw new AppError('You can only respond to reviews on your products', 403);
  }

  await review.addSellerResponse(responseText);

  successResponse(res, review, 'Response added successfully', 200);
});

// mark review as helpful

export const markReviewHelpful = asyncHandler(async (req, res) => {
  const { reviewId } = req.params;

  const review = await Review.findById(reviewId);

  if (!review) {
    throw new AppError('Review not found', 404);
  }

  await review.incrementHelpful();

  successResponse(res, review, 'Review marked as helpful', 200);
});

export default {
  getProductReviews,
  createReview,
  addSellerResponse,
  markReviewHelpful,
};