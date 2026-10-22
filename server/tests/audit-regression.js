const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const User = require('../src/models/User');
const Store = require('../src/models/Store');
const Product = require('../src/models/Product');
const { Order } = require('../src/models/Order');
const Discount = require('../src/models/Discount');
const productService = require('../src/services/productService');
const orderService = require('../src/services/orderService');
const discountService = require('../src/services/discountService');

async function runAuditRegression() {
  console.log('=== STARTING PRODUCTION READINESS AUDIT REGRESSION SUITE ===\n');

  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 8000 });
  console.log('Connected to MongoDB Atlas for testing.\n');

  const testSuffix = Date.now();
  let tenantA, tenantB, storeA, storeB, productA, productB, discountA, orderA;

  try {
    // -------------------------------------------------------------------------
    // SETUP: Two distinct tenants (Tenant A and Tenant B)
    // -------------------------------------------------------------------------
    console.log('[Setup] Creating test Tenant A and Tenant B...');
    
    tenantA = await User.create({
      name: 'Owner A',
      email: `ownerA_${testSuffix}@audit.test`,
      password: 'password123',
      role: 'owner',
    });

    storeA = await Store.create({
      name: `Boutique A ${testSuffix}`,
      slug: `boutique-a-${testSuffix}`,
      ownerId: tenantA._id,
    });
    tenantA.stores = [storeA._id];
    tenantA.activeStore = storeA._id;
    await tenantA.save();

    tenantB = await User.create({
      name: 'Owner B',
      email: `ownerB_${testSuffix}@audit.test`,
      password: 'password123',
      role: 'owner',
    });

    storeB = await Store.create({
      name: `Boutique B ${testSuffix}`,
      slug: `boutique-b-${testSuffix}`,
      ownerId: tenantB._id,
    });
    tenantB.stores = [storeB._id];
    tenantB.activeStore = storeB._id;
    await tenantB.save();

    // Products
    productA = await productService.createProduct(storeA._id, {
      name: 'Anarkali Suit A',
      priceRupees: 1500,
      variants: [{ size: 'M', color: 'Red', stock: 1, sku: 'SUIT-A' }],
    });

    productB = await productService.createProduct(storeB._id, {
      name: 'Silk Saree B',
      priceRupees: 3500,
      variants: [{ size: 'Free Size', color: 'Gold', stock: 5, sku: 'SAREE-B' }],
    });

    // Discount
    discountA = await discountService.createDiscount(storeA._id, {
      code: `SAVE10_${testSuffix}`,
      type: 'PERCENT',
      value: 10,
      minOrderPaise: 100000,
      usageLimit: 1,
    });

    // Order
    orderA = await orderService.createOrder({
      storeId: storeA._id,
      customer: {
        name: 'Customer A',
        phone: '9876543210',
        shippingAddress: { addressLine: '123 Street', city: 'Jaipur', state: 'RJ', pincode: '302001' },
      },
      items: [{ productId: productA._id, variantId: productA.variants[0]._id, quantity: 1 }],
      customerNotes: 'Deliver between 10am-5pm',
    });

    console.log('Setup complete.\n');

    // -------------------------------------------------------------------------
    // TEST SUITE 1: CROSS-TENANT ISOLATION TESTS
    // -------------------------------------------------------------------------
    console.log('--- TEST SUITE 1: CROSS-TENANT DATA ISOLATION ---');

    // 1.1: Tenant A attempts to read Tenant B's product
    try {
      await productService.getProductById(storeA._id, productB._id);
      console.error('❌ FAIL 1.1: Tenant A was able to read Tenant B product!');
    } catch (err) {
      console.log('✔ PASS 1.1: Cross-tenant product read correctly rejected:', err.message);
    }

    // 1.2: Tenant A attempts to update Tenant B's product
    try {
      await productService.updateProduct(storeA._id, productB._id, { name: 'Hacked Product' });
      console.error('❌ FAIL 1.2: Tenant A was able to update Tenant B product!');
    } catch (err) {
      console.log('✔ PASS 1.2: Cross-tenant product update correctly rejected:', err.message);
    }

    // 1.3: Tenant A attempts to delete Tenant B's product
    try {
      await productService.deleteProduct(storeA._id, productB._id);
      console.error('❌ FAIL 1.3: Tenant A was able to delete Tenant B product!');
    } catch (err) {
      console.log('✔ PASS 1.3: Cross-tenant product deletion correctly rejected:', err.message);
    }

    // 1.4: Tenant A attempts to read Tenant B's order
    try {
      await orderService.getOrderById(storeB._id, orderA._id);
      console.error('❌ FAIL 1.4: Tenant B was able to read Tenant A order!');
    } catch (err) {
      console.log('✔ PASS 1.4: Cross-tenant order read correctly rejected:', err.message);
    }

    // 1.5: Tenant A attempts to delete Tenant B's discount
    try {
      await discountService.deleteDiscount(storeB._id, discountA._id);
      console.error('❌ FAIL 1.5: Tenant B was able to delete Tenant A discount!');
    } catch (err) {
      console.log('✔ PASS 1.5: Cross-tenant discount deletion correctly rejected:', err.message);
    }

    // -------------------------------------------------------------------------
    // TEST SUITE 2: INVENTORY CONCURRENCY & OVERSELLING
    // -------------------------------------------------------------------------
    console.log('\n--- TEST SUITE 2: INVENTORY CONCURRENCY & OVERSOLD PREVENTION ---');

    // Product with exactly 1 item in stock
    const singleStockProduct = await productService.createProduct(storeA._id, {
      name: 'Exclusive Lehenga (Only 1 in stock)',
      priceRupees: 5000,
      variants: [{ size: 'Free Size', color: 'Crimson', stock: 1, sku: 'EXCL-1' }],
    });
    const targetVariantId = singleStockProduct.variants[0]._id;

    console.log('Launching 2 simultaneous checkout requests for a product with stock = 1...');

    const checkoutPayload = {
      storeId: storeA._id,
      customer: {
        name: 'Buyer',
        phone: '9999988888',
        shippingAddress: { addressLine: '456 Avenue', city: 'Delhi', state: 'DL', pincode: '110001' },
      },
      items: [{ productId: singleStockProduct._id, variantId: targetVariantId, quantity: 1 }],
    };

    const results = await Promise.allSettled([
      orderService.createOrder(checkoutPayload),
      orderService.createOrder(checkoutPayload),
    ]);

    const successes = results.filter((r) => r.status === 'fulfilled');
    const failures = results.filter((r) => r.status === 'rejected');

    console.log(`Concurrent checkouts complete: Successes=${successes.length}, Failures=${failures.length}`);

    // Verify database stock
    const freshProduct = await Product.findById(singleStockProduct._id);
    const remainingStock = freshProduct.variants.id(targetVariantId).stock;
    console.log(`Remaining stock in DB: ${remainingStock} (totalStock: ${freshProduct.totalStock})`);

    if (successes.length === 1 && failures.length === 1 && remainingStock === 0) {
      console.log('✔ PASS 2.1: Atomic conditional stock decrement prevented overselling!');
    } else {
      console.error('❌ FAIL 2.1: Overselling occurred or unexpected state!', { successes: successes.length, remainingStock });
    }

    // Check if duplicate order number race condition happened:
    if (failures.some((f) => f.reason && f.reason.code === 11000)) {
      console.error('⚠ AUDIT FINDING 2.2: Duplicate key error (E11000) occurred under concurrent checkout due to countDocuments orderNumber race!');
    }

    // -------------------------------------------------------------------------
    // TEST SUITE 3: DISCOUNT USAGE CONCURRENCY & EDGE CASES
    // -------------------------------------------------------------------------
    console.log('\n--- TEST SUITE 3: DISCOUNT VALIDATION & CONCURRENCY ---');

    // 3.1: Expired discount test
    const expiredDiscount = await Discount.create({
      storeId: storeA._id,
      code: `EXPIRED_${testSuffix}`,
      type: 'PERCENT',
      value: 20,
      validUntil: new Date(Date.now() - 3600000), // 1 hour ago
    });

    try {
      await discountService.validateDiscount(storeA._id, expiredDiscount.code, 200000);
      console.error('❌ FAIL 3.1: Expired discount was accepted!');
    } catch (err) {
      console.log('✔ PASS 3.1: Expired discount rejected:', err.message);
    }

    // 3.2: Minimum order threshold
    try {
      await discountService.validateDiscount(storeA._id, discountA.code, 50000); // 50000 paise < 100000 paise min
      console.error('❌ FAIL 3.2: Discount accepted below minimum order amount!');
    } catch (err) {
      console.log('✔ PASS 3.2: Sub-minimum order discount rejected:', err.message);
    }

    // 3.3: Concurrent usage limit check (limit = 1)
    const limitedDiscount = await Discount.create({
      storeId: storeA._id,
      code: `LIMIT1_${testSuffix}`,
      type: 'FLAT',
      value: 10000,
      usageLimit: 1,
      usedCount: 0,
    });

    console.log('Testing concurrent discount coupon validation for limit=1...');
    // Create product with plenty stock
    const multiProduct = await productService.createProduct(storeA._id, {
      name: 'Regular Kurti',
      priceRupees: 1000,
      variants: [{ size: 'M', color: 'Blue', stock: 10, sku: 'KURTI-M' }],
    });

    const discOrderPayload = {
      storeId: storeA._id,
      customer: {
        name: 'Coupon Buyer',
        phone: '9888877777',
        shippingAddress: { addressLine: '789 Rd', city: 'Pune', state: 'MH', pincode: '411001' },
      },
      items: [{ productId: multiProduct._id, variantId: multiProduct.variants[0]._id, quantity: 1 }],
      discountCode: limitedDiscount.code,
    };

    const discResults = await Promise.allSettled([
      orderService.createOrder(discOrderPayload),
      orderService.createOrder(discOrderPayload),
    ]);

    const discSuccesses = discResults.filter((r) => r.status === 'fulfilled');
    const freshDiscount = await Discount.findById(limitedDiscount._id);
    console.log(`Discount orders placed: ${discSuccesses.length}, Final usedCount in DB: ${freshDiscount.usedCount}`);

    if (freshDiscount.usedCount > limitedDiscount.usageLimit) {
      console.error(`❌ FAIL 3.3 (RACE CONDITION): Discount coupon usage limit bypassed! usedCount (${freshDiscount.usedCount}) > usageLimit (${limitedDiscount.usageLimit})!`);
    } else {
      console.log('✔ PASS 3.3: Discount usage limit respected.');
    }

    // -------------------------------------------------------------------------
    // TEST SUITE 4: ORDER STATE TRANSITIONS
    // -------------------------------------------------------------------------
    console.log('\n--- TEST SUITE 4: ORDER STATE TRANSITIONS & STOCK RESTORATION ---');

    // Create an order, confirm it, then cancel it, and verify stock is restored
    const stockBefore = (await Product.findById(multiProduct._id)).variants[0].stock;
    const cancelTestOrder = await orderService.createOrder({
      storeId: storeA._id,
      customer: {
        name: 'Cancel Buyer',
        phone: '9111122222',
        shippingAddress: { addressLine: '101 Street', city: 'Surat', state: 'GJ', pincode: '395001' },
      },
      items: [{ productId: multiProduct._id, variantId: multiProduct.variants[0]._id, quantity: 2 }],
    });

    const stockAfterOrder = (await Product.findById(multiProduct._id)).variants[0].stock;
    console.log(`Stock before: ${stockBefore}, Stock after order of 2: ${stockAfterOrder}`);

    // Update to CONFIRMED
    await orderService.updateOrderStatus(storeA._id, cancelTestOrder._id, 'CONFIRMED');

    // Try invalid transition directly to DELIVERED
    try {
      await orderService.updateOrderStatus(storeA._id, cancelTestOrder._id, 'DELIVERED');
      console.error('❌ FAIL 4.1: Invalid transition CONFIRMED -> DELIVERED was accepted!');
    } catch (err) {
      console.log('✔ PASS 4.1: Invalid transition CONFIRMED -> DELIVERED rejected:', err.message);
    }

    // Cancel order
    await orderService.updateOrderStatus(storeA._id, cancelTestOrder._id, 'CANCELLED');
    const stockAfterCancel = (await Product.findById(multiProduct._id)).variants[0].stock;
    console.log(`Stock after CANCELLED: ${stockAfterCancel}`);

    if (stockAfterCancel === stockBefore) {
      console.log('✔ PASS 4.2: Stock restored correctly upon order cancellation.');
    } else {
      console.error('❌ FAIL 4.2: Stock was not restored on cancellation!');
    }

    // -------------------------------------------------------------------------
    // TEST SUITE 5: PUBLIC ORDER TRACKING PRIVACY / ENUMERATION
    // -------------------------------------------------------------------------
    console.log('\n--- TEST SUITE 5: PUBLIC ORDER TRACKING EXPOSURE AUDIT ---');

    const trackedOrder = await orderService.getPublicOrderTracking(storeA._id, orderA.orderNumber, orderA.customer.phone);
    const exposedFields = Object.keys(trackedOrder);
    console.log('Fields returned by public tracking endpoint:', exposedFields);
    if (trackedOrder.customer.shippingAddress && trackedOrder.customer.shippingAddress.addressLine.includes('Protected')) {
      console.log('✔ PASS 5.1: Address line is successfully redacted/protected in public tracking response.');
    } else {
      console.warn('❌ FAIL 5.1: Full addressLine still exposed in public tracking!');
    }
    if (trackedOrder.internalNotes === undefined) {
      console.log('✔ PASS 5.2: internalNotes successfully excluded from public tracking response.');
    } else {
      console.warn('❌ FAIL 5.2: internalNotes exposed in public tracking!');
    }

  } catch (err) {
    console.error('Unexpected error during audit regression:', err);
  } finally {
    // Cleanup test records
    console.log('\n[Cleanup] Cleaning up test records...');
    if (tenantA) await User.findByIdAndDelete(tenantA._id);
    if (tenantB) await User.findByIdAndDelete(tenantB._id);
    if (storeA) await Store.findByIdAndDelete(storeA._id);
    if (storeB) await Store.findByIdAndDelete(storeB._id);
    if (productA) await Product.findByIdAndDelete(productA._id);
    if (productB) await Product.findByIdAndDelete(productB._id);
    await Product.deleteMany({ name: /Exclusive Lehenga|Regular Kurti/ });
    await Order.deleteMany({ storeId: { $in: [storeA?._id, storeB?._id] } });
    await Discount.deleteMany({ code: new RegExp(testSuffix) });
    await mongoose.disconnect();
    console.log('=== AUDIT REGRESSION COMPLETED ===\n');
  }
}

runAuditRegression();
