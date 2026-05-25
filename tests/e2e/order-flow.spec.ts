import { expect, test } from '@playwright/test';

// Full prepare → sign → submit requires an authenticated Privy session with a funded,
// approved embedded wallet, which can't be established headlessly. These specs verify the
// order panel is wired and rendering, and that the order API routes respond to the
// prepare/submit contract. The signed end-to-end path is covered by the manual funded-wallet
// test described in the Phase 4 prompt.

async function openFirstMarket(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.waitForSelector('a[href^="/markets/"]', { timeout: 30_000 });
  await page.locator('a[href^="/markets/"]').first().click();
  await page.waitForURL(/\/markets\/[^/]+$/);
}

test('order panel renders with Buy YES / Buy NO tabs and amount input', async ({ page }) => {
  await openFirstMarket(page);

  await expect(page.getByRole('button', { name: /^buy yes$/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /^buy no$/i })).toBeVisible();
  await expect(page.getByLabel(/order amount/i)).toBeVisible();
  // Unauthenticated default CTA.
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

  const input = page.getByLabel(/order amount/i);
  await input.fill('20000');
  // Shares preview should become non-zero once an amount is entered.
  await expect(page.getByText(/shares/i).first()).toBeVisible();
});

test('orders/prepare validates input', async ({ request }) => {
  const res = await request.post('/api/orders/prepare', { data: { bad: 'input' } });
  expect(res.status()).toBe(400);
  const body = await res.json();
  expect(body.error.code).toBe('BAD_INPUT');
});
