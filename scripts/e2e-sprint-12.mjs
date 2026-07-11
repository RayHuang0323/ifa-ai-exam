import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';

const url = 'http://127.0.0.1:5173';
const chrome = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
let server;
let browser;
let step = 'init';
const timer = setTimeout(() => { console.error('Timeout:', step); server?.kill(); process.exit(1); }, 90000);
const waitForServer = async () => { for (let index = 0; index < 60; index += 1) { try { if ((await fetch(url)).ok) return; } catch {} await new Promise((resolve) => setTimeout(resolve, 500)); } throw new Error('Vite did not start'); };

try {
  step = 'start server'; server = spawn('cmd.exe', ['/c', 'npm.cmd run dev -- --host 127.0.0.1 --port 5173'], { stdio: 'ignore' }); await waitForServer();
  step = 'launch browser'; browser = await chromium.launch({ executablePath: chrome, headless: true }); const page = await browser.newPage();
  step = 'empty state'; await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 }); await page.evaluate(() => localStorage.clear()); await page.reload({ waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.getByTestId('practice-center-entry').click(); if (!(await page.getByTestId('practice-wrong-review-card').innerText()).includes('目前沒有可複習錯題')) throw new Error('Wrong review empty state missing');
  step = 'seed wrong answer'; await page.evaluate(() => localStorage.setItem('ifa-wrong-answers-v1', JSON.stringify([{ questionId: 1, weekId: 'week-1', wrongCount: 1, correctReviewCount: 0, consecutiveCorrect: 0, lastWrongAt: new Date().toISOString(), lastReviewedAt: null, masteredAt: null, status: 'newWrong', lastSelectedAnswer: '肺動脈', correctAnswer: '肺靜脈', questionType: 'single', source: 'week-1' }]))); await page.reload({ waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.getByTestId('practice-center-entry').click(); await page.getByTestId('practice-wrong-review-card').getByRole('button', { name: '開始錯題複習' }).click({ timeout: 10000 });
  step = 'instructions'; if (!(await page.locator('body').innerText()).includes('錯題複習')) throw new Error('Wrong review instructions missing'); await page.getByRole('button', { name: '確認開始複習' }).click({ timeout: 10000 });
  step = 'answer'; await page.getByRole('radio', { name: '肺靜脈' }).click({ timeout: 10000 }); await page.getByRole('button', { name: '交卷' }).first().click({ timeout: 10000 }); await page.getByRole('button', { name: '確認交卷' }).click({ timeout: 10000 });
  step = 'storage'; const result = await page.evaluate(() => ({ progress: JSON.parse(localStorage.getItem('ifa-study-progress-v1') ?? '{}'), wrong: JSON.parse(localStorage.getItem('ifa-wrong-answers-v1') ?? '[]') })); const session = result.progress.sessions?.at(-1); const wrong = result.wrong.find((record) => record.questionId === 1);
  if (session?.mode !== 'reviewWrong' || !Array.isArray(session.questionIds) || !(wrong?.correctReviewCount > 0 || wrong?.consecutiveCorrect > 0)) throw new Error('Review persistence missing');
  console.log('SPRINT 12 VERIFY PASSED'); process.exitCode = 0;
} catch (error) { console.error(error); console.error('Last step:', step); process.exitCode = 1; } finally { clearTimeout(timer); try { await browser?.close(); } catch {} if (server && !server.killed) server.kill('SIGTERM'); }
