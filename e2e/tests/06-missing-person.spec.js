// Cases 27-30: missing-person photos stored in MongoDB, checked by their bytes, phones hidden.
const { test, expect } = require('@playwright/test');
const api = require('../support/api');
const ui = require('../support/ui');
const { EXTERNAL_BACKEND, CONTROL_PORT } = require('../support/env');

test.describe('Missing person', () => {
    test.describe.configure({ mode: 'serial' });
    let context;
    let page;
    const person = api.randomName('Missing'); // letters only, unique for this run

    test.beforeAll(async ({ browser }) => {
        const pilgrim = await api.newPilgrim('Reporter');
        ({ context, page } = await ui.open(browser, pilgrim));
    });
    test.afterAll(async () => context?.close());

    const fillReport = async (name, file) => {
        await page.getByRole('button', { name: 'Report a missing person' }).click();
        await page.locator('#mp-name').fill(name);
        await page.locator('#mp-age').fill('9');
        await page.locator('#mp-gender').selectOption('MALE');
        await page.locator('#mp-clothes').fill('Yellow shirt, blue shorts');
        await page.locator('#mp-last').fill('Ramkund Ghat near the steps');
        await page.locator('#mp-photo').setInputFiles(file);
        await page.getByRole('button', { name: 'Post missing person report' }).click();
    };
    const reportCard = (name) => page.locator('li.panel').filter({ has: page.getByRole('heading', { name, exact: true }) });
    const photoLoaded = (name) => page.getByRole('img', { name: `Photo of ${name}` }).evaluate((img) => img.complete && img.naturalWidth > 0);

    test('#27 Missing · Report a missing person with a photo', async () => {
        await page.goto(ui.yatra('sos'));
        await fillReport(person, { name: 'child.png', mimeType: 'image/png', buffer: ui.PNG_1PX });
        await expect(page.getByText('Report posted.')).toBeVisible();
        await expect(reportCard(person)).toBeVisible();
        await expect.poll(() => photoLoaded(person), { message: 'photo shows on the bulletin' }).toBe(true);
    });

    test('#28 Missing · Restart the backend, reload', async () => {
        test.skip(EXTERNAL_BACKEND, 'E2E_EXTERNAL_BACKEND=1: the tests did not start the backend, so they cannot restart it');
        // Ctrl+C and npm run dev again, done by the main test runner
        const res = await fetch(`http://127.0.0.1:${CONTROL_PORT}/restart`, { method: 'POST', signal: AbortSignal.timeout(110_000) });
        expect(res.status, await res.text()).toBe(200);
        await page.goto(ui.yatra('sos'));
        await page.getByRole('button', { name: 'Missing reports' }).click();
        await expect(reportCard(person)).toBeVisible();
        await expect.poll(() => photoLoaded(person), { message: 'photo still there after the restart' }).toBe(true);
    });

    test('#29 Missing · Upload a .txt renamed to .jpg', async () => {
        await page.goto(ui.yatra('sos'));
        // The browser is told it is a JPEG; only the server's check of the bytes can catch it
        await fillReport(api.randomName('Fake'), { name: 'notes.jpg', mimeType: 'image/jpeg', buffer: Buffer.from('These are my notes, not a photo.\n') });
        await expect(page.getByText(/photo must be a JPEG, PNG or WEBP/i)).toBeVisible();
        await expect(page.getByText('Report posted.')).toHaveCount(0);
    });

    test('#30 Missing · Log out, open the bulletin', async () => {
        await page.goto(ui.yatra('sos'));
        await page.getByRole('button', { name: 'Log out' }).filter({ visible: true }).first().click();
        await page.getByRole('alertdialog').getByRole('button', { name: 'Log out' }).click();
        await expect.poll(() => page.evaluate(() => localStorage.getItem('cg_token'))).toBeNull();

        await page.goto(ui.yatra('sos'));
        await page.getByRole('button', { name: 'Missing reports' }).click();
        await expect(reportCard(person)).toBeVisible();
        await expect(reportCard(person)).not.toContainText(/Call the family|Call them/);
        await expect(page.getByText(/Call the family|Call them:/)).toHaveCount(0);
        await page.getByRole('button', { name: 'Found persons' }).click();
        await expect(page.locator('li.panel').first()).toBeVisible();
        await expect(page.getByText(/Call the family|Call them:/)).toHaveCount(0);
    });
});
