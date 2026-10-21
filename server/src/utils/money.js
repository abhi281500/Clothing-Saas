/**
 * Utility functions for currency calculation in minor units (paise for INR).
 * 1 INR = 100 Paise.
 * All monetary amounts in database and calculations must be integers.
 */

// Convert INR Rupees (decimal or float) to Paise (integer)
const toPaise = (rupees) => {
  if (typeof rupees === 'string') {
    rupees = parseFloat(rupees);
  }
  if (isNaN(rupees) || rupees < 0) return 0;
  return Math.round(rupees * 100);
};

// Convert Paise (integer) to INR Rupees (decimal number)
const toRupees = (paise) => {
  if (typeof paise !== 'number' || isNaN(paise)) return 0;
  return Number((paise / 100).toFixed(2));
};

// Format Paise into Indian Rupee display string, e.g. "₹1,499.00"
const formatINR = (paise) => {
  const rupees = toRupees(paise);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(rupees);
};

module.exports = {
  toPaise,
  toRupees,
  formatINR,
};
