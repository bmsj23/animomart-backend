import express from 'express';
import * as cartController from '../controllers/cart.controller.js';
import * as cartValidator from '../validators/cart.validator.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// all routes are protected
router.use(authenticate);

// route   GET /api/cart
// desc    get user's cart
// access  private
router.get('/', cartController.getCart);

// route   GET /api/cart/summary
// desc    get cart summary
// access  private
router.get('/summary', cartController.getCartSummary);

// route   GET /api/cart/grouped
// desc    get cart grouped by seller
// access  private
router.get('/grouped', cartController.getCartGroupedBySeller);

// route   POST /api/cart
// desc    add item to cart
// access  private
router.post('/', cartValidator.addToCartValidator, cartController.addToCart);

// route   PUT /api/cart/:productId
// desc    update cart item quantity
// access  private
router.put('/:productId', cartValidator.updateCartItemValidator, cartController.updateCartItem);

// route   DELETE /api/cart/:productId
// desc    remove item from cart
// access  private
router.delete('/:productId', cartValidator.productIdParamValidator, cartController.removeFromCart);

// route   DELETE /api/cart
// desc    clear entire cart
// access  private
router.delete('/', cartController.clearCart);

export default router;