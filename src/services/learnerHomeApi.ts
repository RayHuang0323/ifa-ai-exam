import type { StudyMode, StudySession } from '../types/study';
import { officialStartDate } from '../config/learningBaseline';
import { getFormalQuestionPool, getQuestionsByWeek } from '../utils/questionEngine';

export interface CoverageSummary { practicedCount: number; totalCount: number; remainingCount: number; percent: number; }

export interface LearnerHomeSummary {
  learnerId: 'bella';
  learnerName: 'Bella';
  officialStartDate: string;
  todayAnsweredCount: number;
  todayCompletedSessions: number;
  weekAnsweredCount: number;
  weekCompletedSessions: number;
  totalAnsweredCount: number;
  totalCorrectCount: number;
  totalWrongCount: number;
  overallAccuracy: number | null;
  recentActivities: StudySession[];
  wrongAnswerCount: number;
  lastActivityAt: string | null;
  generatedAt: string;
  coverage: { week1: CoverageSummary; week2: CoverageSummary; all: CoverageSummary };
}

const apiUrl = import.meta.env.VITE_PROGRESS_API_URL as string | undefined;
const writeKey = import.meta.env.VITE_PROGRESS_WRITE_KEY as string | undefined;

export const getLearnerHomeSummary = async (): Promise<LearnerHomeSummary> => {
  if (!apiUrl) throw new Error('remote-unavailable');
  const url = new URL(apiUrl);
  url.searchParams.set('action', 'getLearnerHomeSummary');
  const coverageSets = {
    week1: getQuestionsByWeek('week-1').map((question) => question.id),
    week2: getQuestionsByWeek('week-2').map((question) => question.id),
    all: getFormalQuestionPool().map((question) => question.id),
  };
  url.searchParams.set('coverageSets', JSON.stringify(coverageSets));
  if (writeKey) url.searchParams.set('writeKey', writeKey);
  const response = await fetch(url.toString());
  const payload = await response.json() as { success?: boolean; data?: LearnerHomeSummary };
  if (!response.ok || !payload.success || !payload.data || payload.data.learnerId !== 'bella') throw new Error('remote-unavailable');
  return {
    ...payload.data,
    officialStartDate: payload.data.officialStartDate || officialStartDate,
    coverage: payload.data.coverage ?? {
      week1: { practicedCount: 0, totalCount: coverageSets.week1.length, remainingCount: coverageSets.week1.length, percent: 0 },
      week2: { practicedCount: 0, totalCount: coverageSets.week2.length, remainingCount: coverageSets.week2.length, percent: 0 },
      all: { practicedCount: 0, totalCount: coverageSets.all.length, remainingCount: coverageSets.all.length, percent: 0 },
    },
    recentActivities: Array.isArray(payload.data.recentActivities) ? payload.data.recentActivities.map((item) => ({ ...item, mode: item.mode as StudyMode })) : [],
  };
};
