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
  const dailyTask = await server.ssrLoadModule('/src/utils/dailyTaskV2.ts');
  const unanswered = await server.ssrLoadModule('/src/utils/unansweredQuestionStore.ts');
  const questionEngine = await server.ssrLoadModule('/src/utils/questionEngine.ts');

  const questions = [
    { id: 1, type: 'multipleChoice', answer: 'A', chapter: '', question: '單選', explanation: '解析' },
    { id: 2, type: 'multiSelect', answer: ['A', 'B'], chapter: '', question: '複選', explanation: '解析' },
    { id: 3, type: 'shortAnswer', answer: '內部答案', referenceAnswer: '參考答案', chapter: '', question: '簡答', explanation: '解析' },
    { id: 4, type: 'essay', answer: '內部方向', answerGuide: '答題方向', chapter: '', question: '申論', explanation: '' },
    { id: 5, type: 'case_study', answer: '案例方向', chapter: '', question: '案例', explanation: '案例解析', practiceOnly: true, riskLevel: 'safety_review' },
  ];
  const blankStats = result.getResultStats(questions, {});
  if (blankStats.correctCount !== 0 || blankStats.wrongCount !== 0 || blankStats.unansweredCount !== 5 || blankStats.completedCount !== 0 || blankStats.pendingSelfCheckCount !== 0 || blankStats.reviewItems.length !== 5) throw new Error('未作答沒有與答錯、完成及解析清單分離');
  const answeredStats = result.getResultStats(questions, { 1: 'A', 2: ['A', 'B'], 3: '我的答案', 4: '我的方向' });
  if (answeredStats.correctCount !== 2 || answeredStats.wrongCount !== 0 || answeredStats.unansweredCount !== 1 || answeredStats.completedCount !== 4 || answeredStats.pendingSelfCheckCount !== 2) throw new Error('已作答與待自評統計錯誤');

  storage.clear();
  const pool = Array.from({ length: 60 }, (_, index) => index + 1);
  const dayOne = dailyTask.getDailyTaskV2Plan(pool, [], '2026-07-13');
  dailyTask.completeDailyTaskV2Questions(dayOne.activeQuestionIds.slice(0, 25), pool);
  const dayTwo = dailyTask.getDailyTaskV2Plan(pool, [], '2026-07-14');
  if (dayTwo.carryoverCount !== 5 || dayTwo.activeQuestionIds[0] !== dayOne.activeQuestionIds[25] || dayTwo.activeQuestionIds.length !== 35) throw new Error('每日未完成保留題沒有優先帶入');
  dailyTask.completeDailyTaskV2Questions(dayTwo.activeQuestionIds.slice(0, 5), pool);
  const dayThree = dailyTask.getDailyTaskV2Plan(pool, [], '2026-07-15');
  if (dayThree.carryoverCount !== 30 || dayThree.activeQuestionIds[0] !== dayTwo.activeQuestionIds[5]) throw new Error('完成保留題後，後續每日任務排序錯誤');

  storage.clear();
  unanswered.recordUnansweredQuestions([{ questionId: 101, weekId: 'week-1', sourceMode: 'daily' }, { questionId: 102, weekId: 'exam-practice', sourceMode: 'weeklyReview' }]);
  if (unanswered.getReviewableUnansweredQuestionIds().join(',') !== '101,102') throw new Error('未完成保留題未保存');
  unanswered.resolveUnansweredQuestions([101]);
  if (unanswered.getReviewableUnansweredQuestionIds().join(',') !== '102') throw new Error('完成作答後未從未完成保留題移除');

  if (questionEngine.getFormalQuestionPool().length < 41 || questionEngine.getDailyQuestionPool().length <= questionEngine.getFormalQuestionPool().length || !questionEngine.getPracticeQuestionPool().every((question) => question.practiceOnly === true)) throw new Error('正式題庫與考前練習題庫邊界錯誤');

  const [resultSource, appSource, examSource, homeSource, practiceSource] = await Promise.all([
    readFile(new URL('../src/components/Result.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/App.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/components/Exam.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/views/Home.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/views/PracticeCenter.tsx', import.meta.url), 'utf8'),
  ]);
  if (!resultSource.includes('未完成保留題') || !resultSource.includes('referenceAnswer') || !resultSource.includes('待規準輔助評分') || !resultSource.includes('安全／禁忌題，請以教材與人工核對為準')) throw new Error('Result 未作答學習內容或中文標示缺失');
  if (!appSource.includes('recordUnansweredQuestions') || !appSource.includes('resolveUnansweredQuestions') || !appSource.includes('status: getAnswerStatus(question)') || !appSource.includes('未作答題將保留至下一次每日任務')) throw new Error('App 未完成保留題或同步狀態接線缺失');
  if (!examSource.includes('showSelfCheck') || !examSource.includes('disabled={!isAnswered(answers[currentQuestion.id])}')) throw new Error('考試進行中不應提前顯示自評解析的控制缺失');
  if (!homeSource.includes('getDailyQuestionPool') || !practiceSource.includes('getDailyQuestionPool')) throw new Error('Home / 練習中心未使用正式加考前練習來源池');
  if (appSource.includes('carryover →') || resultSource.includes('carryover →') || homeSource.includes('carryover →') || practiceSource.includes('carryover →')) throw new Error('介面出現內部英文命名');
  console.log('SPRINT 31C VERIFY PASSED');
} finally {
  await server.close();
}
