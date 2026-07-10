import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test('mockExam 離開後可恢復草稿', async ({ page }) => {
  test.setTimeout(60000);
  console.log('Step 1: 開啟首頁');
  await page.getByRole('button', { name: '開始測驗' }).click();
  console.log('Step 2: 確認開始');
  await page.getByRole('button', { name: '確認開始測驗' }).click();
  console.log('Step 3: 作答並離開');
  await page.getByRole('radio').nth(0).click();
  await page.getByRole('button', { name: '離開測驗' }).click();
  await page.getByRole('button', { name: '結束本次測驗並返回首頁' }).click();
  console.log('Step 4: 檢查 Resume');
  await expect(page.getByRole('button', { name: '繼續模擬測驗' })).toBeVisible();
  await page.getByRole('button', { name: '繼續模擬測驗' }).click();
  await expect(page.getByRole('radio').nth(0)).toHaveAttribute('aria-checked', 'true');
  await expect(page.getByRole('button', { name: '已標記' })).toBeVisible();
  await expect(page.getByText('第 1 題 / 共 20 題')).toBeVisible();
});

test('今日任務題數與測驗說明一致', async ({ page }) => {
  const taskButton = page.getByRole('button', { name: /開始今日任務：Week1 練習/ }).first();
  const label = await taskButton.innerText();
  const count = Number(label.match(/(\d+) 題/)?.[1]);
  await taskButton.click();
  await expect(page.getByText(`${count} 題`, { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '確認開始測驗' }).click();
  await expect(page.getByText(`第 1 題 / 共 ${count} 題`)).toBeVisible();
});

test('首頁主要介面中文化', async ({ page }) => {
  for (const text of ['Exam Center', 'Recent Activity', 'Data Syncing', 'Learning Roadmap', 'Active', 'Locked', 'Coming Soon']) {
    await expect(page.getByText(text, { exact: false })).toHaveCount(0);
  }
  for (const text of ['模擬考中心', '最近學習紀錄', '學習路線圖', '使用中', '尚未開放', '建置中']) {
    await expect(page.getByText(text, { exact: false })).toBeVisible();
  }
});
