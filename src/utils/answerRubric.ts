import answerRubrics from '../data/knowledge/answerRubrics.json';
import type { AnswerRubric, ShortAnswerEvaluation } from '../types/rubric';

const rubrics = answerRubrics as AnswerRubric[];

const normalize = (value: string) => value.trim().toLocaleLowerCase().replace(/\s+/g, ' ');

const matchesConcept = (answer: string, concept: { id: string; keywords: string[] }, synonyms: Record<string, string[]>) =>
  [...concept.keywords, ...(synonyms[concept.id] ?? [])].some((keyword) => normalize(answer).includes(normalize(keyword)));

export const getRubricByQuestionId = (questionId: number) => rubrics.find((rubric) => rubric.questionId === questionId) ?? null;

export const evaluateShortAnswer = (answer: string, rubric: AnswerRubric | null): ShortAnswerEvaluation => {
  if (!rubric) {
    return { score: 0, maxScore: 0, passed: false, matchedConcepts: [], missingConcepts: [], matchedOptionalConcepts: [], contradictions: [], needsHumanReview: true, confidence: 0, feedback: '尚無正式評分規準，需人工確認。' };
  }

  const matchedConcepts = rubric.requiredConcepts.filter((concept) => matchesConcept(answer, concept, rubric.acceptedSynonyms)).map((concept) => concept.label);
  const missingConcepts = rubric.requiredConcepts.filter((concept) => !matchesConcept(answer, concept, rubric.acceptedSynonyms)).map((concept) => concept.label);
  const matchedOptionalConcepts = rubric.optionalConcepts.filter((concept) => matchesConcept(answer, concept, rubric.acceptedSynonyms)).map((concept) => concept.label);
  const contradictions = rubric.contradictions.filter((term) => normalize(answer).includes(normalize(term)));
  const conceptRatio = rubric.requiredConcepts.length === 0 ? 0 : matchedConcepts.length / rubric.requiredConcepts.length;
  const score = contradictions.length > 0 ? 0 : Math.round(rubric.maxScore * conceptRatio);
  const confidence = answer.trim().length < 8 ? 0 : Math.round(conceptRatio * 100);
  const needsHumanReview = contradictions.length > 0 || confidence < rubric.needsHumanReviewBelowConfidence;

  return {
    score,
    maxScore: rubric.maxScore,
    passed: score >= rubric.passingScore && !needsHumanReview,
    matchedConcepts,
    missingConcepts,
    matchedOptionalConcepts,
    contradictions,
    needsHumanReview,
    confidence,
    feedback: needsHumanReview ? '答案需人工確認；系統不會修改正式答案。' : missingConcepts.length > 0 ? `尚缺核心概念：${missingConcepts.join('、')}。` : '核心概念已命中。',
  };
};
