// standard api response format for success
export const successResponse = (res, data, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

// standard api response format for error
export const errorResponse = (res, message = 'Error occurred', statusCode = 500, error = null) => {
  const response = {
    success: false,
    message,
  };

  // include error details in development mode
  if (error && process.env.NODE_ENV === 'development') {
    response.error = error;
  }

  return res.status(statusCode).json(response);
};

// validation error response (for express-validator)
export const validationErrorResponse = (res, errors) => {
  // format errors into field: message object
  const formattedErrors = {};
  errors.forEach((error) => {
    formattedErrors[error.path || error.param] = error.msg;
  });

  return res.status(400).json({
    success: false,
    message: 'Validation failed',
    errors: formattedErrors,
  });
};