import { expect, test } from '@playwright/test';

// The page renders null until Privy reports `ready`, then shows the sign-in prompt.
// Wait for the network to settle so Privy has initialized before asserting.
test('account page shows sign-in prompt when logged out', async ({ page }) => {
  test.setTimeout(30_000);
  await page.goto('/account');
  await page.waitForLoadState('networkidle');
  await expect(page.getByText('Sign in to see your account')).toBeVisible();
  // Two "Connect" buttons exist (topbar + this sign-in prompt); the prompt's is last in the DOM.
  await expect(page.getByRole('button', { name: /connect/i }).last()).toBeVisible();
});
