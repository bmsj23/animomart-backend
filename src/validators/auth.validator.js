import { body } from 'express-validator';
import { validate } from '../middleware/validate.js';

// validate google token for login
export const googleLoginValidator = [
  body('googleToken')
    .optional()
    .isString()
    .withMessage('Google token must be a string')
    .trim(),
  body('token')
    .optional()
    .isString()
    .withMessage('Token must be a string')
    .trim(),
  body('credential')
    .optional()
    .isString()
    .withMessage('Credential must be a string')
    .trim(),
  body()
    .custom((value, { req }) => {
      if (!req.body.googleToken && !req.body.token && !req.body.credential) {
        throw new Error('Google token is required (as "token", "googleToken", or "credential")');
      }
      return true;
    }),
  validate,
];

export default {
  googleLoginValidator,
};