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

export default {
  addToCartValidator,
  updateCartItemValidator,
  productIdParamValidator,
};