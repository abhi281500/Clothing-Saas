const dns = require('dns').promises;
const mongoose = require('mongoose');
const Store = require('../models/Store');
const Product = require('../models/Product');
const { Order } = require('../models/Order');

const RESERVED_HOSTNAMES = [
  'localhost',
  '127.0.0.1',
  'clothing-saas-eight.vercel.app',
  'clothing-saas.vercel.app',
  'vercel.app',
  'onrender.com',
  'render.com',
  'github.com',
  'google.com',
  'admin',
  'api',
];

function normalizeDomain(raw) {
  if (!raw || typeof raw !== 'string') return '';
  let d = raw.trim().toLowerCase();
  d = d.replace(/^https?:\/\//i, '');
  d = d.split('/')[0];
  d = d.split(':')[0];
  return d;
}

function isValidHostname(domain) {
  if (!domain || domain.length < 3 || domain.length > 253) return false;
  const pattern = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$/i;
  return pattern.test(domain);
}

class StoreService {
  /**
   * Get public store profile by slug for the customer storefront (safe projection)
   */
  async getPublicStoreBySlug(slug) {
    const store = await Store.findOne({ slug: slug.toLowerCase(), isActive: true }).select('-ownerId');
    if (!store) {
      const err = new Error('Store not found or currently unavailable');
      err.statusCode = 404;
      err.code = 'STORE_NOT_FOUND';
      throw err;
    }
    return store;
  }

  /**
   * Get distinct categories for a store's public catalog
   */
  async getStoreCategories(storeId) {
    const categories = await Product.distinct('category', { storeId, isPublished: true });
    return categories.filter(Boolean);
  }

  /**
   * Update store settings (strictly authorized for store owner)
   */
  async updateStore(storeId, updateData) {
    const allowedFields = [
      'name',
      'tagline',
      'description',
      'whatsappNumber',
      'instagramHandle',
      'facebookUrl',
      'googleMapsUrl',
      'branding',
      'address',
    ];

    const safeUpdate = {};
    for (const key of allowedFields) {
      if (updateData[key] !== undefined) {
        safeUpdate[key] = updateData[key];
      }
    }

    const updatedStore = await Store.findByIdAndUpdate(storeId, safeUpdate, {
      new: true,
      runValidators: true,
    });

    if (!updatedStore) {
      const err = new Error('Store not found');
      err.statusCode = 404;
      throw err;
    }

    return updatedStore;
  }

  /**
   * Get store operational overview / dashboard stats
   */
  async getStoreStats(storeId) {
    const storeObjectId = new mongoose.Types.ObjectId(storeId.toString());

    const [totalProducts, totalOrders, recentOrders, orderStats] = await Promise.all([
      Product.countDocuments({ storeId: storeObjectId }),
      Order.countDocuments({ storeId: storeObjectId }),
      Order.find({ storeId: storeObjectId }).sort({ createdAt: -1 }).limit(5),
      Order.aggregate([
        { $match: { storeId: storeObjectId } },
        {
          $group: {
            _id: '$orderStatus',
            count: { $sum: 1 },
            revenuePaise: { $sum: '$financials.totalPaise' },
          },
        },
      ]),
    ]);

    let totalRevenuePaise = 0;
    const statusCounts = {
      PENDING: 0,
      CONFIRMED: 0,
      SHIPPED: 0,
      DELIVERED: 0,
      CANCELLED: 0,
    };

    orderStats.forEach((stat) => {
      if (statusCounts[stat._id] !== undefined) {
        statusCounts[stat._id] = stat.count;
      }
      if (stat._id !== 'CANCELLED') {
        totalRevenuePaise += stat.revenuePaise || 0;
      }
    });

    return {
      totalProducts,
      totalOrders,
      totalRevenuePaise,
      statusCounts,
      recentOrders,
    };
  }

  /**
   * Configure / update custom domain for seller store
   */
  async setCustomDomain(storeId, rawDomain) {
    const cleanDomain = normalizeDomain(rawDomain);

    if (!cleanDomain || !isValidHostname(cleanDomain)) {
      const err = new Error('Please enter a valid domain name (e.g. fashionhub.in or shop.fashionhub.com).');
      err.statusCode = 400;
      err.code = 'INVALID_DOMAIN_FORMAT';
      throw err;
    }

    if (RESERVED_HOSTNAMES.some((h) => cleanDomain === h || cleanDomain.endsWith('.' + h))) {
      const err = new Error('This domain cannot be mapped as it is a reserved platform domain.');
      err.statusCode = 400;
      err.code = 'RESERVED_DOMAIN';
      throw err;
    }

    // Check if domain is already claimed by another store
    const existing = await Store.findOne({
      'customDomain.domain': cleanDomain,
      _id: { $ne: storeId },
    });
    if (existing) {
      const err = new Error(`The domain "${cleanDomain}" is already connected to another boutique store.`);
      err.statusCode = 409;
      err.code = 'DOMAIN_ALREADY_EXISTS';
      throw err;
    }

    const defaultCnameTarget = process.env.CNAME_TARGET || 'cname.clothing-saas-eight.vercel.app';
    const parts = cleanDomain.split('.');
    const isSubdomain =
      parts.length > 2 &&
      !(parts.length === 3 && (parts[1] === 'co' || parts[1] === 'org' || parts[1] === 'com'));

    const dnsRecords = [];
    if (isSubdomain) {
      dnsRecords.push({
        recordType: 'CNAME',
        name: parts[0],
        value: defaultCnameTarget,
        description: `Map subdomain "${parts[0]}" via CNAME to ${defaultCnameTarget}`,
      });
    } else {
      dnsRecords.push({
        recordType: 'A',
        name: '@',
        value: '76.76.21.21',
        description: 'Map root domain via A Record to Vercel/SaaS edge IP 76.76.21.21',
      });
      dnsRecords.push({
        recordType: 'CNAME',
        name: 'www',
        value: defaultCnameTarget,
        description: `Map "www" prefix via CNAME to ${defaultCnameTarget}`,
      });
    }

    const store = await Store.findById(storeId);
    if (!store) {
      const err = new Error('Store not found');
      err.statusCode = 404;
      throw err;
    }

    store.customDomain = {
      domain: cleanDomain,
      status: 'PENDING_DNS',
      dnsTarget: defaultCnameTarget,
      dnsRecords,
      sslStatus: 'PENDING',
      verifiedAt: null,
      lastDnsCheckError: '',
    };

    return store.save();
  }

  /**
   * Verify DNS records for store custom domain
   */
  async verifyCustomDomain(storeId) {
    const store = await Store.findById(storeId);
    if (!store || !store.customDomain || !store.customDomain.domain) {
      const err = new Error('No custom domain configured for this boutique store.');
      err.statusCode = 400;
      err.code = 'NO_CUSTOM_DOMAIN';
      throw err;
    }

    const domain = store.customDomain.domain;
    const target = store.customDomain.dnsTarget || 'cname.clothing-saas-eight.vercel.app';

    let verified = false;
    let foundCnames = [];
    let foundIps = [];
    let failureReason = '';

    try {
      // 1. Try CNAME resolution
      try {
        foundCnames = await dns.resolveCname(domain);
        const matchesTarget = foundCnames.some(
          (c) =>
            c.toLowerCase().includes('vercel') ||
            c.toLowerCase().includes('clothing-saas') ||
            c.toLowerCase().includes('onrender') ||
            c.toLowerCase() === target.toLowerCase()
        );
        if (matchesTarget) {
          verified = true;
        }
      } catch (cnameErr) {
        // Domain might have an A record instead of CNAME
      }

      // 2. Try A record resolution
      if (!verified) {
        try {
          foundIps = await dns.resolve4(domain);
          const matchesKnownIp = foundIps.some(
            (ip) => ip.startsWith('76.76.21.') || ip.startsWith('104.') || ip.startsWith('172.')
          );
          if (matchesKnownIp) {
            verified = true;
          }
        } catch (aErr) {
          // No A record
        }
      }

      if (verified) {
        store.customDomain.status = 'ACTIVE';
        store.customDomain.sslStatus = 'ACTIVE';
        store.customDomain.verifiedAt = new Date();
        store.customDomain.lastDnsCheckError = '';
        await store.save();
        return {
          verified: true,
          store,
          message: `Domain ${domain} verified successfully and active with SSL!`,
          details: { foundCnames, foundIps },
        };
      } else {
        failureReason =
          foundCnames.length || foundIps.length
            ? `DNS records detected (${foundCnames.join(', ') || foundIps.join(', ')}), but they do not point to ${target} or Vercel IP 76.76.21.21 yet. DNS propagation may take a few minutes.`
            : `No CNAME or A record found for ${domain}. Please verify you added the CNAME/A record in your DNS settings.`;

        store.customDomain.status = 'PENDING_DNS';
        store.customDomain.lastDnsCheckError = failureReason;
        await store.save();

        return {
          verified: false,
          store,
          message: failureReason,
          details: { foundCnames, foundIps },
        };
      }
    } catch (dnsErr) {
      failureReason = `DNS query failed: ${dnsErr.message}. Please check if the domain is registered and spelled correctly.`;
      store.customDomain.status = 'ERROR';
      store.customDomain.lastDnsCheckError = failureReason;
      await store.save();
      return {
        verified: false,
        store,
        message: failureReason,
        details: { foundCnames, foundIps },
      };
    }
  }

  /**
   * Remove custom domain mapping
   */
  async removeCustomDomain(storeId) {
    const store = await Store.findById(storeId);
    if (!store) {
      const err = new Error('Store not found');
      err.statusCode = 404;
      throw err;
    }

    store.customDomain = {
      domain: undefined,
      status: 'NONE',
      dnsRecords: [],
      verifiedAt: null,
      sslStatus: 'PENDING',
      lastDnsCheckError: '',
    };

    return store.save();
  }

  /**
   * Get public store profile resolved by custom domain hostname
   */
  async getPublicStoreByDomain(domain) {
    const cleanDomain = normalizeDomain(domain);
    if (!cleanDomain) {
      const err = new Error('Domain name is required');
      err.statusCode = 400;
      throw err;
    }

    const store = await Store.findOne({
      'customDomain.domain': cleanDomain,
      isActive: true,
    }).select('-ownerId');

    if (!store) {
      const err = new Error(`No active boutique store found for domain "${cleanDomain}"`);
      err.statusCode = 404;
      err.code = 'STORE_NOT_FOUND';
      throw err;
    }

    return store;
  }
}

module.exports = new StoreService();
