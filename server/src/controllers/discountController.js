const discountService = require('../services/discountService');
const { successResponse, errorResponse } = require('../utils/apiResponse');

class DiscountController {
  async listDiscounts(req, res, next) {
    try {
      const discounts = await discountService.listStoreDiscounts(req.storeId);
      return successResponse(res, discounts, 'Discounts retrieved');
    } catch (error) {
      next(error);
    }
  }

  async createDiscount(req, res, next) {
    try {
      const { code, value } = req.body;
      if (!code || value === undefined) {
        return errorResponse(res, 'Discount code and value are required', 400);
      }

      const discount = await discountService.createDiscount(req.storeId, req.body);
      return successResponse(res, discount, 'Discount created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async deleteDiscount(req, res, next) {
    try {
      await discountService.deleteDiscount(req.storeId, req.params.id);
      return successResponse(res, null, 'Discount deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new DiscountController();
