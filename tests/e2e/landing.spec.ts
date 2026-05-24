import { expect, test } from '@playwright/test';

test('landing page loads and shows coming soon', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('predictwaves')).toBeVisible();
  await expect(page.getByText('Coming soon')).toBeVisible();
});
