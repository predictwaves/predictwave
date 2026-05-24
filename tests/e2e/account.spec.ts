import { expect, test } from '@playwright/test';

test('account page shows sign-in prompt when logged out', async ({ page }) => {
  await page.goto('/account');
  await expect(page.getByText('Sign in to see your account')).toBeVisible();
  await expect(page.getByRole('button', { name: /connect/i })).toBeVisible();
});
