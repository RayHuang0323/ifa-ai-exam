import week1Questions from '../data/questions/week1.json';

export type BankQuestion = typeof week1Questions[number];

export const getAvailableWeeks = () => ['week-1'] as const;
export const getQuestionsByWeek = (weekId: string): BankQuestion[] => weekId === 'week-1' ? week1Questions : [];
export const getQuestionById = (questionId: number) => week1Questions.find((question) => question.id === questionId) ?? null;
export const getQuestionCountByWeek = (weekId: string) => getQuestionsByWeek(weekId).length;
