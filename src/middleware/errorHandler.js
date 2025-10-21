import AppError from '../utils/AppError.js';
import { errorResponse } from '../utils/response.js';

// centralized error handling middleware
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.statusCode = err.statusCode || 500;

  // log error in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', err);
  }

  // mongoose bad objectid error
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = new AppError(message, 404);
  }

  // mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    const message = `${field} already exists`;
    error = new AppError(message, 400);
  }

  // mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => e.message);
    const message = errors.join(', ');
    error = new AppError(message, 400);
  }

  // jwt errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token. Please login again';
    error = new AppError(message, 401);
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired. Please login again';
    error = new AppError(message, 401);
  }

  // multer file upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    const message = 'File size too large. Maximum size is 5MB';
    error = new AppError(message, 400);
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    const message = 'Too many files uploaded';
    error = new AppError(message, 400);
  }

  return errorResponse(
    res,
    error.message || 'Server Error',
    error.statusCode || 500,
    process.env.NODE_ENV === 'development' ? error : null
  );
};

export default errorHandler;