import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route('**/*', async (route) => {
    const action = new URL(route.request().url()).searchParams.get('action');
    if (action) {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: false, error: 'offline test' }) });
      return;
    }
    await route.continue();
  });
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test('mockExam 離開後可恢復草稿', async ({ page }) => {
  test.setTimeout(60000);
  console.log('Step 1: 開啟首頁');
  await page.getByTestId('practice-center-entry').click();
  await page.getByTestId('practice-formal-exam-card').getByRole('button', { name: '開始完整模擬考' }).click();
  console.log('Step 2: 確認開始');
  await page.getByRole('button', { name: '確認開始測驗' }).click();
  console.log('Step 3: 作答並離開');
  const firstOption = page.getByRole('radio').first();
  if (await firstOption.count()) await firstOption.click();
  else await page.getByRole('textbox', { name: '文字答案' }).fill('測試草稿答案');
  await page.getByRole('button', { name: '標記此題' }).click();
  await page.getByRole('button', { name: '離開測驗' }).click();
  await page.getByRole('button', { name: '結束本次測驗並返回首頁' }).click();
  console.log('Step 4: 檢查 Resume');
  await expect(page.getByRole('button', { name: '繼續模擬測驗' })).toBeVisible();
  await page.getByRole('button', { name: '繼續模擬測驗' }).click();
  await expect(page.getByRole('button', { name: '已標記' })).toHaveCount(1);
  await expect(page.getByText(/第 1 題 \/ 共 \d+ 題/)).toBeVisible();
});

test('今日任務題數與測驗說明一致', async ({ page }) => {
  const mission = page.getByRole('region', { name: '今日學習重點' });
  const label = await mission.innerText();
  const count = Number(label.match(/今日基本任務：(\d+) 題/)?.[1]);
  const taskButton = page.getByRole('button', { name: '開始今日任務' });
  await taskButton.click();
  await expect(page.getByText(new RegExp(`本次為今日任務，共 ${count} 題`))).toBeVisible();
  await page.getByRole('button', { name: '確認開始測驗' }).click();
  await expect(page.getByText(`第 1 題 / 共 ${count} 題`)).toBeVisible();
});

test('首頁主要介面中文化', async ({ page }) => {
  for (const text of ['Exam Center', 'Recent Activity', 'Data Syncing', 'Learning Roadmap', 'Active', 'Locked', 'Coming Soon']) {
    await expect(page.getByText(text, { exact: false })).toHaveCount(0);
  }
  await expect(page.getByRole('region', { name: '今日學習重點' })).toBeVisible();
  await expect(page.getByText('今日任務', { exact: true })).toBeVisible();
  await expect(page.getByText('本週進度', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: '最近學習紀錄' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '練習中心' })).toBeVisible();
});
