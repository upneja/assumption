import { test } from '@playwright/test';

test.describe.skip('Imposter game happy path (MSW-backed)', () => {
  test('host picks topic, clues, votes, and reveals', async ({ page }) => {
    await page.goto('/');
    // TODO: configure MSW handlers for imposter API routes and drive end-to-end flow.
  });
});
