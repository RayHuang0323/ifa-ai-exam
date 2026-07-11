import React, { useEffect, useState } from 'react';
import { HeroSection } from '../components/home/HeroSection';
import { MissionSection } from '../components/home/MissionSection';
import { RecentActivitySection } from '../components/home/RecentActivitySection';
import { FooterSection } from '../components/home/FooterSection';
import { getExamCountdown, getTodayCompleted, getWeeklyProgress, loadStudyProgress } from '../utils/studyProgress';
import { getStudyReminder } from '../utils/studyReminder';
import type { StudyMode, StudyProgress } from '../types/study';
import { getWrongAnswerSummary, loadWrongAnswers } from '../utils/wrongAnswerStore';
import { planTodayTask } from '../utils/taskPlanner';
import { getCoverageByWeek } from '../utils/questionEngine';
import type { WrongAnswerRecord } from '../types/task';

interface HomeProps {
  hasExamDraft: boolean;
  onResumeExam: () => void;
  onStartTodayTask: (suggestedQuestions: number, mode: StudyMode) => void;
  onOpenWrongBook: () => void;
  onOpenPracticeCenter: () => void;
}

const Home: React.FC<HomeProps> = ({ hasExamDraft, onResumeExam, onStartTodayTask, onOpenWrongBook, onOpenPracticeCenter }) => {
  const [studyProgress, setStudyProgress] = useState<StudyProgress>(() => loadStudyProgress());
  const [wrongAnswers, setWrongAnswers] = useState<WrongAnswerRecord[]>([]);

  useEffect(() => { setStudyProgress(loadStudyProgress()); setWrongAnswers(loadWrongAnswers()); }, []);

  const now = new Date();
  const weeklyProgress = getWeeklyProgress(studyProgress, now);
  const reminder = getStudyReminder(studyProgress, weeklyProgress, now);
  const wrongSummary = getWrongAnswerSummary();
  const todayTask = planTodayTask(studyProgress, weeklyProgress, wrongAnswers.length, reminder.daysSinceLastStudy);
  const examCountdown = getExamCountdown(now);
  const countdownLabel = examCountdown === 0 ? '今天考試' : examCountdown < 0 ? '考試已結束' : `${examCountdown} 天`;
  const todayLabel = `${now.getFullYear()}/${`${now.getMonth() + 1}`.padStart(2, '0')}/${`${now.getDate()}`.padStart(2, '0')}（${['週日', '週一', '週二', '週三', '週四', '週五', '週六'][now.getDay()]}）`;
  const week1Coverage = getCoverageByWeek('week-1', studyProgress, wrongAnswers);
  const todayCompleted = getTodayCompleted(studyProgress, now);
  const todayGuidance = examCountdown >= 0 && examCountdown <= 14 ? '已進入考前衝刺，建議優先處理錯題與完整模擬考。'
    : wrongSummary.highRiskCount > 0 ? '目前有高風險錯題，今日任務會優先混入部分錯題。'
      : todayCompleted > 0 && wrongSummary.reviewableCount > 0 ? '今日任務已完成，建議再做錯題複習。'
        : todayTask.mode === 'weeklyCatchUp' ? '本週進度落後，建議先完成今日任務。'
          : '依今日任務維持練習節奏。';

  return <div className="min-h-screen bg-[#fafafa] text-slate-800 antialiased selection:bg-slate-200 w-full flex flex-col items-center">
    <div className="home-content max-w-5xl w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8 flex flex-col items-center">
      <div className="w-full"><HeroSection hasExamDraft={hasExamDraft} onResumeExam={onResumeExam} /></div>
      <section className="study-dashboard home-primary-dashboard" aria-label="今日學習重點">
        <article className="study-card study-countdown-card"><span className="study-eyebrow">IFA 考試資訊</span><strong>今天：{todayLabel}</strong><span className="study-countdown-label">考試日：2026/09/08</span><span className="study-countdown-label">距離 IFA 考試：</span><span className="study-countdown-value">{countdownLabel}</span></article>
        <MissionSection task={todayTask} wrongAnswerCount={wrongAnswers.length} guidance={todayGuidance} onStartTask={onStartTodayTask} />
      </section>
      <section className="learning-status-grid" aria-label="學習狀態摘要">
        <article className="study-card study-weekly-card"><span className="study-eyebrow">本週進度</span><strong>本週完成 {weeklyProgress.completed} / {weeklyProgress.target} 題</strong><div className="study-progress-track" aria-label={`本週進度 ${weeklyProgress.percentage}%`}><div className="study-progress-fill" style={{ width: `${weeklyProgress.percentage}%` }} /></div><p>完成度 {weeklyProgress.percentage}%・本週還差 {weeklyProgress.remaining} 題</p></article>
        <article className="study-card"><span className="study-eyebrow">錯題狀態</span><strong>待複習 {wrongSummary.reviewableCount} 題</strong><p>高風險 {wrongSummary.highRiskCount} 題・錯題共 {wrongAnswers.length} 題</p><button data-testid="open-wrong-book-button" onClick={onOpenWrongBook} className="mt-3 text-sm font-bold text-indigo-700 hover:text-indigo-900">查看錯題本</button></article>
        <article className="study-card coverage-card" data-testid="week1-coverage"><span className="study-eyebrow">Week1 題庫覆蓋率</span><strong>已練習 {week1Coverage.practicedCount} / {week1Coverage.totalQuestions} 題</strong><p>尚未練習：{week1Coverage.unpracticedCount} 題</p>{week1Coverage.isEstimated && <p>部分舊紀錄無題目 ID，覆蓋率為估算。</p>}</article>
      </section>
      <section className="home-secondary-content" aria-label="學習狀態與功能入口">
        <div className="w-full"><RecentActivitySection /></div>
        <section className="w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"><div><h2 className="text-lg font-bold text-slate-800">練習中心</h2><p className="mt-1 text-sm text-slate-600">集中選擇錯題複習、完整模擬考與簡答／默寫練習。</p></div><button data-testid="practice-center-entry" onClick={onOpenPracticeCenter} className="study-task-button">進入練習中心</button></section>
      </section>
      <div className="w-full pt-4"><FooterSection /></div>
    </div>
  </div>;
};

export default Home;
