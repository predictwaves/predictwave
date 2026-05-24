import { expect, test } from '@playwright/test';

test('category tab filter updates URL and shows filtered results', async ({ page }) => {
  await page.goto('/markets');
  await page.waitForSelector('a[href^="/markets/"]', { timeout: 30_000 });

  // Click the Crypto tab
  await page.getByRole('button', { name: /^crypto$/i }).click();

  // URL should contain ?category=crypto
  await page.waitForURL(/category=crypto/);
  expect(page.url()).toContain('category=crypto');
});

test('topbar is visible on markets page', async ({ page }) => {
  await page.goto('/markets');
  // Logo / wordmark
  await expect(page.getByText('predictwaves')).toBeVisible();
  // Navigation links
  await expect(page.getByRole('link', { name: /markets/i }).first()).toBeVisible();
});
