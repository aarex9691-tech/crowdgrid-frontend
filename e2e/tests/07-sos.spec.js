// Cases 31-32: an SOS reaches the control room live, and the pilgrim sees staff respond.
const { test, expect } = require('@playwright/test');
const api = require('../support/api');
const ui = require('../support/ui');
const { DEMO } = require('../support/env');

test.describe('SOS', () => {
    test.describe.configure({ mode: 'serial' });
    let pilgrim;
    let pilgrimContext;
    let phone;
    let controlContext;
    let control;
    const alertRow = () => control.locator('section[aria-labelledby="sos-q"] li').filter({ hasText: pilgrim.name });

    test.beforeAll(async ({ browser }) => {
        pilgrim = await api.newPilgrim('Sos');
        // No GPS for this pilgrim: an SOS with a location would also re-plan walking routes (cases 33-36)
        ({ context: pilgrimContext, page: phone } = await ui.open(browser, pilgrim));
        ({ context: controlContext, page: control } = await ui.open(browser, await api.demo(DEMO.AUTHORITY)));
    });
    test.afterAll(async () => {
        await pilgrimContext?.close();
        await controlContext?.close();
    });

    test('#31 SOS · Tap SOS (Medical)', async () => {
        await control.goto('/control');
        await expect(control.getByRole('heading', { name: /SOS alerts/ })).toBeVisible();
        await expect(alertRow()).toHaveCount(0);

        await phone.goto(ui.yatra('sos'));
        await phone.getByRole('button', { name: 'SOS', exact: true }).click();
        await expect(phone.getByText(/Alert sent to the control room/)).toBeVisible();

        // No reload on the control room: it must arrive over the live connection
        await expect(alertRow()).toBeVisible({ timeout: 10_000 });
        await expect(alertRow()).toContainText('open');
        await expect(control.getByText(/New .*SOS alert/)).toBeVisible();
    });

    test('#32 SOS · Authority acknowledges, then resolves', async () => {
        await alertRow().getByRole('button', { name: 'Acknowledge' }).click();
        await expect(phone.getByText('Help is on the way', { exact: true })).toBeVisible({ timeout: 10_000 });
        await expect(alertRow()).toContainText('acknowledged');

        await alertRow().getByRole('button', { name: 'Mark resolved' }).click();
        await expect(phone.getByText('SOS resolved', { exact: true })).toBeVisible({ timeout: 10_000 });
        await expect(alertRow()).toContainText('resolved');
    });
});
