import { getStorageItem, safeJsonParse, setStorageItem } from './storageHealth';

export const learnerProfileKey = 'ifa-learner-profile-v1';
export interface LearnerProfile { learnerId: string; learnerName: string; sourceRole: 'learner' | 'coach-test'; deviceLabel: string; isTest: boolean; }
export const learnerProfile: LearnerProfile = { learnerId: 'bella', learnerName: 'Bella', sourceRole: 'learner', deviceLabel: 'learner-device', isTest: false };
const coachTestProfile: LearnerProfile = { learnerId: 'ray-test', learnerName: 'Ray Test', sourceRole: 'coach-test', deviceLabel: 'ray-device', isTest: true };
const isValid = (value: unknown): value is LearnerProfile => Boolean(value) && typeof value === 'object' && typeof (value as LearnerProfile).learnerId === 'string' && typeof (value as LearnerProfile).learnerName === 'string' && ((value as LearnerProfile).sourceRole === 'learner' || (value as LearnerProfile).sourceRole === 'coach-test') && typeof (value as LearnerProfile).deviceLabel === 'string' && typeof (value as LearnerProfile).isTest === 'boolean';
export const getLearnerProfile = (): LearnerProfile => { const stored = safeJsonParse<unknown>(getStorageItem(learnerProfileKey)); return isValid(stored) ? stored : learnerProfile; };
export const setLearnerProfile = (profile: LearnerProfile) => { setStorageItem(learnerProfileKey, JSON.stringify(profile)); return profile; };
export const applyProfileQuery = (): LearnerProfile => { if (typeof window === 'undefined') return getLearnerProfile(); const profile = new URLSearchParams(window.location.search).get('profile'); if (profile === 'coach-test') return setLearnerProfile(coachTestProfile); if (profile === 'learner') return setLearnerProfile(learnerProfile); return getLearnerProfile(); };
// Resolve the URL profile before question pools are assembled during module evaluation.
export const initializedLearnerProfile = applyProfileQuery();
export const getProfileModeLabel = (profile = getLearnerProfile()) => profile.isTest ? 'Ray 測試' : 'Bella 學員';
export const getProfileStorageKey = (key: string, profile = getLearnerProfile()) => profile.isTest ? `ifa-coach-test-${key}` : key;
