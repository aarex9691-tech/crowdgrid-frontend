/**
 * Before the first test:
 *   1. check the settings (test database only)
 *   2. seed the TEST database (npm run seed:test), unless E2E_SKIP_SEED=1
 *   3. start the backend on the test database (unless E2E_EXTERNAL_BACKEND=1)
 * The website itself (Vite) is started by Playwright's webServer setting.
 */
const http = require('http');
const { spawnSync } = require('child_process');
const env = require('./env');
const backend = require('./backend');

module.exports = async () => {
    const bad = env.problems();
    if (bad.length) throw new Error(`End-to-end tests cannot start:\n - ${bad.join('\n - ')}`);

    console.log(`[e2e] Test database: ${env.dbName(env.ENV.TEST_MONGO_URI)} · API ${env.API} · website ${env.WEB}`);

    if (process.env.E2E_SKIP_SEED !== '1') {
        console.log('[e2e] Seeding the test database (npm run seed:test)…');
        const r = spawnSync(process.execPath, ['scripts/seed.js', '--test'], {
            cwd: env.BACKEND_DIR,
            env: env.backendEnv(),
            encoding: 'utf8',
        });
        if (r.status !== 0) throw new Error(`Seeding the test database failed:\n${r.stdout}\n${r.stderr}`);
        const used = r.stdout.split('\n').find((l) => /Using database/.test(l));
        if (used) console.log(`[e2e] ${used.trim()}`);
        console.log('[e2e] Seed complete.');
    }

    if (env.EXTERNAL_BACKEND) {
        if (!(await backend.healthy())) throw new Error(`E2E_EXTERNAL_BACKEND=1 but nothing answers on ${env.API_ORIGIN}/health`);
        console.log('[e2e] Using the backend that is already running (case 28 will be skipped).');
    } else {
        console.log('[e2e] Starting the backend on the test database…');
        await backend.start();
        console.log('[e2e] Backend is up.');
    }
    await checkBackendVersion();
    const control = await startControlServer();
    // Playwright runs this when the run ends
    return async () => {
        control.close();
        await backend.stop();
    };
};

/** POST /restart stops and starts the backend from this (long-lived) process. */
function startControlServer() {
    const server = http.createServer(async (req, res) => {
        if (req.method !== 'POST' || req.url !== '/restart' || env.EXTERNAL_BACKEND) {
            res.writeHead(404).end();
            return;
        }
        try {
            await backend.restart();
            res.writeHead(200).end('restarted');
        } catch (e) {
            res.writeHead(500).end(String(e.message || e));
        }
    });
    return new Promise((resolve, reject) => {
        server.once('error', reject);
        server.listen(env.CONTROL_PORT, '127.0.0.1', () => resolve(server));
    });
}

/**
 * Stops early, with a plain message, when crowdgrid-backend is older than the
 * November fixes (no sign-up code route) or the demo accounts don't use SEED_PASSWORD.
 * Otherwise nearly every case fails with confusing 404 / 401 errors.
 */
async function checkBackendVersion() {
    const post = (path, body) =>
        fetch(`${env.API}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(async (r) => ({ status: r.status, body: await r.text() }));
    const stop = async (msg) => {
        await backend.stop();
        throw new Error(`\n\n${msg}\n`);
    };
    const otp = await post('/auth/otp', { phone: '1', countryCode: '91' }); // invalid number: no code is created
    if (otp.status === 404) {
        await stop(
            'Your crowdgrid-backend folder is older than the November fixes (it has no sign-up code step).\n' +
                `Update it, then run the tests again:\n  cd "${env.BACKEND_DIR}"\n  git checkout main\n  git pull origin main\n  npm install`
        );
    }
    const login = await post('/auth/login', { identifier: env.DEMO.AUTHORITY, password: env.SEED_PASSWORD, countryCode: '91' });
    if (login.status === 401) {
        await stop(
            `The demo account ${env.DEMO.AUTHORITY} does not accept SEED_PASSWORD from crowdgrid-backend/.env after seeding the test database.\n` +
                'Check SEED_PASSWORD in .env (8+ characters, a letter and a number), and that the backend is up to date (git pull origin main).'
        );
    }
}
