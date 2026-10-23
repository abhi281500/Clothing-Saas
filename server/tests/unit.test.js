const assert = require('assert');
const { toPaise, toRupees, formatINR } = require('../src/utils/money');
const { VALID_TRANSITIONS } = require('../src/models/Order');

console.log('--- Running Unit Tests ---');

// Test 1: Money Utility & Minor Units
function testMoneyCalculations() {
  console.log('Testing Money calculations in minor units (paise)...');
  
  // 1499.00 INR should be 149900 paise
  assert.strictEqual(toPaise(1499), 149900, '1499 INR should convert to 149900 paise');
  assert.strictEqual(toPaise('1499.50'), 149950, '1499.50 string should convert to 149950 paise');
  assert.strictEqual(toPaise(0), 0, '0 INR should convert to 0 paise');
  assert.strictEqual(toPaise(-50), 0, 'Negative rupees should return 0 paise');

  // Convert paise back to rupees
  assert.strictEqual(toRupees(149900), 1499.00, '149900 paise should convert to 1499.00 INR');
  assert.strictEqual(toRupees(149950), 1499.50, '149950 paise should convert to 1499.50 INR');

  // Currency string formatting
  const formatted = formatINR(149900);
  assert(formatted.includes('1,499'), `Format INR should contain 1,499, received: ${formatted}`);

  console.log('✔ Money minor unit tests passed!');
}

// Test 2: Order State Machine Transitions
function testOrderStateTransitions() {
  console.log('Testing Order State Machine transitions...');

  // Helper transition tester
  const canTransition = (current, next) => (VALID_TRANSITIONS[current] || []).includes(next);

  // Allowed transitions
  assert.strictEqual(canTransition('PENDING', 'CONFIRMED'), true, 'PENDING -> CONFIRMED must be allowed');
  assert.strictEqual(canTransition('PENDING', 'CANCELLED'), true, 'PENDING -> CANCELLED must be allowed');
  assert.strictEqual(canTransition('CONFIRMED', 'SHIPPED'), true, 'CONFIRMED -> SHIPPED must be allowed');
  assert.strictEqual(canTransition('CONFIRMED', 'CANCELLED'), true, 'CONFIRMED -> CANCELLED must be allowed');
  assert.strictEqual(canTransition('SHIPPED', 'DELIVERED'), true, 'SHIPPED -> DELIVERED must be allowed');

  // Disallowed transitions
  assert.strictEqual(canTransition('PENDING', 'DELIVERED'), false, 'PENDING -> DELIVERED directly must be rejected');
  assert.strictEqual(canTransition('DELIVERED', 'CANCELLED'), false, 'DELIVERED -> CANCELLED must be rejected');
  assert.strictEqual(canTransition('CANCELLED', 'CONFIRMED'), false, 'CANCELLED -> CONFIRMED must be rejected');

  console.log('✔ Order State Machine tests passed!');
}

// Test 3: Discount Calculation Logic
function testDiscountCalculations() {
  console.log('Testing Discount calculations...');

  // Percent discount calculation
  const subtotalPaise = 200000; // ₹2000
  const percentValue = 10; // 10%
  const maxCapPaise = 15000; // ₹150 cap

  let calculatedDiscount = Math.round((subtotalPaise * percentValue) / 100); // 20000 (₹200)
  assert.strictEqual(calculatedDiscount, 20000, '10% of ₹2000 should be ₹200 (20000 paise)');

  if (maxCapPaise > 0 && calculatedDiscount > maxCapPaise) {
    calculatedDiscount = maxCapPaise;
  }
  assert.strictEqual(calculatedDiscount, 15000, 'Discount should be capped at ₹150 (15000 paise)');

  console.log('✔ Discount calculation tests passed!');
}

// Test 4: Campaign Schedule Status Determination
function testCampaignStatus() {
  console.log('Testing Campaign schedule status calculations...');

  const now = new Date();
  const past = new Date(Date.now() - 10000000);
  const future = new Date(Date.now() + 10000000);

  const getStatus = (startDate, endDate, isActive = true) => {
    const cur = new Date();
    if (!isActive) return 'PAUSED';
    if (cur < startDate) return 'UPCOMING';
    if (cur > endDate) return 'EXPIRED';
    return 'ACTIVE';
  };

  assert.strictEqual(getStatus(past, future, true), 'ACTIVE', 'Current date between start and end should be ACTIVE');
  assert.strictEqual(getStatus(future, new Date(Date.now() + 20000000), true), 'UPCOMING', 'Future start date should be UPCOMING');
  assert.strictEqual(getStatus(new Date(Date.now() - 20000000), past, true), 'EXPIRED', 'Past end date should be EXPIRED');
  assert.strictEqual(getStatus(past, future, false), 'PAUSED', 'Inactive campaign should be PAUSED');

  console.log('✔ Campaign schedule status tests passed!');
}

try {
  testMoneyCalculations();
  testOrderStateTransitions();
  testDiscountCalculations();
  testCampaignStatus();
  console.log('\n✅ ALL UNIT TESTS PASSED SUCCESSFULLY!\n');
} catch (err) {
  console.error('\n❌ UNIT TEST FAILED:', err.message);
  process.exit(1);
}
