import { createServer } from 'vite';
import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const storage = new Map();
globalThis.window = {
  location: { search: '?profile=coach-test' },
  localStorage: {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, String(value)),
    removeItem: (key) => storage.delete(key),
  },
};

const root = fileURLToPath(new URL('..', import.meta.url));
const server = await createServer({ root, logLevel: 'error', optimizeDeps: { noDiscovery: true }, server: { middlewareMode: true } });
const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');

try {
  const [result, aiGrading, aiStore] = await Promise.all([
    server.ssrLoadModule('/src/components/Result.tsx'),
    server.ssrLoadModule('/src/services/aiGrading.ts'),
    server.ssrLoadModule('/src/utils/aiReviewStore.ts'),
  ]);
  const [homeSource, healthSource, aiSource, storeSource, appsScriptSource, readmeSource, packageSource] = await Promise.all([
    read('../src/views/Home.tsx'),
    read('../src/components/AiGradingHealthCheck.tsx'),
    read('../src/services/aiGrading.ts'),
    read('../src/utils/aiReviewStore.ts'),
    read('../docs/google-apps-script/Code.gs'),
    read('../docs/google-apps-script/README.md'),
    read('../package.json'),
  ]);

  const input = {
    questionId: 33001,
    sessionId: 'sprint33',
    examType: 'coach-test',
    question: '請簡述芳療諮詢時為何需要確認禁忌症。',
    type: 'shortAnswer',
    userAnswer: '先評估安全性，必要時轉介。',
    referenceAnswer: '確認禁忌症、用藥、疾病史與特殊族群狀態。',
    sampleAnswer: '先確認安全相關資料，必要時轉介。',
    keyPoints: ['禁忌症', '用藥', '轉介'],
    rubric: [{ score: 3, requirement: '涵蓋主要安全重點' }],
    sourceLabel: '測試教材來源',
    sourceFile: '測試資料',
    sourcePage: '待補',
    riskLevel: 'safety_review',
    practiceOnly: true,
    formalScoreEligible: false,
  };

  let responseMode = 'disabled';
  globalThis.fetch = async () => {
    if (responseMode === 'invalid-json') return new Response('not-json', { status: 200 });
    if (responseMode === 'missing-fields') return new Response(JSON.stringify({ success: true, status: 'graded', data: {} }), { status: 200 });
    const review = responseMode === 'needs-human'
      ? { aiReviewStatus: 'needs_human_review', aiReviewLabel: '需人工確認', aiScoreSuggestion: null, matchedKeyPoints: [], missingKeyPoints: ['轉介'], riskFlags: ['高風險題需人工核對'], feedback: '請人工核對教材。', sourceBasis: ['測試教材來源'], confidence: 'low' }
      : { aiReviewStatus: 'mostly_mastered', aiReviewLabel: '大致掌握', aiScoreSuggestion: 2, matchedKeyPoints: ['禁忌症'], missingKeyPoints: ['用藥'], riskFlags: [], feedback: '補強用藥與轉介界線。', sourceBasis: ['測試教材來源'], confidence: 'medium' };
    return new Response(JSON.stringify({ success: responseMode !== 'disabled', status: responseMode === 'disabled' ? 'disabled' : 'graded', data: review }), { status: 200 });
  };

  const disabled = await aiGrading.requestAiGradeAnswer(input);
  if (disabled.status !== 'disabled' || disabled.message !== 'AI 輔助評分尚未啟用。') throw new Error('AI 未啟用 fallback 失敗');
  responseMode = 'invalid-json';
  if ((await aiGrading.requestAiGradeAnswer(input)).status !== 'unavailable') throw new Error('非 JSON 回覆未安全 fallback');
  responseMode = 'missing-fields';
  if ((await aiGrading.requestAiGradeAnswer(input)).status !== 'unavailable') throw new Error('缺欄位回覆未安全 fallback');
  responseMode = 'needs-human';
  const needsHuman = await aiGrading.requestAiGradeAnswer(input);
  if (needsHuman.status !== 'graded' || needsHuman.review.aiScoreSuggestion !== null || needsHuman.review.aiReviewLabel !== '需人工確認') throw new Error('高風險需人工確認結果解析失敗');
  responseMode = 'graded';
  const graded = await aiGrading.requestAiGradeAnswer(input);
  if (graded.status !== 'graded' || graded.review.aiScoreSuggestion !== 2 || graded.review.aiScoreMax !== 3) throw new Error('AI 0～3 分結果解析失敗');
  if (storage.has(aiStore.aiReviewStorageKey)) throw new Error('健康檢查不應寫入 AI 評分本機紀錄');

  const stats = result.getResultStats([
    { id: 1, type: 'multipleChoice', answer: 'A', chapter: '', question: '選擇題' },
    { id: 2, type: 'shortAnswer', answer: '參考答案', chapter: '', question: '簡答題', practiceOnly: true, formalScoreEligible: false },
  ], { 1: 'A', 2: '回答' });
  if (stats.autoGradedCount !== 1 || stats.correctCount !== 1 || stats.accuracy !== 100 || stats.pendingSelfCheckCount !== 1) throw new Error('AI 評分不應混入正式自動判分統計');

  for (const marker of ['profile.isTest && <AiGradingHealthCheck />', 'AiGradingHealthCheck']) if (!homeSource.includes(marker)) throw new Error('Coach 測試模式接線缺失');
  for (const marker of ['規準輔助評分檢查', '執行規準評分檢查', 'gradeWithLocalRubric', '遠端 AI：', '未啟用（未來選配）', 'coach-test-ai-health-check', 'riskLevel: \'safety_review\'', '掌握程度：', '建議分數：', '命中的重點：', '漏掉的重點：', '風險提醒：', '補強建議：', '參考依據：', '信心程度：']) if (!healthSource.includes(marker)) throw new Error(`健康檢查 UI 缺少：${marker}`);
  if (healthSource.includes('AI_GRADING_API_KEY') || healthSource.includes('requestAiGradeAnswer')) throw new Error('健康檢查元件不應依賴遠端 AI 或 AI 金鑰');
  if (!aiSource.includes("body: JSON.stringify({ action: 'aiGradeAnswer'")) throw new Error('AI action payload 缺失');
  if (aiSource.includes('AI_GRADING_API_KEY')) throw new Error('前端服務包含 AI 金鑰');
  if (!storeSource.includes('ifa-ai-reviews-v1') || storeSource.includes('wrongAnswerStorageKey') || storeSource.includes('unanswered')) throw new Error('AI 本機儲存邊界異常');
  for (const marker of ["body.action === 'aiGradeAnswer'", "AI_GRADING_API_KEY", "AI_GRADING_PROVIDER", "AI_GRADING_MODEL", "AI_GRADING_ENDPOINT", "https://api.openai.com/v1/chat/completions", 'JSON.parse(cleaned)', 'needs_human_review']) if (!appsScriptSource.includes(marker)) throw new Error(`Apps Script 設定或防呆缺失：${marker}`);
  for (const marker of ['本機規準輔助評分', '完全不依賴付費 API', 'AI_GRADING_API_KEY', '遠端 AI', '未來選配', 'WRITE_KEY', 'COACH_READ_KEY', 'OFFICIAL_START_DATE']) if (!readmeSource.includes(marker)) throw new Error(`README 缺少：${marker}`);
  if (!JSON.parse(packageSource).scripts['verify:sprint33']) throw new Error('Sprint 33 verify script 未接線');

  const distAssetNames = await readdir(new URL('../dist/assets/', import.meta.url)).catch(() => []);
  const distFiles = (await Promise.all(distAssetNames.filter((name) => /^index-[^/]+\.js$/.test(name)).map((name) => readFile(new URL(`../dist/assets/${name}`, import.meta.url), 'utf8').catch(() => '')))).join('\n');
  if (!distFiles || !distFiles.includes('規準輔助評分檢查')) throw new Error('production bundle 缺少 Sprint 33 健康檢查標記');
  if (/AI_GRADING_API_KEY|sk-[A-Za-z0-9]{20,}/.test(distFiles)) throw new Error('production bundle 疑似包含 AI API Key');
  if (/\.pdf|\.docx/i.test(distFiles) || /Google Login|Google OAuth|登入會員/i.test(distFiles)) throw new Error('production bundle 含 private 或登入內容');
  console.log('SPRINT 33 VERIFY PASSED');
} finally {
  await server.close();
}
