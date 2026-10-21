const orderService = require('../services/orderService');
const { successResponse, errorResponse } = require('../utils/apiResponse');

class OrderController {
  async listOrders(req, res, next) {
    try {
      const { status, page, limit } = req.query;
      const data = await orderService.listStoreOrders(req.storeId, { status, page, limit });
      return successResponse(res, data, 'Orders retrieved');
    } catch (error) {
      next(error);
    }
  }

  async getOrder(req, res, next) {
    try {
      const order = await orderService.getOrderById(req.storeId, req.params.id);
      return successResponse(res, order, 'Order details');
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req, res, next) {
    try {
      const { status, notes } = req.body;
      if (!status) {
        return errorResponse(res, 'New status is required', 400);
      }

      const order = await orderService.updateOrderStatus(req.storeId, req.params.id, status, notes);
      return successResponse(res, order, 'Order status updated successfully');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new OrderController();
