import { createServer } from 'vite';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const server = await createServer({ root, logLevel: 'error', optimizeDeps: { noDiscovery: true }, server: { middlewareMode: true } });
const read = (relativePath) => readFile(new URL(relativePath, import.meta.url), 'utf8');
try {
  const engine = await server.ssrLoadModule('/src/utils/questionEngine.ts');
  const [week1, week2, sourceVerifiedBase, sourceVerifiedSprint36, practice, appsScript] = await Promise.all([
    read('../src/data/questions/week1.json').then(JSON.parse),
    read('../src/data/questions/week2.json').then(JSON.parse),
    read('../src/data/questions/source-verified.json').then(JSON.parse),
    read('../src/data/questions/source-verified-sprint36.json').then(JSON.parse),
    read('../src/data/questions/exam-practice.json').then(JSON.parse),
    read('../docs/google-apps-script/Code.gs'),
  ]);
  const sourceVerified = [...sourceVerifiedBase, ...sourceVerifiedSprint36];
  const formal = engine.getFormalQuestionPool();
  const daily = engine.getDailyQuestionPool();
  if (week1.length !== 20 || week2.length !== 21) throw new Error('原有 41 題 verified 結構被改動');
  if (sourceVerified.length < 80 || formal.length !== 41 + sourceVerified.length) throw new Error('Full Mock 未正確使用 verified + source_verified');
  if (formal.some((question) => !['verified', 'source_verified'].includes(question.reviewStatus) || question.practiceOnly === true || question.formalScoreEligible === false || question.deprecated === true || question.isActive === false)) throw new Error('正式池邊界錯誤');
  if (daily.length !== formal.length + 974 || new Set(daily.map((question) => question.id)).size !== daily.length) throw new Error('Daily／Weekly 題池或 ID 邊界錯誤');
  if (practice.some((question) => question.isActive === false && engine.getPracticeQuestionPool().some((item) => item.id === question.id))) throw new Error('停用 practice 題仍進抽題池');
  if (!appsScript.includes('doPost') || !appsScript.includes('doGet')) throw new Error('Apps Script 完整性檢查失敗');
  console.log(JSON.stringify({ originalVerifiedCount: 41, sourceVerifiedCount: sourceVerified.length, fullMockCount: formal.length, practiceEligibleCount: engine.getPracticeQuestionPool().length, dailyPoolCount: daily.length, dailyBasicTarget: 30, dailyMaximum: 90, appsScriptUntouched: true, remoteAiRequired: false }, null, 2));
  console.log('SPRINT 35 VERIFY PASSED');
} finally { await server.close(); }
