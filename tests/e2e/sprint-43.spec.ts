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

test('Learner 可完成今日任務的暫存、恢復、交卷與非選擇題規準評分', async ({ page }) => {
  test.setTimeout(60000);
  await offlineApi(page);
  await page.goto('/?profile=learner');
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  const mission = page.getByRole('region', { name: '今日學習重點' });
  await expect(page.getByRole('button', { name: '開始今日任務', exact: true })).toBeVisible();
  const count = Number((await mission.innerText()).match(/今日基本任務：(\d+) 題/)?.[1]);
  expect(count).toBeGreaterThan(0);

  await page.getByRole('button', { name: '開始今日任務', exact: true }).click();
  await expect(page.getByText(new RegExp(`本次為今日任務，共 ${count} 題`))).toBeVisible();
  await page.getByRole('button', { name: '確認開始測驗' }).click();
  await expect(page.getByText(`第 1 題 / 共 ${count} 題`)).toBeVisible();

  const firstChoice = page.locator('.exam-question-card button[role="radio"], .exam-question-card button[role="checkbox"]').first();
  if (await firstChoice.count()) await firstChoice.click();
  else await page.getByRole('textbox', { name: '文字答案' }).fill('Sprint 43 測試答案');
  await page.getByRole('button', { name: '離開測驗' }).click();
  await page.getByRole('button', { name: '結束本次測驗並返回首頁' }).click();
  await expect(page.getByRole('button', { name: '繼續模擬測驗' })).toBeVisible();

  await page.getByRole('button', { name: '繼續模擬測驗' }).click();
  await expect(page.getByText(`第 1 題 / 共 ${count} 題`)).toBeVisible();
  await page.getByRole('button', { name: '交卷', exact: true }).first().click();
  await page.getByRole('button', { name: '確認交卷' }).click();
  await expect(page.getByRole('heading', { name: '今日任務結果' })).toBeVisible();
  await expect(page.getByText(/未完成保留題/)).toBeVisible();

  await page.getByRole('button', { name: '返回首頁' }).click();
  await page.getByTestId('practice-center-entry').click();
  await page.getByTestId('practice-writing-card').getByRole('button', { name: '開始簡答／默寫練習' }).click();
  await page.getByRole('button', { name: '確認開始練習' }).click();
  await page.getByRole('textbox', { name: '文字答案' }).fill('肺靜脈將含氧較高的血液送回左心房。');
  await page.getByTestId('submit-self-check-button').click();
  await page.getByTestId('self-check-correct-button').click();
  await expect(page.getByRole('heading', { name: '簡答／默寫練習完成' })).toBeVisible();
  await expect(page.getByRole('region', { name: '規準輔助評分摘要' })).toBeVisible();
  await expect(page.getByText('規準輔助評分').first()).toBeVisible();
});

test('Coach 可讀取學員狀態、測驗紀錄、逐題紀錄與題庫完成率', async ({ page }) => {
  const session = {
    sessionId: 'sprint43-session',
    examTitle: '今日任務',
    examType: 'daily',
    status: 'completed',
    startedAt: '2026-07-22T09:00:00.000Z',
    updatedAt: '2026-07-22T09:30:00.000Z',
    completedAt: '2026-07-22T09:30:00.000Z',
    questionCount: 30,
    answeredCount: 30,
    correctCount: 24,
    wrongCount: 6,
    score: 80,
    durationSeconds: 1800,
  };
  await page.route('**/*', async (route) => {
    const action = new URL(route.request().url()).searchParams.get('action');
    const dataByAction: Record<string, unknown> = {
      getLearnerHomeSummary: null,
      getAnsweredQuestionHistory: [],
      getCoachSummary: { learnerId: 'bella', learnerName: 'Bella', todayAnsweredCount: 30, todayCompletedSessions: 1, totalAnsweredCount: 30, totalCorrectCount: 24, totalWrongCount: 6, overallAccuracy: 80, completedSessionCount: 1, latestScore: 80, lastActivityAt: session.completedAt, generatedAt: session.completedAt },
      getRecentSessions: [session],
      getCoachLearningAnalysis: { completedQuestionCount: 30, completedQuestionIds: [1, 2], incompleteQuestionCount: 1229, lastCompletedAt: session.completedAt, wrongByCategory: [{ category: '解剖生理', count: 6 }], weakestCategory: '解剖生理' },
      getSessionDetails: { session, answers: [{ questionId: '1', selectedAnswer: '錯誤答案', correctAnswer: '正確答案', isCorrect: false, answeredAt: session.completedAt, syncedAt: session.completedAt }] },
    };
    if (!action || !(action in dataByAction)) {
      await route.continue();
      return;
    }
    const data = dataByAction[action];
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(data === null ? { success: false, error: 'unavailable' } : { success: true, data }) });
  });
  await page.goto('/?profile=coach-test');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByTestId('coach-dashboard-entry').getByRole('button', { name: '查看學習紀錄' }).click();
  await page.getByPlaceholder('Coach 查看碼').fill('sprint43-test-key');
  await page.getByRole('button', { name: '查看學習紀錄', exact: true }).click();

  await expect(page.getByText('查看對象：Bella')).toBeVisible();
  await expect(page.getByText('累積完成題數')).toBeVisible();
  await expect(page.getByText('題庫完成率')).toBeVisible();
  await expect(page.getByText('題庫完成率').locator('..').getByText('2%')).toBeVisible();
  await expect(page.getByText('最近測驗紀錄')).toBeVisible();
  await expect(page.getByText('正式題第一輪')).toBeVisible();

  await page.getByRole('button', { name: /今日任務/ }).click();
  await expect(page.getByRole('heading', { name: '測驗詳細' })).toBeVisible();
  await expect(page.getByText('判定：答錯')).toBeVisible();
});
