const User = require('../models/User');
const { errorResponse } = require('../utils/apiResponse');

/**
 * Authentication middleware for seller / owner dashboard.
 * Requires an active, authenticated server-side session.
 */
const requireAuth = async (req, res, next) => {
  try {
    if (!req.session || !req.session.userId) {
      return errorResponse(res, 'Authentication required. Please log in.', 401, null, 'UNAUTHENTICATED');
    }

    const user = await User.findById(req.session.userId).select('-password');
    if (!user) {
      // Session exists but user was deleted
      req.session.destroy(() => {});
      return errorResponse(res, 'Session invalid. User not found.', 401, null, 'USER_NOT_FOUND');
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Helper to regenerate session ID on login/privilege change to prevent session fixation
 */
const regenerateSession = (req) => {
  return new Promise((resolve, reject) => {
    req.session.regenerate((err) => {
      if (err) return reject(err);
      resolve();
    });
  });
};

module.exports = {
  requireAuth,
  regenerateSession,
};
