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
  async listStoreProducts(storeId, { category, search, page = 1, limit = 50 }) {
    const query = { storeId };

    if (category) {
      query.category = category;
    }

    if (search && search.trim()) {
      const sanitized = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = { $regex: sanitized, $options: 'i' };
      query.$or = [
        { name: regex },
        { category: regex },
        { description: regex },
        { 'variants.color': regex },
      ];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const [products, total, categories] = await Promise.all([
      Product.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit, 10)),
      Product.countDocuments(query),
      Product.distinct('category', { storeId }),
    ]);

    return {
      products,
      categories: categories.filter(Boolean),
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

    if (search && search.trim()) {
      const sanitized = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = { $regex: sanitized, $options: 'i' };
      query.$or = [
        { name: regex },
        { category: regex },
        { description: regex },
        { 'variants.color': regex },
      ];
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

    if (!name || !name.trim()) {
      const err = new Error('Product name is required');
      err.statusCode = 400;
      throw err;
    }

    // Convert price to paise (minor units)
    const finalBasePrice = basePricePaise !== undefined ? Number(basePricePaise) : toPaise(priceRupees || 0);
    const finalComparePrice =
      compareAtPricePaise !== undefined ? Number(compareAtPricePaise) : toPaise(compareAtPriceRupees || 0);

    if (finalBasePrice <= 0) {
      const err = new Error('Selling price must be greater than ₹0');
      err.statusCode = 400;
      throw err;
    }

    if (finalComparePrice > 0 && finalComparePrice < finalBasePrice) {
      const err = new Error(
        `Original/MRP price (₹${(finalComparePrice / 100).toFixed(0)}) cannot be lower than the selling price (₹${(finalBasePrice / 100).toFixed(0)})`
      );
      err.statusCode = 400;
      throw err;
    }

    const slug = await this.generateProductSlug(storeId, name.trim());

    // Normalize and validate variants
    const processedVariants = (variants || []).map((v, idx) => {
      const stock = parseInt(v.stock, 10);
      if (isNaN(stock) || stock < 0) {
        const err = new Error(`Stock quantity cannot be negative for variant #${idx + 1}`);
        err.statusCode = 400;
        throw err;
      }

      return {
        size: v.size ? v.size.trim() : 'Free Size',
        color: v.color ? v.color.trim() : 'Default',
        sku: v.sku ? v.sku.trim() : `${slug.slice(0, 10).toUpperCase()}-${idx + 1}`,
        stock,
        priceDifferencePaise: v.priceDifferencePaise || 0,
      };
    });

    // Default to at least one variant if none provided
    if (processedVariants.length === 0) {
      processedVariants.push({
        size: 'Free Size',
        color: 'Default',
        sku: `${slug.slice(0, 10).toUpperCase()}-1`,
        stock: 0,
        priceDifferencePaise: 0,
      });
    }

    const totalStock = processedVariants.reduce((sum, v) => sum + v.stock, 0);

    const product = new Product({
      storeId,
      name: name.trim(),
      slug,
      description: description ? description.trim() : '',
      category: category && category.trim() ? category.trim() : 'Clothing',
      basePricePaise: finalBasePrice,
      compareAtPricePaise: finalComparePrice,
      images: Array.isArray(images) ? images.filter((img) => img && typeof img === 'string' && img.trim()) : [],
      variants: processedVariants,
      totalStock,
      isPublished: isPublished !== undefined ? Boolean(isPublished) : true,
    });

    return product.save();
  }

  /**
   * Update an existing product (seller)
   */
  async updateProduct(storeId, productId, data) {
    const product = await this.getProductById(storeId, productId);

    if (data.name !== undefined) {
      if (!data.name.trim()) {
        const err = new Error('Product name cannot be empty');
        err.statusCode = 400;
        throw err;
      }
      if (data.name.trim() !== product.name) {
        product.name = data.name.trim();
        product.slug = await this.generateProductSlug(storeId, data.name.trim(), product._id);
      }
    }

    if (data.description !== undefined) product.description = data.description ? data.description.trim() : '';
    if (data.category !== undefined) product.category = data.category && data.category.trim() ? data.category.trim() : 'Clothing';
    if (data.isPublished !== undefined) product.isPublished = Boolean(data.isPublished);
    if (data.images !== undefined && Array.isArray(data.images)) {
      product.images = data.images.filter((img) => img && typeof img === 'string' && img.trim());
    }

    let newBasePrice = product.basePricePaise;
    if (data.basePricePaise !== undefined) {
      newBasePrice = Number(data.basePricePaise);
    } else if (data.priceRupees !== undefined) {
      newBasePrice = toPaise(Number(data.priceRupees) || 0);
    }

    let newComparePrice = product.compareAtPricePaise;
    if (data.compareAtPricePaise !== undefined) {
      newComparePrice = Number(data.compareAtPricePaise);
    } else if (data.compareAtPriceRupees !== undefined) {
      newComparePrice = toPaise(Number(data.compareAtPriceRupees) || 0);
    }

    if (newBasePrice <= 0) {
      const err = new Error('Selling price must be greater than ₹0');
      err.statusCode = 400;
      throw err;
    }

    if (newComparePrice > 0 && newComparePrice < newBasePrice) {
      const err = new Error(
        `Original/MRP price (₹${(newComparePrice / 100).toFixed(0)}) cannot be lower than the selling price (₹${(newBasePrice / 100).toFixed(0)})`
      );
      err.statusCode = 400;
      throw err;
    }

    product.basePricePaise = newBasePrice;
    product.compareAtPricePaise = newComparePrice;

    if (data.variants && Array.isArray(data.variants)) {
      product.variants = data.variants.map((v, idx) => {
        const stock = parseInt(v.stock, 10);
        if (isNaN(stock) || stock < 0) {
          const err = new Error(`Stock quantity cannot be negative for variant #${idx + 1}`);
          err.statusCode = 400;
          throw err;
        }

        return {
          size: v.size ? v.size.trim() : 'Free Size',
          color: v.color ? v.color.trim() : 'Default',
          sku: v.sku ? v.sku.trim() : `${product.slug.slice(0, 10).toUpperCase()}-${idx + 1}`,
          stock,
          priceDifferencePaise: v.priceDifferencePaise || 0,
        };
      });

      if (product.variants.length === 0) {
        product.variants.push({
          size: 'Free Size',
          color: 'Default',
          sku: `${product.slug.slice(0, 10).toUpperCase()}-1`,
          stock: 0,
          priceDifferencePaise: 0,
        });
      }

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
