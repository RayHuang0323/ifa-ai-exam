import { studyConfig } from '../data/studyConfig';
import type { ReminderStatus, StudyProgress, WeeklyProgress } from '../types/study';
import { getExamCountdown, getLocalDateString } from './studyProgress';

const getDaysSinceLastStudy = (progress: StudyProgress, now: Date) => {
  if (!progress.lastStudyDate) return null;
  const [year, month, day] = progress.lastStudyDate.split('-').map(Number);
  const lastStudyDate = new Date(year, month - 1, day);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.max(0, Math.round((today.getTime() - lastStudyDate.getTime()) / 86400000));
};

export const getStudyReminder = (progress: StudyProgress, weekly: WeeklyProgress, now = new Date()): ReminderStatus => {
  const examCountdown = getExamCountdown(now);
  const daysSinceLastStudy = getDaysSinceLastStudy(progress, now);
  const expectedCompleted = Math.ceil(weekly.target * ((7 - weekly.remainingDays + 1) / 7));
  const dailyAverage = Math.max(1, Math.ceil(weekly.remaining / weekly.remainingDays));
  const today = getLocalDateString(now);

  if (examCountdown <= 0) {
    return {
      level: 'exam-day',
      title: examCountdown === 0 ? '今天考試' : '考試已結束',
      message: examCountdown === 0 ? '今天請以熟悉流程與穩定心態為主。' : '本期考試日期已過，請依新的備考安排繼續練習。',
      suggestedQuestions: 0,
      daysSinceLastStudy,
    };
  }

  if (weekly.remaining === 0) {
    return {
      level: 'completed',
      title: '本週目標已完成',
      message: '本週目標已完成，可進行錯題複習；錯題複習模式將在後續 Sprint 提供。',
      suggestedQuestions: 0,
      daysSinceLastStudy,
    };
  }

  if (daysSinceLastStudy !== null && daysSinceLastStudy >= 4) {
    return {
      level: 'inactive',
      title: `已 ${daysSinceLastStudy} 天沒有練習`,
      message: `今天先完成 ${studyConfig.minimumRecoveryQuestions} 題恢復手感，不需要一次補完全部進度。`,
      suggestedQuestions: studyConfig.minimumRecoveryQuestions,
      daysSinceLastStudy,
    };
  }

  if (daysSinceLastStudy !== null && daysSinceLastStudy >= 2) {
    const suggestedQuestions = Math.max(studyConfig.minimumRecoveryQuestions, Math.min(studyConfig.dailyQuestionTarget, dailyAverage));
    return {
      level: 'inactive',
      title: `已 ${daysSinceLastStudy} 天沒有練習`,
      message: `今天先完成 ${suggestedQuestions} 題恢復手感，再逐步追上本週進度。`,
      suggestedQuestions,
      daysSinceLastStudy,
    };
  }

  if (progress.sessions.length === 0 || (progress.lastStudyDate !== today && weekly.completed === 0)) {
    return {
      level: 'not-started',
      title: '本週尚未開始',
      message: `今天先完成 ${studyConfig.dailyQuestionTarget} 題，建立本週學習節奏。`,
      suggestedQuestions: studyConfig.dailyQuestionTarget,
      daysSinceLastStudy,
    };
  }

  if (weekly.completed < expectedCompleted * 0.65) {
    return {
      level: 'behind',
      title: '本週進度明顯落後',
      message: `本週還差 ${weekly.remaining} 題，平均每天需完成 ${dailyAverage} 題。`,
      suggestedQuestions: dailyAverage,
      daysSinceLastStudy,
    };
  }

  if (weekly.completed < expectedCompleted * 0.9) {
    return {
      level: 'slightly-behind',
      title: '本週進度稍微落後',
      message: `本週還差 ${weekly.remaining} 題，今天完成 ${dailyAverage} 題即可逐步追上。`,
      suggestedQuestions: dailyAverage,
      daysSinceLastStudy,
    };
  }

  return {
    level: 'on-track',
    title: '本週進度正常',
    message: `本週進度正常，今天完成 ${dailyAverage} 題即可維持節奏。`,
    suggestedQuestions: dailyAverage,
    daysSinceLastStudy,
  };
};
