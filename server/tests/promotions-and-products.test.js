const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const productService = require('../src/services/productService');
const campaignService = require('../src/services/campaignService');
const Store = require('../src/models/Store');
const Product = require('../src/models/Product');
const Campaign = require('../src/models/Campaign');

async function runTests() {
  console.log('=== RUNNING PROMOTIONS & PRODUCT VALIDATION TEST SUITE ===\n');

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✔ Connected to MongoDB Atlas\n');

  let testStore;

  try {
    // Setup test store
    testStore = await Store.create({
      name: 'Test Boutique Automation',
      slug: `test-boutique-${Date.now()}`,
      ownerId: new mongoose.Types.ObjectId(),
      whatsappNumber: '919876543210',
    });

    console.log('--- TEST 1: PRODUCT PRICE & VARIANT VALIDATION ---');

    // 1.1: Reject zero or negative selling price
    let err1 = null;
    try {
      await productService.createProduct(testStore._id, {
        name: 'Invalid Price Kurti',
        priceRupees: 0,
      });
    } catch (err) {
      err1 = err;
    }
    if (err1 && err1.message.includes('greater than ₹0')) {
      console.log('✔ PASS 1.1: Zero price rejected correctly:', err1.message);
    } else {
      throw new Error(`FAIL 1.1: Zero price was not rejected! Result: ${err1?.message}`);
    }

    // 1.2: Reject MRP lower than selling price
    let err2 = null;
    try {
      await productService.createProduct(testStore._id, {
        name: 'Invalid MRP Kurti',
        priceRupees: 1500,
        compareAtPriceRupees: 999, // Lower than selling price
      });
    } catch (err) {
      err2 = err;
    }
    if (err2 && err2.message.includes('cannot be lower than the selling price')) {
      console.log('✔ PASS 1.2: MRP lower than selling price rejected correctly:', err2.message);
    } else {
      throw new Error(`FAIL 1.2: Invalid MRP was not rejected! Result: ${err2?.message}`);
    }

    // 1.3: Reject negative variant stock
    let err3 = null;
    try {
      await productService.createProduct(testStore._id, {
        name: 'Negative Stock Kurti',
        priceRupees: 999,
        variants: [{ size: 'M', color: 'Red', stock: -5 }],
      });
    } catch (err) {
      err3 = err;
    }
    if (err3 && err3.message.includes('cannot be negative')) {
      console.log('✔ PASS 1.3: Negative stock rejected correctly:', err3.message);
    } else {
      throw new Error(`FAIL 1.3: Negative stock was not rejected! Result: ${err3?.message}`);
    }

    // 1.4: Create valid products for search and deals testing
    const p1 = await productService.createProduct(testStore._id, {
      name: 'Banarasi Chanderi Silk Kurti',
      description: 'Handwoven pure silk with golden zari border',
      category: 'Kurtis',
      priceRupees: 1200,
      compareAtPriceRupees: 2000, // 40% discount
      variants: [
        { size: 'M', color: 'Ruby Red', stock: 10 },
        { size: 'L', color: 'Teal Blue', stock: 5 },
      ],
    });

    const p2 = await productService.createProduct(testStore._id, {
      name: 'Casual Cotton Printed Anarkali',
      description: 'Lightweight summer ethnic wear',
      category: 'Suits & Anarkalis',
      priceRupees: 799, // Under ₹999
      variants: [{ size: 'Free Size', color: 'Mustard Yellow', stock: 15 }],
    });

    console.log('✔ PASS 1.4: Valid products created successfully with variants and stock.\n');

    console.log('--- TEST 2: MULTI-FIELD SEARCH EXPANSION ---');

    // 2.1: Search by description keyword ("zari")
    const searchZari = await productService.listPublicProducts(testStore._id, { search: 'zari' });
    if (searchZari.length === 1 && searchZari[0]._id.equals(p1._id)) {
      console.log('✔ PASS 2.1: Matched by description keyword ("zari")');
    } else {
      throw new Error(`FAIL 2.1: Search by description failed! Count: ${searchZari.length}`);
    }

    // 2.2: Search by variant color ("Teal")
    const searchTeal = await productService.listPublicProducts(testStore._id, { search: 'Teal' });
    if (searchTeal.length === 1 && searchTeal[0]._id.equals(p1._id)) {
      console.log('✔ PASS 2.2: Matched by variant color ("Teal")');
    } else {
      throw new Error(`FAIL 2.2: Search by variant color failed! Count: ${searchTeal.length}`);
    }

    // 2.3: Search by category name ("Anarkalis")
    const searchCategory = await productService.listPublicProducts(testStore._id, { search: 'Anarkalis' });
    if (searchCategory.length === 1 && searchCategory[0]._id.equals(p2._id)) {
      console.log('✔ PASS 2.3: Matched by category string ("Anarkalis")\n');
    } else {
      throw new Error(`FAIL 2.3: Search by category failed! Count: ${searchCategory.length}`);
    }

    console.log('--- TEST 3: PROMOTIONS CAMPAIGN ENGINE & VALIDATION ---');

    // 3.1: Reject inverted dates (startDate >= endDate)
    let errDate = null;
    try {
      await campaignService.createCampaign(testStore._id, {
        title: 'Invalid Date Sale',
        startDate: new Date('2026-12-01'),
        endDate: new Date('2026-11-01'), // Earlier than start date!
      });
    } catch (err) {
      errDate = err;
    }
    if (errDate && errDate.message.includes('must be before end date')) {
      console.log('✔ PASS 3.1: Inverted dates rejected correctly:', errDate.message);
    } else {
      throw new Error(`FAIL 3.1: Inverted dates not rejected! Result: ${errDate?.message}`);
    }

    // 3.2: Create an active campaign
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const activeCampaign = await campaignService.createCampaign(testStore._id, {
      title: 'Diwali Festive Sparkle',
      subtitle: 'Flat 30% off handloom silk items',
      badge: 'FESTIVE SALE',
      category: 'Kurtis',
      dealType: 'PERCENTAGE_DISCOUNT',
      discountValue: 30,
      startDate: yesterday,
      endDate: nextWeek,
      isActive: true,
    });

    if (activeCampaign.status === 'ACTIVE') {
      console.log('✔ PASS 3.2: Active campaign recognized as ACTIVE status in real-time');
    } else {
      throw new Error(`FAIL 3.2: Expected ACTIVE status, got: ${activeCampaign.status}`);
    }

    // 3.3: Create an upcoming campaign
    const inTwoDays = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
    const inTenDays = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);

    const upcomingCampaign = await campaignService.createCampaign(testStore._id, {
      title: 'New Year Partywear Collection',
      subtitle: 'Coming soon for the holiday season',
      badge: 'COMING SOON',
      category: 'Suits & Anarkalis',
      startDate: inTwoDays,
      endDate: inTenDays,
      isActive: true,
    });

    if (upcomingCampaign.status === 'UPCOMING') {
      console.log('✔ PASS 3.3: Upcoming campaign recognized as UPCOMING status in real-time\n');
    } else {
      throw new Error(`FAIL 3.3: Expected UPCOMING status, got: ${upcomingCampaign.status}`);
    }

    console.log('--- TEST 4: STOREFRONT REAL-DEALS ENGINE AUDIT ---');

    const deals = await campaignService.getPublicStoreDeals(testStore._id);

    if (deals.activeDeals.length === 1 && deals.activeDeals[0].title === 'Diwali Festive Sparkle') {
      console.log('✔ PASS 4.1: Public deals endpoint returned genuine active campaign');
    } else {
      throw new Error(`FAIL 4.1: Active deals mismatch: ${JSON.stringify(deals.activeDeals)}`);
    }

    if (deals.upcomingDeals.length === 1 && deals.upcomingDeals[0].title === 'New Year Partywear Collection') {
      console.log('✔ PASS 4.2: Public deals endpoint returned genuine upcoming campaign with coming soon badge');
    } else {
      throw new Error(`FAIL 4.2: Upcoming deals mismatch: ${JSON.stringify(deals.upcomingDeals)}`);
    }

    if (deals.inventoryMetrics.discountedProductsCount === 1 && deals.inventoryMetrics.maxDiscountPercent === 40) {
      console.log('✔ PASS 4.3: Real product discount (40%) correctly calculated from inventory');
    } else {
      throw new Error(`FAIL 4.3: Discount metrics mismatch: ${JSON.stringify(deals.inventoryMetrics)}`);
    }

    if (deals.inventoryMetrics.under999Count === 1) {
      console.log('✔ PASS 4.4: Under ₹999 count (1 product) accurately calculated from inventory');
    } else {
      throw new Error(`FAIL 4.4: Under 999 count mismatch: ${JSON.stringify(deals.inventoryMetrics)}`);
    }

    console.log('\n=== ALL PROMOTIONS & PRODUCT VALIDATION TESTS PASSED! ===');
  } finally {
    if (testStore) {
      await Product.deleteMany({ storeId: testStore._id });
      await Campaign.deleteMany({ storeId: testStore._id });
      await Store.deleteOne({ _id: testStore._id });
      console.log('[Cleanup] Test records cleaned up successfully.');
    }
    await mongoose.disconnect();
  }
}

runTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Test Suite Failed:', err);
    process.exit(1);
  });
