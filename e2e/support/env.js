/**
 * Settings shared by the Playwright config, global setup and every test.
 *
 * The suite reads crowdgrid-backend/.env (the same file the team already has) and
 * always runs against the TEST database (TEST_MONGO_URI, name ending in _test),
 * never the shared demo database. Nothing here is written to disk.
 */
const fs = require('fs');
const path = require('path');

const BACKEND_DIR = path.resolve(process.env.CROWDGRID_BACKEND_DIR || path.join(__dirname, '..', '..', '..', 'crowdgrid-backend'));
const FRONTEND_DIR = path.resolve(__dirname, '..', '..');
const STATE_DIR = path.join(__dirname, '..', '.state');

/** Minimal .env reader (KEY=value, # comments, optional quotes). */
const readEnvFile = (file) => {
    if (!fs.existsSync(file)) return {};
    const out = {};
    for (const raw of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
        const line = raw.trim();
        if (!line || line.startsWith('#')) continue;
        const eq = line.indexOf('=');
        if (eq < 1) continue;
        const key = line.slice(0, eq).trim();
        let value = line.slice(eq + 1).trim();
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
        out[key] = value;
    }
    return out;
};

// Real environment variables win over the file (same rule as dotenv)
const fileEnv = readEnvFile(path.join(BACKEND_DIR, '.env'));
const ENV = { ...fileEnv, ...process.env };

const dbName = (uri = '') => {
    const m = /^mongodb(?:\+srv)?:\/\/[^/]+\/([^?]*)/.exec(uri);
    return (m && decodeURIComponent(m[1])) || 'test';
};

const API_PORT = Number(process.env.E2E_API_PORT || 5055); // not 5000, so a dev backend can keep running
const WEB_PORT = Number(process.env.E2E_WEB_PORT || 5174); // not 5173, same reason
const API_ORIGIN = process.env.E2E_API_ORIGIN || `http://localhost:${API_PORT}`;
const API = `${API_ORIGIN}/api`;
const WEB = process.env.E2E_BASE_URL || `http://localhost:${WEB_PORT}`;
const EXTERNAL_BACKEND = process.env.E2E_EXTERNAL_BACKEND === '1';
// Small helper server inside the main test runner: restarts the backend for case 28.
// (A backend started from a test worker dies with that worker on Windows.)
const CONTROL_PORT = Number(process.env.E2E_CONTROL_PORT || 5056);

/** Checks the settings before anything starts; returns a list of problems (empty when fine). */
const problems = () => {
    const list = [];
    if (!fs.existsSync(path.join(BACKEND_DIR, 'server.js'))) {
        list.push(`Backend not found at ${BACKEND_DIR}. Clone crowdgrid-backend next to crowdgrid-frontend, or set CROWDGRID_BACKEND_DIR.`);
        return list;
    }
    if (!fs.existsSync(path.join(BACKEND_DIR, 'node_modules'))) list.push(`Run "npm install" in ${BACKEND_DIR} first.`);
    if (!process.env.E2E_BASE_URL && !fs.existsSync(path.join(FRONTEND_DIR, 'node_modules'))) list.push(`Run "npm install" in ${FRONTEND_DIR} first.`);
    const uri = ENV.TEST_MONGO_URI;
    if (!uri) list.push('TEST_MONGO_URI is missing from crowdgrid-backend/.env (the address ending in /crowdgrid_test?...).');
    else if (!/_test$/i.test(dbName(uri))) list.push(`TEST_MONGO_URI points at the database "${dbName(uri)}". End-to-end tests only run on a database ending in _test.`);
    if (!ENV.SEED_PASSWORD) list.push('SEED_PASSWORD is missing from crowdgrid-backend/.env.');
    if (!EXTERNAL_BACKEND) for (const k of ['JWT_SECRET', 'QR_SECRET']) if (!ENV[k]) list.push(`${k} is missing from crowdgrid-backend/.env.`);
    return list;
};

/** Environment for the backend process started by the tests. */
const backendEnv = () => ({
    ...ENV,
    MONGO_URI: ENV.TEST_MONGO_URI, // the server only ever sees the test database
    TEST_MONGO_URI: ENV.TEST_MONGO_URI,
    PORT: String(API_PORT),
    NODE_ENV: 'test', // quieter logs
    CLIENT_ORIGIN: WEB,
    OTP_PROVIDER: 'SIMULATED', // sign-up code shown on screen
    OTP_REQUIRED: 'true', // cases 1-4 check the code step even if your .env turns it off
});

const DEMO = {
    SUPER_ADMIN: '9000000001',
    AUTHORITY: '9000000002',
    NGO_ADMIN: '9000000003',
    CORPORATE_ADMIN: '9000000004',
    VOLUNTEER: '9000000005',
    PILGRIM: '9000000006',
    PILGRIM2: '9000000007',
};

module.exports = {
    BACKEND_DIR,
    FRONTEND_DIR,
    STATE_DIR,
    ENV,
    API,
    API_ORIGIN,
    API_PORT,
    WEB,
    WEB_PORT,
    EXTERNAL_BACKEND,
    CONTROL_PORT,
    SEED_PASSWORD: ENV.SEED_PASSWORD,
    DEMO,
    EVENT_SLUG: 'simhastha-kumbh-2027',
    problems,
    backendEnv,
    dbName,
};
