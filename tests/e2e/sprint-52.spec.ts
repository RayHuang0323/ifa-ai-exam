import { expect, test, type Page } from '@playwright/test';

const offlineApi = async (page: Page) => {
  await page.route('**/*', async (route) => {
    const action = new URL(route.request().url()).searchParams.get('action');
    if (!action) {
      await route.continue();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: false, error: 'unavailable' }),
    });
  });
};

const readSchedulerState = async (page: Page) => page.evaluate(() => {
  const raw = localStorage.getItem('ifa-question-scheduler-v2');
  return raw ? JSON.parse(raw) as { recentSessions?: Array<{ mode: string; questionIds: number[] }> } : {};
});

test('Daily 與 Weekly 避免近期題目重疊，並保留 formal priority routing', async ({ page }) => {
  test.setTimeout(60000);
  await offlineApi(page);
  await page.goto('/?profile=learner');
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  await page.getByTestId('practice-center-entry').click();
  await page.getByTestId('practice-daily-card').getByRole('button', { name: '開始今日任務', exact: true }).click();
  await page.getByRole('button', { name: '確認開始測驗' }).click();
  await expect(page.getByText(/第 1 題 \/ 共 30 題/)).toBeVisible();
  const dailyState = await readSchedulerState(page);
  const dailySession = [...(dailyState.recentSessions ?? [])].reverse().find((session) => session.mode === 'daily');
  expect(dailySession).toBeTruthy();
  expect(new Set(dailySession?.questionIds ?? []).size).toBe(dailySession?.questionIds.length);

  await page.getByRole('button', { name: '離開測驗' }).click();
  await page.getByRole('button', { name: '結束本次測驗並返回首頁' }).click();
  await page.getByTestId('practice-center-entry').click();
  await page.getByTestId('practice-weekly-review-card').getByRole('button', { name: '開始每週測驗' }).click();
  await page.getByRole('button', { name: '確認開始測驗' }).click();
  await expect(page.getByText(/第 1 題 \/ 共 /)).toBeVisible();

  const weeklyState = await readSchedulerState(page);
  const weeklySession = [...(weeklyState.recentSessions ?? [])].reverse().find((session) => session.mode === 'weekly');
  expect(weeklySession).toBeTruthy();
  expect(new Set(weeklySession?.questionIds ?? []).size).toBe(weeklySession?.questionIds.length);
  expect((weeklySession?.questionIds ?? []).filter((id) => dailySession?.questionIds.includes(id))).toEqual([]);
});
