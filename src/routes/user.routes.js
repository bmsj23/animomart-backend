import express from 'express';
import * as userController from '../controllers/user.controller.js';
import * as userValidator from '../validators/user.validator.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// all routes are protected
router.use(authenticate);

// route   GET /api/users/me
// desc    get own profile
// access  private
router.get('/me', userController.getMe);

// route   PUT /api/users/me
// desc    update own profile
// access  private
router.put('/me', userValidator.updateProfileValidator, userController.updateMe);

// route   DELETE /api/users/me
// desc    delete own account
// access  private
router.delete('/me', userController.deleteMe);

// route   PUT /api/users/seller-info
// desc    update seller information
// access  private
router.put('/seller-info', userValidator.updateSellerInfoValidator, userController.updateSellerInfo);

// route   GET /api/users/:userId
// desc    get public user profile
// access  private
router.get('/:userId', userValidator.userIdValidator, userController.getUser);

// route   GET /api/users/:userId/products
// desc    get user's products
// access  private
router.get('/:userId/products', userValidator.userIdValidator, userController.getUserProducts);

// route   GET /api/users/:userId/reviews
// desc    get reviews for user as seller
// access  private
router.get('/:userId/reviews', userValidator.userIdValidator, userController.getUserReviews);

// route   GET /api/users/seller/:sellerId
// desc    get seller profile with products
// access  private
router.get('/seller/:sellerId', userController.getSellerProfile);

export default router;