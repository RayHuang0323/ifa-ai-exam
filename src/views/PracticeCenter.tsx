import { useEffect, useState } from 'react';
import type { StudyMode, StudyProgress } from '../types/study';
import type { WrongAnswerRecord } from '../types/task';
import { getWeeklyProgress, loadStudyProgress } from '../utils/studyProgress';
import { getStudyReminder } from '../utils/studyReminder';
import { getWrongAnswerSummary, loadWrongAnswers } from '../utils/wrongAnswerStore';
import { planTodayTask } from '../utils/taskPlanner';

interface PracticeCenterProps {
  onReturnHome: () => void;
  onStartTodayTask: (suggestedQuestions: number, mode: StudyMode) => void;
  onStartWrongReview: () => void;
  onOpenWrongBook: () => void;
  onStartNewExam: () => void;
  onStartWritingPractice: () => void;
}

export default function PracticeCenter({ onReturnHome, onStartTodayTask, onStartWrongReview, onOpenWrongBook, onStartNewExam, onStartWritingPractice }: PracticeCenterProps) {
  const [progress, setProgress] = useState<StudyProgress>(() => loadStudyProgress());
  const [wrongAnswers, setWrongAnswers] = useState<WrongAnswerRecord[]>(() => loadWrongAnswers());
  useEffect(() => { setProgress(loadStudyProgress()); setWrongAnswers(loadWrongAnswers()); }, []);

  const now = new Date();
  const weekly = getWeeklyProgress(progress, now);
  const reminder = getStudyReminder(progress, weekly, now);
  const task = planTodayTask(progress, weekly, wrongAnswers.length, reminder.daysSinceLastStudy);
  const wrongSummary = getWrongAnswerSummary();
  const cardClass = 'rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4';
  const buttonClass = 'h-11 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400';

  return <main className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 md:py-12 flex-grow" data-testid="practice-center-page">
    <section className="space-y-8">
      <header className="space-y-2"><h1 className="text-2xl sm:text-3xl font-bold text-white">練習中心</h1><p className="text-sm leading-relaxed text-slate-400">選擇今天要進行的練習模式。每日任務仍會依進度與錯題狀態自動安排。</p></header>
      <section className="grid gap-4 md:grid-cols-2">
        <article className={cardClass} data-testid="practice-daily-card"><h2 className="text-lg font-bold text-white">今日任務</h2><p className="text-sm text-slate-400">依本週進度與錯題狀態安排。今日建議 {task.suggestedQuestions} 題，約 {task.estimatedMinutes} 分鐘。</p><button className={buttonClass} onClick={() => onStartTodayTask(task.suggestedQuestions, task.mode as StudyMode)} disabled={task.mode === 'reviewPreview'}>開始今日任務</button></article>
        <article className={cardClass} data-testid="practice-wrong-review-card"><h2 className="text-lg font-bold text-white">錯題複習</h2><p className="text-sm text-slate-400">待複習 {wrongSummary.reviewableCount} 題・高風險 {wrongSummary.highRiskCount} 題。</p>{wrongSummary.reviewableCount > 0 ? <button className={buttonClass} onClick={onStartWrongReview}>開始錯題複習</button> : <p className="text-sm text-slate-500">目前沒有可複習錯題，完成測驗後會自動整理。</p>}</article>
        <article className={cardClass} data-testid="practice-wrong-book-card"><h2 className="text-lg font-bold text-white">錯題本</h2><p className="text-sm text-slate-400">查看高風險、改善中、已熟練題目。</p><button className={buttonClass} onClick={onOpenWrongBook}>查看錯題本</button></article>
        <article className={cardClass} data-testid="practice-formal-exam-card"><h2 className="text-lg font-bold text-white">完整模擬考</h2><p className="text-sm text-slate-400">Week1 完整模擬考，正式計時。</p><button className={buttonClass} onClick={onStartNewExam}>開始完整模擬考</button></article>
        <article className={cardClass} data-testid="practice-writing-card"><h2 className="text-lg font-bold text-white">簡答／默寫練習</h2><p className="text-sm text-slate-400">練習名詞解釋、簡答與默寫，完成後自我檢核。</p><p className="text-xs text-amber-300">目前為示範題，正式題目將於講義整理後加入。</p><button className={buttonClass} onClick={onStartWritingPractice}>開始簡答／默寫練習</button></article>
      </section>
      <button onClick={onReturnHome} className="h-10 px-4 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm font-bold">返回首頁</button>
    </section>
  </main>;
}
