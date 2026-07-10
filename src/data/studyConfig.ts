export const studyConfig = {
  examDate: '2026-09-08',
  dailyQuestionTarget: 10,
  weeklyQuestionTarget: 120,
  minimumRecoveryQuestions: 5,
  dailyTask: { busyDayQuestions: 5, normalDayQuestions: 10, focusedDayQuestions: 20, defaultDailyQuestions: 10 },
  weeklyTask: { weeklyQuestionTarget: 120, weeklyReviewTarget: 30, weeklyMemoryFocusMinQuestions: 40 },
  recovery: { minimumRecoveryQuestions: 5, normalRecoveryQuestions: 10, heavyRecoveryQuestions: 15 },
  localStorageVersion: 1,
  localStorageKey: 'ifa-study-progress-v1',
} as const;
