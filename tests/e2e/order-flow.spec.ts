import { expect, test } from '@playwright/test';

// The full setup → order flow runs server-side via Privy delegated signing and can't be
// exercised headlessly. These specs verify the order panel renders and gates correctly
// for a logged-out visitor. The signed end-to-end path is covered by the manual test.
//
// The panel lives on a live-data market detail page, so run serially and wait for idle.

async function openFirstMarket(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForSelector('main a[href^="/markets/"]', { timeout: 30_000 });
  await page.locator('main a[href^="/markets/"]').first().click();
  await page.waitForURL(/\/markets\/[^/]+$/, { waitUntil: 'commit' });
  await page.waitForLoadState('domcontentloaded');
}

test.describe.serial('order flow (Polymarket-live)', () => {
  test.describe.configure({ timeout: 30_000 });

  test('order panel renders with Buy YES / Buy NO tabs and amount input', async ({ page }) => {
    await openFirstMarket(page);

    await expect(page.getByRole('button', { name: /^buy yes$/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /^buy no$/i })).toBeVisible();
    await expect(page.getByLabel(/order amount/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in to trade/i })).toBeVisible();
  });

  test('switching to Buy NO updates the active tab', async ({ page }) => {
    await openFirstMarket(page);
    const noTab = page.getByRole('button', { name: /^buy no$/i });
    await noTab.click();
    await expect(noTab).toHaveAttribute('aria-pressed', 'true');
  });

  test('preview updates live as the amount changes', async ({ page }) => {
    await openFirstMarket(page);
    await page.getByLabel(/order amount/i).fill('20000');
    await expect(page.getByText(/shares/i).first()).toBeVisible();
  });
});
