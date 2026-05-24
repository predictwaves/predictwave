import { expect, test } from '@playwright/test';

test('landing page loads and shows connect button', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('predictwaves')).toBeVisible();
  // logged-out: marketing hero with connect button
  await expect(page.getByRole('button', { name: /connect/i })).toBeVisible();
});

test('landing page has Browse markets link', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: /browse markets/i })).toBeVisible();
});

test('sidebar nav is visible on desktop', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/');
  await expect(page.getByRole('link', { name: /markets/i }).first()).toBeVisible();
});
