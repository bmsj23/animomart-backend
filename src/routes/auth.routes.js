import express from 'express';
import * as authController from '../controllers/auth.controller.js';
import * as authValidator from '../validators/auth.validator.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// public routes
// route   POST /api/auth/google
// desc    login or register with google
// access  public
router.post('/google', authValidator.googleLoginValidator, authController.googleLogin);

// route   POST /api/auth/refresh
// desc    refresh access token
// access  public
router.post('/refresh', authController.refreshToken);

// protected routes
// route   GET /api/auth/profile
// desc    get current user profile
// access  private
router.get('/profile', authenticate, authController.getProfile);

// route   POST /api/auth/logout
// desc    logout user
// access  private
router.post('/logout', authenticate, authController.logout);

export default router;