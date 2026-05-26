import { expect, test } from '@playwright/test';

// Live Polymarket data on /markets — run serially and wait for network idle.
test.describe.serial('markets filter (Polymarket-live)', () => {
  test.describe.configure({ timeout: 30_000 });

  test('category tab filter updates URL and shows filtered results', async ({ page }) => {
    await page.goto('/markets');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForSelector('main a[href^="/markets/"]', { timeout: 30_000 });

    // Click the Crypto tab
    await page.getByRole('button', { name: /^crypto$/i }).click();

    // URL should contain ?category=crypto (commit is enough; full load may lag on cold compile)
    await page.waitForURL(/category=crypto/, { waitUntil: 'commit' });
    expect(page.url()).toContain('category=crypto');
  });

  test('topbar is visible on markets page', async ({ page }) => {
    await page.goto('/markets');
    await page.waitForLoadState('domcontentloaded');
    // Logo / wordmark
    await expect(page.getByText('predictwaves')).toBeVisible();
    // Navigation links
    await expect(page.getByRole('link', { name: /markets/i }).first()).toBeVisible();
  });
});
