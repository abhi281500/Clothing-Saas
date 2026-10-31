const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const assert = require('assert');

dotenv.config({ path: path.join(__dirname, '../.env') });

const storeService = require('../src/services/storeService');
const Store = require('../src/models/Store');

async function runCustomDomainTests() {
  console.log('=== RUNNING CUSTOM DOMAIN TEST SUITE ===\n');

  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI is not set in server/.env. Skipping database tests.');
    return;
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✔ Connected to MongoDB Atlas\n');

  let storeA;
  let storeB;

  try {
    const timestamp = Date.now();
    storeA = await Store.create({
      name: 'Custom Domain Store A',
      slug: `custom-domain-a-${timestamp}`,
      ownerId: new mongoose.Types.ObjectId(),
      whatsappNumber: '919876543210',
    });

    storeB = await Store.create({
      name: 'Custom Domain Store B',
      slug: `custom-domain-b-${timestamp}`,
      ownerId: new mongoose.Types.ObjectId(),
      whatsappNumber: '919876543211',
    });

    console.log('--- TEST 1: DOMAIN VALIDATION & RESERVED DOMAIN REJECTION ---');

    // 1.1: Reject invalid domain format
    let err1 = null;
    try {
      await storeService.setCustomDomain(storeA._id, 'not a domain!@#');
    } catch (e) {
      err1 = e;
    }
    assert(err1 && err1.code === 'INVALID_DOMAIN_FORMAT', 'Should reject invalid domain format');
    console.log('✔ PASS 1.1: Invalid domain format rejected correctly');

    // 1.2: Reject reserved domain (e.g. vercel.app or localhost)
    let err2 = null;
    try {
      await storeService.setCustomDomain(storeA._id, 'evil-subdomain.vercel.app');
    } catch (e) {
      err2 = e;
    }
    assert(err2 && err2.code === 'RESERVED_DOMAIN', 'Should reject reserved platform domain');
    console.log('✔ PASS 1.2: Reserved platform domain rejected correctly');

    console.log('\n--- TEST 2: SUBDOMAIN VS APEX DOMAIN DNS GENERATION ---');

    // 2.1: Subdomain (shop.myboutique.in)
    const testSubdomain = `shop-${timestamp}.boutiquehub.in`;
    const updatedSub = await storeService.setCustomDomain(storeA._id, `https://${testSubdomain}/`);
    assert.strictEqual(updatedSub.customDomain.domain, testSubdomain, 'Domain should be normalized');
    assert.strictEqual(updatedSub.customDomain.status, 'PENDING_DNS', 'Status should be PENDING_DNS');
    assert.strictEqual(updatedSub.customDomain.dnsRecords.length, 1, 'Subdomain should have 1 CNAME record');
    assert.strictEqual(updatedSub.customDomain.dnsRecords[0].recordType, 'CNAME', 'Should be CNAME');
    assert.strictEqual(updatedSub.customDomain.dnsRecords[0].name, `shop-${timestamp}`, 'Record name should match prefix');
    console.log('✔ PASS 2.1: Subdomain CNAME record generated correctly');

    // 2.2: Apex domain (myboutique.in)
    const testApex = `boutique-${timestamp}.in`;
    const updatedApex = await storeService.setCustomDomain(storeA._id, testApex);
    assert.strictEqual(updatedApex.customDomain.domain, testApex, 'Domain should be normalized');
    assert.strictEqual(updatedApex.customDomain.dnsRecords.length, 2, 'Apex domain should have A and CNAME records');
    assert.strictEqual(updatedApex.customDomain.dnsRecords[0].recordType, 'A', 'First record should be A');
    assert.strictEqual(updatedApex.customDomain.dnsRecords[0].value, '76.76.21.21', 'Target should be Vercel IP');
    assert.strictEqual(updatedApex.customDomain.dnsRecords[1].recordType, 'CNAME', 'Second record should be www CNAME');
    console.log('✔ PASS 2.2: Apex domain A + www CNAME records generated correctly');

    console.log('\n--- TEST 3: DOMAIN COLLISION & TENANT ISOLATION ---');

    // 3.1: Store B cannot steal Store A's active domain
    let err3 = null;
    try {
      await storeService.setCustomDomain(storeB._id, testApex);
    } catch (e) {
      err3 = e;
    }
    assert(err3 && err3.code === 'DOMAIN_ALREADY_EXISTS', 'Should prevent duplicate custom domain');
    console.log('✔ PASS 3.1: Duplicate domain collision prevented correctly');

    console.log('\n--- TEST 4: PUBLIC STOREFRONT RESOLUTION BY CUSTOM DOMAIN ---');

    // 4.1: Lookup store by domain
    const resolvedStore = await storeService.getPublicStoreByDomain(testApex);
    assert.strictEqual(resolvedStore.name, storeA.name, 'Resolved store name should match');
    assert.strictEqual(resolvedStore.slug, storeA.slug, 'Resolved store slug should match');
    assert.strictEqual(resolvedStore.ownerId, undefined, 'ownerId must NOT be exposed publicly');
    console.log('✔ PASS 4.1: Public storefront correctly resolved by custom domain without leaking ownerId');

    console.log('\n--- TEST 5: REMOVE CUSTOM DOMAIN ---');

    // 5.1: Remove domain from Store A
    const removedStore = await storeService.removeCustomDomain(storeA._id);
    assert.strictEqual(removedStore.customDomain.domain, undefined, 'Domain should be undefined');
    assert.strictEqual(removedStore.customDomain.status, 'NONE', 'Status should be NONE');

    // 5.2: Now Store B should be allowed to use the domain
    const storeBClaimed = await storeService.setCustomDomain(storeB._id, testApex);
    assert.strictEqual(storeBClaimed.customDomain.domain, testApex, 'Store B can claim domain after removal');
    console.log('✔ PASS 5.1 & 5.2: Custom domain removal and re-assignment works');

    console.log('\n========================================');
    console.log('ALL CUSTOM DOMAIN TESTS PASSED SUCCESSFULLY!');
    console.log('========================================\n');
  } finally {
    if (storeA) await Store.findByIdAndDelete(storeA._id);
    if (storeB) await Store.findByIdAndDelete(storeB._id);
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

runCustomDomainTests().catch((err) => {
  console.error('Custom domain test failure:', err);
  process.exit(1);
});
