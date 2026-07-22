import { getStorageItem, safeJsonParse, setStorageItem } from './storageHealth';
import { getProfileStorageKey } from './learnerProfile';
import { FINAL_REVIEW_MODE, finalReviewWeights } from '../config/reviewMode';

export type SchedulerMode = 'daily' | 'weekly' | 'mock' | 'practice' | 'wrongReview';
export type SchedulerMastery = 'mastered' | 'mostly_mastered' | 'partial' | 'not_mastered' | 'needs_human_review' | 'unknown';
export type SchedulerQuestionConfidence = 'A' | 'B' | 'C';
export type SchedulerAnswerConfidence = 'A+' | 'A' | 'B' | 'C';

export interface SchedulerCandidate {
  id: number;
  formal?: boolean;
  priority?: number;
  sourceConfidence?: string;
  isImportant?: boolean;
  isActive?: boolean;
  excludeFromPractice?: boolean;
  deprecated?: boolean;
  practiceOnly?: boolean;
  questionConfidence?: SchedulerQuestionConfidence;
  answerConfidence?: SchedulerAnswerConfidence;
  duplicateGroupId?: string;
  duplicateRisk?: 'none' | 'low' | 'medium' | 'high';
  qualityStatus?: string;
  isMarked?: boolean;
  wrongCount?: number;
  category?: string;
}

export interface QuestionAppearanceRecord {
  questionId: number;
  firstShownAt?: string;
  lastShownAt?: string;
  shownCount: number;
  answeredCount: number;
  completedCount: number;
  lastModeShown?: SchedulerMode;
  lastSessionId?: string;
  cycleNumber: number;
  isCompletedOnce: boolean;
  mastery?: SchedulerMastery;
  recentModeHistory: Array<{ mode: SchedulerMode; shownAt: string; sessionId?: string }>;
}

export interface QuestionSchedulerState {
  version: 2;
  cycleNumber: number;
  records: Record<string, QuestionAppearanceRecord>;
  recentSessions: Array<{ sessionId: string; mode: SchedulerMode; questionIds: number[]; shownAt: string }>;
  importedSessionIds: string[];
}

export interface FirstRoundStats {
  appearedCount: number;
  totalCount: number;
  percentage: number;
  remainingCount: number;
}

export const questionSchedulerStorageKey = 'ifa-question-scheduler-v2';
const MAX_RECENT_SESSIONS = 60;
const MAX_MODE_HISTORY = 12;
const DAY_MS = 86400000;

const emptyState = (): QuestionSchedulerState => ({ version: 2, cycleNumber: 1, records: {}, recentSessions: [], importedSessionIds: [] });
const nowIso = () => new Date().toISOString();
const uniqueIds = (ids: number[]) => [...new Set(ids.filter((id) => Number.isFinite(id)))];
const validMode = (value: unknown): value is SchedulerMode => ['daily', 'weekly', 'mock', 'practice', 'wrongReview'].includes(String(value));

const normalizeRecord = (value: unknown, questionId: number): QuestionAppearanceRecord => {
  const record = value && typeof value === 'object' ? value as Partial<QuestionAppearanceRecord> : {};
  const history = Array.isArray(record.recentModeHistory) ? record.recentModeHistory
    .filter((item): item is { mode: SchedulerMode; shownAt: string; sessionId?: string } => Boolean(item && typeof item === 'object' && validMode((item as { mode?: unknown }).mode) && typeof (item as { shownAt?: unknown }).shownAt === 'string'))
    .slice(-MAX_MODE_HISTORY) : [];
  return {
    questionId,
    firstShownAt: typeof record.firstShownAt === 'string' ? record.firstShownAt : undefined,
    lastShownAt: typeof record.lastShownAt === 'string' ? record.lastShownAt : undefined,
    shownCount: typeof record.shownCount === 'number' && record.shownCount >= 0 ? record.shownCount : 0,
    answeredCount: typeof record.answeredCount === 'number' && record.answeredCount >= 0 ? record.answeredCount : 0,
    completedCount: typeof record.completedCount === 'number' && record.completedCount >= 0 ? record.completedCount : 0,
    lastModeShown: validMode(record.lastModeShown) ? record.lastModeShown : undefined,
    lastSessionId: typeof record.lastSessionId === 'string' ? record.lastSessionId : undefined,
    cycleNumber: typeof record.cycleNumber === 'number' && record.cycleNumber > 0 ? record.cycleNumber : 1,
    isCompletedOnce: record.isCompletedOnce === true,
    mastery: typeof record.mastery === 'string' ? record.mastery as SchedulerMastery : 'unknown',
    recentModeHistory: history,
  };
};

const normalizeState = (value: unknown): QuestionSchedulerState => {
  if (!value || typeof value !== 'object') return emptyState();
  const parsed = value as Partial<QuestionSchedulerState>;
  const records: Record<string, QuestionAppearanceRecord> = {};
  if (parsed.records && typeof parsed.records === 'object') Object.entries(parsed.records).forEach(([key, record]) => {
    const id = Number(key);
    if (Number.isFinite(id)) records[String(id)] = normalizeRecord(record, id);
  });
  const recentSessions = Array.isArray(parsed.recentSessions) ? parsed.recentSessions
    .filter((session): session is { sessionId: string; mode: SchedulerMode; questionIds: number[]; shownAt: string } => Boolean(session && typeof session === 'object' && typeof (session as { sessionId?: unknown }).sessionId === 'string' && validMode((session as { mode?: unknown }).mode) && typeof (session as { shownAt?: unknown }).shownAt === 'string' && Array.isArray((session as { questionIds?: unknown }).questionIds)))
    .map((session) => ({ ...session, questionIds: uniqueIds(session.questionIds) }))
    .slice(-MAX_RECENT_SESSIONS) : [];
  const importedSessionIds = Array.isArray(parsed.importedSessionIds) ? parsed.importedSessionIds.filter((id): id is string => typeof id === 'string').slice(-500) : [];
  return { version: 2, cycleNumber: typeof parsed.cycleNumber === 'number' && parsed.cycleNumber > 0 ? parsed.cycleNumber : 1, records, recentSessions, importedSessionIds };
};

export const loadQuestionSchedulerState = (): QuestionSchedulerState => normalizeState(safeJsonParse<unknown>(getStorageItem(getProfileStorageKey(questionSchedulerStorageKey))));
export const saveQuestionSchedulerState = (state: QuestionSchedulerState) => {
  try { setStorageItem(getProfileStorageKey(questionSchedulerStorageKey), JSON.stringify(state)); } catch { /* 選題紀錄不可用時仍可作答 */ }
};
export const clearQuestionSchedulerState = () => saveQuestionSchedulerState(emptyState());

export const getQuestionAppearance = (questionId: number, state = loadQuestionSchedulerState()) => state.records[String(questionId)] ?? normalizeRecord(null, questionId);

const updateRecords = (mutator: (state: QuestionSchedulerState) => void) => {
  const state = loadQuestionSchedulerState();
  mutator(state);
  saveQuestionSchedulerState(state);
  return state;
};

export const recordQuestionsShown = (questionIds: number[], mode: SchedulerMode, sessionId = '') => {
  const shownAt = nowIso();
  return updateRecords((state) => {
    const ids = uniqueIds(questionIds);
    ids.forEach((questionId) => {
      const key = String(questionId);
      const previous = state.records[key] ?? normalizeRecord(null, questionId);
      state.records[key] = {
        ...previous,
        firstShownAt: previous.firstShownAt ?? shownAt,
        lastShownAt: shownAt,
        shownCount: previous.shownCount + 1,
        lastModeShown: mode,
        lastSessionId: sessionId || previous.lastSessionId,
        cycleNumber: previous.cycleNumber,
        recentModeHistory: [...previous.recentModeHistory, { mode, shownAt, ...(sessionId ? { sessionId } : {}) }].slice(-MAX_MODE_HISTORY),
      };
    });
    if (sessionId) state.recentSessions = [...state.recentSessions, { sessionId, mode, questionIds: ids, shownAt }].slice(-MAX_RECENT_SESSIONS);
  });
};

export interface HistoricalSchedulerSession {
  id: string;
  mode: string;
  questionIds?: number[];
  answeredQuestionIds?: number[];
  completedAt?: string;
  startedAt?: string;
}

const mapHistoricalMode = (mode: string): SchedulerMode => mode === 'formal-exam' ? 'mock' : mode === 'weeklyReview' || mode === 'weeklyCatchUp' ? 'weekly' : mode === 'daily' ? 'daily' : mode === 'reviewWrong' ? 'wrongReview' : 'practice';

/** 將既有本機 StudySession 一次匯入 Scheduler，避免部署後把最近已做題誤判為新題。 */
export const seedSchedulerFromHistoricalSessions = (sessions: HistoricalSchedulerSession[]) => updateRecords((state) => {
  sessions.filter((session) => typeof session.id === 'string' && Array.isArray(session.questionIds) && !state.importedSessionIds.includes(session.id) && !state.recentSessions.some((item) => item.sessionId === session.id)).forEach((session) => {
    const shownAt = session.startedAt || session.completedAt || nowIso();
    const mode = mapHistoricalMode(session.mode);
    const questionIds = uniqueIds(session.questionIds ?? []);
    const answeredIds = new Set(uniqueIds(session.answeredQuestionIds ?? []));
    questionIds.forEach((questionId) => {
      const previous = state.records[String(questionId)] ?? normalizeRecord(null, questionId);
      const previousLast = previous.lastShownAt ? new Date(previous.lastShownAt).getTime() : 0;
      const nextLast = new Date(shownAt).getTime() >= previousLast ? shownAt : previous.lastShownAt;
      const nextHistory = new Date(shownAt).getTime() >= previousLast ? [...previous.recentModeHistory, { mode, shownAt, sessionId: session.id }] : previous.recentModeHistory;
      state.records[String(questionId)] = {
        ...previous,
        firstShownAt: previous.firstShownAt && new Date(previous.firstShownAt).getTime() <= new Date(shownAt).getTime() ? previous.firstShownAt : shownAt,
        lastShownAt: nextLast,
        shownCount: previous.shownCount + 1,
        answeredCount: previous.answeredCount + (answeredIds.has(questionId) ? 1 : 0),
        completedCount: previous.completedCount + (answeredIds.has(questionId) ? 1 : 0),
        lastModeShown: nextLast === shownAt ? mode : previous.lastModeShown,
        lastSessionId: nextLast === shownAt ? session.id : previous.lastSessionId,
        isCompletedOnce: previous.isCompletedOnce || answeredIds.has(questionId),
        recentModeHistory: nextHistory.slice(-MAX_MODE_HISTORY),
      };
    });
    state.recentSessions = [...state.recentSessions, { sessionId: session.id, mode, questionIds, shownAt }].slice(-MAX_RECENT_SESSIONS);
    state.importedSessionIds = [...state.importedSessionIds, session.id].slice(-500);
  });
});

export const recordQuestionsAnswered = (questionIds: number[]) => updateRecords((state) => {
  uniqueIds(questionIds).forEach((questionId) => {
    const previous = state.records[String(questionId)] ?? normalizeRecord(null, questionId);
    state.records[String(questionId)] = { ...previous, answeredCount: previous.answeredCount + 1 };
  });
});

export const recordQuestionsCompleted = (questionIds: number[]) => updateRecords((state) => {
  uniqueIds(questionIds).forEach((questionId) => {
    const previous = state.records[String(questionId)] ?? normalizeRecord(null, questionId);
    state.records[String(questionId)] = { ...previous, completedCount: previous.completedCount + 1, isCompletedOnce: true };
  });
});

export const recordQuestionMastery = (questionId: number, mastery: SchedulerMastery) => updateRecords((state) => {
  const previous = state.records[String(questionId)] ?? normalizeRecord(null, questionId);
  state.records[String(questionId)] = { ...previous, mastery };
});

export const getRecentQuestionIds = (options: { modes?: SchedulerMode[]; days?: number; now?: Date } = {}) => {
  const state = loadQuestionSchedulerState();
  const modes = options.modes ? new Set(options.modes) : null;
  const cutoff = (options.now ?? new Date()).getTime() - (options.days ?? 2) * DAY_MS;
  return uniqueIds(state.recentSessions.filter((session) => new Date(session.shownAt).getTime() >= cutoff && (!modes || modes.has(session.mode))).flatMap((session) => session.questionIds));
};

const isBlocked = (candidate: SchedulerCandidate) => candidate.isActive === false || candidate.excludeFromPractice === true || candidate.deprecated === true || candidate.qualityStatus === 'unsafe_candidate' || candidate.qualityStatus === 'duplicate_candidate';
const candidateGroupKey = (candidate: SchedulerCandidate) => candidate.duplicateGroupId ? `group:${candidate.duplicateGroupId}` : `id:${candidate.id}`;
const getRecordScore = (candidate: SchedulerCandidate, state: QuestionSchedulerState) => {
  const record = getQuestionAppearance(candidate.id, state);
  const masteryPenalty = record.mastery === 'not_mastered' ? 40 : record.mastery === 'partial' || record.mastery === 'needs_human_review' ? 20 : record.mastery === 'mostly_mastered' ? 5 : 0;
  const priority = Math.max(0, candidate.priority ?? 0);
  const importance = candidate.isImportant ? 30 : (candidate.formal ? 10 : 0) + (candidate.sourceConfidence === 'high' ? 8 : 0);
  const age = record.lastShownAt ? Math.min(20, Math.max(0, (Date.now() - new Date(record.lastShownAt).getTime()) / DAY_MS)) : 20;
  return masteryPenalty + importance + priority + age - record.shownCount * 5;
};
const sortByScore = (candidates: SchedulerCandidate[], state: QuestionSchedulerState) => [...candidates].sort((a, b) => getRecordScore(b, state) - getRecordScore(a, state) || a.id - b.id);
const uniqueCandidates = (candidates: SchedulerCandidate[]) => [...new Map(candidates.filter((candidate) => Number.isFinite(candidate.id) && !isBlocked(candidate)).map((candidate) => [candidate.id, candidate])).values()];
const selectFromGroups = (groups: SchedulerCandidate[][], count: number, state: QuestionSchedulerState, selectedGroups = new Set<string>()) => {
  const selected: SchedulerCandidate[] = [];
  const seen = new Set<number>();
  groups.forEach((group) => sortByScore(group, state).forEach((candidate) => {
    const groupKey = candidateGroupKey(candidate);
    if (selected.length >= count || seen.has(candidate.id) || selectedGroups.has(groupKey)) return;
    selected.push(candidate); seen.add(candidate.id); selectedGroups.add(groupKey);
  }));
  return selected;
};
const uniqueGroups = (candidates: SchedulerCandidate[], count: number, blockedGroups = new Set<string>()) => {
  const selected: SchedulerCandidate[] = [];
  const seenGroups = new Set(blockedGroups);
  candidates.forEach((candidate) => {
    const groupKey = candidateGroupKey(candidate);
    if (selected.length >= count || seenGroups.has(groupKey)) return;
    selected.push(candidate);
    seenGroups.add(groupKey);
  });
  return selected;
};

const getCandidateConfidence = (candidate: SchedulerCandidate): SchedulerAnswerConfidence => candidate.answerConfidence ?? (candidate.questionConfidence === undefined && candidate.practiceOnly !== true ? 'A' : candidate.questionConfidence === 'C' || candidate.practiceOnly ? 'C' : candidate.questionConfidence === 'A' ? 'A' : 'B');
const selectCoverageQuestions = (candidates: SchedulerCandidate[], count: number, carryoverIds: number[], recentIds: Set<number>, state: QuestionSchedulerState, completedIds = new Set<number>(), maxLowConfidenceRatio?: number) => {
  const unique = uniqueCandidates(candidates);
  const completedGroups = new Set(unique.filter((candidate) => completedIds.has(candidate.id)).map(candidateGroupKey));
  const recentGroups = new Set(unique.filter((candidate) => recentIds.has(candidate.id)).map(candidateGroupKey));
  const blockedGroups = new Set([...completedGroups, ...recentGroups]);
  const available = unique.filter((candidate) => !completedIds.has(candidate.id));
  const byId = new Map(available.map((candidate) => [candidate.id, candidate]));
  const carryover = carryoverIds.map((id) => byId.get(id)).filter((candidate): candidate is SchedulerCandidate => Boolean(candidate));
  const carryoverGroups = new Set(carryover.map(candidateGroupKey));
  const remaining = available.filter((candidate) => !carryover.some((item) => item.id === candidate.id) && !carryoverGroups.has(candidateGroupKey(candidate)) && !blockedGroups.has(candidateGroupKey(candidate)));
  const neverShown = remaining.filter((candidate) => getQuestionAppearance(candidate.id, state).shownCount === 0);
  const unseenCycle = remaining.filter((candidate) => !getQuestionAppearance(candidate.id, state).isCompletedOnce && !recentIds.has(candidate.id));
  const nonrecent = remaining.filter((candidate) => !recentIds.has(candidate.id));
  const notMastered = remaining.filter((candidate) => ['not_mastered', 'partial', 'needs_human_review'].includes(getQuestionAppearance(candidate.id, state).mastery ?? 'unknown'));
  const groups = [neverShown, unseenCycle, nonrecent, notMastered, remaining];
  const maxLowConfidence = maxLowConfidenceRatio === undefined ? count : Math.floor(count * maxLowConfidenceRatio);
  const carryoverTop = carryover.filter((candidate) => ['A+', 'A'].includes(getCandidateConfidence(candidate)));
  const carryoverB = carryover.filter((candidate) => getCandidateConfidence(candidate) === 'B');
  const carryoverLow = carryover.filter((candidate) => getCandidateConfidence(candidate) === 'C');
  const selectedCarryoverHigh = uniqueGroups([...carryoverTop, ...carryoverB], count);
  const selectedCarryoverGroupIds = new Set(selectedCarryoverHigh.map(candidateGroupKey));
  const selectedCarryover = [...selectedCarryoverHigh, ...uniqueGroups(carryoverLow, Math.max(0, maxLowConfidence - selectedCarryoverHigh.filter((candidate) => getCandidateConfidence(candidate) === 'C').length), selectedCarryoverGroupIds)].slice(0, count);
  const remainingCount = Math.max(0, count - selectedCarryover.length);
  const selectedCarryoverLowCount = selectedCarryover.filter((candidate) => getCandidateConfidence(candidate) === 'C').length;
  const remainingLowSlots = Math.max(0, maxLowConfidence - selectedCarryoverLowCount);
  const topGroups = groups.map((group) => group.filter((candidate) => ['A+', 'A'].includes(getCandidateConfidence(candidate))));
  const bGroups = groups.map((group) => group.filter((candidate) => getCandidateConfidence(candidate) === 'B'));
  const lowGroups = groups.map((group) => group.filter((candidate) => getCandidateConfidence(candidate) === 'C'));
  const highBudget = Math.max(0, remainingCount - remainingLowSlots);
  const selectedGroups = new Set(selectedCarryover.map(candidateGroupKey));
  const selectedTop = selectFromGroups(topGroups, highBudget, state, selectedGroups);
  const selectedB = selectFromGroups(bGroups, Math.max(0, highBudget - selectedTop.length), state, selectedGroups);
  const selectedLow = selectFromGroups(lowGroups, Math.min(remainingLowSlots, remainingCount - selectedTop.length - selectedB.length), state, selectedGroups);
  const selected = [...selectedTop, ...selectedB, ...selectedLow];
  return [...selectedCarryover, ...selected].map((candidate) => candidate.id);
};

export const selectDailyQuestionIds = (candidates: SchedulerCandidate[], count: number, carryoverIds: number[] = [], permanentCompletedQuestionIds: number[] = []) => {
  const state = loadQuestionSchedulerState();
  const recentIds = new Set(getRecentQuestionIds({ modes: ['daily', 'weekly', 'mock'], days: 3 }));
  const completedIds = new Set([...permanentCompletedQuestionIds, ...Object.values(state.records).filter((record) => record.isCompletedOnce || record.completedCount > 0).map((record) => record.questionId)]);
  return selectCoverageQuestions(candidates, Math.max(0, count), carryoverIds, recentIds, state, completedIds, 0.1);
};

export const selectWeeklyQuestionIds = (candidates: SchedulerCandidate[], count: number, carryoverIds: number[] = [], permanentCompletedQuestionIds: number[] = []) => {
  const state = loadQuestionSchedulerState();
  const recentIds = new Set(getRecentQuestionIds({ modes: ['daily', 'weekly', 'mock'], days: 7 }));
  const completedIds = new Set([...permanentCompletedQuestionIds, ...Object.values(state.records).filter((record) => record.isCompletedOnce || record.completedCount > 0).map((record) => record.questionId)]);
  const formalPriorityCandidates = candidates.map((candidate) => candidate.formal === true
    ? { ...candidate, priority: (candidate.priority ?? 0) + 1000 }
    : candidate);
  return selectCoverageQuestions(formalPriorityCandidates, Math.max(0, count), carryoverIds, recentIds, state, completedIds);
};

/** Sprint 39 僅建置能力。未明確啟用 FINAL_REVIEW_MODE 時永遠不回傳題目。 */
export const selectFinalReviewQuestionIds = (candidates: SchedulerCandidate[], count: number) => {
  if (!FINAL_REVIEW_MODE) return [];
  const eligible = uniqueCandidates(candidates).filter((candidate) => (candidate.wrongCount ?? 0) > 0 || candidate.isMarked || candidate.isImportant || candidate.formal);
  const weight = (candidate: SchedulerCandidate) => (candidate.wrongCount ?? 0) > 0
    ? finalReviewWeights.wrongAnswer + (candidate.wrongCount ?? 0)
    : candidate.isMarked ? finalReviewWeights.marked
      : candidate.isImportant ? finalReviewWeights.important : finalReviewWeights.normal;
  return eligible.sort((a, b) => weight(b) - weight(a) || (b.priority ?? 0) - (a.priority ?? 0) || a.id - b.id)
    .slice(0, Math.max(0, count)).map((candidate) => candidate.id);
};

export const selectMockQuestionIds = (candidates: SchedulerCandidate[], count: number) => {
  const state = loadQuestionSchedulerState();
  const formal = uniqueCandidates(candidates).filter((candidate) => candidate.formal === true && getCandidateConfidence(candidate) !== 'C');
  const topCount = formal.filter((candidate) => ['A+', 'A'].includes(getCandidateConfidence(candidate))).length;
  const maxTargetWithTwentyPercentB = topCount + Math.floor(topCount * 0.25);
  const target = Math.min(Math.max(0, count), formal.length, maxTargetWithTwentyPercentB);
  const bLimit = Math.min(formal.length - topCount, Math.floor(target * 0.2));
  const topLimit = Math.max(0, target - bLimit);
  const unseen = formal.filter((candidate) => getQuestionAppearance(candidate.id, state).shownCount === 0);
  const lessShown = formal.filter((candidate) => getQuestionAppearance(candidate.id, state).shownCount <= 1 && !unseen.some((item) => item.id === candidate.id));
  const alreadySeen = formal.filter((candidate) => !unseen.some((item) => item.id === candidate.id) && !lessShown.some((item) => item.id === candidate.id));
  const firstRoundComplete = formal.length > 0 && formal.every((candidate) => getQuestionAppearance(candidate.id, state).shownCount > 0);
  const repeatLimit = Math.max(0, Math.floor(target * (firstRoundComplete ? 0.2 : 0.1)));
  const topGroups = [unseen, lessShown, alreadySeen].map((group) => group.filter((candidate) => ['A+', 'A'].includes(getCandidateConfidence(candidate))));
  const bGroups = [unseen, lessShown, alreadySeen].map((group) => group.filter((candidate) => getCandidateConfidence(candidate) === 'B'));
  const preferredTop = selectFromGroups(topGroups.slice(0, 2), Math.max(0, topLimit - repeatLimit), state);
  const importantTopRepeats = sortByScore(topGroups[2].filter((candidate) => candidate.isImportant), state).slice(0, repeatLimit);
  const selectedTop = selectFromGroups([preferredTop, importantTopRepeats, topGroups.flat()], topLimit, state);
  const preferredB = selectFromGroups(bGroups.slice(0, 2), bLimit, state);
  const selectedB = selectFromGroups([preferredB, bGroups.flat()], Math.min(bLimit, target - selectedTop.length), state);
  return [...selectedTop, ...selectedB].slice(0, target).map((candidate) => candidate.id);
};

export const getFirstRoundStats = (questionIds: number[], state = loadQuestionSchedulerState()): FirstRoundStats => {
  const ids = uniqueIds(questionIds);
  const appearedCount = ids.filter((id) => getQuestionAppearance(id, state).shownCount > 0).length;
  return { appearedCount, totalCount: ids.length, percentage: ids.length ? Math.round((appearedCount / ids.length) * 100) : 0, remainingCount: Math.max(0, ids.length - appearedCount) };
};

export const getRecentRepeatRate = (mode: SchedulerMode, days = 7) => {
  const state = loadQuestionSchedulerState();
  const cutoff = Date.now() - days * DAY_MS;
  const ids = state.recentSessions.filter((session) => session.mode === mode && new Date(session.shownAt).getTime() >= cutoff).flatMap((session) => session.questionIds);
  return ids.length ? Math.round((1 - new Set(ids).size / ids.length) * 100) : 0;
};

export const getSchedulerStage = (daysUntilExam: number) => daysUntilExam <= 7 ? 'C' : daysUntilExam <= 14 ? 'B' : 'A';
