const Campaign = require('../models/Campaign');
const Product = require('../models/Product');
const { toPaise } = require('../utils/money');

class CampaignService {
  /**
   * List all campaigns for a specific store (seller dashboard)
   */
  async listStoreCampaigns(storeId) {
    const campaigns = await Campaign.find({ storeId }).sort({ createdAt: -1 });
    const now = new Date();

    return campaigns.map((campaign) => {
      const doc = campaign.toObject();
      let status = 'PAUSED';
      if (!doc.isActive) {
        status = 'PAUSED';
      } else if (now < new Date(doc.startDate)) {
        status = 'UPCOMING';
      } else if (now > new Date(doc.endDate)) {
        status = 'EXPIRED';
      } else {
        status = 'ACTIVE';
      }
      doc.status = status;
      return doc;
    });
  }

  /**
   * Get single campaign by ID (scoped to store)
   */
  async getCampaignById(storeId, campaignId) {
    const campaign = await Campaign.findOne({ _id: campaignId, storeId });
    if (!campaign) {
      const err = new Error('Promotion campaign not found');
      err.statusCode = 404;
      throw err;
    }
    const doc = campaign.toObject();
    doc.status = campaign.getStatus();
    return doc;
  }

  /**
   * Create a new campaign (seller dashboard)
   */
  async createCampaign(storeId, data) {
    const {
      title,
      subtitle,
      badge,
      category,
      dealType,
      discountValue,
      priceCapPaise,
      priceCapRupees,
      startDate,
      endDate,
      isActive,
      bgGradient,
      textColor,
    } = data;

    if (!title || !title.trim()) {
      const err = new Error('Campaign title is required');
      err.statusCode = 400;
      throw err;
    }

    if (!startDate || !endDate) {
      const err = new Error('Both start date and end date are required');
      err.statusCode = 400;
      throw err;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      const err = new Error('Invalid start date or end date format');
      err.statusCode = 400;
      throw err;
    }

    if (start >= end) {
      const err = new Error('Campaign start date must be before end date');
      err.statusCode = 400;
      throw err;
    }

    // Validate discountValue if applicable
    const numericDiscount = Number(discountValue) || 0;
    if (numericDiscount < 0 || numericDiscount > 90) {
      const err = new Error('Discount percentage must be between 0 and 90%');
      err.statusCode = 400;
      throw err;
    }

    // Determine price cap in paise
    let finalPriceCapPaise = 0;
    if (priceCapPaise !== undefined) {
      finalPriceCapPaise = Number(priceCapPaise) || 0;
    } else if (priceCapRupees !== undefined) {
      finalPriceCapPaise = toPaise(Number(priceCapRupees) || 0);
    }

    const campaign = new Campaign({
      storeId,
      title: title.trim(),
      subtitle: subtitle ? subtitle.trim() : '',
      badge: badge ? badge.trim() : 'Special Deal',
      category: category && category.trim() ? category.trim() : 'All',
      dealType: dealType || 'PERCENTAGE_DISCOUNT',
      discountValue: numericDiscount,
      priceCapPaise: Math.max(0, finalPriceCapPaise),
      startDate: start,
      endDate: end,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      bgGradient: bgGradient || 'linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)',
      textColor: textColor || '#be123c',
    });

    const saved = await campaign.save();
    const doc = saved.toObject();
    doc.status = saved.getStatus();
    return doc;
  }

  /**
   * Update an existing campaign
   */
  async updateCampaign(storeId, campaignId, data) {
    const campaign = await Campaign.findOne({ _id: campaignId, storeId });
    if (!campaign) {
      const err = new Error('Promotion campaign not found');
      err.statusCode = 404;
      throw err;
    }

    if (data.title !== undefined) {
      if (!data.title.trim()) {
        const err = new Error('Campaign title cannot be empty');
        err.statusCode = 400;
        throw err;
      }
      campaign.title = data.title.trim();
    }

    if (data.subtitle !== undefined) campaign.subtitle = data.subtitle.trim();
    if (data.badge !== undefined) campaign.badge = data.badge.trim();
    if (data.category !== undefined) campaign.category = data.category.trim() || 'All';
    if (data.dealType !== undefined) campaign.dealType = data.dealType;

    if (data.discountValue !== undefined) {
      const val = Number(data.discountValue);
      if (val < 0 || val > 90) {
        const err = new Error('Discount percentage must be between 0 and 90%');
        err.statusCode = 400;
        throw err;
      }
      campaign.discountValue = val;
    }

    if (data.priceCapPaise !== undefined) {
      campaign.priceCapPaise = Math.max(0, Number(data.priceCapPaise) || 0);
    } else if (data.priceCapRupees !== undefined) {
      campaign.priceCapPaise = toPaise(Math.max(0, Number(data.priceCapRupees) || 0));
    }

    const start = data.startDate ? new Date(data.startDate) : campaign.startDate;
    const end = data.endDate ? new Date(data.endDate) : campaign.endDate;

    if (start >= end) {
      const err = new Error('Campaign start date must be before end date');
      err.statusCode = 400;
      throw err;
    }

    if (data.startDate) campaign.startDate = start;
    if (data.endDate) campaign.endDate = end;
    if (data.isActive !== undefined) campaign.isActive = Boolean(data.isActive);
    if (data.bgGradient !== undefined) campaign.bgGradient = data.bgGradient;
    if (data.textColor !== undefined) campaign.textColor = data.textColor;

    const saved = await campaign.save();
    const doc = saved.toObject();
    doc.status = saved.getStatus();
    return doc;
  }

  /**
   * Delete a campaign (seller dashboard)
   */
  async deleteCampaign(storeId, campaignId) {
    const campaign = await Campaign.findOneAndDelete({ _id: campaignId, storeId });
    if (!campaign) {
      const err = new Error('Promotion campaign not found');
      err.statusCode = 404;
      throw err;
    }
    return campaign;
  }

  /**
   * Public Storefront Real Deals & Promotions Engine
   * Eliminates fake promotional data by:
   * 1. Querying active seller campaigns (now between startDate and endDate, isActive: true)
   * 2. Querying upcoming seller campaigns (now < startDate, isActive: true)
   * 3. Calculating genuine product-backed metrics from published inventory
   */
  async getPublicStoreDeals(storeId) {
    const now = new Date();

    // 1. Fetch campaigns for this store
    const [activeCampaigns, upcomingCampaigns, publishedProducts] = await Promise.all([
      Campaign.find({
        storeId,
        isActive: true,
        startDate: { $lte: now },
        endDate: { $gte: now },
      }).sort({ createdAt: -1 }),

      Campaign.find({
        storeId,
        isActive: true,
        startDate: { $gt: now },
      }).sort({ startDate: 1 }),

      Product.find({
        storeId,
        isPublished: true,
      }).select('name category basePricePaise compareAtPricePaise totalStock slug images'),
    ]);

    // 2. Derive real product statistics
    let maxDiscountPercent = 0;
    let under999Count = 0;
    let discountedProductsCount = 0;

    publishedProducts.forEach((p) => {
      // Check under ₹999 (99900 paise)
      if (p.basePricePaise <= 99900 && p.totalStock > 0) {
        under999Count++;
      }

      // Check real discount (MRP > Selling Price)
      if (p.compareAtPricePaise && p.compareAtPricePaise > p.basePricePaise) {
        discountedProductsCount++;
        const pct = Math.round(
          ((p.compareAtPricePaise - p.basePricePaise) / p.compareAtPricePaise) * 100
        );
        if (pct > maxDiscountPercent) {
          maxDiscountPercent = pct;
        }
      }
    });

    // Format active campaign cards
    const activeDeals = activeCampaigns.map((c) => ({
      _id: c._id,
      title: c.title,
      subtitle: c.subtitle,
      badge: c.badge || 'Active Deal',
      category: c.category,
      dealType: c.dealType,
      discountValue: c.discountValue,
      priceCapPaise: c.priceCapPaise,
      endDate: c.endDate,
      bgGradient: c.bgGradient,
      textColor: c.textColor,
      isUpcoming: false,
    }));

    // Format upcoming campaign cards
    const upcomingDeals = upcomingCampaigns.map((c) => ({
      _id: c._id,
      title: c.title,
      subtitle: c.subtitle || `Starts on ${new Date(c.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`,
      badge: 'Coming Soon',
      category: c.category,
      dealType: c.dealType,
      discountValue: c.discountValue,
      priceCapPaise: c.priceCapPaise,
      startDate: c.startDate,
      bgGradient: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      textColor: '#475569',
      isUpcoming: true,
    }));

    return {
      activeDeals,
      upcomingDeals,
      hasCampaigns: activeDeals.length > 0 || upcomingDeals.length > 0,
      inventoryMetrics: {
        totalProducts: publishedProducts.length,
        discountedProductsCount,
        maxDiscountPercent,
        under999Count,
      },
    };
  }
}

module.exports = new CampaignService();
