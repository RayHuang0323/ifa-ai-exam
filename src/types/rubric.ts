export interface RubricConcept {
  id: string;
  label: string;
  keywords: string[];
}

export interface AnswerRubric {
  id: string;
  questionId: number;
  requiredConcepts: RubricConcept[];
  acceptedSynonyms: Record<string, string[]>;
  optionalConcepts: RubricConcept[];
  contradictions: string[];
  maxScore: number;
  passingScore: number;
  needsHumanReviewBelowConfidence: number;
}

export interface ShortAnswerEvaluation {
  score: number;
  maxScore: number;
  passed: boolean;
  matchedConcepts: string[];
  missingConcepts: string[];
  matchedOptionalConcepts: string[];
  contradictions: string[];
  needsHumanReview: boolean;
  confidence: number;
  feedback: string;
}
