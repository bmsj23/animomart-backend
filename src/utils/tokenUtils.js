import jwt from 'jsonwebtoken';
import config from '../config/config.js';

// generate access token (short-lived)
export const generateAccessToken = (userId) => {
  return jwt.sign(
    { userId },
    config.jwt.accessSecret,
    { expiresIn: config.jwt.accessExpire }
  );
};

// generate refresh token (long-lived)
export const generateRefreshToken = (userId) => {
  return jwt.sign(
    { userId },
    config.jwt.refreshSecret,
    { expiresIn: config.jwt.refreshExpire }
  );
};

// verify access token
export const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, config.jwt.accessSecret);
  } catch (error) {
    throw new Error('Invalid or expired access token');
  }
};

// verify refresh token
export const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, config.jwt.refreshSecret);
  } catch (error) {
    throw new Error('Invalid or expired refresh token');
  }
};

// generate both tokens at once
export const generateTokenPair = (userId) => {
  return {
    accessToken: generateAccessToken(userId),
    refreshToken: generateRefreshToken(userId),
  };
};