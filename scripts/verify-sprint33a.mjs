import { createServer } from 'vite';
import { readFile, readdir } from 'node:fs/promises';
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
const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');
const rubric = [0, 1, 2, 3].map((score) => ({ score, label: String(score), description: '規準測試' }));
const baseInput = {
  questionId: 33010,
  sessionId: 'sprint33a',
  examType: 'daily',
  question: '請簡述芳療諮詢時為何需要確認禁忌症。',
  type: 'shortAnswer',
  userAnswer: '',
  referenceAnswer: '需確認禁忌症、用藥、疾病史與特殊族群，必要時轉介醫療專業。',
  sampleAnswer: '先確認禁忌症、用藥與疾病史，再評估特殊族群與安全限制，必要時轉介醫療專業。',
  keyPoints: ['確認禁忌症', '確認用藥與疾病史', '評估特殊族群', '避免不安全用油', '必要時轉介醫療專業'],
  rubric,
  category: '諮詢流程／個案評估',
  sourceLabel: '教材 AI 萃取練習題（非歷屆試題）',
  sourceFile: '教材.txt',
  sourcePage: '待補',
  riskLevel: 'standard_review',
  practiceOnly: true,
  formalScoreEligible: false,
};

const withAnswer = (answer, overrides = {}) => ({ ...baseInput, ...overrides, userAnswer: answer });

try {
  const [local, result, store, engine] = await Promise.all([
    server.ssrLoadModule('/src/utils/localRubricGrading.ts'),
    server.ssrLoadModule('/src/components/Result.tsx'),
    server.ssrLoadModule('/src/utils/aiReviewStore.ts'),
    server.ssrLoadModule('/src/utils/questionEngine.ts'),
  ]);
  const [resultSource, healthSource, localSource, aiSource, storeSource, codeSource, progressSource, coachSource, homeSource, packageSource] = await Promise.all([
    read('../src/components/Result.tsx'),
    read('../src/components/AiGradingHealthCheck.tsx'),
    read('../src/utils/localRubricGrading.ts'),
    read('../src/services/aiGrading.ts'),
    read('../src/utils/aiReviewStore.ts'),
    read('../docs/google-apps-script/Code.gs'),
    read('../src/services/progressSync.ts'),
    read('../src/services/coachApi.ts'),
    read('../src/services/learnerHomeApi.ts'),
    read('../package.json'),
  ]);

  const full = local.gradeWithLocalRubric(withAnswer('因為有些身體狀況、用藥或族群不適合使用特定精油，需要先評估安全性，必要時轉介醫療專業。'));
  if (full.gradingMethod !== 'local_rubric' || full.gradingMethodLabel !== '規準輔助評分' || full.aiScoreSuggestion !== 3 || full.aiReviewStatus !== 'mastered') throw new Error(`完整短答未得 3 分：${JSON.stringify(full)}`);
  const mostly = local.gradeWithLocalRubric(withAnswer('先確認禁忌症、用藥與疾病史，必要時轉介醫療專業。'));
  if (mostly.aiScoreSuggestion !== 2 && mostly.aiScoreSuggestion !== 3) throw new Error('大致完整答案未落在 2～3 分');
  const partial = local.gradeWithLocalRubric(withAnswer('先評估。'));
  if (partial.aiScoreSuggestion !== 1 || partial.aiReviewStatus !== 'partial') throw new Error('少數命中未得 1 分');
  const irrelevant = local.gradeWithLocalRubric(withAnswer('今天天氣很好，心情也不錯。'));
  if (irrelevant.aiScoreSuggestion !== 0 || irrelevant.aiReviewStatus !== 'not_mastered') throw new Error('無關答案未得 0 分');
  const synonyms = local.gradeWithLocalRubric(withAnswer('若情況不適用就避免使用，並確認服藥與疾病史，必要時就醫。'));
  if (synonyms.matchedKeyPoints.length < 3) throw new Error('同義詞未能命中足夠評分重點');
  const dangerous = local.gradeWithLocalRubric(withAnswer('孕婦都可以使用，濃度越高越有效，不需要稀釋。', { riskLevel: 'safety_review' }));
  if (dangerous.aiScoreSuggestion !== 0 || dangerous.riskFlags.length < 2) throw new Error('危險／否定敘述未安全降分');
  const copied = local.gradeWithLocalRubric(withAnswer(baseInput.question));
  if (copied.aiScoreSuggestion !== 0) throw new Error('複製題目未被降分');
  const repeated = local.gradeWithLocalRubric(withAnswer('安全安全安全安全安全安全安全安全。'));
  if (repeated.aiScoreSuggestion !== 0) throw new Error('重複文字未被降分');
  const shortEssay = local.gradeWithLocalRubric(withAnswer('安全。', { type: 'essay', keyPoints: ['安全', '評估', '理由'] }));
  if (shortEssay.aiScoreSuggestion === 3) throw new Error('過短申論不應得 3 分');
  const caseReview = local.gradeWithLocalRubric(withAnswer('先了解個案狀況，再提出保守建議。', { type: 'case_study', riskLevel: 'safety_review', category: '案例題', keyPoints: ['評估個案', '安全禁忌', '提出保守建議', '必要時轉介'] }));
  if (caseReview.aiScoreSuggestion === 3 || !caseReview.missingKeyPoints.some((item) => item.includes('安全') || item.includes('轉介'))) throw new Error('案例缺安全／轉介未保守扣分');
  const formulaReview = local.gradeWithLocalRubric(withAnswer('使用 2% 濃度，每 10 ml 植物油加入適量精油。', { type: 'shortAnswer', category: '配方設計', riskLevel: 'safety_review', question: '請說明配方濃度與用量。', keyPoints: ['稀釋比例', '安全限制'] }));
  if (formulaReview.aiReviewStatus !== 'needs_human_review' || formulaReview.aiScoreSuggestion !== null) throw new Error('高風險精確濃度未轉人工確認');
  const insufficient = local.gradeWithLocalRubric(withAnswer('有回答。', { keyPoints: [], rubric: [] }));
  if (insufficient.aiReviewStatus !== 'needs_human_review' || insufficient.aiScoreSuggestion !== null) throw new Error('規準不足未轉人工確認');
  const blank = local.gradeWithLocalRubric(withAnswer(''));
  if (blank.aiScoreSuggestion !== 0) throw new Error('空白回答未得 0 分');

  storage.clear();
  store.recordAiReview(full);
  const stored = store.getAiReview(33010, 'sprint33a');
  if (!stored || stored.gradingMethod !== 'local_rubric' || stored.gradingMethodLabel !== '規準輔助評分') throw new Error('本機規準評分保存欄位缺失');
  if (store.getAiReviewsForSession('sprint33a').length !== 1) throw new Error('本機規準評分 session 讀取失敗');

  const stats = result.getResultStats([
    { id: 1, type: 'multipleChoice', answer: 'A', chapter: '', question: '選擇' },
    { id: 2, type: 'shortAnswer', answer: '參考', chapter: '', question: '簡答', practiceOnly: true, formalScoreEligible: false },
  ], { 1: 'A', 2: '回答' });
  if (stats.autoGradedCount !== 1 || stats.correctCount !== 1 || stats.accuracy !== 100 || stats.pendingSelfCheckCount !== 1) throw new Error('規準分數污染正式正確率');

  for (const marker of ['gradeWithLocalRubric', '規準輔助評分', '進行規準輔助評分', '此分數由參考答案與評分重點進行規則比對', '無法完整理解所有同義表達']) if (!resultSource.includes(marker)) throw new Error(`Result 本機規準 UI 缺失：${marker}`);
  if (resultSource.includes('requestAiGradeAnswer') || resultSource.includes('請 AI 協助評分') || resultSource.includes('AI 評分中')) throw new Error('Result 仍呼叫或顯示遠端 AI 評分');
  for (const marker of ['gradeWithLocalRubric', '規準輔助評分檢查', '本機規準評分', '遠端 AI：', '未啟用（未來選配）', '執行規準評分檢查', 'gradingMethodLabel']) if (!healthSource.includes(marker)) throw new Error(`健康檢查本機化缺失：${marker}`);
  if (healthSource.includes('requestAiGradeAnswer') || healthSource.includes('AI_GRADING_API_KEY')) throw new Error('健康檢查仍依賴遠端 AI 或金鑰');
  for (const marker of ['NFKC', '禁忌症', '轉介', 'synonymGroups', '不需要', '複製題目', 'gradingMethod: \'local_rubric\'', '需人工確認']) if (!localSource.includes(marker)) throw new Error(`本機規準品質規則缺失：${marker}`);
  if (!aiSource.includes("body: JSON.stringify({ action: 'aiGradeAnswer'") || !aiSource.includes('remote_ai')) throw new Error('未保留未來遠端 provider 選配邊界');
  if (!storeSource.includes('gradingMethod') || !storeSource.includes('local_rubric')) throw new Error('aiReviewStore 未支援本機規準欄位');

  const sessionHeaders = "['sessionId','learnerId','examId','examTitle','examType','status','startedAt','updatedAt','completedAt','questionCount','answeredCount','correctCount','wrongCount','unansweredCount','score','durationSeconds','lastEventId','learnerName','sourceRole','deviceLabel','isTest']";
  const answerHeaders = "['sessionId','examId','questionId','selectedAnswer','correctAnswer','isCorrect','answeredAt','syncedAt','learnerId','learnerName','sourceRole','isTest']";
  for (const marker of [sessionHeaders, answerHeaders, 'exam_started', 'exam_progress', 'exam_completed', 'function seenEvent', 'function saveSession', 'function saveAnswers', "body.action === 'aiGradeAnswer'", 'getLearnerHomeSummary', 'getCoachSummary', 'getRecentSessions', 'getSessionDetails', 'COACH_READ_KEY', 'WRITE_KEY', 'LockService.getScriptLock', 'lock.releaseLock']) if (!codeSource.includes(marker)) throw new Error(`Code.gs 契約缺失：${marker}`);
  const aiBranchIndex = codeSource.indexOf("if (body.action === 'aiGradeAnswer')");
  const generalRequiredIndex = codeSource.indexOf("required(body,['schemaVersion'");
  if (aiBranchIndex < 0 || generalRequiredIndex < 0 || aiBranchIndex > generalRequiredIndex) throw new Error('Code.gs AI 分支順序可能攔截一般同步');
  if (!codeSource.includes("if (!apiKey || !model || provider !== 'openai-compatible') return json({success:false,status:'disabled'")) throw new Error('Code.gs 空白 AI 屬性未安全停用');
  if (!progressSource.includes('eventId') || !progressSource.includes('exam_completed') || !coachSource.includes('getCoachSummary') || !homeSource.includes('getLearnerHomeSummary')) throw new Error('前端同步／Coach／Learner API 契約缺失');
  if (!JSON.parse(packageSource).scripts['verify:sprint33a']) throw new Error('Sprint 33A verify script 未接線');

  const assetNames = await readdir(new URL('../dist/assets/', import.meta.url)).catch(() => []);
  const distFiles = (await Promise.all(assetNames.filter((name) => /^index-[^/]+\.js$/.test(name)).map((name) => readFile(new URL(`../dist/assets/${name}`, import.meta.url), 'utf8').catch(() => '')))).join('\n');
  if (!distFiles || !distFiles.includes('規準輔助評分')) throw new Error('production bundle 缺少本機規準評分標記');
  if (/AI_GRADING_API_KEY|sk-[A-Za-z0-9]{20,}/.test(distFiles)) throw new Error('production bundle 疑似含 AI API Key');
  if (/Google Login|Google OAuth|登入會員|\.pdf|\.docx/i.test(distFiles)) throw new Error('production bundle 含禁止內容');
  if (engine.getFormalQuestionPool().length < 41 || engine.getPracticeQuestionPool().some((question) => question.practiceOnly !== true)) throw new Error('verified／practice 邊界錯誤');
  console.log('SPRINT 33A VERIFY PASSED');
} finally {
  await server.close();
}
