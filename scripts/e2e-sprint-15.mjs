import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';

const url = 'http://127.0.0.1:5173';
const text = {
  empty: '\u76ee\u524d\u9084\u6c92\u6709\u5b78\u7fd2\u7d00\u9304\u3002',
  daily: '\u4eca\u65e5\u4efb\u52d9',
  review: '\u932f\u984c\u8907\u7fd2',
  guidance: '\u9ad8\u98a8\u96aa\u932f\u984c',
  task: '\u958b\u59cb\u4eca\u65e5\u4efb\u52d9',
  instructions: '\u6e2c\u9a57\u8aaa\u660e',
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
const session = (id, mode, completedAt, answeredCount, correctCount, wrongCount, durationSeconds) => ({ id, date: completedAt.slice(0, 10), weekId: 'week-1', mode, answeredCount, correctCount, wrongCount, durationSeconds, completedAt, questionIds: [1], correctQuestionIds: correctCount ? [1] : [], wrongQuestionIds: wrongCount ? [1] : [], skippedQuestionIds: [] });

try {
  step = 'start server';
  server = spawn('cmd.exe', ['/c', 'npm.cmd run dev -- --host 127.0.0.1 --port 5173'], { stdio: 'ignore' });
  await waitForServer();
  browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  const page = await browser.newPage();

  step = 'empty recent activity';
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 15000 });
  if (!(await page.getByTestId('recent-activity-empty').innerText()).includes(text.empty)) throw new Error('Recent activity empty state missing');

  step = 'daily activity';
  await page.evaluate((dailySession) => localStorage.setItem('ifa-study-progress-v1', JSON.stringify({ version: 1, sessions: [dailySession], lastStudyDate: dailySession.date, currentStreak: 1, longestStreak: 1 })), session('daily-1', 'daily', '2026-07-12T10:30:00.000Z', 10, 8, 2, 120));
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 15000 });
  const dailyActivity = await page.getByTestId('recent-activity-list').innerText();
  for (const label of [text.daily, '\u984c\u6578 10 \u984c', '\u7b54\u5c0d 8 \u984c', '\u7b54\u932f 2 \u984c', '\u6b63\u78ba\u7387 80%', '\u82b1\u8cbb\u6642\u9593 2 \u5206\u9418']) if (!dailyActivity.includes(label)) throw new Error(`Missing daily activity value: ${label}`);

  step = 'review activity and guidance';
  await page.evaluate((reviewSession) => {
    const progress = JSON.parse(localStorage.getItem('ifa-study-progress-v1') ?? '{}');
    progress.sessions.push(reviewSession);
    localStorage.setItem('ifa-study-progress-v1', JSON.stringify(progress));
    localStorage.setItem('ifa-wrong-answers-v1', JSON.stringify([{ questionId: 1, weekId: 'week-1', wrongCount: 2, correctReviewCount: 0, consecutiveCorrect: 0, lastWrongAt: new Date().toISOString(), lastReviewedAt: null, masteredAt: null, status: 'highRisk', lastSelectedAnswer: '\u80ba\u52d5\u8108', correctAnswer: '\u80ba\u975c\u8108', questionType: 'single', source: 'week-1' }]));
  }, session('review-1', 'reviewWrong', '2026-07-12T11:00:00.000Z', 1, 1, 0, 45));
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 15000 });
  if (!(await page.getByTestId('recent-activity-list').innerText()).includes(text.review)) throw new Error('Wrong review activity missing');
  if (!(await page.getByTestId('study-guidance').innerText()).includes(text.guidance)) throw new Error('High-risk wrong answer guidance missing');

  step = 'start today task';
  await page.getByTestId('primary-today-task').click({ timeout: 10000 });
  if (!(await page.locator('body').innerText()).includes(text.instructions)) throw new Error('Today task did not enter instructions');

  console.log('SPRINT 15 VERIFY PASSED');
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
