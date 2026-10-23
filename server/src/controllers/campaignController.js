const campaignService = require('../services/campaignService');
const { successResponse, errorResponse } = require('../utils/apiResponse');

class CampaignController {
  async listCampaigns(req, res, next) {
    try {
      const campaigns = await campaignService.listStoreCampaigns(req.storeId);
      return successResponse(res, campaigns, 'Campaigns retrieved');
    } catch (error) {
      next(error);
    }
  }

  async getCampaign(req, res, next) {
    try {
      const campaign = await campaignService.getCampaignById(req.storeId, req.params.id);
      return successResponse(res, campaign, 'Campaign details');
    } catch (error) {
      next(error);
    }
  }

  async createCampaign(req, res, next) {
    try {
      const campaign = await campaignService.createCampaign(req.storeId, req.body);
      return successResponse(res, campaign, 'Promotion campaign created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async updateCampaign(req, res, next) {
    try {
      const campaign = await campaignService.updateCampaign(req.storeId, req.params.id, req.body);
      return successResponse(res, campaign, 'Promotion campaign updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async deleteCampaign(req, res, next) {
    try {
      await campaignService.deleteCampaign(req.storeId, req.params.id);
      return successResponse(res, null, 'Promotion campaign deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CampaignController();
