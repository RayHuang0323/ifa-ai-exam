import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';

const url = 'http://127.0.0.1:5173';
const text = {
  title: '\u7c21\u7b54\uff0f\u9ed8\u5beb\u7df4\u7fd2',
  start: '\u958b\u59cb\u7c21\u7b54\uff0f\u9ed8\u5beb\u7df4\u7fd2',
  confirm: '\u78ba\u8a8d\u958b\u59cb\u7df4\u7fd2',
  reference: '\u53c3\u8003\u7b54\u6848',
  rubric: '\u81ea\u6211\u6aa2\u6838\u9ede',
  needsReview: '\u6211\u9700\u8981\u8907\u7fd2',
  complete: '\u7c21\u7b54\uff0f\u9ed8\u5beb\u7df4\u7fd2\u5b8c\u6210',
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

  step = 'open writing practice';
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 15000 });
  if (!(await page.getByTestId('writing-practice-section').innerText()).includes(text.title)) throw new Error('Writing practice entry missing');
  await page.getByTestId('start-writing-practice-button').click();
  await page.getByRole('button', { name: text.confirm }).click();

  step = 'answer and self check';
  await page.getByLabel('\u6587\u5b57\u7b54\u6848').fill('\u80ba\u975c\u8108\u5c07\u80ba\u90e8\u542b\u6c27\u8840\u9001\u56de\u5de6\u5fc3\u623f\u3002');
  await page.getByTestId('submit-self-check-button').click();
  const selfCheck = await page.locator('[role="dialog"]').innerText();
  for (const label of [text.reference, text.rubric, text.needsReview]) if (!selfCheck.includes(label)) throw new Error(`Missing self-check content: ${label}`);
  await page.getByTestId('self-check-needs-review-button').click();
  if (!(await page.locator('body').innerText()).includes(text.complete)) throw new Error('Writing practice result missing');

  step = 'persistence and recent activity';
  const stored = await page.evaluate(() => ({ progress: JSON.parse(localStorage.getItem('ifa-study-progress-v1') ?? '{}'), wrong: JSON.parse(localStorage.getItem('ifa-wrong-answers-v1') ?? '[]') }));
  const session = stored.progress.sessions?.at(-1);
  if (session?.mode !== 'writingPractice' || !session.wrongQuestionIds?.includes(9001) || !stored.wrong.some((record) => record.questionId === 9001)) throw new Error('Writing practice persistence missing');
  await page.getByRole('button', { name: '\u8fd4\u56de\u9996\u9801' }).click();
  if (!(await page.getByTestId('recent-activity-list').innerText()).includes(text.title)) throw new Error('Recent activity missing writing practice');

  console.log('SPRINT 16 VERIFY PASSED');
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
