import { expect, test } from '@playwright/test';

test('weighted Full Mock 使用固定校準題數', async ({ page }) => {
  test.setTimeout(60000);
  await page.goto('/?profile=learner');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByTestId('practice-center-entry').click();
  await page.getByTestId('practice-formal-exam-card').getByRole('button', { name: '開始完整模擬考' }).click();
  await expect(page.getByText('本次使用正式 verified 題與教材證據題，共 60 題')).toBeVisible();
  await page.getByRole('button', { name: '確認開始測驗' }).click();
  await expect(page.getByText('第 1 題 / 共 60 題')).toBeVisible();
});
