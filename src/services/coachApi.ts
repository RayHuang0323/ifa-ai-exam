export const coachReadKeyStorageKey = 'ifa-coach-read-key-v1';
export interface CoachSummary { learnerId: string; learnerName: string; todayAnsweredCount: number; todayCompletedSessions: number; totalAnsweredCount: number; totalCorrectCount: number; totalWrongCount: number; overallAccuracy: number | null; completedSessionCount: number; latestScore: number | null; lastActivityAt: string | null; generatedAt: string; }
export interface CoachSession { sessionId: string; examTitle: string; examType: string; status: string; startedAt: string; updatedAt: string; completedAt: string; questionCount: number; answeredCount: number; correctCount: number | null; wrongCount: number | null; score: number | null; durationSeconds: number | null; }
export interface CoachAnswer { questionId: string; selectedAnswer: unknown; correctAnswer: unknown; isCorrect: boolean | null; answeredAt: string; syncedAt: string; }
export interface CoachLearningAnalysis { completedQuestionCount: number; completedQuestionIds: number[]; incompleteQuestionCount: number; lastCompletedAt: string | null; wrongByCategory: Array<{ category: string; count: number }>; weakestCategory: string | null; }
const apiUrl = () => (import.meta.env.VITE_PROGRESS_API_URL as string | undefined)?.trim() ?? '';
const request = async <T>(action: string, readKey: string, sessionId?: string): Promise<T> => {
  if (!apiUrl()) throw new Error('unavailable');
  const url = new URL(apiUrl()); url.searchParams.set('action', action); url.searchParams.set('readKey', readKey); if (sessionId) url.searchParams.set('sessionId', sessionId);
  const response = await fetch(url.toString()); const result = await response.json() as { success?: boolean; error?: string; data?: T };
  if (!response.ok || result.success !== true) throw new Error(result.error === 'unauthorized' ? 'unauthorized' : 'unavailable');
  return result.data as T;
};
export const getCoachSummary = (readKey: string) => request<CoachSummary>('getCoachSummary', readKey);
export const getRecentSessions = (readKey: string) => request<CoachSession[]>('getRecentSessions', readKey);
export const getSessionDetails = (readKey: string, sessionId: string) => request<{ session: CoachSession; answers: CoachAnswer[] }>('getSessionDetails', readKey, sessionId);
export const getCoachLearningAnalysis = async (readKey: string, totalQuestionCount: number) => {
  if (!apiUrl()) throw new Error('unavailable');
  const url = new URL(apiUrl());
  url.searchParams.set('action', 'getCoachLearningAnalysis');
  url.searchParams.set('readKey', readKey);
  url.searchParams.set('totalQuestionCount', String(totalQuestionCount));
  const response = await fetch(url.toString());
  const result = await response.json() as { success?: boolean; error?: string; data?: CoachLearningAnalysis };
  if (!response.ok || result.success !== true || !result.data) throw new Error(result.error === 'unauthorized' ? 'unauthorized' : 'unavailable');
  return result.data;
};
