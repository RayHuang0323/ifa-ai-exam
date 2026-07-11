import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';

const URL = 'http://127.0.0.1:5173';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const UI = {
  startExam: '開始測驗', confirmStart: '確認開始測驗', leaveExam: '離開測驗',
  confirmLeave: '結束本次測驗並返回首頁', resumeExam: '繼續模擬測驗',
  task: /開始今日任務：Week1.*?(\d+) 題/,
  forbidden: ['Exam Center', 'Recent Activity', 'Data Syncing', 'Learning Roadmap', 'Active', 'Locked', 'Coming Soon'],
  required: ['最近學習紀錄', '練習中心', '進入練習中心'],
};
let server; let browser; let currentStep = 'init';
const hardTimeout = setTimeout(() => { console.error('[Fatal] timeout'); console.error('Last step:', currentStep); server?.kill(); process.exit(1); }, 90000);
const step = (name) => { currentStep = name; console.log(name); };
const waitForServer = async () => { for (let i = 0; i < 60; i += 1) { try { if ((await fetch(URL)).ok) return; } catch {} await new Promise((r) => setTimeout(r, 500)); } throw new Error('Vite did not start'); };
const body = (page) => page.locator('body').innerText({ timeout: 10000 });
const clickButton = (page, name) => page.getByRole('button', { name }).click({ timeout: 10000 });
const fail = async (page, message) => { console.error('URL:', page.url()); console.error((await body(page)).slice(0, 1000)); console.error('draft:', await page.evaluate(() => localStorage.getItem('ifa-week1-exam-draft-v1'))); throw new Error(message); };
async function verifyResume(page) { step('[Resume] start'); await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 15000 }); await page.evaluate(() => localStorage.clear()); await page.reload({ waitUntil: 'domcontentloaded', timeout: 15000 }); step('[Resume] enter'); await page.getByTestId('practice-center-entry').click(); await page.getByTestId('practice-formal-exam-card').getByRole('button', { name: '開始完整模擬考' }).click({ timeout: 10000 }); await clickButton(page, UI.confirmStart); await page.getByRole('radio').first().click({ timeout: 10000 }); step('[Resume] leave'); await clickButton(page, UI.leaveExam); await clickButton(page, UI.confirmLeave); step('[Resume] check'); if (!(await body(page)).includes(UI.resumeExam)) await fail(page, 'Resume button missing'); if (!(await page.evaluate(() => localStorage.getItem('ifa-week1-exam-draft-v1')))) await fail(page, 'Draft missing'); await clickButton(page, UI.resumeExam); }
async function verifyTaskCount(page) { step('[Task] start'); await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 15000 }); const button = page.getByRole('button', { name: UI.task }).first(); const match = (await button.innerText({ timeout: 10000 })).match(/(\d+) 題/); const count = match?.[1]; if (!count) throw new Error('Task count missing'); await button.click({ timeout: 10000 }); const text = await body(page); if (!text.includes('題目數') || !text.includes(`${count} 題`)) await fail(page, 'Instruction count mismatch'); await clickButton(page, UI.confirmStart); if (!(await body(page)).includes(`第 1 題 / 共 ${count} 題`)) await fail(page, 'Exam count mismatch'); }
async function verifyChineseUi(page) { step('[UI] scan'); await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 15000 }); const text = await body(page); for (const item of UI.forbidden) if (text.includes(item)) await fail(page, `English UI: ${item}`); for (const item of UI.required) if (!text.includes(item)) await fail(page, `Chinese UI missing: ${item}`); }
async function verifyHomeFocus(page) {
  step('[Home] task focus');
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
  const text = await body(page);
  if (text.includes('今日建議')) await fail(page, 'Duplicate today suggestion card found');
  const coverageText = await page.getByTestId('week1-coverage').innerText({ timeout: 10000 });
  if (!coverageText.includes('已練習') || !coverageText.includes('尚未練習')) await fail(page, 'Coverage card missing');
  if (!text.includes('今日完成後，剩餘題目將於後續每日任務、每週複習與正式模擬考中安排。')) await fail(page, 'Task explanation missing');
  if (await page.getByTestId('primary-today-task').count() !== 1) await fail(page, 'Primary task CTA count is not one');
}
async function main() { step('[Server] start'); server = spawn('cmd.exe', ['/c', 'npm.cmd run dev -- --host 127.0.0.1 --port 5173'], { stdio: 'ignore' }); step('[Server] wait'); await waitForServer(); step('[Browser] launch'); browser = await chromium.launch({ executablePath: CHROME, headless: true }); const page = await browser.newPage(); await verifyResume(page); await verifyTaskCount(page); await verifyChineseUi(page); await verifyHomeFocus(page); console.log('VERIFY PASSED'); }
try { await main(); process.exitCode = 0; } catch (error) { console.error(error); console.error('Last step:', currentStep); process.exitCode = 1; } finally { clearTimeout(hardTimeout); try { await browser?.close(); } catch {} if (server && !server.killed) server.kill('SIGTERM'); }
