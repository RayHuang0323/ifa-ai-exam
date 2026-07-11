import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';

const url = 'http://127.0.0.1:5173';
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

  step = 'verify simplified home';
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 15000 });
  const home = await page.locator('body').innerText();
  for (const label of ['今天：', '考試日：', '距離 IFA 考試：', '今日任務', '開始今日任務', '進入練習中心', '最近學習紀錄']) if (!home.includes(label)) throw new Error(`首頁缺少：${label}`);
  if (await page.getByTestId('writing-practice-section').count()) throw new Error('首頁仍顯示完整簡答／默寫練習卡');

  step = 'open practice center and daily task';
  await page.getByTestId('practice-center-entry').click();
  for (const id of ['practice-center-page', 'practice-daily-card', 'practice-wrong-review-card', 'practice-wrong-book-card', 'practice-formal-exam-card', 'practice-writing-card']) if (!(await page.getByTestId(id).count())) throw new Error(`練習中心缺少：${id}`);
  await page.getByTestId('practice-daily-card').getByRole('button', { name: '開始今日任務' }).click();
  if (!(await page.locator('body').innerText()).includes('測驗說明')) throw new Error('今日任務未進入既有流程');
  await page.getByRole('button', { name: '返回首頁' }).click();

  step = 'reload and verify wrong review';
  await page.getByTestId('practice-center-entry').click();
  await page.evaluate(() => localStorage.setItem('ifa-wrong-answers-v1', JSON.stringify([{ questionId: 1, weekId: 'week-1', wrongCount: 1, lastWrongAt: new Date().toISOString(), lastSelectedAnswer: 'A', correctAnswer: 'B', questionType: 'single-choice', source: 'week-1', correctReviewCount: 0, consecutiveCorrect: 0, lastReviewedAt: null, masteredAt: null, status: 'highRisk' }])));
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.getByTestId('practice-center-entry').click();
  if (!(await page.getByTestId('practice-wrong-review-card').innerText()).includes('待複習 1 題')) throw new Error('合法錯題未顯示為可複習');
  await page.getByTestId('practice-wrong-review-card').getByRole('button', { name: '開始錯題複習' }).click();
  if (!(await page.locator('body').innerText()).includes('錯題複習')) throw new Error('錯題複習未進入既有流程');
  await page.getByRole('button', { name: '返回首頁' }).click();

  step = 'verify wrong book and writing practice';
  await page.getByTestId('practice-center-entry').click();
  await page.getByTestId('practice-wrong-book-card').getByRole('button', { name: '查看錯題本' }).click();
  if (!(await page.getByTestId('wrong-book-page').count())) throw new Error('錯題本入口未開啟');
  await page.getByRole('button', { name: '返回首頁' }).click();
  await page.getByTestId('practice-center-entry').click();
  await page.getByTestId('practice-writing-card').getByRole('button', { name: '開始簡答／默寫練習' }).click();
  if (!(await page.locator('body').innerText()).includes('簡答／默寫練習')) throw new Error('簡答／默寫未進入既有流程');
  console.log('SPRINT 17 VERIFY PASSED');
} catch (error) {
  console.error(error);
  console.error('Last step:', step);
  process.exitCode = 1;
} finally {
  clearTimeout(timeout);
  try { await browser?.close(); } catch {}
  if (server && !server.killed) server.kill('SIGTERM');
}
