import { validationResult } from 'express-validator';
import { validationErrorResponse } from '../utils/response.js';

// middleware to handle validation errors from express-validator
const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return validationErrorResponse(res, errors.array());
  }

  next();
};

export default validate;