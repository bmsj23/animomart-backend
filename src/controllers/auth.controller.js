import asyncHandler from '../utils/asyncHandler.js';
import * as authService from '../services/auth.service.js';
import { successResponse } from '../utils/response.js';
import config from '../config/config.js';

// verify google token and login/register user

export const googleLogin = asyncHandler(async (req, res) => {
  const { googleToken, token, credential } = req.body;
  const authToken = googleToken || token || credential;

  const result = await authService.googleAuth(authToken);

  // set refresh token as httpOnly cookie
  res.cookie('refreshToken', result.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  successResponse(res, {
    user: result.user,
    accessToken: result.accessToken,
  }, 'Login successful', 200);
});

// refresh access token using refresh token


export const refreshToken = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  const result = await authService.refreshAccessToken(refreshToken);

  successResponse(res, result, 'Token refreshed successfully', 200);
});

// get current user profile


export const getProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const user = await authService.getCurrentUser(userId);

  successResponse(res, user, 'Profile retrieved successfully', 200);
});

// logout user and clear cookies

export const logout = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  await authService.logout(userId);

  // clear refresh token cookie
  res.clearCookie('refreshToken');

  successResponse(res, null, 'Logged out successfully', 200);
});

export default {
  googleLogin,
  refreshToken,
  getProfile,
  logout,
};