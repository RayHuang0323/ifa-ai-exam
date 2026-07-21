import { createServer } from 'vite';
import { readFile } from 'node:fs/promises';
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
const server = await createServer({ root, logLevel: 'error', optimizeDeps: { noDiscovery: true }, server: { middlewareMode: true } });
try {
  const result = await server.ssrLoadModule('/src/components/Result.tsx');
  const aiGrading = await server.ssrLoadModule('/src/services/aiGrading.ts');
  const aiStore = await server.ssrLoadModule('/src/utils/aiReviewStore.ts');
  const questionEngine = await server.ssrLoadModule('/src/utils/questionEngine.ts');
  const nonChoiceValidator = await readFile(new URL('./validate-nonchoice-learning.mjs', import.meta.url), 'utf8');

  const questions = [
    { id: 1, type: 'multipleChoice', answer: 'A', chapter: '', question: '選擇題', explanation: '解析' },
    { id: 2, type: 'shortAnswer', answer: '參考答案', referenceAnswer: '參考答案', sampleAnswer: '高分示範答案', keyPoints: ['重點一', '重點二', '重點三'], rubric: [{ score: 3 }], commonOmissions: ['漏答'], teacherExplanation: '老師解析', sourceLabel: '教材來源', sourceFile: '教材.txt', sourcePage: '待補', chapter: '', question: '簡答題', explanation: '解析', practiceOnly: true, formalScoreEligible: false },
    { id: 3, type: 'case_study', answer: '安全答題方向', referenceAnswer: '安全答題方向', sampleAnswer: '案例示範', keyPoints: ['評估', '禁忌', '轉介'], rubric: [{ score: 3 }], commonOmissions: ['漏答安全界線'], teacherExplanation: '案例解析', sourceLabel: '教材來源', sourceFile: '教材.txt', sourcePage: '待補', riskLevel: 'safety_review', chapter: '', question: '案例題', explanation: '解析', practiceOnly: true, formalScoreEligible: false },
  ];
  const stats = result.getResultStats(questions, { 1: 'A', 2: '我的答案', 3: '我的案例答案' });
  if (stats.autoGradedCount !== 1 || stats.correctCount !== 1 || stats.accuracy !== 100 || stats.pendingSelfCheckCount !== 2 || stats.reviewItems.length !== 3) throw new Error('非選擇題不應混入自動判分正確率');

  let fetchMode = 'disabled';
  globalThis.fetch = async () => new Response(JSON.stringify(fetchMode === 'disabled' ? { success: false, status: 'disabled' } : { success: true, status: 'graded', data: { aiReviewStatus: 'mostly_mastered', aiReviewLabel: '大致掌握', aiScoreSuggestion: 2, matchedKeyPoints: ['評估'], missingKeyPoints: ['轉介'], riskFlags: [], feedback: '補強安全界線。', sourceBasis: ['教材來源'], confidence: 'medium' } }), { status: 200 });
  const input = { questionId: 2, sessionId: 'sprint32', examType: 'daily', question: '簡答題', type: 'shortAnswer', userAnswer: '我的答案', referenceAnswer: '參考答案', sampleAnswer: '示範答案', keyPoints: ['評估'], rubric: [{ score: 3 }], sourceLabel: '教材來源', sourcePage: '待補', practiceOnly: true, formalScoreEligible: false };
  const disabled = await aiGrading.requestAiGradeAnswer(input);
  if (disabled.status !== 'disabled') throw new Error('未設定 AI endpoint 時 fallback 失敗');
  fetchMode = 'graded';
  const graded = await aiGrading.requestAiGradeAnswer(input);
  if (graded.status !== 'graded' || graded.review.aiScoreSuggestion !== 2 || graded.review.aiScoreMax !== 3 || graded.review.aiReviewLabel !== '大致掌握') throw new Error('AI 0～3 分結果解析失敗');
  aiStore.recordAiReview(graded.review);
  if (!aiStore.getAiReview(2, 'sprint32') || aiStore.getAiReviewsForSession('sprint32').length !== 1) throw new Error('AI 評分本機保存失敗');

  if (questionEngine.getFormalQuestionPool().length < 41 || questionEngine.getDailyQuestionPool().length <= questionEngine.getFormalQuestionPool().length || questionEngine.getPracticeQuestionPool().some((question) => question.practiceOnly !== true)) throw new Error('verified-only 或 practiceOnly 邊界失敗');
  if (!nonChoiceValidator.includes('referenceAnswer') || !nonChoiceValidator.includes('sampleAnswer') || !nonChoiceValidator.includes('keyPoints') || !nonChoiceValidator.includes('sourcePage')) throw new Error('非選擇題內容 validator 規則缺失');

  const distIndex = await readFile(new URL('../dist/index.html', import.meta.url), 'utf8').catch(() => '');
  const distAsset = (distIndex.match(/assets\/index-[^"']+\.js/) || [])[0];
  const distFiles = distAsset ? await readFile(new URL(`../dist/${distAsset.slice('assets/'.length)}`, import.meta.url), 'utf8').catch(() => '') : '';
  const [resultSource, aiSource, appsScriptSource] = await Promise.all([
    readFile(new URL('../src/components/Result.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/services/aiGrading.ts', import.meta.url), 'utf8'),
    readFile(new URL('../docs/google-apps-script/Code.gs', import.meta.url), 'utf8'),
  ]);
  for (const label of ['參考答案', '高分示範答案', '評分重點', '老師解析', '常見漏答提醒', '教材來源', '規準輔助評分', '掌握程度', '參考依據', '信心程度']) if (!resultSource.includes(label)) throw new Error(`Result 缺少中文欄位：${label}`);
  if (!resultSource.includes('未作答，請先參考答案與解析') || !resultSource.includes('不列入正式 verified 成績')) throw new Error('未作答或正式成績隔離提示缺失');
  if (!aiSource.includes('VITE_PROGRESS_WRITE_KEY') || aiSource.includes('AI_GRADING_API_KEY')) throw new Error('前端 AI 金鑰邊界錯誤');
  if (!appsScriptSource.includes("body.action === 'aiGradeAnswer'") || !appsScriptSource.includes('AI_GRADING_API_KEY') || !appsScriptSource.includes("status:'disabled'") || !appsScriptSource.includes('needs_human_review')) throw new Error('Apps Script AI endpoint 安全 fallback 缺失');
  if (distFiles && /AI_GRADING_API_KEY|sk-[A-Za-z0-9]{20,}/.test(distFiles)) throw new Error('production bundle 疑似包含 AI API Key');
  if (resultSource.includes('>referenceAnswer<') || resultSource.includes('>sampleAnswer<') || resultSource.includes('>rubric<') || resultSource.includes('>aiReviewStatus<')) throw new Error('介面直接顯示英文內部欄位名稱');
  console.log('SPRINT 32 VERIFY PASSED');
} finally {
  await server.close();
}
