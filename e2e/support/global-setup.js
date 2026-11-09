/**
 * Before the first test:
 *   1. check the settings (test database only)
 *   2. seed the TEST database (npm run seed:test), unless E2E_SKIP_SEED=1
 *   3. start the backend on the test database (unless E2E_EXTERNAL_BACKEND=1)
 * The website itself (Vite) is started by Playwright's webServer setting.
 */
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
};
