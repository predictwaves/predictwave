import { expect, test } from '@playwright/test';

test('landing page loads with topbar and brand name', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('predictwaves').first()).toBeVisible();
});

test('landing page shows connect button for logged-out users', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: /connect/i })).toBeVisible();
});

test('tab nav is visible with Markets tab active', async ({ page }) => {
  await page.goto('/');
  const marketsTab = page.getByRole('link', { name: /^markets$/i });
  await expect(marketsTab.first()).toBeVisible();
});

test('search bar trigger is visible in topbar', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: /search markets/i })).toBeVisible();
});

test('category chips are visible on home page', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: /^all$/i })).toBeVisible();
});

test('partners strip links to /partners', async ({ page }) => {
  await page.goto('/');
  const strip = page.getByRole('link', { name: /for partners/i });
  await expect(strip).toBeVisible();
  await expect(strip).toHaveAttribute('href', '/partners');
});
