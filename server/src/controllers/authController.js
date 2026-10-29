const authService = require('../services/authService');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const { regenerateSession } = require('../middlewares/auth');

class AuthController {
  async register(req, res, next) {
    try {
      const { name, email, password, storeName, phone } = req.body;

      if (!name || !email || !password) {
        return errorResponse(res, 'Name, email, and password are required', 400);
      }

      if (password.length < 8) {
        return errorResponse(res, 'Password must be at least 8 characters long', 400);
      }

      const result = await authService.register({ name, email, password, storeName, phone });

      // Rotate session on registration to prevent session fixation attacks
      await regenerateSession(req);
      req.session.userId = result.user._id;

      return successResponse(res, result, 'Registration successful', 201);
    } catch (error) {
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return errorResponse(res, 'Email and password are required', 400);
      }

      const result = await authService.login(req, { email, password });
      return successResponse(res, result, 'Login successful');
    } catch (error) {
      next(error);
    }
  }

  async logout(req, res, next) {
    try {
      await authService.logout(req);
      const isProduction = process.env.NODE_ENV === 'production';
      const sameSiteSetting = isProduction
        ? (process.env.COOKIE_SAMESITE || 'none')
        : 'lax';
      const cookieDomain = process.env.COOKIE_DOMAIN;

      res.clearCookie('clothing_saas_sid', {
        path: '/',
        httpOnly: true,
        secure: isProduction,
        sameSite: sameSiteSetting,
        domain: cookieDomain && cookieDomain !== 'localhost' && cookieDomain !== 'none'
          ? cookieDomain
          : undefined,
      });
      return successResponse(res, null, 'Logged out successfully');
    } catch (error) {
      next(error);
    }
  }

  async me(req, res, next) {
    try {
      const result = await authService.getProfile(req.user._id);
      return successResponse(res, result, 'Current user profile');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
