import { expect, test } from '@playwright/test';

test('weighted Full Mock 使用固定校準題數', async ({ page }) => {
  test.setTimeout(60000);
  await page.goto('/?profile=learner');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByTestId('practice-center-entry').click();
  await expect(page.getByTestId('practice-formal-exam-card')).toContainText('正式模擬考題庫：324 題');
  await expect(page.getByTestId('practice-daily-card')).toContainText(/正式題第一輪：\d+ \/ 324 題/);
  await page.getByTestId('practice-formal-exam-card').getByRole('button', { name: '開始完整模擬考' }).click();
  await expect(page.getByText('本次使用正式 verified 題與教材證據題，共 60 題')).toBeVisible();
  await page.getByRole('button', { name: '確認開始測驗' }).click();
  await expect(page.getByText('第 1 題 / 共 60 題')).toBeVisible();
});

test('Full Mock 可完成 Exam → Submit → Result → 解析流程', async ({ page }) => {
  test.setTimeout(90000);
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  page.on('pageerror', (error) => pageErrors.push(error.message));

  await page.goto('/?profile=learner');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByTestId('practice-center-entry').click();
  await page.getByTestId('practice-formal-exam-card').getByRole('button', { name: '開始完整模擬考' }).click();
  await page.getByRole('button', { name: '確認開始測驗' }).click();
  await expect(page.getByText('第 1 題 / 共 60 題')).toBeVisible();

  const answerCurrentQuestion = async () => {
    const options = page.locator('[role="radio"], [role="checkbox"]');
    if (await options.count()) {
      await options.first().click();
      return;
    }
    await page.getByRole('textbox', { name: '文字答案' }).fill('考前稽核測試作答');
  };
  await answerCurrentQuestion();
  await page.getByRole('button', { name: '前往第 60 題' }).click();
  await answerCurrentQuestion();
  await page.getByRole('button', { name: '交卷', exact: true }).last().click();
  await page.getByRole('button', { name: '確認交卷' }).click();

  await expect(page.getByRole('heading', { name: '正式題庫測驗結果' })).toBeVisible();
  await expect(page.getByText('總題數').locator('..').getByText('60')).toBeVisible();
  await page.getByRole('button', { name: '查看本次題目與解析' }).click();
  await expect(page.getByText('【解析】').first()).toBeVisible();
  expect(consoleErrors).toEqual([]);
  expect(pageErrors).toEqual([]);
});
