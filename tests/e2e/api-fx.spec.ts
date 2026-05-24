import { test, expect } from '@playwright/test';

test('GET /api/fx returns a numeric NGN/USD rate', async ({ request }) => {
  const response = await request.get('/api/fx?pair=NGN%2FUSD');
  expect(response.status()).toBe(200);

  const body = await response.json() as Record<string, unknown>;
  expect(body).toHaveProperty('pair', 'NGN/USD');
  expect(typeof body.rate).toBe('number');
  expect(body.rate as number).toBeGreaterThan(0);
  expect(body).toHaveProperty('source');
  expect(body).toHaveProperty('fetchedAt');
  expect(typeof body.stale).toBe('boolean');
});

test('GET /api/markets/curated returns markets array', async ({ request }) => {
  const response = await request.get('/api/markets/curated');
  expect(response.status()).toBe(200);

  const body = await response.json() as { markets: unknown[] };
  expect(body).toHaveProperty('markets');
  expect(Array.isArray(body.markets)).toBe(true);
});
