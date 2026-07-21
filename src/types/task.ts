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
  totalQuestions?: number;
  completedQuestions?: number;
  carryoverQuestions?: number;
  isInsufficient?: boolean;
  basicQuestions?: number;
  maximumQuestions?: number;
  canAddQuestions?: number;
}

export interface WrongAnswerRecord {
  questionId: number;
  weekId: string;
  wrongCount: number;
  correctReviewCount: number;
  consecutiveCorrect: number;
  lastWrongAt: string;
  lastReviewedAt: string | null;
  masteredAt: string | null;
  status: 'newWrong' | 'reviewing' | 'highRisk' | 'improving' | 'mastered';
  lastSelectedAnswer: string | string[] | null;
  correctAnswer: string | string[];
  questionType: string;
  source: string;
}
