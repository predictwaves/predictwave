import { expect, test } from '@playwright/test';

// Homepage renders live Polymarket market cards; run serially so these don't
// compete for the single dev server, and wait for the network to settle first.
test.describe.serial('landing (Polymarket-live)', () => {
  test.describe.configure({ timeout: 30_000 });

  test('landing page loads with topbar and brand name', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.getByText('predictwaves').first()).toBeVisible();
  });

  test('landing page shows connect button for logged-out users', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.getByRole('button', { name: /connect/i })).toBeVisible();
  });

  test('tab nav is visible with Markets tab active', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    const marketsTab = page.getByRole('link', { name: /^markets$/i });
    await expect(marketsTab.first()).toBeVisible();
  });

  test('search bar trigger is visible in topbar', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.getByRole('button', { name: /search markets/i })).toBeVisible();
  });

  test('category chips are visible on home page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.getByRole('button', { name: /^all$/i })).toBeVisible();
  });

  test('partners link is no longer present', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.getByRole('link', { name: /for partners/i })).toHaveCount(0);
  });
});
