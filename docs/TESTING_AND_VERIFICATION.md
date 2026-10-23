# Testing and Verification Strategy

This document details the test suites, verification procedures, and automated test execution commands for the BoutiqueSaaS platform.

---

## 1. Test Architecture Overview

The testing strategy encompasses four levels of verification:
1. **Unit Test Suite:** In-memory verification of domain logic, state machines, and monetary mathematics.
2. **Promotions & Product Validation Test Suite:** End-to-end integration tests verifying database constraints, multi-field search, campaign lifecycle, and real-deals aggregation.
3. **Production Readiness Audit Regression Suite:** Multi-tenant security isolation, concurrency safety under simulated race conditions, and privacy audits.
4. **Frontend Production Build Verification:** Compilation and bundling validation via Vite.

---

## 2. Test Suites Detailed Breakdown

### 2.1 Unit Tests (`server/tests/unit.test.js`)
- **Integer Minor Units Arithmetic:**
  - Validates conversion between rupees and paise (`toPaise(1499) === 149900`).
  - Ensures negative inputs resolve safely to 0 paise.
  - Verifies currency formatting output (e.g., `₹1,499.00`).
- **Order State Machine Transitions:**
  - Verifies valid transitions: `PENDING → CONFIRMED`, `CONFIRMED → SHIPPED`, `SHIPPED → DELIVERED`, and cancellation paths.
  - Verifies invalid transitions: Rejects illegal jumps such as `PENDING → DELIVERED` directly or attempting to transition out of `DELIVERED` or `CANCELLED`.
- **Discount Calculations:**
  - Verifies percentage discount calculations and maximum cap limits (e.g. 10% on ₹2000 capped at ₹150).
- **Campaign Schedule Status:**
  - Verifies real-time status resolution (`UPCOMING`, `ACTIVE`, `EXPIRED`, `PAUSED`) based on temporal boundaries and active flags.

### 2.2 Promotions & Product Validation Suite (`server/tests/promotions-and-products.test.js`)
- **Price & Variant Validation:**
  - Rejects zero or negative selling price (`priceRupees: 0`).
  - Rejects Original/MRP price lower than the selling price.
  - Rejects negative variant stock quantities.
  - Verifies valid multi-variant product creation.
- **Multi-Field Search Expansion:**
  - Matches products by description keywords (e.g., `"zari"`).
  - Matches products by variant color names (e.g., `"Teal"`).
  - Matches products by category names (e.g., `"Anarkalis"`).
- **Campaign Lifecycle Engine:**
  - Rejects inverted campaign date ranges (`startDate >= endDate`).
  - Validates dynamic `ACTIVE` and `UPCOMING` status computation.
- **Storefront Real-Deals Aggregation:**
  - Validates that active and upcoming campaigns appear in public deals.
  - Verifies authentic inventory-backed discount percentages (e.g., 40% OFF).
  - Verifies authentic under ₹999 inventory counts.

### 2.3 Audit Regression Suite (`server/tests/audit-regression.js`)
- **Cross-Tenant Data Isolation:**
  - Verifies that Seller B cannot read, modify, or delete Seller A's products, orders, or discount codes.
- **Inventory Concurrency & Oversold Prevention:**
  - Dispatches 2 concurrent checkout requests for a single remaining inventory unit (`stock = 1`).
  - Asserts that exactly 1 checkout succeeds, 1 checkout fails with an out-of-stock error, and remaining database stock is exactly 0.
- **Discount Coupon Concurrency:**
  - Simulates simultaneous checkouts for a coupon with `usageLimit = 1`.
  - Asserts that the atomic condition `$expr: { $lt: ['$usedCount', '$usageLimit'] }` allows only 1 redemption.
- **Order Cancellation Stock Restoration:**
  - Confirms that cancelling an order atomically restores reserved stock back to the product variant.
- **Public Order Tracking Privacy Audit:**
  - Inspects fields returned by `/api/storefront/:slug/track-order`.
  - Asserts that street address line 1 is redacted with `[Protected for customer privacy]`.
  - Asserts that `internalNotes` are completely excluded.

---

## 3. Test Execution Commands

### Run Unit Tests
```bash
npm test
# Or from server directory:
node server/tests/runner.js
```

### Run Promotions & Product Validation Integration Tests
```bash
node server/tests/promotions-and-products.test.js
```

### Run Complete Audit Regression Suite
```bash
node server/tests/audit-regression.js
```

### Run Frontend Production Build
```bash
npm run build
```

---

## 4. Verification Results Summary

| Test Suite | Total Assertions | Status |
| :--- | :--- | :--- |
| **Unit Test Suite** | 12 assertions | **100% Passed** |
| **Promotions & Product Integration Suite** | 11 assertions | **100% Passed** |
| **Audit Regression Suite** | 9 assertions | **100% Passed** |
| **Vite Client Production Build** | 1969 modules | **Zero Warnings / Zero Errors** |
