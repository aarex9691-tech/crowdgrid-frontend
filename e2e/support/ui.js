/**
 * Browser helpers: open a page (optionally already logged in), dates in India time,
 * and the live personal QR exactly as the phone computes it.
 */
const { EVENT_SLUG } = require('./env');

/** Skips the Namaste intro and the guided tour, which would cover the page. */
const quietIntro = () => {
    try {
        sessionStorage.setItem('cg_intro_seen', '1');
        localStorage.setItem('cg_tour_done', '1');
    } catch {
        /* about:blank has no storage */
    }
};

/** Logs the tab in once (a later "Log out" in the same tab sticks). */
const seedLogin = ({ token, user }) => {
    try {
        if (sessionStorage.getItem('e2e_login_done')) return;
        localStorage.setItem('cg_token', token);
        localStorage.setItem('cg_user', JSON.stringify(user));
        sessionStorage.setItem('e2e_login_done', '1');
    } catch {
        /* about:blank has no storage */
    }
};

/**
 * New browser window. `session` = { token, user } from api.newPilgrim() / api.demo()
 * to start logged in; leave it out for a visitor who is not logged in.
 */
const open = async (browser, session, options = {}) => {
    const context = await browser.newContext(options);
    await context.addInitScript(quietIntro);
    if (session) await context.addInitScript(seedLogin, { token: session.token, user: session.user });
    const page = await context.newPage();
    return { context, page };
};

const yatra = (tab) => `/yatra/${EVENT_SLUG}${tab ? `?tab=${tab}` : ''}`;

// ---- dates (India time, YYYY-MM-DD like the app) ----
const istToday = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
const addDays = (day, n) => {
    const d = new Date(`${day}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() + n);
    return d.toISOString().slice(0, 10);
};

/** First number in a text ("1,234 beds free" -> 1234); 0 when the text says sold out / full. */
const firstNumber = (text) => {
    if (/sold out|full for/i.test(text)) return 0;
    const m = /(\d[\d,]*)/.exec(text);
    return m ? Number(m[1].replace(/,/g, '')) : NaN;
};

/**
 * The live personal QR text the passbook shows, computed from the key the phone
 * keeps in localStorage (same maths as components/MyQrCard.jsx). offsetMs = -120000
 * gives the code that was on screen 2 minutes ago, i.e. an old screenshot.
 */
const liveQr = async (page, offsetMs = 0) => {
    await page.waitForFunction(() => !!localStorage.getItem('cg_myqr_live'));
    return page.evaluate(async (offset) => {
        const live = JSON.parse(localStorage.getItem('cg_myqr_live'));
        const step = Math.floor((Date.now() + offset) / 1000 / live.periodS);
        const enc = new TextEncoder();
        const key = await crypto.subtle.importKey('raw', enc.encode(live.key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
        const sig = new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(String(step))));
        let s = '';
        for (const b of sig) s += String.fromCharCode(b);
        const code = btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '').slice(0, 16);
        return `CGL.${live.userId}.${step}.${code}`;
    }, offsetMs);
};

/** A tiny real PNG (1x1 pixel) for the missing-person photo. */
const PNG_1PX = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');

module.exports = { open, yatra, istToday, addDays, firstNumber, liveQr, PNG_1PX };
