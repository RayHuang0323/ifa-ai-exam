import type { StudyMode } from '../types/study';

export const calculateTimeLimitInMinutes = (mode: StudyMode, questions: { type: string }[]) => {
  if (mode === 'formal-exam') return 90;
  const minutes = questions.reduce((total, question) => total + (question.type === 'essay' || question.type === 'case' || question.type === 'case_study' ? 10 : ['short_answer', 'short-answer', 'shortAnswer'].includes(question.type) ? 4 : 1), 0);
  if (mode === 'reviewWrong') return Math.min(20, Math.max(5, minutes));
  if (mode === 'weeklyCatchUp') return Math.min(60, Math.max(20, minutes));
  if (mode === 'weeklyReview') return Math.min(75, Math.max(30, minutes));
  return Math.min(30, Math.max(10, minutes));
};
