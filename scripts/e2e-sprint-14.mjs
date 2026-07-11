import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';

const url = 'http://127.0.0.1:5173';
const text = {
  openBook: '\u67e5\u770b\u932f\u984c\u672c',
  title: '\u932f\u984c\u672c',
  empty: '\u76ee\u524d\u9084\u6c92\u6709\u932f\u984c\u3002',
  returnHome: '\u8fd4\u56de\u9996\u9801',
  total: '\u932f\u984c\u7e3d\u6578',
  reviewable: '\u5f85\u8907\u7fd2',
  status: '\u9ad8\u98a8\u96aa',
  review: '\u958b\u59cb\u8907\u7fd2\u76ee\u524d\u7be9\u9078\u984c\u76ee',
  reviewInstructions: '\u932f\u984c\u8907\u7fd2',
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

  step = 'empty wrong book';
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 15000 });
  if (!(await page.getByTestId('open-wrong-book-button').count())) throw new Error('Wrong book entry missing from home');
  await page.getByTestId('open-wrong-book-button').click();
  if (!(await page.getByTestId('wrong-book-empty').innerText()).includes(text.empty)) throw new Error('Wrong book empty state missing');
  await page.getByRole('button', { name: text.returnHome }).click();

  step = 'seed and open wrong book';
  await page.evaluate(() => localStorage.setItem('ifa-wrong-answers-v1', JSON.stringify([{
    questionId: 1,
    weekId: 'week-1',
    wrongCount: 2,
    correctReviewCount: 0,
    consecutiveCorrect: 0,
    lastWrongAt: new Date().toISOString(),
    lastReviewedAt: null,
    masteredAt: null,
    status: 'highRisk',
    lastSelectedAnswer: '\u80ba\u52d5\u8108',
    correctAnswer: '\u80ba\u975c\u8108',
    questionType: 'single',
    source: 'week-1',
  }])));
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.getByTestId('open-wrong-book-button').click();
  const book = await page.getByTestId('wrong-book-page').innerText();
  for (const label of [text.title, text.total, text.reviewable, text.status, '1']) if (!book.includes(label)) throw new Error(`Missing wrong book content: ${label}`);
  if (!(await page.getByTestId('wrong-book-list').innerText()).includes('\u984c\u76ee ID\uff1a1')) throw new Error('Wrong book question entry missing');

  step = 'start filtered review';
  await page.getByTestId('wrong-book-review-filter-button').click();
  if (!(await page.locator('body').innerText()).includes(text.reviewInstructions)) throw new Error('Filtered wrong book review did not enter reviewWrong instructions');

  console.log('SPRINT 14 VERIFY PASSED');
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
