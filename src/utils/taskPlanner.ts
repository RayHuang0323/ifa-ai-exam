import { studyConfig } from '../data/studyConfig';
import type { TodayTask } from '../types/task';
import type { StudyProgress, WeeklyProgress } from '../types/study';

export const planTodayTask = (progress: StudyProgress, weekly: WeeklyProgress, wrongAnswerCount: number, daysSinceLastStudy: number | null): TodayTask => {
  void progress;
  const behind = weekly.completed < Math.ceil(weekly.target * ((7 - weekly.remainingDays + 1) / 7)) * .65;
  if (weekly.remaining === 0) return { id: 'week-1-review-preview', title: '本週記憶強化', description: '本週目標已完成，可準備進行錯題複習。', mode: 'reviewPreview', weekId: 'week-1', suggestedQuestions: 0, source: 'week-1', reason: wrongAnswerCount > 0 ? `目前累積 ${wrongAnswerCount} 題錯題，後續可優先複習。` : '完成更多測驗後，系統會建立錯題複習清單。', estimatedMinutes: 0, ctaLabel: 'Week1 測驗仍可使用' };
  if (daysSinceLastStudy !== null && daysSinceLastStudy >= 3) return { id: 'week-1-recovery', title: '恢復手感', description: `建議 ${studyConfig.recovery.minimumRecoveryQuestions} 題，約 5 分鐘`, mode: 'recovery', weekId: 'week-1', suggestedQuestions: studyConfig.recovery.minimumRecoveryQuestions, source: 'week-1', reason: '已有數天未練習，今天先完成短測驗即可。', estimatedMinutes: 5, ctaLabel: `開始今日任務：Week1 ${studyConfig.recovery.minimumRecoveryQuestions} 題` };
  if (behind) return { id: 'week-1-catch-up', title: '本週進度補強', description: `建議 ${studyConfig.recovery.heavyRecoveryQuestions} 題，約 12 分鐘`, mode: 'weeklyCatchUp', weekId: 'week-1', suggestedQuestions: studyConfig.recovery.heavyRecoveryQuestions, source: 'week-1', reason: '本週進度落後，先補一小段即可。', estimatedMinutes: 12, ctaLabel: `開始今日任務：Week1 ${studyConfig.recovery.heavyRecoveryQuestions} 題` };
  return { id: 'week-1-daily', title: 'Week1 每日練習', description: `建議 ${studyConfig.dailyTask.defaultDailyQuestions} 題，約 8 分鐘`, mode: 'daily', weekId: 'week-1', suggestedQuestions: studyConfig.dailyTask.defaultDailyQuestions, source: 'week-1', reason: '本週進度正常，今天維持手感即可。', estimatedMinutes: 8, ctaLabel: `開始今日任務：Week1 ${studyConfig.dailyTask.defaultDailyQuestions} 題` };
};
