// Input rules shared by every form.
// Keep in sync with crowdgrid-backend/utils/validate.js (the server checks the same rules).
import { phoneError } from './phone';

/** Allowed characters per kind of field, and how to strip anything else while typing. */
export const KINDS = {
  name: { re: /^[\p{L}\p{M}][\p{L}\p{M} .'-]*$/u, strip: /[^\p{L}\p{M} .'-]/gu, hint: "letters, spaces and . ' - only" },
  place: { re: /^[\p{L}\p{M}\d][\p{L}\p{M}\d .,'&()/#:-]*$/u, strip: /[^\p{L}\p{M}\d .,'&()/#:-]/gu, hint: 'letters, numbers, spaces and , . - / # & ( ) only' },
  code: { re: /^[A-Za-z0-9][A-Za-z0-9 ./-]*$/, strip: /[^A-Za-z0-9 ./-]/g, hint: 'letters, numbers and / . - only' },
  text: { re: /^[^\p{Cc}]*$/su, strip: null, hint: '' },
};

export const LIMITS = {
  personName: { min: 2, max: 80, kind: 'name' },
  city: { min: 2, max: 60, kind: 'name' },
  title: { min: 3, max: 100, kind: 'text' },
  venue: { min: 2, max: 120, kind: 'place' },
  address: { min: 5, max: 200, kind: 'place' },
  orgName: { min: 2, max: 120, kind: 'place' },
  campName: { min: 2, max: 120, kind: 'place' },
  regNumber: { min: 2, max: 40, kind: 'code' },
  shortText: { min: 0, max: 120, kind: 'text' },
  longText: { min: 0, max: 500, kind: 'text' },
};

const ruleOf = (rule) => (typeof rule === 'string' ? LIMITS[rule] : rule);

/** Removes characters a field never accepts and enforces the length limit while typing. */
export const cleanText = (value, rule) => {
  const r = ruleOf(rule);
  const k = KINDS[r.kind || 'text'];
  let s = String(value ?? '');
  if (k.strip) s = s.replace(k.strip, '');
  s = s.replace(/^\s+/, '').replace(/\s{2,}/g, ' '); // no leading spaces, no double spaces
  return s.slice(0, r.max);
};

/** Error message for a text field, or '' when valid. */
export const textError = (value, label, rule, { required = false } = {}) => {
  const r = ruleOf(rule);
  const v = String(value ?? '').trim();
  if (!v) return required ? `${label} is required` : '';
  if (v.length < (r.min || 0)) return `${label} needs at least ${r.min} characters`;
  if (v.length > r.max) return `${label} can be at most ${r.max} characters`;
  const k = KINDS[r.kind || 'text'];
  if (!k.re.test(v)) return `${label} can contain ${k.hint}`;
  return '';
};

/** Error for a whole-number field kept as a string of digits. */
export const intError = (value, label, { min, max, required = false } = {}) => {
  const v = String(value ?? '').trim();
  if (!v) return required ? `${label} is required` : '';
  if (!/^-?\d+$/.test(v)) return `${label} must be a whole number`;
  const n = Number(v);
  if (n < min || n > max) return `${label} must be between ${min.toLocaleString('en-IN')} and ${max.toLocaleString('en-IN')}`;
  return '';
};

export const pinError = (value, { required = false } = {}) => {
  const v = String(value ?? '').trim();
  if (!v) return required ? 'PIN code is required' : '';
  if (!/^[1-9]\d{5}$/.test(v)) return v.length < 6 ? `PIN code needs 6 digits (you entered ${v.length})` : 'PIN code cannot start with 0';
  return '';
};

/** Phone error that allows an empty value for optional fields. */
export const optionalPhoneError = (countryCode, value, { required = false } = {}) => {
  if (!String(value ?? '').trim()) return required ? 'Enter a mobile number' : '';
  return phoneError(countryCode, value);
};

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const emailError = (value) => (value && !EMAIL_RE.test(String(value).trim()) ? 'Enter a valid email address, e.g. name@gmail.com' : '');

/** First non-empty message in a list, for blocking a submit. */
export const firstError = (...errors) => errors.find(Boolean) || '';
