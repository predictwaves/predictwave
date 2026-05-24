import { expect, test } from '@playwright/test';

test('markets list loads and shows market cards', async ({ page }) => {
  await page.goto('/');

  // Category chips should be visible
  await expect(page.getByRole('button', { name: /^all$/i })).toBeVisible();

  // Wait for at least one market card to load (markets come from Polymarket API)
  await page.waitForSelector('a[href^="/markets/"]', { timeout: 30_000 });
  const cards = page.locator('a[href^="/markets/"]');
  const count = await cards.count();
  expect(count).toBeGreaterThanOrEqual(1);

  // Click first card and verify navigation to detail page
  const firstCard = cards.first();
  const href = await firstCard.getAttribute('href');
  await firstCard.click();
  await page.waitForURL(/\/markets\/[^/]+$/);
  expect(page.url()).toMatch(/\/markets\//);
  if (href) {
    expect(page.url()).toContain(href);
  }
});

test('market detail page renders chart and orderbook', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('a[href^="/markets/"]', { timeout: 30_000 });
  await page.locator('a[href^="/markets/"]').first().click();
  await page.waitForURL(/\/markets\/[^/]+$/);

  // Chart should render (recharts uses svg)
  await expect(page.locator('svg.recharts-surface').first()).toBeVisible({ timeout: 20_000 });

  // Order book section
  await expect(page.getByText(/order book/i)).toBeVisible();
});

test('category chip filters markets', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('a[href^="/markets/"]', { timeout: 30_000 });

  // Click Politics chip
  const politicsChip = page.getByRole('button', { name: /^politics$/i });
  await expect(politicsChip).toBeVisible();
  await politicsChip.click();

  // URL should update with category param
  await page.waitForURL(/category=politics/);
  expect(page.url()).toContain('category=politics');
});
