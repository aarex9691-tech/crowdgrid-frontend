// Cases 37-39: role checks in the browser and account lockout.
const { test, expect } = require('@playwright/test');
const api = require('../support/api');
const ui = require('../support/ui');
const { DEMO } = require('../support/env');

test('#37 Security · Pilgrim opens /control', async ({ browser }) => {
    const { context, page } = await ui.open(browser, await api.newPilgrim('Curious'));
    await page.goto('/control');
    await expect(page.getByRole('heading', { name: /isn't available for your account/ })).toBeVisible();
    await expect(page.getByRole('heading', { name: /District control room/ })).toHaveCount(0);
    await context.close();
});

test('#38 Security · Volunteer opens a yatra page', async ({ browser }) => {
    const { context, page } = await ui.open(browser, await api.demo(DEMO.VOLUNTEER));
    await page.goto(ui.yatra('lodging'));
    await expect(page.getByText(/Booking is only for pilgrims/)).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Panchavati Tent City - Block A' })).toBeVisible(); // camps are listed…
    await expect(page.getByRole('button', { name: /^(Book beds|Choose beds)$/ })).toHaveCount(0); // …but cannot be booked

    await page.goto(ui.yatra('food'));
    await expect(page.getByRole('heading', { name: 'Godavari Langar' })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Claim/ })).toHaveCount(0);

    await page.goto(ui.yatra('transit'));
    await expect(page.getByRole('heading', { name: 'E-Shuttle S1' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Get boarding pass|Add to cart/ })).toHaveCount(0);
    await context.close();
});

test('#39 Security · 5 wrong passwords on a test account (not a demo one)', async ({ browser }) => {
    const target = await api.newPilgrim('Lockout'); // a fresh account, so no demo login gets locked
    const { context, page } = await ui.open(browser);
    await page.goto('/login');
    await page.locator('#identifier').fill(target.phone);
    for (let attempt = 1; attempt <= 5; attempt++) {
        await page.locator('#password').fill(`Wrong${attempt}pass`);
        const answer = page.waitForResponse((r) => r.url().includes('/auth/login'));
        await page.locator('form').getByRole('button', { name: 'Log in' }).click();
        const res = await answer;
        if (attempt < 5) {
            expect(res.status()).toBe(401);
            await expect(page.getByText('Invalid mobile number or password')).toBeVisible();
        }
    }
    await expect(page.getByText(/locked for 15 minutes/)).toBeVisible();

    // even the right password is refused while locked
    await page.locator('#password').fill(target.password);
    await page.locator('form').getByRole('button', { name: 'Log in' }).click();
    await expect(page.getByText(/locked for 1[45] more minutes/)).toBeVisible();
    expect(page.url()).toContain('/login');
    await context.close();
});
