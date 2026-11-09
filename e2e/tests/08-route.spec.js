// Cases 33-36: safest walking route, Dijkstra vs A*, live re-planning, load-aware routing.
const { test, expect } = require('@playwright/test');
const api = require('../support/api');
const ui = require('../support/ui');
const { DEMO } = require('../support/env');

test.describe('Walking route', () => {
    test.describe.configure({ mode: 'serial' });
    let pilgrimContext;
    let walker; // a pilgrim (no login needed) on the Walk to ghat tab
    let authority;
    let closedLaneId;

    test.beforeAll(async ({ browser }) => {
        authority = await api.demo(DEMO.AUTHORITY);
        ({ context: pilgrimContext, page: walker } = await ui.open(browser));
    });
    test.afterAll(async () => {
        // put the lane back so the demo map is unchanged
        if (closedLaneId) await api.patch(`/route/lanes/${closedLaneId}`, { status: 'NORMAL', note: '' }, { token: authority.token }).catch(() => {});
        await pilgrimContext?.close();
    });

    test('#33 Route · Tent City Block A to Ramkund', async () => {
        await walker.goto(ui.yatra('route'));
        await expect(walker.locator('#rt-from')).toHaveValue('tent-city-a');
        await expect(walker.getByRole('button', { name: /Ramkund/, pressed: true })).toBeVisible();
        await expect(walker.getByText('Safest route (recommended)')).toBeVisible();
        // Shortest route is its own card, unless the safest one is also the shortest
        await expect(walker.getByText('Shortest route', { exact: true }).or(walker.getByText(/also the shortest/)).first()).toBeVisible();
        // both routes are drawn on the map
        await expect.poll(() => walker.locator('.leaflet-overlay-pane path').count()).toBeGreaterThan(0);
    });

    test('#34 Route · Open "How the route was worked out"', async () => {
        await walker.getByText('How the route was worked out').click();
        await expect(walker.getByText(/Dijkstra's algorithm checked \d+ junctions/)).toBeVisible();
        await expect(walker.getByText(/A\* search .* checked \d+ junctions/)).toBeVisible();
        await expect(walker.getByText('Both found the same best route.')).toBeVisible();
    });

    test('#35 Route · Authority closes a lane on that route', async ({ browser }) => {
        const plan = await api.routePlan('tent-city-a', 'ramkund');
        const lane = plan.safest.lanes[Math.floor(plan.safest.lanes.length / 2)];
        closedLaneId = lane.id;

        const { context, page: control } = await ui.open(browser, authority);
        try {
            await control.goto('/control');
            const panel = control.locator('section[aria-labelledby="lanes"]');
            const list = panel.getByRole('list', { name: 'Lanes, most restricted first' });
            await list.getByRole('button').filter({ has: control.getByText(lane.name, { exact: true }) }).first().click();
            await panel.getByRole('radio', { name: 'Closed' }).check({ force: true });
            await panel.getByRole('button', { name: 'Save', exact: true }).click();
            await expect(panel.getByText(/marked closed/)).toBeVisible();
        } finally {
            await context.close();
        }

        // The pilgrim's open map re-plans by itself (no reload)
        await expect(walker.getByText(/Conditions changed on the way, so your safest route has been updated/)).toBeVisible({ timeout: 20_000 });
        const after = await api.routePlan('tent-city-a', 'ramkund');
        expect(after.safest.lanes.map((l) => l.id)).not.toContain(lane.id);
    });

    test('#36 Route · Refresh the route about 50 times, open the lane panel', async ({ browser }) => {
        // put the closed lane back first, so routes can use it again
        await api.patch(`/route/lanes/${closedLaneId}`, { status: 'NORMAL', note: '' }, { token: authority.token });
        closedLaneId = null;
        for (let i = 0; i < 50; i++) await api.routePlan('tent-city-a', 'ramkund');

        const { context, page: control } = await ui.open(browser, authority);
        try {
            await control.goto('/control');
            const list = control.getByRole('list', { name: 'Lanes, most restricted first' });
            await expect(list.getByText(/\d+ routed here recently/).first()).toBeVisible();
            const counts = (await list.getByText(/\d+ routed here recently/).allTextContents()).map((t) => ui.firstNumber(t));
            expect(Math.max(...counts)).toBeGreaterThanOrEqual(10);
        } finally {
            await context.close();
        }
    });
});
