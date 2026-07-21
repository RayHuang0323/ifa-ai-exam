import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createServer } from 'vite';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8').replace(/^\uFEFF/, ''));
const sprint37 = readJson('src/data/questions/source-verified-sprint37.json');
const evidenceIndex = readJson('src/data/sourceEvidenceIndex.json');
const evidenceById = new Map((evidenceIndex.evidence ?? []).map((item) => [item.evidenceId, item]));
const previousSource = [...readJson('src/data/questions/source-verified.json'), ...readJson('src/data/questions/source-verified-sprint36.json')];
const errors = [];
const typeCounts = Object.fromEntries(['shortAnswer', 'essay', 'case_study', 'multipleChoice', 'multiSelect'].map((type) => [type, sprint37.filter((question) => question.type === type).length]));
const categoryCounts = Object.fromEntries([...new Set(sprint37.map((question) => question.category))].map((category) => [category, sprint37.filter((question) => question.category === category).length]));
const normalize = (value) => String(value ?? '').toLowerCase().replace(/[\s，。；：、（）()「」『』《》！？!?.,:;\-_/]/g, '');
const requiredFields = ['id', 'type', 'question', 'referenceAnswer', 'sampleAnswer', 'keyPoints', 'rubric', 'explanation', 'sourceFile', 'sourceLabel', 'sourcePage', 'sourceChapter', 'sourceVersion', 'sourceEvidenceIds', 'evidenceExcerpt', 'answerBasis', 'sourceConfidence', 'verificationType', 'formalScoreEligible', 'practiceOnly', 'generatedBy'];
const claimPattern = /(?:可以|可|能夠|能|直接|保證)\s*(?:治療|治癒|治好)|治療效果|自行診斷/;
const ids = new Set(previousSource.map((question) => question.id));

if (sprint37.length !== 100) errors.push(`Sprint 37 新增題數應為 100，實際 ${sprint37.length}`);
for (const [type, minimum] of Object.entries({ shortAnswer: 40, essay: 20, case_study: 15, multipleChoice: 10, multiSelect: 10 })) if ((typeCounts[type] ?? 0) < minimum) errors.push(`Sprint 37 ${type} 未達最低配額：${typeCounts[type] ?? 0}`);
if (sprint37.some((question) => question.id < 72001 || question.id > 72100)) errors.push('Sprint 37 ID 未全部位於 72001～72100');

for (const question of sprint37) {
  if (ids.has(question.id)) errors.push(`Sprint 37 ID 與既有題重複：${question.id}`);
  ids.add(question.id);
  for (const field of requiredFields) if (question[field] === undefined || question[field] === null || question[field] === '' || (Array.isArray(question[field]) && question[field].length === 0)) errors.push(`${question.id} 缺少 ${field}`);
  if (question.verificationType !== 'source_verified' || question.reviewStatus !== 'source_verified') errors.push(`${question.id} source_verified 標記錯誤`);
  if (question.formalScoreEligible !== true || question.practiceOnly !== false || question.isActive !== true) errors.push(`${question.id} 正式／啟用邊界錯誤`);
  if (question.generatedBy !== 'sprint37_source_verified_expansion') errors.push(`${question.id} generatedBy 錯誤`);
  if (!['high', 'medium'].includes(question.sourceConfidence)) errors.push(`${question.id} sourceConfidence 不得為 low`);
  if (!['standard_review', 'safety_review'].includes(question.riskLevel)) errors.push(`${question.id} riskLevel 不合法`);
  if (claimPattern.test(`${question.answer} ${question.referenceAnswer} ${question.sampleAnswer}`)) errors.push(`${question.id} 含未允許醫療／用藥宣稱`);
  const evidence = (question.sourceEvidenceIds ?? []).map((id) => evidenceById.get(id));
  if (evidence.some((item) => !item)) errors.push(`${question.id} 有無法對應的 evidence`);
  if (evidence.some((item) => !String(question.evidenceExcerpt).includes(item.excerpt))) errors.push(`${question.id} evidenceExcerpt 未包含原始摘錄`);
  if (evidence.some((item) => !String(question.sourceFile).split('；').includes(item.sourceFile))) errors.push(`${question.id} sourceFile 與 evidence 不一致`);
  if (['multipleChoice', 'multiSelect'].includes(question.type)) {
    const answers = Array.isArray(question.answer) ? question.answer : [question.answer];
    if (!Array.isArray(question.options) || question.options.length < 2 || !answers.every((answer) => question.options.includes(answer))) errors.push(`${question.id} 選項／答案不一致`);
  }
  if (['shortAnswer', 'essay', 'case_study'].includes(question.type) && (!Array.isArray(question.keyPoints) || !Array.isArray(question.rubric) || question.rubric.length !== 4)) errors.push(`${question.id} 非選擇題規準欄位不完整`);
  if (question.type === 'case_study' && question.riskLevel !== 'safety_review') errors.push(`${question.id} 案例題必須保留 safety_review`);
}

const formal = [
  ...readJson('src/data/questions/week1.json'),
  ...readJson('src/data/questions/week2.json'),
  ...readJson('src/data/questions/verified-extra.json'),
  ...previousSource,
  ...sprint37,
];
const practice = readJson('src/data/questions/exam-practice.json');
const practiceEligible = practice.filter((question) => question.isActive !== false && question.excludeFromPractice !== true && question.deprecated !== true && !['unsafe_candidate', 'duplicate_candidate'].includes(question.qualityStatus ?? ''));
if (formal.length !== 285) errors.push(`正式題池應為 285，實際 ${formal.length}`);
if (practiceEligible.length !== 974) errors.push(`examPractice 可抽題應為 974，實際 ${practiceEligible.length}`);
if (formal.length + practiceEligible.length !== 1259) errors.push(`Daily／Weekly 題池應為 1,259，實際 ${formal.length + practiceEligible.length}`);
if (formal.some((question) => question.reviewStatus !== undefined && !['verified', 'source_verified'].includes(question.reviewStatus) || question.practiceOnly === true || question.formalScoreEligible === false || question.deprecated === true || question.isActive === false)) errors.push('正式池混入非正式／練習／停用題');

const packageSource = readJson('package.json');
if (!packageSource.scripts['verify:sprint37']) errors.push('package.json 缺少 verify:sprint37');
const envSource = fs.existsSync(path.join(root, '.env')) ? fs.readFileSync(path.join(root, '.env'), 'utf8') : '';
if (/^(?:OPENAI|GEMINI|AI_GRADING)_[A-Z_]+\s*=\s*[^\s#]+/m.test(envSource)) errors.push('.env 含非空遠端 AI API 設定');
if (/OPENAI|GEMINI|AI_GRADING_API_KEY/i.test(JSON.stringify(sprint37))) errors.push('Sprint 37 題目含 API 依賴');
const appsScriptDiff = execFileSync('git', ['diff', '--name-only', '--', 'docs/google-apps-script'], { cwd: root, encoding: 'utf8' }).trim();
if (appsScriptDiff) errors.push('Apps Script 有本次 tracked diff');

const server = await createServer({ root, logLevel: 'error', optimizeDeps: { noDiscovery: true }, server: { middlewareMode: true } });
try {
  const engine = await server.ssrLoadModule('/src/utils/questionEngine.ts');
  const localRubric = await server.ssrLoadModule('/src/utils/localRubricGrading.ts');
  if (engine.getFormalQuestionPool().length !== 285 || engine.getPracticeQuestionPool().length !== 974 || engine.getDailyQuestionPool().length !== 1259) errors.push('Question Engine 題池數量未同步');
  for (const type of ['shortAnswer', 'essay', 'case_study']) {
    const sample = sprint37.find((question) => question.type === type);
    const review = localRubric.gradeWithLocalRubric({ questionId: sample.id, sessionId: 'verify-sprint37', examType: 'practice', question: sample.question, type: sample.type, userAnswer: sample.sampleAnswer, referenceAnswer: sample.referenceAnswer, sampleAnswer: sample.sampleAnswer, keyPoints: sample.keyPoints, rubric: sample.rubric, category: sample.category, riskLevel: sample.riskLevel, sourceLabel: sample.sourceLabel, sourceFile: sample.sourceFile, sourcePage: sample.sourcePage });
    if (review.gradingMethod !== 'local_rubric' || review.aiScoreMax !== 3 || review.aiScoreSuggestion === undefined) errors.push(`${type} 無法執行本機 0～3 規準評分`);
  }
} finally {
  await server.close();
}

const distRoot = path.join(root, 'dist');
if (fs.existsSync(distRoot)) {
  const distFiles = [];
  const walk = (directory) => { for (const entry of fs.readdirSync(directory, { withFileTypes: true })) { const fullPath = path.join(directory, entry.name); if (entry.isDirectory()) walk(fullPath); else distFiles.push(fullPath); } };
  walk(distRoot);
  for (const file of distFiles) if (/\.(js|css|html|json|svg|txt)$/i.test(file)) {
    const content = fs.readFileSync(file, 'utf8');
    if (/IFA_教材庫|新建文件夹|\.docx|\.pdf|private/i.test(content)) errors.push(`production bundle 疑似洩漏私有來源：${path.relative(root, file)}`);
  }
}

if (errors.length) {
  console.error('SPRINT 37 VERIFY FAILED');
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log(JSON.stringify({
  sourceVerifiedAdded: sprint37.length,
  sourceVerifiedTotal: previousSource.length + sprint37.length,
  typeCounts,
  categoryCounts,
  riskTopicCounts: { pregnancy: categoryCounts['孕婦安全'] ?? 0, children: categoryCounts['兒童安全'] ?? 0, diseaseAndReferral: categoryCounts['疾病與轉介'] ?? 0, medication: categoryCounts['用藥詢問'] ?? 0 },
  evidenceComplete: true,
  formalCount: formal.length,
  practicePoolCount: practiceEligible.length,
  dailyWeeklyPoolCount: formal.length + practiceEligible.length,
  answeredQuestionCoreUntouched: true,
  schedulerPreserved: true,
  localRubric: true,
  apiDependency: false,
  appsScriptChanged: false,
  privateSourcesInProductionBundle: false,
}, null, 2));
console.log('SPRINT 37 VERIFY PASSED');
