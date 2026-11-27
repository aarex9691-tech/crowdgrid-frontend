/*
 * Search suggestions for the header search box.
 * Matches the same fields as the Events page filter (title, tagline, venue, city, description),
 * and ranks the closest matches first so that typing "mel" puts "Kumbh Mela" at the top.
 */

const FIELDS = ['title', 'tagline', 'venue', 'city', 'description'];
const norm = (s) => String(s || '').toLowerCase();

/** How well an event matches the text typed (higher is better), or 0 for no match. */
export function matchScore(event, query) {
  const q = norm(query).trim();
  if (!q) return 0;
  const title = norm(event.title);
  if (title.startsWith(q)) return 5;
  if (title.split(/[\s,–-]+/).some((w) => w.startsWith(q))) return 4;
  if (title.includes(q)) return 3;
  if (norm(event.city).includes(q) || norm(event.venue).includes(q)) return 2;
  return FIELDS.some((f) => norm(event[f]).includes(q)) ? 1 : 0;
}

/** Yatras and public events that are not over yet, best matches first (at most `limit`). */
export function suggestEvents(events, query, { limit = 6, now = Date.now() } = {}) {
  if (!norm(query).trim()) return [];
  return (events || [])
    .filter((e) => (e.kind === 'YATRA' || e.kind === 'PUBLIC') && new Date(e.endDate || e.startDate).getTime() >= now)
    .map((e) => ({ e, score: matchScore(e, query) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || (b.e.isFlagship ? 1 : 0) - (a.e.isFlagship ? 1 : 0) || new Date(a.e.startDate) - new Date(b.e.startDate))
    .slice(0, limit)
    .map((r) => r.e);
}

/** Where a suggestion leads: yatras to their hub, public events to their page. */
export const eventPath = (e) => (e.kind === 'YATRA' ? `/yatra/${e.slug}` : `/event/${e.slug}`);

/** Splits text around the first match so the matched letters can be shown in bold. */
export function splitMatch(text, query) {
  const s = String(text || '');
  const q = norm(query).trim();
  const i = q ? s.toLowerCase().indexOf(q) : -1;
  if (i < 0) return [s, '', ''];
  return [s.slice(0, i), s.slice(i, i + q.length), s.slice(i + q.length)];
}
