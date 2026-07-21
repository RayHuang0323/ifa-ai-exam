import { createServer } from 'vite';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const read = (relativePath) => readFile(join(root, relativePath), 'utf8');
const server = await createServer({ root, logLevel: 'error', optimizeDeps: { noDiscovery: true }, server: { middlewareMode: true } });

try {
  const engine = await server.ssrLoadModule('/src/utils/questionEngine.ts');
  const [week1, week2, sourceBase, sourceExpansion, practice, version, result, coach, app, daily, distIndex] = await Promise.all([
    read('src/data/questions/week1.json').then(JSON.parse),
    read('src/data/questions/week2.json').then(JSON.parse),
    read('src/data/questions/source-verified.json').then(JSON.parse),
    read('src/data/questions/source-verified-sprint36.json').then(JSON.parse),
    read('src/data/questions/exam-practice.json').then(JSON.parse),
    read('src/config/questionBankVersion.ts'),
    read('src/components/Result.tsx'),
    read('src/views/CoachDashboard.tsx'),
    read('src/App.tsx'),
    read('src/utils/dailyTaskV2.ts'),
    read('dist/index.html'),
  ]);
  const source = [...sourceBase, ...sourceExpansion];
  const formal = engine.getFormalQuestionPool();
  const dailyPool = engine.getDailyQuestionPool();
  const practiceEligible = engine.getPracticeQuestionPool();
  const excludedFormal = formal.filter((question) => question.practiceOnly === true || question.formalScoreEligible === false || question.deprecated === true || question.isActive === false || ['needs_review', 'practice_review', 'safety_review', 'mock_only'].includes(question.reviewStatus));
  const errors = [];
  if (week1.length !== 20 || week2.length !== 21 || source.length < 84) errors.push(`題庫原始數量異常：Week1=${week1.length}、Week2=${week2.length}、source_verified=${source.length}`);
  if (formal.length !== 41 + source.length || dailyPool.length !== formal.length + 974 || practiceEligible.length !== 974) errors.push(`Question Engine 數量異常：formal=${formal.length}、daily=${dailyPool.length}、practice=${practiceEligible.length}`);
  if (new Set(formal.map((question) => question.id)).size !== formal.length) errors.push('Full Mock 正式池含重複 ID');
  if (excludedFormal.length) errors.push(`Full Mock 含排除題：${excludedFormal.map((question) => question.id).join(', ')}`);
  if (!source.every((question) => question.verificationType === 'source_verified' && question.evidenceExcerpt && question.answerBasis && question.sourceEvidenceIds?.length)) errors.push('source_verified 缺 evidenceExcerpt、answerBasis 或 sourceEvidenceIds');
  if (!version.includes("sprint36-source-verified-v2") || !version.includes(`fullMockEligibleCount: ${formal.length}`) || !version.includes(`dailyWeeklyPoolCount: ${dailyPool.length}`)) errors.push('題庫版本常數內容不完整');
  if (!result.includes('answerBasis') || !result.includes('question.verificationType === \'source_verified\'')) errors.push('Result 未接線 source_verified 答案依據顯示');
  if (!coach.includes('questionBankVersionLabel') || !coach.includes('question-bank-version')) errors.push('Coach Test 未顯示題庫版本');
  if (!app.includes('getFormalQuestionPool()') || !app.includes('dailyMaximum')) errors.push('正式模擬考或 Daily 上限接線缺失');
  if (!daily.includes('dailyTarget = 30') || !daily.includes('dailyMaximum = 90')) errors.push('Daily 30／90 題規則缺失');
  if (!distIndex.includes('assets/')) errors.push('dist/index.html 未指向 production asset');
  if (errors.length) { console.error('SPRINT 35.1 VERIFY FAILED'); errors.forEach((error) => console.error(`- ${error}`)); process.exit(1); }
  console.log(JSON.stringify({ verifiedCount: week1.length + week2.length, sourceVerifiedCount: source.length, fullMockCount: formal.length, dailyWeeklyPoolCount: dailyPool.length, practiceEligibleCount: practiceEligible.length, dailyBasicTarget: 30, dailyMaximum: 90, sourceEvidenceFields: true, resultShowsAnswerBasis: true, coachShowsVersion: true }, null, 2));
  console.log('SPRINT 35.1 VERIFY PASSED');
} finally {
  await server.close();
}
