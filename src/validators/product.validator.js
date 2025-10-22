import { body, param, query } from 'express-validator';
import { validate } from '../middleware/validate.js';

// validate product creation
export const createProductValidator = [
  body('name')
    .notEmpty()
    .withMessage('Product name is required')
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Product name must be between 3 and 200 characters'),

  body('description')
    .notEmpty()
    .withMessage('Product description is required')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Product description must be between 10 and 2000 characters'),

  body('price')
    .notEmpty()
    .withMessage('Price is required')
    .isFloat({ min: 0.01 })
    .withMessage('Price must be greater than 0'),

  body('category')
    .notEmpty()
    .withMessage('Category is required')
    .customSanitizer(value => {
      // capitalize first letter of each word
      if (typeof value === 'string') {
        return value
          .toLowerCase()
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      }
      return value;
    })
    .isIn(['School Supplies', 'Electronics', 'Books', 'Clothing', 'Food & Beverages', 'Handmade Items', 'Sports Equipment', 'Dorm Essentials', 'Beauty & Personal Care', 'Others'])
    .withMessage('Invalid category'),

  body('condition')
    .notEmpty()
    .withMessage('Condition is required')
    .customSanitizer(value => {
      // capitalize first letter of each word
      if (typeof value === 'string') {
        return value
          .toLowerCase()
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      }
      return value;
    })
    .isIn(['New', 'Like New', 'Good', 'Fair'])
    .withMessage('Invalid condition'),

  body('stock')
    .notEmpty()
    .withMessage('Stock is required')
    .isInt({ min: 0 })
    .withMessage('Stock must be a non-negative integer'),

  body('images')
    .isArray({ min: 1, max: 5 })
    .withMessage('Product must have between 1 and 5 images'),

  body('images.*')
    .optional()
    .custom((value) => {
      // accept valid URLs or skip if empty
      if (!value) return true;
      // allow http, https, and cloudinary URLs
      const urlPattern = /^https?:\/\/.+/i;
      if (!urlPattern.test(value)) {
        throw new Error('Invalid image URL');
      }
      return true;
    }),

  body('meetupLocations')
    .optional()
    .isArray()
    .withMessage('Meetup locations must be an array'),

  body('meetupLocations.*')
    .isString()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Meetup location must not exceed 200 characters'),

  body('shippingAvailable')
    .optional()
    .isBoolean()
    .withMessage('Shipping available must be a boolean'),

  body('shippingFee')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Shipping fee must be a positive number'),

  validate,
];

// validate product update
export const updateProductValidator = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Product name must be between 3 and 200 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Product description must be between 10 and 2000 characters'),

  body('price')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('Price must be greater than 0'),

  body('category')
    .optional()
    .customSanitizer(value => {
      // capitalize first letter of each word
      if (typeof value === 'string') {
        return value
          .toLowerCase()
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      }
      return value;
    })
    .isIn(['School Supplies', 'Electronics', 'Books', 'Clothing', 'Food & Beverages', 'Handmade Items', 'Sports Equipment', 'Dorm Essentials', 'Beauty & Personal Care', 'Others'])
    .withMessage('Invalid category'),

  body('condition')
    .optional()
    .customSanitizer(value => {
      // capitalize first letter of each word
      if (typeof value === 'string') {
        return value
          .toLowerCase()
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      }
      return value;
    })
    .isIn(['New', 'Like New', 'Good', 'Fair'])
    .withMessage('Invalid condition'),

  body('stock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Stock must be a non-negative integer'),

  body('status')
    .optional()
    .isIn(['active', 'paused', 'sold', 'deleted'])
    .withMessage('Invalid status'),

  body('images')
    .optional()
    .isArray({ min: 1, max: 5 })
    .withMessage('Product must have between 1 and 5 images'),

  body('images.*')
    .optional()
    .custom((value) => {
      // accept valid URLs or skip if empty
      if (!value) return true;
      // allow http, https, and cloudinary URLs
      const urlPattern = /^https?:\/\/.+/i;
      if (!urlPattern.test(value)) {
        throw new Error('Invalid image URL');
      }
      return true;
    }),

  body('meetupLocations')
    .optional()
    .isArray()
    .withMessage('Meetup locations must be an array'),

  body('shippingAvailable')
    .optional()
    .isBoolean()
    .withMessage('Shipping available must be a boolean'),

  body('shippingFee')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Shipping fee must be a positive number'),

  validate,
];

// validate product id param
export const productIdValidator = [
  param('productId')
    .isMongoId()
    .withMessage('Invalid product ID'),

  validate,
];

// validate product status update
export const updateStatusValidator = [
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['active', 'paused', 'sold'])
    .withMessage('Invalid status'),

  validate,
];

// validate search query
export const searchValidator = [
  query('q')
    .notEmpty()
    .withMessage('Search query is required')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Search query must be at least 2 characters'),

  validate,
];

export default {
  createProductValidator,
  updateProductValidator,
  productIdValidator,
  updateStatusValidator,
  searchValidator,
};