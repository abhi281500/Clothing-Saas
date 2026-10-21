const Product = require('../models/Product');
const { toPaise } = require('../utils/money');

class ProductService {
  /**
   * Helper to generate unique slug per store
   */
  async generateProductSlug(storeId, name, excludeId = null) {
    let baseSlug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    if (!baseSlug) baseSlug = 'product';

    let uniqueSlug = baseSlug;
    let counter = 1;
    while (true) {
      const query = { storeId, slug: uniqueSlug };
      if (excludeId) {
        query._id = { $ne: excludeId };
      }
      const existing = await Product.findOne(query);
      if (!existing) break;
      uniqueSlug = `${baseSlug}-${counter}`;
      counter++;
    }
    return uniqueSlug;
  }

  /**
   * List products for seller dashboard (scoped to storeId)
   */
  async listStoreProducts(storeId, { category, search, page = 1, limit = 20 }) {
    const query = { storeId };

    if (category) {
      query.category = category;
    }

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const [products, total] = await Promise.all([
      Product.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit, 10)),
      Product.countDocuments(query),
    ]);

    return {
      products,
      pagination: {
        total,
        page: parseInt(page, 10),
        pages: Math.ceil(total / parseInt(limit, 10)),
      },
    };
  }

  /**
   * List published products for public storefront
   */
  async listPublicProducts(storeId, { category, search, sort = 'newest' }) {
    const query = { storeId, isPublished: true };

    if (category) {
      query.category = category;
    }

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    let sortOption = { createdAt: -1 };
    if (sort === 'price_asc') sortOption = { basePricePaise: 1 };
    if (sort === 'price_desc') sortOption = { basePricePaise: -1 };

    return Product.find(query).sort(sortOption);
  }

  /**
   * Get single product by ID (seller dashboard)
   */
  async getProductById(storeId, productId) {
    const product = await Product.findOne({ _id: productId, storeId });
    if (!product) {
      const err = new Error('Product not found in this store');
      err.statusCode = 404;
      throw err;
    }
    return product;
  }

  /**
   * Get single product by slug (public storefront)
   */
  async getPublicProductBySlug(storeId, slug) {
    const product = await Product.findOne({ storeId, slug, isPublished: true });
    if (!product) {
      const err = new Error('Product not found');
      err.statusCode = 404;
      throw err;
    }
    return product;
  }

  /**
   * Create a new product (seller)
   */
  async createProduct(storeId, data) {
    const {
      name,
      description,
      category,
      priceRupees,
      basePricePaise,
      compareAtPriceRupees,
      compareAtPricePaise,
      images,
      variants,
      isPublished,
    } = data;

    // Convert price to paise (minor units)
    const finalBasePrice = basePricePaise !== undefined ? basePricePaise : toPaise(priceRupees || 0);
    const finalComparePrice =
      compareAtPricePaise !== undefined ? compareAtPricePaise : toPaise(compareAtPriceRupees || 0);

    const slug = await this.generateProductSlug(storeId, name);

    // Normalize variants
    const processedVariants = (variants || []).map((v, idx) => ({
      size: v.size || 'Free Size',
      color: v.color || 'Default',
      sku: v.sku || `${slug.slice(0, 10).toUpperCase()}-${idx + 1}`,
      stock: parseInt(v.stock, 10) || 0,
      priceDifferencePaise: v.priceDifferencePaise || 0,
    }));

    const totalStock = processedVariants.reduce((sum, v) => sum + v.stock, 0);

    const product = new Product({
      storeId,
      name,
      slug,
      description: description || '',
      category: category || 'Clothing',
      basePricePaise: finalBasePrice,
      compareAtPricePaise: finalComparePrice,
      images: Array.isArray(images) ? images : [],
      variants: processedVariants,
      totalStock,
      isPublished: isPublished !== undefined ? isPublished : true,
    });

    return product.save();
  }

  /**
   * Update an existing product (seller)
   */
  async updateProduct(storeId, productId, data) {
    const product = await this.getProductById(storeId, productId);

    if (data.name && data.name !== product.name) {
      product.name = data.name;
      product.slug = await this.generateProductSlug(storeId, data.name, product._id);
    }

    if (data.description !== undefined) product.description = data.description;
    if (data.category !== undefined) product.category = data.category;
    if (data.isPublished !== undefined) product.isPublished = data.isPublished;
    if (data.images !== undefined) product.images = data.images;

    if (data.basePricePaise !== undefined) {
      product.basePricePaise = data.basePricePaise;
    } else if (data.priceRupees !== undefined) {
      product.basePricePaise = toPaise(data.priceRupees);
    }

    if (data.compareAtPricePaise !== undefined) {
      product.compareAtPricePaise = data.compareAtPricePaise;
    } else if (data.compareAtPriceRupees !== undefined) {
      product.compareAtPricePaise = toPaise(data.compareAtPriceRupees);
    }

    if (data.variants && Array.isArray(data.variants)) {
      product.variants = data.variants.map((v, idx) => ({
        size: v.size || 'Free Size',
        color: v.color || 'Default',
        sku: v.sku || `${product.slug.slice(0, 10).toUpperCase()}-${idx + 1}`,
        stock: parseInt(v.stock, 10) || 0,
        priceDifferencePaise: v.priceDifferencePaise || 0,
      }));
      product.totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);
    }

    return product.save();
  }

  /**
   * Delete a product
   */
  async deleteProduct(storeId, productId) {
    const product = await Product.findOneAndDelete({ _id: productId, storeId });
    if (!product) {
      const err = new Error('Product not found in this store');
      err.statusCode = 404;
      throw err;
    }
    return product;
  }
}

module.exports = new ProductService();
