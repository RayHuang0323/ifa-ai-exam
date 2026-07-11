import week1Questions from '../data/questions/week1.json';
import { writingPracticeSamples } from '../data/questions/writingPracticeSamples';
import type { QuestionCoverage, QuestionStats, EngineQuestion, QuestionType } from '../types/question';
import type { StudyProgress } from '../types/study';
import type { WrongAnswerRecord } from '../types/task';

type RawQuestion = typeof week1Questions[number];

export const normalizeQuestion = (rawQuestion: RawQuestion, weekId: string, index: number): EngineQuestion => ({
  id: typeof rawQuestion.id === 'number' ? rawQuestion.id : index + 1,
  weekId,
  type: rawQuestion.type as QuestionType,
  topicId: rawQuestion.chapter || 'general',
  knowledgePointIds: rawQuestion.knowledgeId ? [rawQuestion.knowledgeId] : [],
  difficulty: rawQuestion.difficulty,
  sourceRefs: ['source-pending-review'],
  sourceType: 'pending-review',
  isPastPaper: false,
  isAiGenerated: false,
  needsReview: true,
  correctAnswer: rawQuestion.answer,
  explanation: rawQuestion.explanation,
});

export const getAvailableWeeks = () => ['week-1'] as const;
export const getQuestionsByWeek = (weekId: string) => weekId === 'week-1' ? week1Questions : [];
export const getQuestionById = (questionId: number) => week1Questions.find((question) => question.id === questionId) ?? writingPracticeSamples.find((question) => question.id === questionId) ?? null;
export const getQuestionCountByWeek = (weekId: string) => getQuestionsByWeek(weekId).length;
export const getQuestionIdsByWeek = (weekId: string) => getQuestionsByWeek(weekId).map((question) => question.id);
export const getWritingPracticeQuestions = () => writingPracticeSamples;

export const getCoverageByWeek = (weekId: string, studyProgress: StudyProgress, wrongAnswers: WrongAnswerRecord[]): QuestionCoverage => {
  const validQuestionIds = new Set(getQuestionIdsByWeek(weekId));
  const practiced = new Set<number>();
  let missingSessionQuestionIdsCount = 0;

  studyProgress.sessions.filter((session) => session.weekId === weekId).forEach((session) => {
    if (!session.questionIds) {
      missingSessionQuestionIdsCount += 1;
      return;
    }
    session.questionIds.forEach((questionId) => {
      if (validQuestionIds.has(questionId)) practiced.add(questionId);
    });
  });
  wrongAnswers.filter((record) => record.weekId === weekId).forEach((record) => practiced.add(record.questionId));

  const totalQuestions = validQuestionIds.size;
  const practicedCount = practiced.size;
  return {
    totalQuestions,
    practicedQuestionIds: [...practiced].sort((a, b) => a - b),
    practicedCount,
    unpracticedCount: Math.max(0, totalQuestions - practicedCount),
    coveragePercentage: totalQuestions === 0 ? 0 : Math.round((practicedCount / totalQuestions) * 100),
    isEstimated: missingSessionQuestionIdsCount > 0,
    missingSessionQuestionIdsCount,
  };
};

export const getQuestionStats = (questionId: number, studyProgress: StudyProgress, wrongAnswers: WrongAnswerRecord[]): QuestionStats => {
  const sessions = studyProgress.sessions.filter((session) => session.questionIds?.includes(questionId));
  return {
    questionId,
    practiceCount: sessions.length,
    correctCount: sessions.filter((session) => session.correctQuestionIds?.includes(questionId)).length,
    wrongCount: sessions.filter((session) => session.wrongQuestionIds?.includes(questionId)).length,
    skippedCount: sessions.filter((session) => session.skippedQuestionIds?.includes(questionId)).length,
    wrongRecordCount: wrongAnswers.find((record) => record.questionId === questionId)?.wrongCount ?? 0,
  };
};
