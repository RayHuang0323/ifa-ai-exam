import { studyConfig } from '../data/studyConfig';
import type { StudyProgress, StudySession, WeeklyProgress } from '../types/study';

const legacyResultKey = 'ifa_exam_state';

const createEmptyProgress = (): StudyProgress => ({
  version: studyConfig.localStorageVersion,
  sessions: [],
  lastStudyDate: null,
  currentStreak: 0,
  longestStreak: 0,
});

const toLocalDate = (value: Date) => {
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, '0');
  const day = `${value.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseLocalDate = (date: string) => {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const isValidSession = (value: unknown): value is StudySession => {
  if (!value || typeof value !== 'object') return false;
  const session = value as Partial<StudySession>;
  return typeof session.id === 'string'
    && typeof session.date === 'string'
    && typeof session.weekId === 'string'
    && session.mode === 'formal-exam'
    && typeof session.answeredCount === 'number'
    && typeof session.correctCount === 'number'
    && typeof session.wrongCount === 'number'
    && typeof session.durationSeconds === 'number'
    && typeof session.completedAt === 'string';
};

const refreshStreaks = (progress: StudyProgress, today = new Date()): StudyProgress => {
  const uniqueDates = [...new Set(progress.sessions.map((session) => session.date))].sort().reverse();
  const todayDate = toLocalDate(today);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const validStart = uniqueDates[0] === todayDate || uniqueDates[0] === toLocalDate(yesterday);
  let currentStreak = 0;

  if (validStart && uniqueDates[0]) {
    let cursor = parseLocalDate(uniqueDates[0]);
    for (const date of uniqueDates) {
      if (date !== toLocalDate(cursor)) break;
      currentStreak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
  }

  let longestStreak = 0;
  let runningStreak = 0;
  let previousDate: Date | null = null;
  for (const date of [...uniqueDates].reverse()) {
    const currentDate = parseLocalDate(date);
    if (previousDate) {
      const expected = new Date(previousDate);
      expected.setDate(expected.getDate() + 1);
      runningStreak = toLocalDate(expected) === date ? runningStreak + 1 : 1;
    } else {
      runningStreak = 1;
    }
    longestStreak = Math.max(longestStreak, runningStreak);
    previousDate = currentDate;
  }

  return {
    ...progress,
    lastStudyDate: uniqueDates[0] ?? null,
    currentStreak,
    longestStreak: Math.max(progress.longestStreak, longestStreak),
  };
};

const migrateLegacyResult = (progress: StudyProgress): StudyProgress => {
  if (progress.sessions.length > 0 || typeof window === 'undefined') return progress;

  try {
    const raw = window.localStorage.getItem(legacyResultKey);
    if (!raw) return progress;
    const legacy = JSON.parse(raw) as Record<string, unknown>;
    const completedAt = typeof legacy.completedAt === 'string' ? legacy.completedAt : null;
    const correctCount = typeof legacy.correctCount === 'number' ? legacy.correctCount : null;
    const wrongCount = typeof legacy.wrongCount === 'number' ? legacy.wrongCount : null;
    const durationSeconds = typeof legacy.timeSpent === 'number' ? legacy.timeSpent : null;

    if (!completedAt || correctCount === null || wrongCount === null || durationSeconds === null || correctCount < 0 || wrongCount < 0 || durationSeconds < 0) {
      return progress;
    }

    const completedDate = new Date(completedAt);
    if (Number.isNaN(completedDate.getTime())) return progress;

    return refreshStreaks({
      ...progress,
      sessions: [{
        id: `legacy-week1-${completedAt}`,
        date: toLocalDate(completedDate),
        weekId: 'week-1',
        mode: 'formal-exam',
        answeredCount: correctCount + wrongCount,
        correctCount,
        wrongCount,
        durationSeconds,
        completedAt,
      }],
    });
  } catch {
    return progress;
  }
};

export const loadStudyProgress = (): StudyProgress => {
  const fallback = createEmptyProgress();
  if (typeof window === 'undefined') return fallback;

  try {
    const raw = window.localStorage.getItem(studyConfig.localStorageKey);
    if (!raw) {
      const migrated = migrateLegacyResult(fallback);
      if (migrated.sessions.length > 0) saveStudyProgress(migrated);
      return migrated;
    }
    const parsed = JSON.parse(raw) as Partial<StudyProgress>;
    if (!Array.isArray(parsed.sessions) || !parsed.sessions.every(isValidSession)) {
      const migrated = migrateLegacyResult(fallback);
      if (migrated.sessions.length > 0) saveStudyProgress(migrated);
      return migrated;
    }

    return refreshStreaks({
      version: studyConfig.localStorageVersion,
      sessions: parsed.sessions,
      lastStudyDate: typeof parsed.lastStudyDate === 'string' ? parsed.lastStudyDate : null,
      currentStreak: typeof parsed.currentStreak === 'number' ? parsed.currentStreak : 0,
      longestStreak: typeof parsed.longestStreak === 'number' ? parsed.longestStreak : 0,
    });
  } catch {
    return migrateLegacyResult(fallback);
  }
};

export const saveStudyProgress = (progress: StudyProgress) => {
  try {
    window.localStorage.setItem(studyConfig.localStorageKey, JSON.stringify(progress));
  } catch (error) {
    console.error('Failed to save study progress:', error);
  }
};

export const recordStudySession = (session: StudySession) => {
  const progress = loadStudyProgress();
  if (progress.sessions.some((item) => item.id === session.id)) return progress;

  const nextProgress = refreshStreaks({ ...progress, sessions: [...progress.sessions, session] });
  saveStudyProgress(nextProgress);
  return nextProgress;
};

export const getWeeklyProgress = (progress: StudyProgress, now = new Date()): WeeklyProgress => {
  const weekStartDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekday = weekStartDate.getDay() || 7;
  weekStartDate.setDate(weekStartDate.getDate() - weekday + 1);
  const weekEndDate = new Date(weekStartDate);
  weekEndDate.setDate(weekEndDate.getDate() + 6);
  const completed = progress.sessions
    .filter((session) => session.date >= toLocalDate(weekStartDate) && session.date <= toLocalDate(weekEndDate))
    .reduce((total, session) => total + session.answeredCount, 0);
  const remaining = Math.max(0, studyConfig.weeklyQuestionTarget - completed);
  const dayIndex = Math.min(6, Math.max(0, Math.floor((new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() - weekStartDate.getTime()) / 86400000)));

  return {
    weekStart: toLocalDate(weekStartDate),
    weekEnd: toLocalDate(weekEndDate),
    target: studyConfig.weeklyQuestionTarget,
    completed,
    percentage: Math.min(100, Math.round((completed / studyConfig.weeklyQuestionTarget) * 100)),
    remaining,
    remainingDays: Math.max(1, 7 - dayIndex),
  };
};

export const getTodayCompleted = (progress: StudyProgress, now = new Date()) =>
  progress.sessions.filter((session) => session.date === toLocalDate(now)).reduce((total, session) => total + session.answeredCount, 0);

export const getExamCountdown = (now = new Date()) => {
  const examDate = parseLocalDate(studyConfig.examDate);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((examDate.getTime() - today.getTime()) / 86400000);
};

export const getLocalDateString = toLocalDate;
