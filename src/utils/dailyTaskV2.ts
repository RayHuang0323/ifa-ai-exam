import { getStorageItem, safeJsonParse, setStorageItem } from './storageHealth';
import { getProfileStorageKey } from './learnerProfile';

export const dailyTaskV2StorageKey = 'ifa-daily-task-v2-state';
export const dailyTaskV2DraftStorageKey = 'ifa-daily-task-v2-draft';
export const dailyTarget = 30;
export const dailyMaximum = 90;
// 舊版欄位名稱保留，避免既有本機狀態與測試讀取失效。
export const dailyDisplayLimit = dailyMaximum;

export interface DailyTaskV2State {
  date: string;
  assignedQuestionIds: number[];
  completedQuestionIds: number[];
  carryoverQuestionIds: number[];
  dailyTarget: number;
  dailyDisplayLimit: number;
  generatedAt: string;
  updatedAt: string;
}

export interface DailyTaskV2Plan {
  state: DailyTaskV2State;
  activeQuestionIds: number[];
  completedCount: number;
  carryoverCount: number;
  isInsufficient: boolean;
  maximumQuestionCount: number;
  canAddQuestionCount: number;
}

const uniqueValidIds = (ids: unknown, availableIds: Set<number>) => Array.isArray(ids)
  ? [...new Set(ids.filter((id): id is number => typeof id === 'number' && availableIds.has(id)))]
  : [];

const getToday = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

const loadState = (availableIds: Set<number>): DailyTaskV2State | null => {
  try {
    const parsed = safeJsonParse<Partial<DailyTaskV2State>>(getStorageItem(getProfileStorageKey(dailyTaskV2StorageKey)) ?? '');
    if (!parsed || typeof parsed.date !== 'string' || !Array.isArray(parsed.assignedQuestionIds)) return null;
    return {
      date: parsed.date,
      assignedQuestionIds: uniqueValidIds(parsed.assignedQuestionIds, availableIds),
      completedQuestionIds: uniqueValidIds(parsed.completedQuestionIds, availableIds),
      carryoverQuestionIds: uniqueValidIds(parsed.carryoverQuestionIds, availableIds),
      dailyTarget: dailyTarget,
      dailyDisplayLimit: dailyDisplayLimit,
      generatedAt: typeof parsed.generatedAt === 'string' ? parsed.generatedAt : new Date().toISOString(),
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : new Date().toISOString(),
    };
  } catch {
    return null;
  }
};

const saveState = (state: DailyTaskV2State) => {
  try { setStorageItem(getProfileStorageKey(dailyTaskV2StorageKey), JSON.stringify(state)); } catch { /* local task remains usable in memory */ }
};

/**
 * 由 Question Scheduler 提供當日選題後，僅替換當日 assigned 清單。
 * 已完成題仍保留在狀態中，避免加做或重新開啟任務時遺失歷史完成數。
 */
export const applyDailyTaskV2QuestionSelection = (questionIds: number[], availableQuestionIds: number[], date = getToday()) => {
  const availableIds = new Set(availableQuestionIds);
  const current = loadState(availableIds);
  if (!current || current.date !== date) return getDailyTaskV2Plan(availableQuestionIds, [], date);
  const selected = uniqueValidIds(questionIds, availableIds);
  const selectedSet = new Set(selected);
  const completedQuestionIds = current.completedQuestionIds.filter((id) => selectedSet.has(id));
  const carryoverQuestionIds = current.carryoverQuestionIds.filter((id) => selectedSet.has(id) && !completedQuestionIds.includes(id));
  const nextState: DailyTaskV2State = { ...current, assignedQuestionIds: selected, completedQuestionIds, carryoverQuestionIds, updatedAt: new Date().toISOString() };
  saveState(nextState);
  return buildPlan(nextState, availableQuestionIds);
};

const getAddableQuestionIds = (state: DailyTaskV2State, availableQuestionIds: number[]) => {
  const assigned = new Set(state.assignedQuestionIds);
  const completed = new Set(state.completedQuestionIds);
  const carryover = state.carryoverQuestionIds.filter((id) => !assigned.has(id) && !completed.has(id));
  const carryoverSet = new Set(carryover);
  const fresh = availableQuestionIds.filter((id) => !assigned.has(id) && !completed.has(id) && !carryoverSet.has(id));
  return [...carryover, ...fresh];
};

const buildPlan = (state: DailyTaskV2State, availableQuestionIds: number[]): DailyTaskV2Plan => {
  const completed = new Set(state.completedQuestionIds);
  const activeQuestionIds = state.assignedQuestionIds.filter((id) => !completed.has(id));
  const canAddQuestionCount = Math.min(
    Math.max(0, dailyMaximum - state.assignedQuestionIds.length),
    getAddableQuestionIds(state, availableQuestionIds).length,
  );
  return {
    state,
    activeQuestionIds,
    completedCount: state.assignedQuestionIds.filter((id) => completed.has(id)).length,
    carryoverCount: state.assignedQuestionIds.filter((id) => state.carryoverQuestionIds.includes(id)).length,
    isInsufficient: state.assignedQuestionIds.length < dailyTarget,
    maximumQuestionCount: dailyMaximum,
    canAddQuestionCount,
  };
};

export const getDailyTaskV2Plan = (availableQuestionIds: number[], previouslyCompletedQuestionIds: number[] = [], date = getToday()): DailyTaskV2Plan => {
  const availableIds = new Set(availableQuestionIds);
  const previous = loadState(availableIds);
  let state = previous;

  if (!state || state.date !== date) {
    const priorCarryover = state
      ? uniqueValidIds([...state.carryoverQuestionIds.filter((id) => !state!.completedQuestionIds.includes(id)), ...state.assignedQuestionIds.filter((id) => !state!.completedQuestionIds.includes(id))], availableIds)
      : [];
    const completedHistory = new Set([...previouslyCompletedQuestionIds, ...(state?.completedQuestionIds ?? [])]);
    const visibleCarryover = priorCarryover.slice(0, dailyDisplayLimit);
    const remainingSlots = Math.max(0, dailyDisplayLimit - visibleCarryover.length);
    const freshIds = availableQuestionIds.filter((id) => !completedHistory.has(id) && !priorCarryover.includes(id)).slice(0, Math.min(dailyTarget, remainingSlots));
    const now = new Date().toISOString();
    state = {
      date,
      assignedQuestionIds: [...visibleCarryover, ...freshIds],
      completedQuestionIds: [],
      carryoverQuestionIds: priorCarryover,
      dailyTarget,
      dailyDisplayLimit,
      generatedAt: now,
      updatedAt: now,
    };
    saveState(state);
  }

  return buildPlan(state, availableQuestionIds);
};

export const extendDailyTaskV2Plan = (availableQuestionIds: number[], requestedQuestionCount = dailyMaximum, date = getToday(), previouslyCompletedQuestionIds: number[] = []): DailyTaskV2Plan => {
  const initialPlan = getDailyTaskV2Plan(availableQuestionIds, previouslyCompletedQuestionIds, date);
  const availableIds = new Set(availableQuestionIds);
  const state = loadState(availableIds) ?? initialPlan.state;
  const desiredCount = Math.max(dailyTarget, Math.min(dailyMaximum, Math.floor(requestedQuestionCount)));
  if (state.date !== date || state.assignedQuestionIds.length >= desiredCount) return initialPlan;

  const additions = getAddableQuestionIds(state, availableQuestionIds).slice(0, desiredCount - state.assignedQuestionIds.length);
  if (additions.length === 0) return buildPlan(state, availableQuestionIds);
  const nextState = {
    ...state,
    assignedQuestionIds: [...state.assignedQuestionIds, ...additions],
    updatedAt: new Date().toISOString(),
  };
  saveState(nextState);
  return buildPlan(nextState, availableQuestionIds);
};

export const completeDailyTaskV2Questions = (questionIds: number[], availableQuestionIds: number[]) => {
  const state = loadState(new Set(availableQuestionIds));
  if (!state) return;
  const completed = new Set(state.completedQuestionIds);
  questionIds.forEach((id) => { if (state.assignedQuestionIds.includes(id)) completed.add(id); });
  const carryoverQuestionIds = [...new Set([
    ...state.carryoverQuestionIds.filter((id) => !completed.has(id)),
    ...state.assignedQuestionIds.filter((id) => !completed.has(id)),
  ])];
  saveState({ ...state, completedQuestionIds: [...completed], carryoverQuestionIds, updatedAt: new Date().toISOString() });
};
