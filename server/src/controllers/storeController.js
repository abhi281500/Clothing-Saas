const storeService = require('../services/storeService');
const { successResponse } = require('../utils/apiResponse');

class StoreController {
  async getMyStore(req, res, next) {
    try {
      const store = req.store;
      return successResponse(res, store, 'Store details');
    } catch (error) {
      next(error);
    }
  }

  async updateMyStore(req, res, next) {
    try {
      const updatedStore = await storeService.updateStore(req.storeId, req.body);
      return successResponse(res, updatedStore, 'Store updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async getDashboardStats(req, res, next) {
    try {
      const stats = await storeService.getStoreStats(req.storeId);
      return successResponse(res, stats, 'Store dashboard statistics');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new StoreController();
