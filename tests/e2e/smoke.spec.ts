import { expect, test } from '@playwright/test';

test('smoke: 首頁可開啟', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('body')).toBeVisible();
  const text = await page.locator('body').innerText();
  console.log(text.slice(0, 500));
});
