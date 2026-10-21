/**
 * Standard API response envelope helpers
 */

const successResponse = (res, data = null, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

const errorResponse = (res, message = 'An error occurred', statusCode = 500, errors = null, code = null) => {
  const payload = {
    success: false,
    error: {
      message,
      code: code || `ERR_${statusCode}`,
    },
  };

  if (errors) {
    payload.error.details = errors;
  }

  return res.status(statusCode).json(payload);
};

module.exports = {
  successResponse,
  errorResponse,
};
