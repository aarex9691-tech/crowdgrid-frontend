#!/usr/bin/env node
/**
 * Every automated check in the November handover doc, in one command:
 *
 *   cd crowdgrid-frontend/e2e
 *   npm run all                 # everything
 *   npm run all -- --no-db      # only the checks that need no database (unit, benchmark, lint, build)
 *   npm run all -- --no-e2e     # everything except the browser tests
 *
 * Steps (all on the TEST database; the shared demo database is never touched):
 *   backend   test:unit, bench:route, seed:test, test:flows, test:concurrency
 *   frontend  lint, build
 *   e2e       the 39 manual cases in a real browser (Playwright)
 *
 * Writes results/all-tests.md and stops with exit code 1 if anything failed.
 */
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const env = require('./support/env');

const args = new Set(process.argv.slice(2));
const noDb = args.has('--no-db');
const noE2e = args.has('--no-e2e') || noDb;
const RESULTS = path.join(__dirname, 'results');

// What "passing" looks like, from the doc's Automated tests table
const steps = [
    { name: 'Backend unit tests', cwd: env.BACKEND_DIR, cmd: 'npm run test:unit', expect: /\b0 failed/ },
    { name: 'Route benchmark (Dijkstra vs A*)', cwd: env.BACKEND_DIR, cmd: 'npm run bench:route' },
    { name: 'Seed the test database', cwd: env.BACKEND_DIR, cmd: 'npm run seed:test', db: true, expect: /Seed complete|Lodgings:/ },
    { name: 'Flow tests', cwd: env.BACKEND_DIR, cmd: 'npm run test:flows', db: true, expect: /All checks passed/ },
    { name: 'Concurrency tests', cwd: env.BACKEND_DIR, cmd: 'npm run test:concurrency', db: true },
    { name: 'Frontend lint', cwd: env.FRONTEND_DIR, cmd: 'npm run lint' },
    { name: 'Frontend build', cwd: env.FRONTEND_DIR, cmd: 'npm run build' },
    { name: 'Manual cases 1-39 in the browser (Playwright)', cwd: __dirname, cmd: 'npx playwright test', e2e: true },
].filter((s) => !(noDb && s.db) && !(noE2e && s.e2e));

const run = (step) =>
    new Promise((resolve) => {
        const started = Date.now();
        let out = '';
        const child = spawn(step.cmd, {
            cwd: step.cwd,
            shell: true,
            // the backend scripts read .env themselves; TEST_MONGO_URI from the environment wins as usual
            env: { ...process.env, FORCE_COLOR: '0' },
        });
        const take = (chunk) => {
            const s = chunk.toString();
            out += s;
            process.stdout.write(s);
        };
        child.stdout.on('data', take);
        child.stderr.on('data', take);
        child.on('close', (code) => {
            const ok = code === 0 && (!step.expect || step.expect.test(out));
            resolve({ ...step, ok, code, seconds: Math.round((Date.now() - started) / 1000), tail: out.trim().split('\n').slice(-3).join(' / ') });
        });
    });

(async () => {
    if (!noDb) {
        const bad = env.problems();
        if (bad.length) {
            console.error(`Cannot run the database tests:\n - ${bad.join('\n - ')}\n(Use --no-db to run only the checks that need no database.)`);
            process.exit(1);
        }
    }
    const results = [];
    for (const step of steps) {
        console.log(`\n=== ${step.name} (${step.cmd}) ===\n`);
        results.push(await run(step));
    }

    const line = (r) => `| ${r.ok ? 'PASS' : 'FAIL'} | ${r.name} | \`${r.cmd}\` | ${r.seconds} s | ${r.tail.replace(/\|/g, '\\|').slice(0, 160)} |`;
    const failed = results.filter((r) => !r.ok);
    const stamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    const md = [
        '# CrowdGrid: all automated tests',
        '',
        `Run on ${stamp} IST · ${results.length - failed.length}/${results.length} steps passed`,
        '',
        '| Result | Step | Command | Time | Last lines |',
        '|---|---|---|---|---|',
        ...results.map(line),
        '',
        noE2e ? '' : 'Per-case results for the 39 manual cases: results/manual-cases.md (HTML report: npm run report).',
        '',
    ].join('\n');
    fs.mkdirSync(RESULTS, { recursive: true });
    fs.writeFileSync(path.join(RESULTS, 'all-tests.md'), md);

    console.log('\n================ Summary ================');
    for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}  (${r.seconds} s)`);
    console.log(`\n${results.length - failed.length}/${results.length} steps passed. Written to ${path.join(RESULTS, 'all-tests.md')}`);
    process.exit(failed.length ? 1 : 0);
})();
