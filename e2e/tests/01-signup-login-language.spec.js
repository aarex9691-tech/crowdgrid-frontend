// Cases 1-7: sign-up with the phone code, demo logins, Hindi and Marathi.
const { test, expect } = require('@playwright/test');
const api = require('../support/api');
const ui = require('../support/ui');
const { DEMO, SEED_PASSWORD } = require('../support/env');

test.describe('Sign-up', () => {
    test.describe.configure({ mode: 'serial' });
    let context;
    let page;
    const phone = api.randomPhone();
    const name = api.randomName('Signup');
    let code;

    test.beforeAll(async ({ browser }) => {
        ({ context, page } = await ui.open(browser));
    });
    test.afterAll(async () => context?.close());

    test('#01 Sign-up · Create account without sending a code', async () => {
        await page.goto('/register');
        await page.locator('#name').fill(name);
        await page.locator('#phone').fill(phone);
        await page.locator('#password').fill(api.PASSWORD);
        await page.getByRole('button', { name: 'Create account' }).click();
        await expect(page.getByText(/verify your mobile number first/i)).toBeVisible();
        expect(page.url()).toContain('/register');
    });

    test('#02 Sign-up · Tap Send code', async () => {
        await page.getByRole('button', { name: /Send code to verify this number/ }).click();
        const notice = page.getByText(/Code:\s*\d{6}/);
        await expect(notice).toBeVisible();
        code = /Code:\s*(\d{6})/.exec(await notice.textContent())[1];
        expect(code).toMatch(/^\d{6}$/);
    });

    test('#03 Sign-up · Enter a wrong code', async () => {
        const wrong = code === '000000' ? '111111' : '000000';
        await page.locator('#otp').fill(wrong);
        await page.getByRole('button', { name: 'Create account' }).click();
        await expect(page.getByText(/That code is not right/)).toBeVisible();
    });

    test('#04 Sign-up · Enter the right code', async () => {
        await page.locator('#otp').fill(code);
        await page.getByRole('button', { name: 'Create account' }).click();
        await expect(page).not.toHaveURL(/\/register/);
        const role = await page.evaluate(() => JSON.parse(localStorage.getItem('cg_user') || 'null')?.role);
        expect(role).toBe('USER');
        await expect(page.getByRole('link', { name: 'My Passbook' }).first()).toBeVisible();
    });
});

test('#05 Login · Log in as each demo role', async ({ browser }) => {
    const roles = [
        { phone: DEMO.SUPER_ADMIN, path: '/control', heading: /District control room/ },
        { phone: DEMO.AUTHORITY, path: '/control', heading: /District control room/ },
        { phone: DEMO.NGO_ADMIN, path: '/ngo', heading: /Shri Ram Seva Trust/ },
        { phone: DEMO.CORPORATE_ADMIN, path: '/corporate-admin', heading: /My campus & corporate events/ },
        { phone: DEMO.VOLUNTEER, path: '/scan', heading: /Pass scanner/ },
        { phone: DEMO.PILGRIM, path: '/', role: 'USER' },
        { phone: DEMO.PILGRIM2, path: '/', role: 'USER' },
    ];
    for (const r of roles) {
        const { context, page } = await ui.open(browser);
        await page.goto('/login');
        await page.locator('#identifier').fill(r.phone);
        await page.locator('#password').fill(SEED_PASSWORD);
        await page.locator('form').getByRole('button', { name: 'Log in' }).click();
        await expect.soft(page, `${r.phone} lands on ${r.path}`).toHaveURL(new RegExp(`${r.path.replace(/\//g, '\\/')}$`));
        if (r.heading) await expect.soft(page.getByRole('heading', { level: 1, name: r.heading }), `${r.phone} sees its home page`).toBeVisible();
        if (r.role) {
            await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('cg_user') || 'null')?.role), { message: `${r.phone} is a pilgrim` }).toBe(r.role);
        }
        await context.close();
    }
});

// The header picker; after switching, its own label is in the new language, so find it by its options
const languagePicker = (page) => page.locator('select:visible:has(option[value="mr"])').first();

test('#06 Language · Header picker: Hindi, open the Simhastha page', async ({ browser }) => {
    const { context, page } = await ui.open(browser);
    await page.goto('/');
    await languagePicker(page).selectOption('hi');
    await page.goto(ui.yatra());
    await expect(page.getByRole('tab', { name: 'ठहरने की जगह और शिविर' })).toBeVisible();
    // every service tab is in Hindi (Devanagari script)
    for (const tab of await page.getByRole('tab').all()) await expect.soft(tab).toHaveText(/[ऀ-ॿ]/);
    await expect(page.getByTestId('tab-hint')).toHaveText(/[ऀ-ॿ]/);
    await expect(page.getByTestId('tab-hint')).not.toContainText('Book a bed');
    await expect(page.getByRole('button', { name: 'बिस्तर बुक करें' }).first()).toBeVisible();
    await context.close();
});

test('#07 Language · Switch to Marathi and refresh', async ({ browser }) => {
    const { context, page } = await ui.open(browser);
    await page.goto(ui.yatra());
    await languagePicker(page).selectOption('mr');
    await page.reload();
    await expect(languagePicker(page)).toHaveValue('mr');
    await expect(page.getByRole('tab', { name: 'निवास आणि शिबिरे' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'बेड बुक करा' }).first()).toBeVisible();
    await context.close();
});
