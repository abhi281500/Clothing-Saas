const productService = require('../services/productService');
const { successResponse, errorResponse } = require('../utils/apiResponse');

class ProductController {
  async listProducts(req, res, next) {
    try {
      const { category, search, page, limit } = req.query;
      const data = await productService.listStoreProducts(req.storeId, {
        category,
        search,
        page,
        limit,
      });
      return successResponse(res, data, 'Products retrieved');
    } catch (error) {
      next(error);
    }
  }

  async getProduct(req, res, next) {
    try {
      const product = await productService.getProductById(req.storeId, req.params.id);
      return successResponse(res, product, 'Product details');
    } catch (error) {
      next(error);
    }
  }

  async createProduct(req, res, next) {
    try {
      const { name, basePricePaise, priceRupees } = req.body;
      if (!name) {
        return errorResponse(res, 'Product name is required', 400);
      }
      if (basePricePaise === undefined && priceRupees === undefined) {
        return errorResponse(res, 'Price is required', 400);
      }

      const product = await productService.createProduct(req.storeId, req.body);
      return successResponse(res, product, 'Product created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async updateProduct(req, res, next) {
    try {
      const product = await productService.updateProduct(req.storeId, req.params.id, req.body);
      return successResponse(res, product, 'Product updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async deleteProduct(req, res, next) {
    try {
      await productService.deleteProduct(req.storeId, req.params.id);
      return successResponse(res, null, 'Product deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ProductController();
