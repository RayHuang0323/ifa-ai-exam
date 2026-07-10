import React, { useEffect, useState } from 'react';

// 引入切片元件
import { HeroSection } from '../components/home/HeroSection';
import { ProgressSection } from '../components/home/ProgressSection';
import { MissionSection } from '../components/home/MissionSection';
import { ExamSection } from '../components/home/ExamSection';
import { CoachSection } from '../components/home/CoachSection';
import { RecentActivitySection } from '../components/home/RecentActivitySection';
import { RoadmapSection } from '../components/home/RoadmapSection';
import { FooterSection } from '../components/home/FooterSection';
import { studyConfig } from '../data/studyConfig';
import { getExamCountdown, getTodayCompleted, getWeeklyProgress, loadStudyProgress } from '../utils/studyProgress';
import { getStudyReminder } from '../utils/studyReminder';
import type { StudyProgress } from '../types/study';

interface HomeProps {
  hasExamDraft: boolean;
  onResumeExam: () => void;
  onStartTodayTask: (suggestedQuestions: number) => void;
  onStartNewExam: () => void;
}

const Home: React.FC<HomeProps> = ({ hasExamDraft, onResumeExam, onStartTodayTask, onStartNewExam }) => {
  const [hasHistory, setHasHistory] = useState<boolean>(false);
  const [studyProgress, setStudyProgress] = useState<StudyProgress>(() => loadStudyProgress());

  useEffect(() => {
    try {
      const existingState = localStorage.getItem('ifa_exam_state');
      const latestProgress = loadStudyProgress();
      setStudyProgress(latestProgress);
      setHasHistory(Boolean(existingState) || latestProgress.sessions.length > 0);
    } catch (error) {
      console.error('Failed to read configuration storage key:', error);
    }
  }, []);

  const now = new Date();
  const weeklyProgress = getWeeklyProgress(studyProgress, now);
  const reminder = getStudyReminder(studyProgress, weeklyProgress, now);
  const examCountdown = getExamCountdown(now);
  const todayCompleted = getTodayCompleted(studyProgress, now);
  const countdownLabel = examCountdown === 0 ? '今天考試' : examCountdown < 0 ? '考試已結束' : `${examCountdown} 天`;

  return (
    <div className="min-h-screen bg-[#fafafa] text-slate-800 antialiased selection:bg-slate-200 w-full flex flex-col items-center">
      <div className="home-content max-w-5xl w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8 flex flex-col items-center">
        {/* [1] Hero 滿版 */}
        <div className="w-full">
          <HeroSection hasExamDraft={hasExamDraft} onResumeExam={onResumeExam} />
        </div>

        <section className="study-dashboard" aria-label="學習進度與提醒">
          <article className="study-card study-countdown-card">
            <span className="study-eyebrow">IFA 考試</span>
            <strong>2026 / 09 / 08</strong>
            <span className="study-countdown-label">距離考試</span>
            <span className="study-countdown-value">{countdownLabel}</span>
          </article>

          <article className="study-card study-weekly-card">
            <div className="study-card-heading">
              <div>
                <span className="study-eyebrow">本週學習進度</span>
                <strong>本週完成 {weeklyProgress.completed} / {weeklyProgress.target} 題</strong>
              </div>
              <span className="study-percentage">{weeklyProgress.percentage}%</span>
            </div>
            <div className="study-progress-track" aria-label={`本週進度 ${weeklyProgress.percentage}%`}>
              <div className="study-progress-fill" style={{ width: `${weeklyProgress.percentage}%` }} />
            </div>
            <p>本週還差 {weeklyProgress.remaining} 題・剩餘 {weeklyProgress.remainingDays} 天</p>
          </article>

          <article className={`study-card study-reminder-card study-reminder-${reminder.level}`}>
            <span className="study-eyebrow">今日建議</span>
            <strong>{reminder.title}</strong>
            <p>{reminder.message}</p>
            <div className="study-reminder-footer">
              <span>今日已完成 {todayCompleted} / {studyConfig.dailyQuestionTarget} 題</span>
              {reminder.suggestedQuestions > 0 && <span>建議：{reminder.suggestedQuestions} 題</span>}
            </div>
            <button onClick={() => onStartTodayTask(reminder.suggestedQuestions)} className="study-task-button">開始今日任務：Week1 練習 {reminder.suggestedQuestions || studyConfig.dailyQuestionTarget} 題</button>
          </article>

          <article className="study-card study-streak-card">
            <span className="study-eyebrow">連續學習</span>
            <strong>{studyProgress.currentStreak} 天</strong>
            <p>同一天完成多次測驗只計為一天。</p>
          </article>
        </section>

        {/* [2] Progress + Coach 左右排列 (桌機並排，行動端自動堆疊) */}
        <div className="home-progress-grid grid grid-cols-1 lg:grid-cols-3 gap-6 w-full items-start">
          <div className="lg:col-span-2 w-full">
            <ProgressSection />
          </div>
          <div className="lg:col-span-1 w-full">
            <CoachSection hasHistory={hasHistory} />
          </div>
        </div>

        {/* [3] Mission 滿版 */}
        <div className="w-full">
          <MissionSection />
        </div>

        {/* [4] Exam 滿版 */}
        <div className="w-full">
          <ExamSection onStartExam={onStartNewExam} />
        </div>

        {/* [5] Activity 滿版 */}
        <div className="w-full">
          <RecentActivitySection hasHistory={hasHistory} />
        </div>

        {/* [6] Roadmap 滿版 */}
        <div className="w-full">
          <RoadmapSection />
        </div>

        {/* [7] Footer 滿版 */}
        <div className="w-full pt-4">
          <FooterSection />
        </div>
      </div>
    </div>
  );
};

export default Home;
