const IST = 'Asia/Kolkata';

export const fmtDate = (d, opts = {}) =>
  new Date(d).toLocaleDateString('en-IN', { timeZone: IST, day: 'numeric', month: 'short', year: 'numeric', ...opts });

export const fmtDateTime = (d) =>
  new Date(d).toLocaleString('en-IN', { timeZone: IST, day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });

export const fmtTime = (d) => new Date(d).toLocaleTimeString('en-IN', { timeZone: IST, hour: 'numeric', minute: '2-digit' });

export const todayIST = () => new Intl.DateTimeFormat('en-CA', { timeZone: IST }).format(new Date());

export const addDaysIST = (dateStr, n) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: IST }).format(new Date(new Date(`${dateStr}T12:00:00+05:30`).getTime() + n * 86400000));

export const compactNumber = (n) => new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 }).format(n);

export const CATEGORY_LABELS = {
  FREE_CAMP: 'Free NGO camp',
  DHARAMSHALA: 'Dharamshala',
  FAMILY_TENT: 'Family tent',
  SENIOR_DORM: 'Senior dormitory',
  ASHRAM: 'Ashram',
};

export const MEAL_LABELS = { BREAKFAST: 'Breakfast', LUNCH: 'Lunch', DINNER: 'Dinner' };

export const DOMAIN_LABELS = {
  CROWD_CONTROL: 'Crowd marshalling',
  LANGAR_SERVING: 'Langar food serving',
  SENIOR_ESCORT: 'Senior citizen escort',
  FIRST_AID: 'First-aid assistance',
};

export const EVENT_CATEGORIES = {
  SPIRITUAL: 'Spiritual',
  CULTURAL: 'Cultural',
  HERITAGE_WALK: 'Heritage walk',
  SEVA: 'Seva',
  WORKSHOP: 'Workshop',
  OTHER: 'Other',
};

/** Google Maps link for a point (opens the app on phones). */
export const googleMapsUrl = (loc, fallbackQuery) =>
  loc?.lat
    ? `https://www.google.com/maps/search/?api=1&query=${loc.lat},${loc.lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fallbackQuery || '')}`;
