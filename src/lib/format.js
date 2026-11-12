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

// Categories of public events, in the order hosts and visitors see them.
// Keep in sync with crowdgrid-backend/utils/eventCategories.js.
export const EVENT_CATEGORIES = {
  SPIRITUAL: 'Spiritual',
  HERITAGE_WALK: 'Heritage walks',
  MUSIC: 'Music & concerts',
  SPORTS: 'Sports & fitness',
  FOOD: 'Food & markets',
  TECH: 'Tech & talks',
  COMEDY_THEATRE: 'Comedy & theatre',
  EXHIBITION: 'Exhibitions',
  WORKSHOP: 'Workshops',
  FESTIVAL: 'Festivals',
  KIDS: 'Kids & family',
  SEVA: 'Community & seva',
  OTHER: 'Other',
};

/** Label for any category, including older ones no longer offered to hosts. */
export const categoryLabel = (k) => EVENT_CATEGORIES[k] || { CULTURAL: 'Culture & arts' }[k] || 'Event';

/** Google Maps link for a point (opens the app on phones). */
export const googleMapsUrl = (loc, fallbackQuery) =>
  loc?.lat
    ? `https://www.google.com/maps/search/?api=1&query=${loc.lat},${loc.lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fallbackQuery || '')}`;
