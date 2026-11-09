/**
 * Starts, stops and restarts the backend used by the end-to-end tests.
 * It runs `node server.js` from crowdgrid-backend with MONGO_URI set to the test
 * database, on its own port (5055 by default). The process id is kept in
 * e2e/.state/backend.pid so the restart test (case 28) and the teardown can find it.
 */
const fs = require('fs');
const path = require('path');
const { spawn, spawnSync } = require('child_process');
const { BACKEND_DIR, STATE_DIR, API_ORIGIN, backendEnv } = require('./env');

const PID_FILE = path.join(STATE_DIR, 'backend.pid');
const LOG_FILE = path.join(STATE_DIR, 'backend.log');
const isWin = process.platform === 'win32';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const healthy = async () => {
    try {
        const res = await fetch(`${API_ORIGIN}/health`, { signal: AbortSignal.timeout(2000) });
        return res.ok;
    } catch {
        return false;
    }
};

const waitFor = async (want, timeoutMs, what) => {
    const until = Date.now() + timeoutMs;
    while (Date.now() < until) {
        if ((await healthy()) === want) return;
        await sleep(500);
    }
    const tail = fs.existsSync(LOG_FILE) ? fs.readFileSync(LOG_FILE, 'utf8').split('\n').slice(-25).join('\n') : '';
    throw new Error(`Backend did not ${what} within ${Math.round(timeoutMs / 1000)} s.\nLast lines of ${LOG_FILE}:\n${tail}`);
};

const start = async () => {
    fs.mkdirSync(STATE_DIR, { recursive: true });
    if (await healthy()) {
        throw new Error(`Something is already answering on ${API_ORIGIN}. Stop it (or a previous test run), or set E2E_API_PORT to a free port.`);
    }
    const log = fs.openSync(LOG_FILE, 'a');
    fs.writeSync(log, `\n---- backend start ${new Date().toISOString()} ----\n`);
    const child = spawn(process.execPath, ['server.js'], {
        cwd: BACKEND_DIR,
        env: backendEnv(),
        stdio: ['ignore', log, log],
        detached: !isWin, // own process group, so the whole tree can be stopped
        windowsHide: true,
    });
    child.unref();
    fs.writeFileSync(PID_FILE, String(child.pid));
    // Atlas can take a while to connect on a cold start
    await waitFor(true, 90000, 'start');
    return child.pid;
};

const stop = async () => {
    if (!fs.existsSync(PID_FILE)) return;
    const pid = Number(fs.readFileSync(PID_FILE, 'utf8'));
    fs.rmSync(PID_FILE, { force: true });
    if (!pid) return;
    try {
        if (isWin) spawnSync('taskkill', ['/pid', String(pid), '/T', '/F'], { stdio: 'ignore' });
        else process.kill(-pid, 'SIGTERM');
    } catch {
        /* already gone */
    }
    await waitFor(false, 20000, 'stop');
};

/** Case 28: Ctrl+C and npm run dev again. */
const restart = async () => {
    await stop();
    return start();
};

const managed = () => fs.existsSync(PID_FILE);

module.exports = { start, stop, restart, healthy, managed, LOG_FILE };
