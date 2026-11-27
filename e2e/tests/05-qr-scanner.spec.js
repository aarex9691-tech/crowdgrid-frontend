// Cases 22-26: the live personal QR and the volunteer's scanner.
// The scanner's "type the code" box is used instead of the camera; it sends exactly
// what the camera would read. The QR text is computed from the key on the phone,
// the same way the passbook draws it.
const { test, expect } = require('@playwright/test');
const api = require('../support/api');
const ui = require('../support/ui');
const { DEMO } = require('../support/env');

const SHUTTLE = 'E-Shuttle S1';

test.describe('Live QR and scanner', () => {
    test.describe.configure({ mode: 'serial' });
    let pilgrimContext;
    let phone; // pilgrim's passbook
    let volContext;
    let scanner; // volunteer's scanner
    let pilgrim;

    test.beforeAll(async ({ browser }) => {
        pilgrim = await api.newPilgrim('Scanner');
        // A bus pass for today, so there is something to check in at the bus gate
        const bus = await api.shuttle(SHUTTLE);
        await api.post(`/transit/${bus._id}/pass`, { people: 1 }, { token: pilgrim.token });
        ({ context: pilgrimContext, page: phone } = await ui.open(browser, pilgrim));
        ({ context: volContext, page: scanner } = await ui.open(browser, await api.demo(DEMO.VOLUNTEER)));
    });
    test.afterAll(async () => {
        await pilgrimContext?.close();
        await volContext?.close();
    });

    /** Types the QR text into the scanner and returns the scan result shown. */
    const scan = async (qr) => {
        await scanner.locator('#manual').fill(qr);
        const answer = scanner.waitForResponse((r) => r.url().includes('/passes/scan'));
        await scanner.getByRole('button', { name: 'Check pass' }).click();
        return (await answer).json();
    };
    const resultBox = () => scanner.locator('[role="status"][aria-live="assertive"]').filter({ hasText: /VALID|REJECTED/ }).first();

    test('#22 QR · Open My Passbook', async () => {
        await phone.goto('/passbook');
        await expect(phone.getByText(/Live QR · changes in \d+s/)).toBeVisible();
        const img = phone.getByRole('img', { name: /Personal QR for/ });
        await expect(img).toBeVisible();
        const first = await img.getAttribute('src');
        // the picture changes when the 30-second window rolls over
        await expect.poll(() => img.getAttribute('src'), { timeout: 40_000, intervals: [1000], message: 'QR changes within 30 s' }).not.toBe(first);
    });

    test("#23 Scanner · Volunteer scans the pilgrim's QR at the bus gate", async () => {
        await scanner.goto('/scan');
        await scanner.getByRole('radio', { name: 'Bus gate' }).click();
        const r = await scan(await ui.liveQr(phone));
        expect(r.result, r.message).toBe('VALID');
        await expect(resultBox()).toContainText(/VALID/);
        await expect(resultBox()).toContainText(SHUTTLE);
    });

    test('#24 Scanner · Scan again', async () => {
        const r = await scan(await ui.liveQr(phone));
        expect(r.result).toBe('REJECTED');
        await expect(resultBox()).toContainText('REJECTED');
        await expect(resultBox()).toContainText(/already used/i);
    });

    test('#25 Scanner · Screenshot the QR, wait 2 min, scan the screenshot', async () => {
        // The code that was on the screen 2 minutes ago (a screenshot taken then)
        const screenshot = await ui.liveQr(phone, -120_000);
        const r = await scan(screenshot);
        expect(r.reason).toBe('OLD_SCREENSHOT');
        await expect(resultBox()).toContainText(/More than a minute old: probably a screenshot/i);
    });

    test('#26 Scanner · Reset the QR, scan an old copy', async () => {
        const oldCopy = await ui.liveQr(phone);
        const oldKey = await phone.evaluate(() => localStorage.getItem('cg_myqr_live'));
        await phone.getByRole('button', { name: /Reset this QR/ }).click();
        await phone.getByRole('button', { name: 'Yes, reset' }).click();
        await expect.poll(() => phone.evaluate(() => localStorage.getItem('cg_myqr_live'))).not.toBe(oldKey);

        const r = await scan(oldCopy);
        expect(r.result).toBe('REJECTED');
        await expect(resultBox()).toContainText('REJECTED');
        await expect(resultBox()).toContainText(/reset|tampered/i);
    });
});
