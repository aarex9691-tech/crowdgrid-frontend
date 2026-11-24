// Cases 8-14: beds are counted night by night, 5 per person per night, stays up to 7 nights.
const { test, expect } = require('@playwright/test');
const api = require('../support/api');
const ui = require('../support/ui');
const { DEMO } = require('../support/env');

const CAMP = 'Panchavati Tent City - Block A'; // free camp of Shri Ram Seva Trust (NGO admin 9000000003)
const SOLD_OUT_CAMP = 'Tapovan Free Seva Camp';
const TONIGHT_GUESTS = ['Tonight Guest Alpha', 'Tonight Guest Bravo', 'Tonight Guest Charlie', 'Tonight Guest Delta', 'Tonight Guest Echo'];
const TOMORROW_GUESTS = ['Second Night Alpha', 'Second Night Bravo', 'Second Night Charlie', 'Second Night Delta', 'Second Night Echo'];

const campCard = (page, name) => page.locator('li.panel').filter({ has: page.getByRole('heading', { name, exact: true }) });
// availability pill (amenities use pill-quiet, so they are not picked up)
const bedsFree = async (card) => ui.firstNumber((await card.locator('.pill-ok, .pill-low, .pill-out').first().textContent()) || '');

/** Opens the camp's booking form, sets the number of beds and guest names, and submits. */
const book = async (page, camp, guests) => {
    const card = campCard(page, camp);
    await card.getByRole('button', { name: 'Book beds' }).click();
    for (let i = 1; i < guests.length; i++) await card.getByRole('button', { name: 'One bed more' }).click();
    for (let i = 0; i < guests.length; i++) await card.getByLabel(`Guest ${i + 1} full name`).fill(guests[i]);
    await card.getByRole('button', { name: new RegExp(`^Book ${guests.length} bed\\(s\\)`) }).click();
};

test.describe('Lodging', () => {
    test.describe.configure({ mode: 'serial' });
    let context;
    let page;
    let pilgrim;
    let campId;
    const tonight = ui.istToday(); // Simhastha has started, so the first bookable night is tonight
    const tomorrow = ui.addDays(tonight, 1);

    test.beforeAll(async ({ browser }) => {
        pilgrim = await api.newPilgrim('Lodging');
        campId = (await api.lodging(CAMP))._id;
        ({ context, page } = await ui.open(browser, pilgrim));
    });
    test.afterAll(async () => context?.close());

    test('#08 Lodging · Book 5 beds at a free camp for tonight', async () => {
        await page.goto(ui.yatra('lodging'));
        await expect(page.locator('#stay-in')).toHaveValue(tonight);
        const booked = page.waitForResponse((r) => r.url().includes(`/lodgings/${campId}/book`) && r.request().method() === 'POST');
        await book(page, CAMP, TONIGHT_GUESTS);
        const res = await booked;
        expect(res.ok(), await res.text()).toBeTruthy();
        const data = await res.json();
        expect(data.pass.details.bedNumbers).toHaveLength(5);
        // "Booking confirmed: <tent and bed numbers>"
        await expect(page.getByText(/Booking confirmed: .*Bed/)).toBeVisible();

        // QR in the passbook: the stay is listed, and the personal QR is there
        await page.goto('/passbook');
        await expect(page.getByRole('heading', { name: CAMP }).first()).toBeVisible();
        await expect(page.getByRole('img', { name: /Personal QR for/ })).toBeVisible();
    });

    test('#09 Lodging · Try 1 more bed tonight', async () => {
        await page.goto(ui.yatra('lodging'));
        await book(page, CAMP, ['One More Guest']);
        await expect(page.getByText(/Limit is 5 beds per person on any night/)).toBeVisible();
    });

    test('#10 Lodging · Change check-in to tomorrow', async () => {
        await page.goto(ui.yatra('lodging'));
        const card = campCard(page, CAMP);
        await expect(card).toBeVisible();
        const tonightFree = await bedsFree(card);
        await page.locator('#stay-in').fill(tomorrow);
        await expect.poll(() => bedsFree(card), { message: 'tomorrow shows the 5 beds booked tonight as free' }).toBe(tonightFree + 5);
    });

    test('#11 Lodging · Book 5 beds for tomorrow', async () => {
        await expect(page.locator('#stay-in')).toHaveValue(tomorrow);
        await book(page, CAMP, TOMORROW_GUESTS);
        await expect(page.getByText(/Booking confirmed/)).toBeVisible();
    });

    test('#12 Lodging · Pick a check-out over 7 nights away', async () => {
        await page.goto(ui.yatra('lodging'));
        const checkIn = ui.addDays(tonight, 3);
        await page.locator('#stay-in').fill(checkIn);
        await expect(page.locator('#stay-out')).toHaveAttribute('max', ui.addDays(checkIn, 7));
        // the server refuses a longer stay too, even if someone gets round the date picker
        const err = await api
            .post(`/lodgings/${campId}/book`, { beds: 1, guestNames: ['Long Stay'], checkIn, checkOut: ui.addDays(checkIn, 8) }, { token: pilgrim.token })
            .catch((e) => e);
        expect(err.status).toBe(400);
        expect(err.message).toMatch(/7 nights/);
    });

    test('#13 Lodging · Look at Tapovan Free Seva Camp', async () => {
        await page.goto(ui.yatra('lodging'));
        const card = campCard(page, SOLD_OUT_CAMP);
        await expect(card.getByText('Sold out for these dates')).toBeVisible();
        await expect(card.getByRole('button', { name: 'Book beds' })).toBeDisabled();
    });

    test('#14 Lodging · NGO admin: tent map, switch "Night of"', async ({ browser }) => {
        const ngo = await api.demo(DEMO.NGO_ADMIN);
        const { context: ngoContext, page: map } = await ui.open(browser, ngo);
        try {
            await map.goto(`/camps/${campId}/map`);
            const night = map.locator('#map-night');
            const seat = (guest) => map.getByRole('button', { name: new RegExp(guest) });

            await night.fill(tonight);
            await expect(seat(TONIGHT_GUESTS[0])).toBeVisible();
            await expect(seat(TONIGHT_GUESTS[4])).toBeVisible();
            await expect(seat(TOMORROW_GUESTS[0])).toHaveCount(0);

            await night.fill(tomorrow);
            await expect(seat(TOMORROW_GUESTS[0])).toBeVisible();
            await expect(seat(TONIGHT_GUESTS[0])).toHaveCount(0);

            await night.fill(ui.addDays(tonight, 2));
            await expect(seat(TONIGHT_GUESTS[0])).toHaveCount(0);
            await expect(seat(TOMORROW_GUESTS[0])).toHaveCount(0);
        } finally {
            await ngoContext.close();
        }
    });
});
