import { expect, test } from '@playwright/test';

test('landing page loads and shows connect button', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('predictwaves')).toBeVisible();
  await expect(page.getByRole('button', { name: /connect/i })).toBeVisible();
});
