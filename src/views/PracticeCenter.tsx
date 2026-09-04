import type { StudyMode } from '../types/study';
import { getWrongAnswerSummary } from '../utils/wrongAnswerStore';
import { getAvailableWeeks, getDailyQuestionPool, getFormalQuestionPool, getFullMockQuestionPool, getPracticeQuestionPool } from '../utils/questionEngine';
import { dailyMaximum, dailyTarget, getDailyTaskV2Plan } from '../utils/dailyTaskV2';
import { loadStudyProgress } from '../utils/studyProgress';
import { getFirstRoundStats } from '../utils/questionScheduler';

interface PracticeCenterProps {
  onReturnHome: () => void;
  onStartTodayTask: (suggestedQuestions: number, mode: StudyMode) => void;
  onStartWrongReview: () => void;
  onOpenWrongBook: () => void;
  onStartNewExam: () => void;
  onStartWeeklyReview: () => void;
  onStartWritingPractice: () => void;
}

export default function PracticeCenter({ onReturnHome, onStartTodayTask, onStartWrongReview, onOpenWrongBook, onStartNewExam, onStartWeeklyReview, onStartWritingPractice }: PracticeCenterProps) {
  const completedHistory = loadStudyProgress().sessions.flatMap((session) => session.questionIds ?? []);
  const dailyPlan = getDailyTaskV2Plan(getDailyQuestionPool().map((question) => question.id), completedHistory);
  const availableWeeks = getAvailableWeeks();
  const practiceCount = getPracticeQuestionPool().length;
  const formalQuestions = getFormalQuestionPool().filter((question) => question.practiceOnly !== true);
  const fullMockQuestions = getFullMockQuestionPool();
  const practiceQuestions = getPracticeQuestionPool();
  const formalFirstRound = getFirstRoundStats(fullMockQuestions.map((question) => question.id));
  const practiceFirstRound = getFirstRoundStats(practiceQuestions.map((question) => question.id));
  const wrongSummary = getWrongAnswerSummary();
  const cardClass = 'rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4';
  const buttonClass = 'h-11 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400';

  return <main className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 md:py-12 flex-grow" data-testid="practice-center-page">
    <section className="space-y-8">
      <header className="space-y-2"><h1 className="text-2xl sm:text-3xl font-bold text-white">練習中心</h1><p className="text-sm leading-relaxed text-slate-400">選擇今天要進行的練習模式。每日任務仍會依進度與錯題狀態自動安排。</p></header>
      <p className="text-sm text-slate-300">目前可用週次：{availableWeeks.map((week) => week.replace('week-', 'Week ')).join('、')}</p>
      <section className="grid gap-4 md:grid-cols-2">
        <article className={cardClass} data-testid="practice-daily-card"><h2 className="text-lg font-bold text-white">每日任務</h2><p className="text-sm text-slate-400">今日基本任務：{dailyTarget} 題・今日最高上限：{dailyMaximum} 題。</p><p className="text-sm text-slate-400">今日進度：{dailyPlan.completedCount} / {dailyPlan.state.assignedQuestionIds.length} 題。</p><p className="text-xs text-indigo-200">正式題＋考前練習題：{getDailyQuestionPool().length} 題可用。</p><p className="text-xs text-indigo-200">正式題第一輪：{formalFirstRound.appearedCount} / {formalFirstRound.totalCount} 題・練習題第一輪：{practiceFirstRound.appearedCount} / {practiceFirstRound.totalCount} 題。</p>{dailyPlan.carryoverCount > 0 && <p className="text-sm text-amber-200">未完成保留題：{dailyPlan.carryoverCount} 題。</p>}{dailyPlan.isInsufficient && <p className="text-sm text-amber-200">目前可用題數不足，已提供 {dailyPlan.state.assignedQuestionIds.length} 題。</p>}<div className="flex flex-wrap gap-2"><button className={buttonClass} onClick={() => onStartTodayTask(dailyPlan.activeQuestionIds.length, 'daily' as StudyMode)} disabled={dailyPlan.activeQuestionIds.length === 0}>{dailyPlan.activeQuestionIds.length > 0 ? '開始今日任務' : '今日任務已完成'}</button>{dailyPlan.canAddQuestionCount > 0 && <button className="h-11 px-5 rounded-xl border border-indigo-400 text-indigo-200 hover:bg-indigo-900/50 text-sm font-bold" onClick={() => onStartTodayTask(dailyMaximum, 'daily' as StudyMode)}>今日加做題目</button>}</div></article>
        <article className={cardClass} data-testid="practice-wrong-review-card"><h2 className="text-lg font-bold text-white">錯題複習</h2><p className="text-sm text-slate-400">待複習 {wrongSummary.reviewableCount} 題・高風險 {wrongSummary.highRiskCount} 題。</p>{wrongSummary.reviewableCount > 0 ? <button className={buttonClass} onClick={onStartWrongReview}>開始錯題複習</button> : <p className="text-sm text-slate-500">目前沒有可複習錯題，完成測驗後會自動整理。</p>}</article>
        <article className={cardClass} data-testid="practice-wrong-book-card"><h2 className="text-lg font-bold text-white">錯題本</h2><p className="text-sm text-slate-400">查看高風險、改善中、已熟練題目。</p><button className={buttonClass} onClick={onOpenWrongBook}>查看錯題本</button></article>
        <article className={cardClass} data-testid="practice-formal-exam-card"><h2 className="text-lg font-bold text-white">完整模擬考</h2><p className="text-sm text-slate-400">正式模擬考題庫：{fullMockQuestions.length} 題，正式計時。</p><p className="text-xs text-indigo-200">來源：正式 verified 題＋教材證據題；一般練習題不列入正式模擬考。</p><button className={buttonClass} onClick={onStartNewExam}>開始完整模擬考</button></article>
        <article className={cardClass} data-testid="practice-weekly-review-card"><h2 className="text-lg font-bold text-white">每週測驗</h2><p className="text-sm text-slate-400">最多 40 題；優先帶入錯題，混合正式題與考前練習題。</p><p className="text-xs text-indigo-200">考前練習題 {practiceCount} 題，不列入正式 verified 成績。</p>{formalQuestions.length + practiceCount < 30 && <p className="text-sm text-amber-200">目前可用題數不足，將使用 {formalQuestions.length + practiceCount} 題。</p>}<button className={buttonClass} onClick={onStartWeeklyReview}>開始每週測驗</button></article>
        <article className={cardClass} data-testid="practice-writing-card"><h2 className="text-lg font-bold text-white">簡答／默寫練習</h2><p className="text-sm text-slate-400">練習名詞解釋、簡答與默寫，完成後自我檢核。</p><p className="text-xs text-amber-300">目前為示範題，正式題目將於講義整理後加入。</p><button className={buttonClass} onClick={onStartWritingPractice}>開始簡答／默寫練習</button></article>
      </section>
      <button onClick={onReturnHome} className="h-10 px-4 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm font-bold">返回首頁</button>
    </section>
  </main>;
}
