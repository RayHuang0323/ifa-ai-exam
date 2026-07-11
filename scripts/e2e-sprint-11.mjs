import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';

const url = 'http://127.0.0.1:5173';
const chrome = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
let server;
let browser;
let step = 'init';
const timeout = setTimeout(() => { console.error('Timeout at:', step); server?.kill(); process.exit(1); }, 90000);
const waitForServer = async () => { for (let index = 0; index < 60; index += 1) { try { if ((await fetch(url)).ok) return; } catch {} await new Promise((resolve) => setTimeout(resolve, 500)); } throw new Error('Vite did not start'); };
const text = (page) => page.locator('body').innerText({ timeout: 10000 });

try {
  step = 'start server'; console.log('[Sprint11] start server');
  server = spawn('cmd.exe', ['/c', 'npm.cmd run dev -- --host 127.0.0.1 --port 5173'], { stdio: 'ignore' });
  await waitForServer();
  step = 'launch browser'; console.log('[Sprint11] launch browser');
  browser = await chromium.launch({ executablePath: chrome, headless: true });
  const page = await browser.newPage();
  step = 'load legacy data'; console.log('[Sprint11] legacy compatibility');
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.evaluate(() => localStorage.setItem('ifa-study-progress-v1', JSON.stringify({ version: 1, sessions: [{ id: 'legacy', date: '2026-07-11', weekId: 'week-1', mode: 'formal-exam', answeredCount: 1, correctCount: 1, wrongCount: 0, durationSeconds: 10, completedAt: '2026-07-11T00:00:00.000Z' }], lastStudyDate: null, currentStreak: 0, longestStreak: 0 })));
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 15000 });
  if (!(await text(page)).includes('部分舊紀錄無題目 ID，覆蓋率為估算。')) throw new Error('Legacy coverage notice missing');
  step = 'start daily task'; console.log('[Sprint11] start daily task');
  await page.getByTestId('primary-today-task').click({ timeout: 10000 });
  await page.getByRole('button', { name: '確認開始測驗' }).click({ timeout: 10000 });
  for (let index = 0; index < 15; index += 1) {
    const radio = page.getByRole('radio').first();
    const checkbox = page.getByRole('checkbox').first();
    const answer = page.getByLabel('文字答案');
    if (await radio.count()) await radio.click({ timeout: 10000 });
    else if (await checkbox.count()) await checkbox.click({ timeout: 10000 });
    else await answer.fill('測試作答', { timeout: 10000 });
    if (index < 14) await page.getByRole('button', { name: '下一題' }).click({ timeout: 10000 });
  }
  step = 'submit session'; console.log('[Sprint11] submit session');
  await page.getByRole('button', { name: '交卷' }).first().click({ timeout: 10000 });
  await page.getByRole('button', { name: '確認交卷' }).click({ timeout: 10000 });
  const session = await page.evaluate(() => { const progress = JSON.parse(localStorage.getItem('ifa-study-progress-v1') ?? '{}'); return progress.sessions?.at(-1); });
  if (!session || session.questionIds?.length !== 15 || !Array.isArray(session.correctQuestionIds) || !Array.isArray(session.wrongQuestionIds) || !Array.isArray(session.skippedQuestionIds)) throw new Error('Detailed StudySession missing question IDs');
  console.log('SPRINT 11 VERIFY PASSED');
  process.exitCode = 0;
} catch (error) { console.error(error); console.error('Last step:', step); process.exitCode = 1; } finally { clearTimeout(timeout); try { await browser?.close(); } catch {} if (server && !server.killed) server.kill('SIGTERM'); }
