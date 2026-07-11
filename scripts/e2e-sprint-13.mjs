import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';

const url = 'http://127.0.0.1:5173';
const text = {
  today: '\u4eca\u5929\uff1a',
  examDay: '\u8003\u8a66\u65e5\uff1a',
  countdown: '\u8ddd\u96e2 IFA \u8003\u8a66\uff1a',
  minutes: '\u5206\u9418',
  startExam: '\u958b\u59cb\u6e2c\u9a57',
  startReview: '\u958b\u59cb\u932f\u984c\u8907\u7fd2',
  confirmReview: '\u78ba\u8a8d\u958b\u59cb\u8907\u7fd2',
  submit: '\u4ea4\u5377',
  confirmSubmit: '\u78ba\u8a8d\u4ea4\u5377',
  correctAnswer: '\u80ba\u975c\u8108',
  reviewComplete: '\u932f\u984c\u8907\u7fd2\u5b8c\u6210',
  correctThisTime: '\u672c\u6b21\u7b54\u5c0d',
  stillNeedsWork: '\u672c\u6b21\u4ecd\u9700\u52a0\u5f37',
  mastered: '\u76ee\u524d\u5df2\u719f\u7df4',
};

let server;
let browser;
let step = 'init';
const timeout = setTimeout(() => { console.error('Timeout:', step); server?.kill(); process.exit(1); }, 90000);
const waitForServer = async () => {
  for (let index = 0; index < 60; index += 1) {
    try { if ((await fetch(url)).ok) return; } catch {}
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error('Vite did not start');
};

try {
  step = 'start server';
  server = spawn('cmd.exe', ['/c', 'npm.cmd run dev -- --host 127.0.0.1 --port 5173'], { stdio: 'ignore' });
  await waitForServer();
  browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  const page = await browser.newPage();

  step = 'home dashboard';
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 15000 });
  const home = await page.locator('body').innerText();
  for (const label of [text.today, text.examDay, text.countdown]) if (!home.includes(label)) throw new Error(`Missing home label: ${label}`);

  step = 'today task time';
  await page.getByTestId('primary-today-task').click({ timeout: 10000 });
  const dailyInstructions = await page.locator('body').innerText();
  const dailyMinutes = /\u8003\u8a66\u6642\u9593\s*(\d+) \u5206\u9418/.exec(dailyInstructions)?.[1];
  if (!dailyMinutes || Number(dailyMinutes) === 90) throw new Error('Today task shows 90 minutes');

  step = 'formal exam time';
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.getByTestId('practice-center-entry').click();
  await page.getByTestId('practice-formal-exam-card').getByRole('button', { name: '開始完整模擬考' }).click({ timeout: 10000 });
  if (!(await page.locator('body').innerText()).includes(`90 ${text.minutes}`)) throw new Error('Formal exam no longer shows 90 minutes');

  step = 'seed wrong answer';
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.evaluate(() => localStorage.setItem('ifa-wrong-answers-v1', JSON.stringify([{
    questionId: 1,
    weekId: 'week-1',
    wrongCount: 1,
    correctReviewCount: 0,
    consecutiveCorrect: 0,
    lastWrongAt: new Date().toISOString(),
    lastReviewedAt: null,
    masteredAt: null,
    status: 'newWrong',
    lastSelectedAnswer: '\u80ba\u52d5\u8108',
    correctAnswer: '\u80ba\u975c\u8108',
    questionType: 'single',
    source: 'week-1',
  }])));
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.getByTestId('practice-center-entry').click();
  await page.getByTestId('practice-wrong-review-card').getByRole('button', { name: text.startReview }).click({ timeout: 10000 });
  const reviewInstructions = await page.locator('body').innerText();
  const reviewMinutes = /\u8003\u8a66\u6642\u9593\s*(\d+) \u5206\u9418/.exec(reviewInstructions)?.[1];
  if (!reviewMinutes || Number(reviewMinutes) === 90) throw new Error('Wrong-answer review shows 90 minutes');

  step = 'complete wrong review correctly';
  await page.getByRole('button', { name: text.confirmReview }).click({ timeout: 10000 });
  await page.getByRole('radio', { name: text.correctAnswer }).click({ timeout: 10000 });
  await page.getByRole('button', { name: text.submit }).first().click({ timeout: 10000 });
  await page.getByRole('button', { name: text.confirmSubmit }).click({ timeout: 10000 });
  const result = await page.locator('body').innerText();
  for (const label of [text.reviewComplete, text.correctThisTime, text.stillNeedsWork, text.mastered]) if (!result.includes(label)) throw new Error(`Missing review result label: ${label}`);
  if (!result.includes(`${text.correctThisTime} 1 \u984c`)) throw new Error('Correct review answer was not counted');
  if (!result.includes(`${text.stillNeedsWork} 0 \u984c`)) throw new Error('Correct review answer was counted as still needing work');

  step = 'same-day improving exclusion';
  const wrongAnswers = await page.evaluate(() => JSON.parse(localStorage.getItem('ifa-wrong-answers-v1') ?? '[]'));
  if (wrongAnswers.find((record) => record.questionId === 1)?.status !== 'improving') throw new Error('Correct review did not set status to improving');
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.getByTestId('practice-center-entry').click();
  const reviewCard = page.getByTestId('practice-wrong-review-card');
  if (await reviewCard.getByRole('button', { name: text.startReview }).count()) throw new Error('Same-day improving answer remains reviewable');
  if (!(await reviewCard.innerText()).includes('\u76ee\u524d\u6c92\u6709\u53ef\u8907\u7fd2\u932f\u984c')) throw new Error('Practice center reviewableCount does not exclude same-day improving answer');

  console.log('SPRINT 13 VERIFY PASSED');
  process.exitCode = 0;
} catch (error) {
  console.error(error);
  console.error('Last step:', step);
  process.exitCode = 1;
} finally {
  clearTimeout(timeout);
  try { await browser?.close(); } catch {}
  if (server && !server.killed) server.kill('SIGTERM');
}
