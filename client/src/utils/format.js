/**
 * Client currency and date formatting utilities
 */

export const toRupees = (paise) => {
  if (typeof paise !== 'number' || isNaN(paise)) return 0;
  return Number((paise / 100).toFixed(2));
};

export const toPaise = (rupees) => {
  const val = parseFloat(rupees);
  if (isNaN(val) || val < 0) return 0;
  return Math.round(val * 100);
};

export const formatINR = (paise) => {
  const rupees = toRupees(paise);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(rupees);
};

export const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString));
};
