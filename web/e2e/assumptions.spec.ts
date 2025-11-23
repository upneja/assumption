import { test } from '@playwright/test';

test.describe.skip('Assumptions happy path (MSW-backed)', () => {
  test('host creates room and plays a round', async ({ page }) => {
    await page.goto('/');
    // TODO: configure MSW handlers for API calls, then drive host + guest flows
    // Keeping skipped until mock server wiring is in place.
  });
});
