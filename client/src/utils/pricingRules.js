/**
 * Standard Switchgear Category-Based Pricing Matrix
 * Pricing starts from ₹ 50,000 for standard base category:
 * (11kV, 630A, 26.3 kA, Indoor VCB Switchboard)
 * 
 * Provides dynamic unit price lookup based on kV, Ampere, and Usage (Indoor vs Outdoor),
 * and Indian currency formatting with commas (e.g. 50,000 / 1,25,000).
 */

export const STANDARD_SWITCHGEAR_PRICING = {
  // 11 kV Series (Starts from ₹ 50,000)
  '11 kV_630 A_Indoor': 50000,
  '11 kV_630 A_Outdoor': 65000,
  '11 kV_800 A_Indoor': 75000,
  '11 kV_800 A_Outdoor': 90000,
  '11 kV_1250 A_Indoor': 110000,
  '11 kV_1250 A_Outdoor': 130000,

  // 22 kV Series
  '22 kV_630 A_Indoor': 150000,
  '22 kV_630 A_Outdoor': 175000,
  '22 kV_800 A_Indoor': 190000,
  '22 kV_800 A_Outdoor': 220000,
  '22 kV_1250 A_Indoor': 240000,
  '22 kV_1250 A_Outdoor': 275000,

  // 33 kV Series
  '33 kV_630 A_Indoor': 310000,
  '33 kV_630 A_Outdoor': 350000,
  '33 kV_800 A_Indoor': 380000,
  '33 kV_800 A_Outdoor': 425000,
  '33 kV_1250 A_Indoor': 450000,
  '33 kV_1250 A_Outdoor': 500000
};

/**
 * Get standard unit price based on category specifications
 */
export const getStandardUnitPrice = (kilovolt = '11 kV', ampere = '630 A', usage = 'Indoor') => {
  const normKv = (kilovolt || '11 kV').trim();
  const normAmp = (ampere || '630 A').trim();
  const normUsage = (usage || 'Indoor').trim();

  const key = `${normKv}_${normAmp}_${normUsage}`;
  if (STANDARD_SWITCHGEAR_PRICING[key] !== undefined) {
    return STANDARD_SWITCHGEAR_PRICING[key];
  }

  // Graceful formula fallback for custom / others starting from ₹ 50,000
  let basePrice = 50000;
  if (normKv.includes('22')) basePrice += 100000;
  else if (normKv.includes('33')) basePrice += 260000;

  if (normAmp.includes('800')) basePrice += 25000;
  else if (normAmp.includes('1250')) basePrice += 60000;
  else if (normAmp.includes('2000')) basePrice += 120000;

  if (normUsage.toLowerCase() === 'outdoor') basePrice += 15000;

  return basePrice;
};

/**
 * Format raw number to Indian currency format with commas
 * e.g. 50000 -> "50,000", 1250000 -> "12,50,000"
 */
export const formatIndianCommas = (val) => {
  if (val === undefined || val === null || val === '') return '';
  const num = typeof val === 'number' ? val : Number(String(val).replace(/[^0-9.-]/g, ''));
  if (isNaN(num)) return '';
  return num.toLocaleString('en-IN');
};

/**
 * Parse a string with Indian commas back to an integer
 * e.g. "50,000" -> 50000
 */
export const parseIndianCommas = (str) => {
  if (!str) return 0;
  const cleaned = String(str).replace(/[^0-9.-]/g, '');
  const parsed = Number(cleaned);
  return isNaN(parsed) ? 0 : parsed;
};

