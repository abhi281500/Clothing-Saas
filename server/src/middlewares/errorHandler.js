const config = require('../config/env');
const { errorResponse } = require('../utils/apiResponse');

// Central error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error(`[Error] ${req.method} ${req.originalUrl}:`, err);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const details = Object.values(err.errors).map((e) => e.message);
    return errorResponse(res, 'Validation failed', 400, details, 'VALIDATION_ERROR');
  }

  // Mongoose duplicate key error (E11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return errorResponse(res, `A record with this ${field} already exists.`, 409, null, 'DUPLICATE_KEY');
  }

  // CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    return errorResponse(res, `Invalid ID format for parameter: ${err.path}`, 400, null, 'INVALID_ID');
  }

  // Default server error
  const message = config.isProduction ? 'Internal server error' : err.message;
  return errorResponse(res, message, err.statusCode || 500, null, err.code || 'INTERNAL_SERVER_ERROR');
};

module.exports = errorHandler;
