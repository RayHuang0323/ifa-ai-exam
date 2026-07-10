import React, { useEffect, useState } from 'react';

// 引入切片元件
import { HeroSection } from '../components/home/HeroSection';
import { MissionSection } from '../components/home/MissionSection';
import { ExamSection } from '../components/home/ExamSection';
import { CoachSection } from '../components/home/CoachSection';
import { RecentActivitySection } from '../components/home/RecentActivitySection';
import { RoadmapSection } from '../components/home/RoadmapSection';
import { FooterSection } from '../components/home/FooterSection';
import { studyConfig } from '../data/studyConfig';
import { getExamCountdown, getWeeklyProgress, loadStudyProgress } from '../utils/studyProgress';
import { getStudyReminder } from '../utils/studyReminder';
import type { StudyProgress } from '../types/study';
import type { StudyMode } from '../types/study';
import { loadWrongAnswers } from '../utils/wrongAnswerStore';
import { planTodayTask } from '../utils/taskPlanner';
import { getQuestionCountByWeek } from '../utils/questionBank';
import type { WrongAnswerRecord } from '../types/task';

interface HomeProps {
  hasExamDraft: boolean;
  onResumeExam: () => void;
  onStartTodayTask: (suggestedQuestions: number, mode: StudyMode) => void;
  onStartNewExam: () => void;
}

const Home: React.FC<HomeProps> = ({ hasExamDraft, onResumeExam, onStartTodayTask, onStartNewExam }) => {
  const [hasHistory, setHasHistory] = useState<boolean>(false);
  const [studyProgress, setStudyProgress] = useState<StudyProgress>(() => loadStudyProgress());
  const [wrongAnswers, setWrongAnswers] = useState<WrongAnswerRecord[]>([]);

  useEffect(() => {
    try {
      const existingState = localStorage.getItem('ifa_exam_state');
      const latestProgress = loadStudyProgress();
      setStudyProgress(latestProgress);
      setWrongAnswers(loadWrongAnswers());
      setHasHistory(Boolean(existingState) || latestProgress.sessions.length > 0);
    } catch (error) {
      console.error('Failed to read configuration storage key:', error);
    }
  }, []);

  const now = new Date();
  const weeklyProgress = getWeeklyProgress(studyProgress, now);
  const reminder = getStudyReminder(studyProgress, weeklyProgress, now);
  const examCountdown = getExamCountdown(now);
  const wrongAnswerCount = wrongAnswers.length;
  const todayTask = planTodayTask(studyProgress, weeklyProgress, wrongAnswerCount, reminder.daysSinceLastStudy);
  const countdownLabel = examCountdown === 0 ? '今天考試' : examCountdown < 0 ? '考試已結束' : `${examCountdown} 天`;
  const week1Total = getQuestionCountByWeek('week-1');
  const practicedQuestionIds = new Set<number>();
  studyProgress.sessions.filter((session) => session.weekId === 'week-1').forEach((session) => session.questionIds?.forEach((id) => practicedQuestionIds.add(id)));
  wrongAnswers.forEach((record) => practicedQuestionIds.add(record.questionId));
  const practicedCount = practicedQuestionIds.size;
  const remainingQuestionCount = Math.max(0, week1Total - practicedCount);

  return (
    <div className="min-h-screen bg-[#fafafa] text-slate-800 antialiased selection:bg-slate-200 w-full flex flex-col items-center">
      <div className="home-content max-w-5xl w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8 flex flex-col items-center">
        {/* [1] Hero 滿版 */}
        <div className="w-full">
          <HeroSection hasExamDraft={hasExamDraft} onResumeExam={onResumeExam} />
        </div>

        <section className="study-dashboard home-primary-dashboard" aria-label="今日學習重點">
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
            <p className="study-memory-focus">每週記憶強化：{wrongAnswerCount > 0 ? `本週錯題 ${wrongAnswerCount} 題，建議至少再複習 ${studyConfig.weeklyTask.weeklyReviewTarget} 題錯題與重點題。` : '完成更多測驗後，系統會整理本週錯題與複習重點。'}</p>
          </article>

          <MissionSection task={todayTask} wrongAnswerCount={wrongAnswerCount} onStartTask={onStartTodayTask} />
        </section>

        <section className="learning-status-grid" aria-label="學習狀態">
          <article className="study-card study-streak-card">
            <span className="study-eyebrow">連續學習</span>
            <strong>{studyProgress.currentStreak} 天</strong>
            <p>同一天完成多次測驗只計為一天。</p>
          </article>
          <article className="study-card">
            <span className="study-eyebrow">錯題數</span>
            <strong>{wrongAnswerCount} 題</strong>
            <p>{wrongAnswerCount > 0 ? '錯題會保留為後續複習依據。' : '完成測驗後會建立錯題紀錄。'}</p>
          </article>
          <article className="study-card coverage-card" data-testid="week1-coverage">
            <span className="study-eyebrow">Week1 題庫覆蓋率</span>
            <strong>已練習 {practicedCount} / {week1Total} 題</strong>
            <p>尚未練習：{remainingQuestionCount} 題</p>
            <p>錯題：{wrongAnswerCount} 題・待複習：{wrongAnswerCount} 題</p>
          </article>
        </section>

        <section className="home-secondary-content" aria-label="其他學習功能">
          <div className="w-full">
            <ExamSection onStartExam={onStartNewExam} />
          </div>
          <div className="w-full"><RecentActivitySection hasHistory={hasHistory} /></div>
          <div className="w-full"><RoadmapSection /></div>
          <div className="w-full"><CoachSection hasHistory={hasHistory} /></div>
        </section>

        <div className="w-full pt-4">
          <FooterSection />
        </div>
      </div>
    </div>
  );
};

export default Home;
