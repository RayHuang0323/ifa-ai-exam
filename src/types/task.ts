import type { StudyMode } from './study';

export interface TodayTask {
  id: string;
  title: string;
  description: string;
  mode: StudyMode | 'reviewPreview';
  weekId: 'week-1';
  suggestedQuestions: number;
  source: 'week-1';
  reason: string;
  estimatedMinutes: number;
  ctaLabel: string;
}

export interface WrongAnswerRecord {
  questionId: number;
  weekId: 'week-1';
  wrongCount: number;
  lastWrongAt: string;
  lastSelectedAnswer: string | string[] | null;
  correctAnswer: string | string[];
  questionType: string;
  source: 'week-1';
}
