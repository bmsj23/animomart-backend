import express from 'express';
import * as favoriteController from '../controllers/favorite.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// all routes are protected
router.use(authenticate);

// route   GET /api/favorites
// desc    get user's favorites
// access  private
router.get('/', favoriteController.getFavorites);

// route   POST /api/favorites
// desc    add product to favorites
// access  private
router.post('/', favoriteController.addFavorite);

// route   DELETE /api/favorites/:productId
// desc    remove product from favorites
// access  private
router.delete('/:productId', favoriteController.removeFavorite);

// route   GET /api/favorites/:productId/check
// desc    check if product is favorited
// access  private
router.get('/:productId/check', favoriteController.checkFavorite);

export default router;