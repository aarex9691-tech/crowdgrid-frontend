// Mobile number rules per country (national number length).
// Keep in sync with crowdgrid-backend/utils/phone.js.
export const COUNTRIES = [
  { code: '91', name: 'India', min: 10, max: 10, pattern: /^[6-9]\d{9}$/ },
  { code: '977', name: 'Nepal', min: 10, max: 10 },
  { code: '94', name: 'Sri Lanka', min: 9, max: 9 },
  { code: '880', name: 'Bangladesh', min: 10, max: 10 },
  { code: '1', name: 'USA / Canada', min: 10, max: 10 },
  { code: '44', name: 'United Kingdom', min: 10, max: 10 },
  { code: '61', name: 'Australia', min: 9, max: 9 },
  { code: '971', name: 'UAE', min: 9, max: 9 },
  { code: '65', name: 'Singapore', min: 8, max: 8 },
  { code: '49', name: 'Germany', min: 10, max: 11 },
  { code: '33', name: 'France', min: 9, max: 9 },
  { code: '7', name: 'Russia', min: 10, max: 10 },
  { code: '81', name: 'Japan', min: 10, max: 10 },
  { code: '230', name: 'Mauritius', min: 8, max: 8 },
];

export const countryFor = (code) => COUNTRIES.find((c) => c.code === code) || COUNTRIES[0];

const lengthText = (c) => (c.min === c.max ? `${c.min}` : `${c.min}-${c.max}`);

/** Error message for a number, or '' when it is valid. */
export const phoneError = (code, value) => {
  const c = countryFor(code);
  const n = String(value || '').replace(/\D/g, '');
  if (!n) return 'Enter your mobile number';
  if (/[^\d\s-]/.test(String(value))) return 'Use digits only (choose the country code from the list)';
  if (n.length < c.min) return `Too short: ${c.name} mobile numbers have ${lengthText(c)} digits (you entered ${n.length})`;
  if (n.length > c.max) return `Too long: ${c.name} mobile numbers have ${lengthText(c)} digits (you entered ${n.length})`;
  if (c.pattern && !c.pattern.test(n)) return 'Indian mobile numbers start with 6, 7, 8 or 9';
  return '';
};

export const formatPhone = (code, phone) => (phone ? `+${code || '91'} ${phone}` : '');
