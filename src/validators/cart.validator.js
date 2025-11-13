import { body, param } from 'express-validator';
import { validate } from '../middleware/validate.js';

// validate add to cart
export const addToCartValidator = [
  body('productId')
    .notEmpty()
    .withMessage('Product ID is required')
    .isMongoId()
    .withMessage('Invalid product ID'),

  body('quantity')
    .notEmpty()
    .withMessage('Quantity is required')
    .isInt({ min: 1, max: 99 })
    .withMessage('Quantity must be between 1 and 99'),

  validate,
];

// validate update cart item
export const updateCartItemValidator = [
  param('productId')
    .isMongoId()
    .withMessage('Invalid product ID'),

  body('quantity')
    .notEmpty()
    .withMessage('Quantity is required')
    .isInt({ min: 1, max: 99 })
    .withMessage('Quantity must be between 1 and 99'),

  validate,
];

// validate product id param
export const productIdParamValidator = [
  param('productId')
    .isMongoId()
    .withMessage('Invalid product ID'),

  validate,
];

// validate stock check request
export const validateStockValidator = [
  body('items')
    .notEmpty()
    .withMessage('Items array is required')
    .isArray({ min: 1 })
    .withMessage('Items must be a non-empty array'),

  body('items.*.productId')
    .notEmpty()
    .withMessage('Product ID is required for each item')
    .isMongoId()
    .withMessage('Invalid product ID format'),

  body('items.*.quantity')
    .notEmpty()
    .withMessage('Quantity is required for each item')
    .isInt({ min: 1, max: 999 })
    .withMessage('Quantity must be between 1 and 999'),

  validate,
];

export default {
  addToCartValidator,
  updateCartItemValidator,
  productIdParamValidator,
  validateStockValidator,
};