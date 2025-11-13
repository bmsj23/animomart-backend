import asyncHandler from '../utils/asyncHandler.js';
import * as cartService from '../services/cart.service.js';
import { successResponse } from '../utils/response.js';

// get user's cart

export const getCart = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const result = await cartService.getCart(userId);

  successResponse(res, result, 'Cart retrieved successfully', 200);
});

// add item to cart

export const addToCart = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { productId, quantity } = req.body;

  const cart = await cartService.addToCart(userId, productId, quantity);

  successResponse(res, cart, 'Item added to cart successfully', 200);
});

// update cart item quantity

export const updateCartItem = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { productId } = req.params;
  const { quantity } = req.body;

  const cart = await cartService.updateCartItem(userId, productId, quantity);

  successResponse(res, cart, 'Cart item updated successfully', 200);
});

// remove item from cart

export const removeFromCart = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { productId } = req.params;

  const cart = await cartService.removeFromCart(userId, productId);

  successResponse(res, cart, 'Item removed from cart successfully', 200);
});

// clear entire cart

export const clearCart = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const cart = await cartService.clearCart(userId);

  successResponse(res, cart, 'Cart cleared successfully', 200);
});

// get cart summary

export const getCartSummary = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const summary = await cartService.getCartSummary(userId);

  successResponse(res, summary, 'Cart summary retrieved successfully', 200);
});

// get cart grouped by seller

export const getCartGroupedBySeller = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const result = await cartService.getCartGroupedBySeller(userId);

  successResponse(res, result, 'Cart grouped by seller retrieved successfully', 200);
});

// validate stock availability

export const validateStock = asyncHandler(async (req, res) => {
  const { items } = req.body;

  const result = await cartService.validateStock(items);

  successResponse(res, result, result.message, 200);
});

export default {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  getCartSummary,
  getCartGroupedBySeller,
  validateStock,
};