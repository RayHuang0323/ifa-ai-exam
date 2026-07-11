export type StudyMode = 'formal-exam' | 'daily' | 'weeklyCatchUp' | 'recovery' | 'reviewWrong';

export interface StudySession {
  id: string;
  date: string;
  weekId: string;
  mode: StudyMode;
  answeredCount: number;
  correctCount: number;
  wrongCount: number;
  durationSeconds: number;
  completedAt: string;
  startedAt?: string;
  questionIds?: number[];
  correctQuestionIds?: number[];
  wrongQuestionIds?: number[];
  skippedQuestionIds?: number[];
}

export interface StudyProgress {
  version: number;
  sessions: StudySession[];
  lastStudyDate: string | null;
  currentStreak: number;
  longestStreak: number;
}

export interface WeeklyProgress {
  weekStart: string;
  weekEnd: string;
  target: number;
  completed: number;
  percentage: number;
  remaining: number;
  remainingDays: number;
}

export type ReminderLevel = 'not-started' | 'on-track' | 'slightly-behind' | 'behind' | 'inactive' | 'completed' | 'exam-day';

export interface ReminderStatus {
  level: ReminderLevel;
  title: string;
  message: string;
  suggestedQuestions: number;
  daysSinceLastStudy: number | null;
}
