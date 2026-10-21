const Store = require('../models/Store');
const { errorResponse } = require('../utils/apiResponse');

/**
 * Tenant scoping middleware.
 * Guarantees that any seller request is strictly bound to the store they legitimately own/manage.
 * NEVER trust a client-supplied storeId blindly.
 */
const requireStoreScope = async (req, res, next) => {
  try {
    if (!req.user) {
      return errorResponse(res, 'Authentication required before tenant scoping', 401);
    }

    // Determine target store ID:
    // If client supplied a storeId header/param, verify user actually owns or belongs to it
    const requestedStoreId = req.headers['x-store-id'] || req.query.storeId || req.body?.storeId;

    let storeIdToUse = req.user.activeStore;

    if (requestedStoreId) {
      const isAuthorizedForRequestedStore = req.user.stores.some(
        (id) => id.toString() === requestedStoreId.toString()
      );
      if (!isAuthorizedForRequestedStore) {
        return errorResponse(
          res,
          'Access forbidden: You do not have permissions for the requested store.',
          403,
          null,
          'TENANT_ACCESS_DENIED'
        );
      }
      storeIdToUse = requestedStoreId;
    }

    if (!storeIdToUse) {
      return errorResponse(
        res,
        'No active store associated with this account. Please create or onboard a store first.',
        400,
        null,
        'NO_ACTIVE_STORE'
      );
    }

    const store = await Store.findById(storeIdToUse);
    if (!store) {
      return errorResponse(res, 'Store not found or inactive', 404, null, 'STORE_NOT_FOUND');
    }

    req.store = store;
    req.storeId = store._id;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  requireStoreScope,
};
