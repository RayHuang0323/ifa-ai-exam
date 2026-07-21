import { dailyTaskV2DraftStorageKey, dailyTaskV2StorageKey } from './dailyTaskV2';
import { getProfileStorageKey } from './learnerProfile';
import { unansweredQuestionStorageKey } from './unansweredQuestionStore';

export const resetDailyTaskKeys = [dailyTaskV2StorageKey, dailyTaskV2DraftStorageKey, unansweredQuestionStorageKey] as const;
// 不含 profile、Coach 查看碼與同步 queue；未同步事件仍會在背景補送。
export const resetLocalProgressKeys = [
  ...resetDailyTaskKeys,
  'ifa-study-progress-v1',
  'ifa-wrong-answers-v1',
  'ifa_exam_state',
] as const;

const removeKeys = (keys: readonly string[]) => {
  keys.forEach((key) => { try { window.localStorage.removeItem(getProfileStorageKey(key)); } catch { /* storage unavailable */ } });
};

export const resetDailyTask = () => removeKeys(resetDailyTaskKeys);
export const resetLocalProgress = () => removeKeys(resetLocalProgressKeys);
