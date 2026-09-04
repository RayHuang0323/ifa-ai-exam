import React, { useEffect, useState } from 'react';
import { HeroSection } from '../components/home/HeroSection';
import { MissionSection } from '../components/home/MissionSection';
import { RecentActivitySection } from '../components/home/RecentActivitySection';
import { FooterSection } from '../components/home/FooterSection';
import { getExamCountdown, getTodayCompleted, getWeeklyProgress, loadStudyProgress } from '../utils/studyProgress';
import { getStudyReminder } from '../utils/studyReminder';
import type { StudyMode } from '../types/study';
import { getWrongAnswerSummary, loadWrongAnswers } from '../utils/wrongAnswerStore';
import { planTodayTask } from '../utils/taskPlanner';
import { getCoverageByWeek, getDailyQuestionPool, getFormalQuestionPool, getFullMockQuestionPool } from '../utils/questionEngine';
import type { LearnerProfile } from '../utils/learnerProfile';
import { dailyMaximum, dailyTarget, getDailyTaskV2Plan } from '../utils/dailyTaskV2';
import { getLearnerHomeSummary, type LearnerHomeSummary } from '../services/learnerHomeApi';
import AiGradingHealthCheck from '../components/AiGradingHealthCheck';
import { getFirstRoundStats } from '../utils/questionScheduler';

interface HomeProps {
  hasExamDraft: boolean; onResumeExam: () => void; onStartTodayTask: (suggestedQuestions: number, mode: StudyMode) => void;
  onOpenWrongBook: () => void; onOpenPracticeCenter: () => void; onOpenCoachDashboard: () => void;
  onResetDailyTask: () => void; onResetLocalProgress: () => void; profile: LearnerProfile; resetRevision: number; notice?: string;
}

const Home: React.FC<HomeProps> = ({ hasExamDraft, onResumeExam, onStartTodayTask, onOpenWrongBook, onOpenPracticeCenter, onOpenCoachDashboard, onResetDailyTask, onResetLocalProgress, profile, resetRevision, notice }) => {
  const studyProgress = loadStudyProgress();
  const wrongAnswers = loadWrongAnswers();
  const [remote, setRemote] = useState<LearnerHomeSummary | null>(null);
  const [remoteStatus, setRemoteStatus] = useState<'loading' | 'ready' | 'fallback'>('loading');

  useEffect(() => { let active = true; getLearnerHomeSummary().then((summary) => { if (active) { setRemote(summary); setRemoteStatus('ready'); } }).catch(() => { if (active) { setRemote(null); setRemoteStatus('fallback'); } }); return () => { active = false; }; }, [resetRevision]);

  const now = new Date();
  const localWeekly = getWeeklyProgress(studyProgress, now);
  const weeklyProgress = remoteStatus === 'ready' && remote ? { completed: remote.weekAnsweredCount, target: localWeekly.target, percentage: Math.min(100, Math.round(remote.weekAnsweredCount / localWeekly.target * 100)), remaining: Math.max(0, localWeekly.target - remote.weekAnsweredCount) } : localWeekly;
  const reminder = getStudyReminder(studyProgress, localWeekly, now);
  const localWrongSummary = getWrongAnswerSummary();
  const wrongSummary = remoteStatus === 'ready' && remote ? { reviewableCount: remote.wrongAnswerCount, highRiskCount: 0 } : localWrongSummary;
  const plannerTask = planTodayTask(studyProgress, localWeekly, wrongAnswers.length, reminder.daysSinceLastStudy);
  const completedHistory = studyProgress.sessions.flatMap((session) => session.questionIds ?? []);
  const dailyPlan = getDailyTaskV2Plan(getDailyQuestionPool().map((question) => question.id), completedHistory);
  const todayTask = { ...plannerTask, id: 'daily-task-v2', title: '每日任務', mode: 'daily' as StudyMode, suggestedQuestions: dailyPlan.activeQuestionIds.length, totalQuestions: dailyPlan.state.assignedQuestionIds.length, completedQuestions: dailyPlan.completedCount, carryoverQuestions: dailyPlan.carryoverCount, isInsufficient: dailyPlan.isInsufficient, basicQuestions: dailyTarget, maximumQuestions: dailyMaximum, canAddQuestions: dailyPlan.canAddQuestionCount, description: '每日基本任務 30 題，可依需要加做至 90 題。', reason: '優先安排未完成保留題，再補入新的可練習題。', estimatedMinutes: Math.max(5, Math.ceil(dailyPlan.state.assignedQuestionIds.length * 1.5)), ctaLabel: dailyPlan.activeQuestionIds.length > 0 ? '開始今日任務' : '今日任務已完成' };
  const examCountdown = getExamCountdown(now);
  const countdownLabel = examCountdown === 0 ? '今天考試' : examCountdown < 0 ? '考試已結束' : `${examCountdown} 天`;
  const todayLabel = `${now.getFullYear()}/${`${now.getMonth() + 1}`.padStart(2, '0')}/${`${now.getDate()}`.padStart(2, '0')}（${['週日', '週一', '週二', '週三', '週四', '週五', '週六'][now.getDay()]}）`;
  const localWeek1Coverage = getCoverageByWeek('week-1', studyProgress, wrongAnswers);
  const localWeek2Coverage = getCoverageByWeek('week-2', studyProgress, wrongAnswers);
  const localAllIds = new Set(studyProgress.sessions.flatMap((session) => session.questionIds ?? []));
  const localAllTotal = getFormalQuestionPool().length;
  const formalFirstRound = getFirstRoundStats(getFullMockQuestionPool().map((question) => question.id));
  const practiceFirstRound = getFirstRoundStats(getDailyQuestionPool().filter((question) => question.practiceOnly === true).map((question) => question.id));
  const localAllCoverage = { practicedCount: getFormalQuestionPool().filter((question) => localAllIds.has(question.id)).length, totalCount: localAllTotal, remainingCount: Math.max(0, localAllTotal - getFormalQuestionPool().filter((question) => localAllIds.has(question.id)).length), percent: localAllTotal ? Math.round(getFormalQuestionPool().filter((question) => localAllIds.has(question.id)).length / localAllTotal * 100) : 0 };
  const coverage = remoteStatus === 'ready' && remote ? remote.coverage : { week1: { practicedCount: localWeek1Coverage.practicedCount, totalCount: localWeek1Coverage.totalQuestions, remainingCount: localWeek1Coverage.unpracticedCount, percent: localWeek1Coverage.totalQuestions ? Math.round(localWeek1Coverage.practicedCount / localWeek1Coverage.totalQuestions * 100) : 0 }, week2: { practicedCount: localWeek2Coverage.practicedCount, totalCount: localWeek2Coverage.totalQuestions, remainingCount: localWeek2Coverage.unpracticedCount, percent: localWeek2Coverage.totalQuestions ? Math.round(localWeek2Coverage.practicedCount / localWeek2Coverage.totalQuestions * 100) : 0 }, all: localAllCoverage };
  const coverageLabel = remoteStatus === 'ready' ? '' : '（本機暫存估算）';
  const todayCompleted = remoteStatus === 'ready' && remote ? remote.todayAnsweredCount : getTodayCompleted(studyProgress, now);
  const todayGuidance = examCountdown >= 0 && examCountdown <= 14 ? '已進入考前衝刺，建議優先處理錯題與完整模擬考。' : wrongSummary.highRiskCount > 0 ? '目前有高風險錯題，今日任務會優先混入部分錯題。' : todayCompleted > 0 && wrongSummary.reviewableCount > 0 ? '今日任務已完成，建議再做錯題複習。' : '依今日任務維持練習節奏。';
  const sourceText = remoteStatus === 'ready' ? '正式進度來源：Google Sheet' : remoteStatus === 'loading' ? '正在讀取 Google Sheet 正式進度…' : '遠端進度暫時無法讀取，以下為本機暫存';
  const resetDaily = () => { if (window.confirm('重置本瀏覽器今日任務？只影響此裝置，不影響 Google Sheet 或正式學習紀錄。')) onResetDailyTask(); };
  const resetLocal = () => { if (window.confirm('重置本瀏覽器測試資料？只清除此裝置測試資料，不影響 learner 紀錄。')) onResetLocalProgress(); };

  return <div className="min-h-screen bg-[#fafafa] text-slate-800 antialiased selection:bg-slate-200 w-full flex flex-col items-center"><div className="home-content max-w-5xl w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8 flex flex-col items-center">
    <div className="w-full"><HeroSection hasExamDraft={hasExamDraft} onResumeExam={onResumeExam} /></div>
    <p data-testid="profile-mode" className="w-full text-right text-xs text-slate-400">目前模式：{profile.isTest ? 'Ray 測試' : 'Bella 學員'}{profile.isTest && <a className="ml-2 text-indigo-600 hover:text-indigo-800" href="?profile=learner">切回 Bella 學員模式</a>}</p>
    {notice && <p role="status" className="w-full rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</p>}
    <p data-testid="progress-source-status" className={`w-full rounded-xl px-4 py-3 text-sm ${remoteStatus === 'fallback' ? 'border border-amber-200 bg-amber-50 text-amber-800' : 'border border-sky-200 bg-sky-50 text-sky-800'}`}>{sourceText}{remoteStatus === 'ready' && remote?.lastActivityAt && <span className="ml-2 text-xs">・最後活動：{new Date(remote.lastActivityAt).toLocaleString()}</span>}</p>
    <section className="study-dashboard home-primary-dashboard" aria-label="今日學習重點"><article className="study-card study-countdown-card"><span className="study-eyebrow">IFA 考試資訊</span><strong>今天：{todayLabel}</strong><span className="study-countdown-label">考試日：2026/09/08</span><span className="study-countdown-label">距離 IFA 考試：</span><span className="study-countdown-value">{countdownLabel}</span></article><MissionSection task={todayTask} wrongAnswerCount={wrongSummary.reviewableCount} guidance={todayGuidance} onStartTask={onStartTodayTask} /></section>
    <section className="learning-status-grid" aria-label="學習狀態摘要"><article className="study-card study-weekly-card"><span className="study-eyebrow">本週進度</span><strong>本週完成 {weeklyProgress.completed} / {weeklyProgress.target} 題</strong><div className="study-progress-track" aria-label={`本週進度 ${weeklyProgress.percentage}%`}><div className="study-progress-fill" style={{ width: `${weeklyProgress.percentage}%` }} /></div><p>完成度 {weeklyProgress.percentage}%・本週還差 {weeklyProgress.remaining} 題</p>{remoteStatus === 'ready' && remote && <p>自動判分正確率：{remote.overallAccuracy === null ? '—' : `${remote.overallAccuracy}%`}</p>}</article><article className="study-card"><span className="study-eyebrow">第一輪覆蓋率</span><strong>正式題 {formalFirstRound.appearedCount} / {formalFirstRound.totalCount} 題</strong><p>練習題 {practiceFirstRound.appearedCount} / {practiceFirstRound.totalCount} 題</p><p className="text-xs text-slate-500">先完成新題覆蓋，再安排重點複習。</p></article><article className="study-card"><span className="study-eyebrow">錯題狀態</span><strong>待複習 {wrongSummary.reviewableCount} 題</strong><p>{remoteStatus === 'ready' ? '遠端測驗紀錄中的答錯 session 數。' : `高風險 ${wrongSummary.highRiskCount} 題・錯題共 ${wrongAnswers.length} 題`}</p><button data-testid="open-wrong-book-button" onClick={onOpenWrongBook} className="mt-3 text-sm font-bold text-indigo-700 hover:text-indigo-900">查看錯題本</button></article><article className="study-card coverage-card" data-testid="week1-coverage"><span className="study-eyebrow">Week1 題庫覆蓋率{coverageLabel}</span><strong>已練習 {coverage.week1.practicedCount} / {coverage.week1.totalCount} 題</strong><p>尚未練習：{coverage.week1.remainingCount} 題</p></article><article className="study-card coverage-card" data-testid="week2-coverage"><span className="study-eyebrow">Week2 題庫覆蓋率{coverageLabel}</span><strong>已練習 {coverage.week2.practicedCount} / {coverage.week2.totalCount} 題</strong><p>尚未練習：{coverage.week2.remainingCount} 題</p></article><article className="study-card coverage-card" data-testid="all-coverage"><span className="study-eyebrow">全題庫覆蓋率{coverageLabel}</span><strong>已練習 {coverage.all.practicedCount} / {coverage.all.totalCount} 題</strong><p>尚未練習：{coverage.all.remainingCount} 題</p></article></section>
    <section className="home-secondary-content" aria-label="學習狀態與功能入口"><div className="w-full"><RecentActivitySection sessions={remoteStatus === 'ready' && remote ? remote.recentActivities : undefined} sourceLabel={remoteStatus === 'ready' ? 'Google Sheet 正式紀錄' : '本機暫存'} /></div><section className="w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"><div><h2 className="text-lg font-bold text-slate-800">練習中心</h2><p className="mt-1 text-sm text-slate-600">集中選擇錯題複習、每週測驗、完整模擬考與簡答／默寫練習。</p></div><button data-testid="practice-center-entry" onClick={onOpenPracticeCenter} className="study-task-button">進入練習中心</button></section>{profile.isTest && <><section data-testid="coach-dashboard-entry" className="w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"><div><h2 className="text-lg font-bold text-slate-800">Coach 學習追蹤</h2><p className="mt-1 text-sm text-slate-600">查看 Bella 的學習進度、最近測驗與答題紀錄</p></div><button onClick={onOpenCoachDashboard} className="study-task-button">查看學習紀錄</button></section><section data-testid="coach-reset-tools" className="w-full rounded-2xl border border-amber-200 bg-amber-50 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"><div><h2 className="font-bold text-amber-950">Coach 本機工具</h2><p className="mt-1 text-sm text-amber-900">只重置此瀏覽器資料，不會變更 Google Sheet 或 Coach 查看碼。</p></div><div className="flex flex-wrap gap-2"><button onClick={resetDaily} className="h-10 rounded-xl border border-amber-300 bg-white px-4 text-sm font-bold text-amber-950">重置本瀏覽器今日任務</button><button onClick={resetLocal} className="h-10 rounded-xl border border-red-300 bg-white px-4 text-sm font-bold text-red-800">重置本瀏覽器測試資料</button></div></section></>}</section>
    {profile.isTest && <AiGradingHealthCheck />}
    <div className="w-full pt-4"><FooterSection /></div>
  </div></div>;
};
export default Home;
