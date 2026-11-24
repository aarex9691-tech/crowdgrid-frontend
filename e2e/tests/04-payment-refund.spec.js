// Cases 18-21: paid camp checkout, simulated UPI, refund on cancellation.
const { test, expect } = require('@playwright/test');
const api = require('../support/api');
const ui = require('../support/ui');

const PAID_CAMP = 'Ramkund Dharamshala'; // ₹100 per bed per night
const REFUND_CAMP = 'Kushavarta Pilgrim Shelter'; // ₹50 per bed per night

test.describe('Payment and refund', () => {
    test.describe.configure({ mode: 'serial' });
    let context;
    let page;
    let pilgrim;
    let price;
    const today = ui.istToday();

    test.beforeAll(async ({ browser }) => {
        pilgrim = await api.newPilgrim('Payment');
        price = (await api.lodging(PAID_CAMP)).pricePerNight;
        ({ context, page } = await ui.open(browser, pilgrim));
    });
    test.afterAll(async () => context?.close());

    test('#18 Payment · Paid camp, 2 beds x 2 nights, go to Checkout', async () => {
        await page.goto(ui.yatra('lodging'));
        await page.locator('#stay-in').fill(today);
        await page.locator('#stay-out').fill(ui.addDays(today, 2)); // check-out day 3 = 2 nights
        const card = page.locator('li.panel').filter({ has: page.getByRole('heading', { name: PAID_CAMP, exact: true }) });
        await card.getByRole('button', { name: 'Choose beds' }).click();
        await card.getByRole('button', { name: 'One bed more' }).click();
        await card.getByLabel('Guest 1 full name').fill('Paying Guest Alpha');
        await card.getByLabel('Guest 2 full name').fill('Paying Guest Bravo');
        const expected = `₹${(price * 2 * 2).toLocaleString('en-IN')}`;
        await card.getByRole('button', { name: `Add to cart · ${expected}` }).click();
        await expect(page.getByText(/is in your cart/)).toBeVisible();

        await page.goto('/checkout');
        await page.getByRole('button', { name: 'Continue to payment' }).click();
        const total = page.locator('div').filter({ has: page.getByText('To pay', { exact: true }) }).last();
        await expect(total).toContainText(expected);
        await expect(page.getByText(/Please pay by \d{1,2}:\d{2}/)).toBeVisible();
    });

    test('#19 Payment · Pay with fail@upi', async () => {
        await page.locator('#upi').fill('fail@upi');
        await page.getByRole('button', { name: /^Pay ₹/ }).click();
        await expect(page.getByText(/declined/i)).toBeVisible();
    });

    test('#20 Payment · Pay with test@okaxis', async () => {
        await page.locator('#upi').fill('test@okaxis');
        await page.getByRole('button', { name: /^Pay ₹/ }).click();
        await expect(page.getByText('Payment successful')).toBeVisible();
        await expect(page.getByRole('img', { name: new RegExp(`QR for ${PAID_CAMP}`) })).toBeVisible();

        await page.goto('/passbook');
        await expect(page.getByRole('heading', { name: PAID_CAMP }).first()).toBeVisible();
        await expect(page.getByRole('img', { name: /Personal QR for/ })).toBeVisible();
    });

    test('#21 Refund · Cancel a stay 3+ days ahead from the passbook', async () => {
        // A paid stay 4 days from now (more than 48 hours ahead = full refund), bought through the API
        const camp = await api.lodging(REFUND_CAMP);
        await api.buyStay(pilgrim, camp, { beds: 1, checkIn: ui.addDays(today, 4), checkOut: ui.addDays(today, 5) });

        await page.goto('/passbook');
        const pass = page.locator('article').filter({ has: page.getByRole('heading', { name: REFUND_CAMP }) });
        await pass.getByRole('button', { name: 'Cancel this stay' }).click();
        const dialog = page.getByTestId('cancel-dialog');
        await expect(dialog.getByText('Refund (100%)')).toBeVisible();
        await expect(dialog.getByTestId('refund-amount')).toHaveText(`₹${camp.pricePerNight}`);
        await dialog.getByRole('button', { name: /Cancel and refund/ }).click();
        await expect(page.getByText(/Cancelled\. ₹\d+ \(100%\)/)).toBeVisible();
    });
});
