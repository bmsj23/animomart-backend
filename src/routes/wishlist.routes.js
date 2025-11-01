import express from 'express';
import * as wishlistController from '../controllers/wishlist.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// all routes are protected
router.use(authenticate);

// route   GET /api/wishlist
// desc    get user's wishlist
// access  private
router.get('/', wishlistController.getWishlist);

// route   POST /api/wishlist
// desc    add product to wishlist
// access  private
router.post('/', wishlistController.addToWishlist);

// route   DELETE /api/wishlist/:productId
// desc    remove product from wishlist
// access  private
router.delete('/:productId', wishlistController.removeFromWishlist);

// route   GET /api/wishlist/check/:productId
// desc    check if product is in wishlist
// access  private
router.get('/check/:productId', wishlistController.checkWishlist);

export default router;