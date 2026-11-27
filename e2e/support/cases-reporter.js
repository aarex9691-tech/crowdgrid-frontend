/**
 * Fills in the "Result" column of the handover doc's 39 manual cases.
 * Every test title starts with its case number ("#08 Lodging · ..."). After the run
 * this writes e2e/results/manual-cases.md and .csv and prints a short summary.
 */
const fs = require('fs');
const path = require('path');

const TOTAL = 39;
const OUT_DIR = path.join(__dirname, '..', 'results');

class CasesReporter {
    constructor() {
        this.cases = new Map();
    }

    onTestEnd(test, result) {
        const m = /^#(\d+)\s+(.*)$/.exec(test.title);
        if (!m) return;
        const n = Number(m[1]);
        const status = { passed: 'PASS', failed: 'FAIL', timedOut: 'FAIL', interrupted: 'NOT RUN', skipped: 'SKIPPED' }[result.status] || result.status;
        const err = result.error ? String(result.error.message || result.error).replace(/\u001b\[[0-9;]*m/g, '').split('\n').find((l) => l.trim()) : '';
        const skipNote = result.status === 'skipped' ? (test.annotations.find((a) => a.type === 'skip')?.description || 'skipped (an earlier case in the same area failed)') : '';
        this.cases.set(n, { n, title: m[2], status, note: (err || skipNote || '').trim().slice(0, 200) });
    }

    onEnd() {
        if (!this.cases.size) return; // e.g. --list, or the run stopped before any case
        const rows = [];
        for (let n = 1; n <= TOTAL; n++) rows.push(this.cases.get(n) || { n, title: '', status: 'NOT RUN', note: 'not part of this run' });
        const count = (s) => rows.filter((r) => r.status === s).length;
        const stamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
        const esc = (s) => String(s).replace(/\|/g, '\\|');
        const md = [
            `# CrowdGrid manual cases: automated run`,
            '',
            `Run on ${stamp} IST · ${count('PASS')} passed · ${count('FAIL')} failed · ${count('SKIPPED')} skipped · ${count('NOT RUN')} not run`,
            '',
            '| # | Case | Result | Notes |',
            '|---|------|--------|-------|',
            ...rows.map((r) => `| ${r.n} | ${esc(r.title)} | ${r.status} | ${esc(r.note)} |`),
            '',
        ].join('\n');
        const csv = ['#,Case,Result,Notes', ...rows.map((r) => [r.n, r.title, r.status, r.note].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n');
        fs.mkdirSync(OUT_DIR, { recursive: true });
        fs.writeFileSync(path.join(OUT_DIR, 'manual-cases.md'), md);
        fs.writeFileSync(path.join(OUT_DIR, 'manual-cases.csv'), csv);
        console.log(`\nManual cases: ${count('PASS')}/${TOTAL} passed, ${count('FAIL')} failed, ${count('SKIPPED') + count('NOT RUN')} not run`);
        for (const r of rows.filter((x) => x.status === 'FAIL')) console.log(`  FAIL #${r.n} ${r.title}: ${r.note}`);
        console.log(`Results table: ${path.join(OUT_DIR, 'manual-cases.md')}`);
    }

    printsToStdio() {
        return false;
    }
}

module.exports = CasesReporter;
