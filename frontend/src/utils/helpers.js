import { format, parseISO, isValid } from 'date-fns';

/**
 * Format a number as Indian currency (INR)
 * e.g. 123456.78 => "₹1,23,456.78"
 */
export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) return '₹0.00';
  const num = parseFloat(amount);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};

/**
 * Format liters with comma separation
 * e.g. 1234.56 => "1,234.56 L"
 */
export const formatLiters = (liters) => {
  if (liters === null || liters === undefined || isNaN(liters)) return '0.00 L';
  const num = parseFloat(liters);
  return `${new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num)} L`;
};

/**
 * Format date as "23 May 2026"
 */
export const formatDate = (date) => {
  if (!date) return '-';
  try {
    const d = typeof date === 'string' ? parseISO(date) : new Date(date);
    if (!isValid(d)) return '-';
    return format(d, 'dd MMM yyyy');
  } catch {
    return '-';
  }
};

/**
 * Format datetime as "23 May 2026, 14:30"
 */
export const formatDateTime = (dt) => {
  if (!dt) return '-';
  try {
    const d = typeof dt === 'string' ? parseISO(dt) : new Date(dt);
    if (!isValid(d)) return '-';
    return format(d, 'dd MMM yyyy, HH:mm');
  } catch {
    return '-';
  }
};

/**
 * Trigger a file download from a Blob
 */
export const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.parentNode.removeChild(link);
  window.URL.revokeObjectURL(url);
};

/**
 * Get MUI color string based on status
 */
export const getStatusColor = (status) => {
  if (!status) return 'default';
  const s = status.toLowerCase();
  switch (s) {
    case 'active':
    case 'paid':
    case 'completed':
    case 'operational':
      return 'success';
    case 'inactive':
    case 'cancelled':
    case 'grounded':
      return 'error';
    case 'pending':
    case 'in_transit':
    case 'low':
      return 'warning';
    case 'partial':
    case 'maintenance':
      return 'warning';
    case 'draft':
    case 'scheduled':
      return 'info';
    default:
      return 'default';
  }
};

/**
 * Get color for fuel stock level
 */
export const getStockLevelColor = (current, capacity) => {
  if (!capacity || capacity === 0) return 'error';
  const pct = (current / capacity) * 100;
  if (pct >= 50) return 'success';
  if (pct >= 20) return 'warning';
  return 'error';
};

/**
 * Get stock level percentage
 */
export const getStockPercentage = (current, capacity) => {
  if (!capacity || capacity === 0) return 0;
  return Math.min((current / capacity) * 100, 100);
};

/**
 * Truncate a long string
 */
export const truncate = (str, maxLen = 40) => {
  if (!str) return '';
  return str.length > maxLen ? `${str.substring(0, maxLen)}...` : str;
};

/**
 * Debounce function
 */
export const debounce = (fn, delay = 300) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};

/**
 * Get initials from a name
 */
export const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

/**
 * Format a number with commas (Indian format)
 */
export const formatNumber = (num) => {
  if (num === null || num === undefined || isNaN(num)) return '0';
  return new Intl.NumberFormat('en-IN').format(parseFloat(num));
};
