export const safeJsonParse = <T>(raw: string | null): T | null => {
  if (!raw) return null;
  try { return JSON.parse(raw) as T; } catch { return null; }
};

export const getStorageItem = (key: string) => {
  try { return typeof window === 'undefined' ? null : window.localStorage.getItem(key); } catch { return null; }
};

export const setStorageItem = (key: string, value: string) => {
  try { if (typeof window !== 'undefined') window.localStorage.setItem(key, value); } catch { /* storage may be unavailable */ }
};

export const removeStorageItem = (key: string) => {
  try { if (typeof window !== 'undefined') window.localStorage.removeItem(key); } catch { /* storage may be unavailable */ }
};
