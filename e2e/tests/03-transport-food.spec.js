// Cases 15-17: shuttle seats per day, meal tokens for a family, 1 token per meal.
const { test, expect } = require('@playwright/test');
const api = require('../support/api');
const ui = require('../support/ui');

const SHUTTLE = 'E-Shuttle S1';

test.describe('Transport and food', () => {
    test.describe.configure({ mode: 'serial' });
    let context;
    let page;
    let kitchen; // name of the kitchen used in cases 16-17

    test.beforeAll(async ({ browser }) => {
        const pilgrim = await api.newPilgrim('Transport');
        ({ context, page } = await ui.open(browser, pilgrim));
    });
    test.afterAll(async () => context?.close());

    test('#15 Transport · E-Shuttle S1 pass for 3 people', async () => {
        await page.goto(ui.yatra('transit'));
        const card = page.locator('li.panel').filter({ has: page.getByRole('heading', { name: SHUTTLE, exact: true }) });
        const seatsText = card.getByText(/seats left for/);
        await expect(seatsText).toBeVisible();
        const before = ui.firstNumber(await seatsText.textContent());

        await card.getByRole('button', { name: 'More people' }).click();
        await card.getByRole('button', { name: 'More people' }).click();
        await card.getByRole('button', { name: /Get boarding pass/ }).click();
        await expect(page.getByText(/Boarding pass ready .*for 3 people/)).toBeVisible();

        await page.reload();
        const after = page.locator('li.panel').filter({ has: page.getByRole('heading', { name: SHUTTLE, exact: true }) }).getByText(/seats left for/);
        await expect.poll(async () => ui.firstNumber(await after.textContent()), { message: '"Seats left" drops by 3' }).toBe(before - 3);
    });

    test('#16 Food · Claim a token for 4 people', async () => {
        await page.goto(ui.yatra('food'));
        // Tomorrow's lunch: always in the future, whatever time the tests run
        await page.getByRole('button', { name: 'Tomorrow' }).click();
        await page.getByRole('button', { name: /^Lunch/ }).click();
        for (let i = 0; i < 3; i++) await page.getByRole('button', { name: 'More people' }).click();
        await expect(page.locator('output')).toHaveText('4');

        const cards = page.locator('li.panel').filter({ has: page.getByRole('button', { name: 'Claim token for 4' }) });
        await expect(cards.first()).toBeVisible();
        const card = cards.first();
        kitchen = (await card.getByRole('heading').textContent()).trim();
        const remaining = async (c) => Number(/Remaining passes\s*(\d+)/.exec(await c.textContent())[1]);
        const before = await remaining(card);

        await card.getByRole('button', { name: 'Claim token for 4' }).click();
        await expect(page.getByText(/Meal token ready/)).toBeVisible();
        await expect(page.getByRole('img', { name: /QR for/ })).toHaveCount(1); // one QR for the whole family
        await expect(page.getByText(/Serve 4 plates|x 4/).first()).toBeVisible();

        await page.getByRole('button', { name: 'Back to kitchens' }).click();
        const again = page.locator('li.panel').filter({ has: page.getByRole('heading', { name: kitchen, exact: true }) });
        await expect.poll(() => remaining(again), { message: 'plates left drop by 4' }).toBe(before - 4);
    });

    test('#17 Food · Claim the same meal again', async () => {
        const card = page.locator('li.panel').filter({ has: page.getByRole('heading', { name: kitchen, exact: true }) });
        const answer = page.waitForResponse((r) => /\/food\/slots\/[^/]+\/claim/.test(r.url()));
        await card.getByRole('button', { name: 'Claim token for 4' }).click();
        const res = await answer;
        const body = await res.text();
        expect(res.status(), `server answer to a second claim: ${body}`).toBe(409);
        expect(body).toMatch(/limit 1 per meal/i);
        await expect(page.getByText(/limit 1 per meal/i)).toBeVisible();
    });
});
