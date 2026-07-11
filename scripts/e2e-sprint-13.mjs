import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';

const url = 'http://127.0.0.1:5173';
let server; let browser; let step = 'init';
const timeout = setTimeout(() => { console.error('Timeout:', step); server?.kill(); process.exit(1); }, 90000);
const waitForServer = async () => { for (let index = 0; index < 60; index += 1) { try { if ((await fetch(url)).ok) return; } catch {} await new Promise((resolve) => setTimeout(resolve, 500)); } throw new Error('Vite did not start'); };
try {
  step = 'start'; server = spawn('cmd.exe', ['/c', 'npm.cmd run dev -- --host 127.0.0.1 --port 5173'], { stdio: 'ignore' }); await waitForServer(); browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true }); const page = await browser.newPage();
  step = 'home'; await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 }); const home = await page.locator('body').innerText();
  for (const label of ['今天：', '考試日：', '距離 IFA 考試']) if (!home.includes(label)) throw new Error(`Missing ${label}`);
  if (home.includes('90 分鐘') && home.includes('今日任務')) throw new Error('Daily task shows 90 minutes');
  step = 'formal'; await page.getByRole('button', { name: '開始測驗' }).click({ timeout: 10000 }); const instructions = await page.locator('body').innerText(); if (!instructions.includes('90 分鐘')) throw new Error('Formal exam no longer shows 90 minutes');
  step = 'review'; await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 }); await page.evaluate(() => localStorage.setItem('ifa-wrong-answers-v1', JSON.stringify([{ questionId: 1, weekId: 'week-1', wrongCount: 1, correctReviewCount: 0, consecutiveCorrect: 0, lastWrongAt: new Date().toISOString(), lastReviewedAt: null, masteredAt: null, status: 'newWrong', lastSelectedAnswer: '肺動脈', correctAnswer: '肺靜脈', questionType: 'single', source: 'week-1' }]))); await page.reload({ waitUntil: 'domcontentloaded', timeout: 15000 }); await page.getByTestId('start-wrong-review-button').click({ timeout: 10000 }); await page.getByRole('button', { name: '確認開始複習' }).click({ timeout: 10000 }); await page.getByRole('radio', { name: '肺靜脈' }).click({ timeout: 10000 }); await page.getByRole('button', { name: '交卷' }).first().click({ timeout: 10000 }); await page.getByRole('button', { name: '確認交卷' }).click({ timeout: 10000 }); const result = await page.locator('body').innerText(); for (const label of ['錯題複習完成', '本次答對', '本次仍需加強', '目前已熟練']) if (!result.includes(label)) throw new Error(`Missing review result ${label}`); if (result.includes('本次仍需加強 1 題')) throw new Error('Correct answer counted as still wrong');
  console.log('SPRINT 13 VERIFY PASSED'); process.exitCode = 0;
} catch (error) { console.error(error); console.error('Last step:', step); process.exitCode = 1; } finally { clearTimeout(timeout); try { await browser?.close(); } catch {} if (server && !server.killed) server.kill('SIGTERM'); }
