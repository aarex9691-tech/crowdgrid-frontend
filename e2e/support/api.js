/**
 * Talks to the backend directly, for set-up steps that are not the thing being
 * tested (making a fresh pilgrim, buying a pass to scan, closing a lane afterwards).
 */
const { API, SEED_PASSWORD, EVENT_SLUG } = require('./env');

const PASSWORD = 'E2eTest123'; // 8+ characters, a letter and a number

const call = async (method, path, { token, body } = {}) => {
    const res = await fetch(`${API}${path}`, {
        method,
        headers: {
            ...(body ? { 'Content-Type': 'application/json' } : {}),
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    let data;
    try {
        data = JSON.parse(text);
    } catch {
        data = text;
    }
    if (!res.ok) {
        const err = new Error(`${method} ${path} -> ${res.status}: ${(data && data.message) || text}`);
        err.status = res.status;
        err.data = data;
        throw err;
    }
    return data;
};

const get = (path, opts) => call('GET', path, opts);
const post = (path, body, opts = {}) => call('POST', path, { ...opts, body: body || {} });
const patch = (path, body, opts = {}) => call('PATCH', path, { ...opts, body: body || {} });

/** A random Indian mobile number (starts with 6) that no seeded account uses. */
const randomPhone = () => `6${String(Math.floor(Math.random() * 1e9)).padStart(9, '0')}`;

/** Names must be letters only, so the random part is letters too. */
const randomName = (first = 'Test') => {
    const letters = 'abcdefghijklmnopqrstuvwxyz';
    let s = '';
    for (let i = 0; i < 6; i++) s += letters[Math.floor(Math.random() * letters.length)];
    return `${first} ${s[0].toUpperCase()}${s.slice(1)}`;
};

/** Signs up a brand-new pilgrim through the real OTP flow. */
const newPilgrim = async (first = 'Pilgrim') => {
    const phone = randomPhone();
    const name = randomName(first);
    const otp = await post('/auth/otp', { phone, countryCode: '91' });
    const reg = await post('/auth/register', { name, phone, countryCode: '91', password: PASSWORD, otp: otp.devCode });
    return { token: reg.token, user: reg.user, phone, name: reg.user?.name || name, password: PASSWORD };
};

// Demo logins are cached per test process: the API allows 50 sign-in attempts per 15 minutes
const demoCache = new Map();
const demo = async (phone) => {
    if (!demoCache.has(phone)) {
        const r = await post('/auth/login', { identifier: phone, password: SEED_PASSWORD, countryCode: '91' });
        demoCache.set(phone, { token: r.token, user: r.user, phone });
    }
    return demoCache.get(phone);
};

let flagship;
const event = async () => {
    if (!flagship) flagship = await get(`/events/${EVENT_SLUG}`);
    return flagship;
};

const lodging = async (name, { checkIn, checkOut } = {}) => {
    const ev = await event();
    const q = new URLSearchParams({ eventId: ev._id, ...(checkIn ? { checkIn } : {}), ...(checkOut ? { checkOut } : {}) });
    const list = await get(`/lodgings?${q}`);
    const found = list.find((l) => l.name === name);
    if (!found) throw new Error(`Camp "${name}" not found. Was the test database seeded?`);
    return found;
};

const shuttle = async (name) => {
    const ev = await event();
    const list = await get(`/transit?eventId=${ev._id}`);
    const found = list.find((r) => r.name === name);
    if (!found) throw new Error(`Shuttle "${name}" not found. Was the test database seeded?`);
    return found;
};

const routePlan = async (from = 'tent-city-a', to = 'ramkund') => {
    const ev = await event();
    return get(`/route/plan?${new URLSearchParams({ eventId: ev._id, from, to })}`);
};

/** Buys a paid stay through the order + simulated payment API. */
const buyStay = async (session, camp, { beds = 1, checkIn, checkOut, guests } = {}) => {
    const order = await post(
        '/orders',
        { items: [{ kind: 'LODGING', refId: camp._id, input: { beds, guestNames: guests || Array.from({ length: beds }, (_, i) => `Guest ${'ABCDE'[i]}`), checkIn, checkOut } }] },
        { token: session.token }
    );
    return post(`/orders/${order._id}/pay`, { method: 'UPI', upiId: 'e2e@okaxis' }, { token: session.token });
};

module.exports = { PASSWORD, call, get, post, patch, randomPhone, randomName, newPilgrim, demo, event, lodging, shuttle, routePlan, buyStay };
