import type { StudyMode } from '../types/study';

export const calculateTimeLimitInMinutes = (mode: StudyMode, questions: { type: string }[]) => {
  if (mode === 'formal-exam') return 90;
  const minutes = questions.reduce((total, question) => total + (question.type === 'essay' ? 10 : question.type === 'short_answer' ? 4 : 1), 0);
  if (mode === 'reviewWrong') return Math.min(20, Math.max(5, minutes));
  if (mode === 'weeklyCatchUp') return Math.min(60, Math.max(20, minutes));
  return Math.min(30, Math.max(10, minutes));
};
