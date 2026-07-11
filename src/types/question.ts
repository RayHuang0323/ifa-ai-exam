import type { SourceType } from './source';

export type QuestionType = 'single' | 'multiple' | 'short_answer' | 'essay' | 'case_study';

export interface EngineQuestion {
  id: number;
  weekId: string;
  type: QuestionType;
  topicId: string;
  knowledgePointIds: string[];
  difficulty: number;
  sourceRefs: string[];
  sourceType: SourceType;
  isPastPaper: boolean;
  isAiGenerated: boolean;
  needsReview: boolean;
  correctAnswer: string | string[];
  explanation: string;
}

export interface QuestionCoverage {
  totalQuestions: number;
  practicedQuestionIds: number[];
  practicedCount: number;
  unpracticedCount: number;
  coveragePercentage: number;
  isEstimated: boolean;
  missingSessionQuestionIdsCount: number;
}

export interface QuestionStats {
  questionId: number;
  practiceCount: number;
  correctCount: number;
  wrongCount: number;
  skippedCount: number;
  wrongRecordCount: number;
}
