import { body } from 'express-validator';
import { validate } from '../middleware/validate.js';

// validate google token for login
export const googleLoginValidator = [
  body('googleToken')
    .notEmpty()
    .withMessage('Google token is required')
    .isString()
    .withMessage('Google token must be a string')
    .trim(),
  validate,
];

export default {
  googleLoginValidator,
};