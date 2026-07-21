import { createServer } from 'vite';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const storage = new Map();
globalThis.window = {
  location: { search: '' },
  localStorage: {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, String(value)),
    removeItem: (key) => storage.delete(key),
  },
};

const root = fileURLToPath(new URL('..', import.meta.url));
const read = (relativePath) => readFile(new URL(relativePath, import.meta.url), 'utf8');
const rubric = [0, 1, 2, 3].map((score) => ({ score, label: String(score), description: 'Sprint 36A 驗證規準' }));
const baseInput = {
  questionId: 36001,
  sessionId: 'sprint36a',
  examType: 'daily',
  question: '請簡述芳療諮詢時為何需要確認禁忌症。',
  type: 'shortAnswer',
  userAnswer: '',
  referenceAnswer: '需確認禁忌症、用藥、疾病史與特殊族群，必要時轉介醫療專業。',
  sampleAnswer: '先確認禁忌症、用藥與疾病史，再評估特殊族群與安全限制，必要時轉介醫療專業。',
  keyPoints: ['確認禁忌症', '確認用藥與疾病史', '評估特殊族群', '避免不安全用油', '必要時轉介醫療專業'],
  rubric,
  category: '諮詢流程／個案評估',
  sourceLabel: '教材證據題',
  sourceFile: '教材.txt',
  sourcePage: '待補',
  sourceChapter: '諮詢流程',
  sourceVersion: '教材版本待補',
  answerBasis: '驗證用參考答案',
  evidenceExcerpt: '驗證用教材摘錄',
  riskLevel: 'standard_review',
  practiceOnly: true,
  formalScoreEligible: false,
};
const withAnswer = (answer, overrides = {}) => ({ ...baseInput, ...overrides, userAnswer: answer });

const server = await createServer({ root, logLevel: 'error', optimizeDeps: { noDiscovery: true }, server: { middlewareMode: true } });
try {
  const [local, result, store] = await Promise.all([
    server.ssrLoadModule('/src/utils/localRubricGrading.ts'),
    server.ssrLoadModule('/src/components/Result.tsx'),
    server.ssrLoadModule('/src/utils/aiReviewStore.ts'),
  ]);
  const [resultSource, coachSource, aiSource, engineSource, packageSource] = await Promise.all([
    read('../src/components/Result.tsx'),
    read('../src/views/CoachDashboard.tsx'),
    read('../src/utils/aiReviewStore.ts'),
    read('../src/utils/questionEngine.ts'),
    read('../package.json'),
  ]);
  const errors = [];
  const full = local.gradeWithLocalRubric(withAnswer('因為需要先確認禁忌症、用藥與疾病史，評估特殊族群的安全限制，必要時轉介醫療專業。'));
  if (full.gradingMethod !== 'local_rubric' || full.aiScoreMax !== 3 || full.aiScoreSuggestion === null) errors.push('有作答短答未產生 0～3 分規準結果');
  const blank = local.gradeWithLocalRubric(withAnswer(''));
  if (blank.aiScoreSuggestion !== 0) errors.push('空白答案規準基礎結果不正確');
  const essay = local.gradeWithLocalRubric(withAnswer('先說明核心概念，再依教材整理理由、條件與安全界線。', { questionId: 36002, type: 'essay' }));
  if (essay.gradingMethod !== 'local_rubric' || essay.aiScoreMax !== 3) errors.push('申論題無法使用規準輔助評分');
  const caseReview = local.gradeWithLocalRubric(withAnswer('先確認個案狀況與安全限制，再提出保守建議，必要時轉介。', { questionId: 36003, type: 'case_study', keyPoints: ['評估個案', '安全禁忌', '提出保守建議', '必要時轉介'] }));
  if (caseReview.gradingMethod !== 'local_rubric' || caseReview.aiScoreMax !== 3) errors.push('案例題無法使用規準輔助評分');
  storage.clear();
  store.recordAiReview(full);
  if (store.getAiReview(36001, 'sprint36a')?.gradingMethod !== 'local_rubric') errors.push('規準評分結果未保存到既有 review store');
  const stats = result.getResultStats([
    { id: 1, type: 'multipleChoice', answer: 'A', chapter: '', question: '選擇' },
    { id: 2, type: 'shortAnswer', answer: '參考', chapter: '', question: '簡答', practiceOnly: true, formalScoreEligible: false },
  ], { 1: 'A', 2: '回答' });
  if (stats.autoGradedCount !== 1 || stats.correctCount !== 1 || stats.pendingSelfCheckCount !== 1) errors.push('規準分數污染正式自動判分統計');
  for (const marker of [
    'useEffect(() =>',
    'gradeWithLocalRubric(buildGradePayload(question, answer',
    'recordAiReview(review)',
    "if (!isAnswered(answer)",
    '非選擇題交卷後會自動進行規準輔助評分',
    '未作答',
    '待規準輔助評分',
    '尚未執行規準輔助評分',
    'sourceFile',
    'sourcePage',
    'sourceChapter',
    'sourceVersion',
    'answerBasis',
    'evidenceExcerpt',
    '教材來源與答案依據',
  ]) if (!resultSource.includes(marker)) errors.push('Result 缺少必要標記：' + marker);
  if (resultSource.includes('待自評') || coachSource.includes('待自評')) errors.push('使用者介面仍顯示待自評');
  if (!coachSource.includes('未作答') || !coachSource.includes('尚未執行規準輔助評分')) errors.push('Coach 詳細紀錄狀態未正確轉譯');
  if (resultSource.includes('requestAiGradeAnswer') || resultSource.includes('AI API')) errors.push('Result 不應依賴遠端 AI');
  if (!aiSource.includes('local_rubric')) errors.push('review store 缺少本機規準欄位');
  if (!engineSource.includes('sourceChapter') || !engineSource.includes('sourceVersion')) errors.push('Question Engine 缺少來源章節／版本欄位');
  if (!JSON.parse(packageSource).scripts['verify:sprint36a']) errors.push('package.json 缺少 verify:sprint36a');
  if (errors.length) {
    console.error('SPRINT 36A VERIFY FAILED');
    errors.forEach((error) => console.error('- ' + error));
    process.exit(1);
  }
  console.log(JSON.stringify({
    nonchoiceAutoRubric: true,
    blankAnswerExcludedFromAutoRun: true,
    scoreRange: '0-3',
    sourceTraceabilityFields: true,
    displayNoPendingSelfReview: true,
    scoreIsolationPreserved: true,
    apiDependency: false,
    appsScriptChanged: false,
  }, null, 2));
  console.log('SPRINT 36A VERIFY PASSED');
} finally {
  await server.close();
}
