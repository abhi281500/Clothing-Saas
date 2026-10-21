const rateLimit = require('express-rate-limit');

// Strict rate limit for auth endpoints (prevent brute-force password guessing)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 requests per IP per window
  message: {
    success: false,
    error: {
      message: 'Too many authentication attempts. Please try again after 15 minutes.',
      code: 'RATE_LIMIT_EXCEEDED',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Checkout rate limit (prevent bot spam & card testing)
const checkoutLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20, // 20 requests per IP
  message: {
    success: false,
    error: {
      message: 'Too many checkout requests. Please wait a few moments before trying again.',
      code: 'CHECKOUT_RATE_LIMIT_EXCEEDED',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// General API rate limiter
const generalApiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 200, // 200 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  authLimiter,
  checkoutLimiter,
  generalApiLimiter,
};
