import {
  auditQuestionLanguage,
  enhanceDisplayQuestion,
  hasAiGeneratedWording,
  normalizeExamQuestion,
  type FormalQuestionRefinement,
} from './questionQualityAudit';

/**
 * Sprint 42.1 的正式題 display-only refinement。
 *
 * 這個 layer 只處理學員看到的題幹與人工複核標記，不會覆寫 canonical
 * question、answer、evidenceExcerpt 或 answerBasis。它在 question governance
 * 之後套用，因此 Full Mock 的 285 題可以共用同一份顯示結果。
 */
export type FormalRefinableQuestion = {
  id: number;
  type: string;
  question: string;
  answer?: string | string[];
  explanation?: string;
  answerBasis?: string;
  category?: string;
  chapter?: string;
  displayQuestion?: string;
  questionLanguageAudit?: ReturnType<typeof auditQuestionLanguage>;
  formalQuestionRefinement?: FormalQuestionRefinement;
};

const shortAnswerDirection = '作答時請依題目適用情況，交代定義、主要特性、用途與安全注意事項。';
const essayDirection = '作答時請進行比較、分析與評估，並交代相關條件與限制。';
const caseDirection = '作答時請交代個案背景、使用需求與安全限制，並說明評估及處理順序。';

const isShortAnswer = (type: string) => type === 'shortAnswer' || type === 'short_answer';
const isEssay = (type: string) => type === 'essay' || type === 'writing';
const isCase = (type: string) => ['case', 'case-study', 'case_study'].includes(type);
const stripTopic = (value: string) => value.replace(/^【[^】]+】/u, '').trim();
const topicPrefix = (value: string) => value.match(/^【[^】]+】/u)?.[0] ?? '';
const removeTerminalPunctuation = (value: string) => value.trim().replace(/[。！？?]+$/u, '');

const stripMaterialPromptResidue = (value: string) => normalizeExamQuestion(value, '')
  .replace(/請?依(?:照)?教材(?:的)?(?:證據|证据|evidence)?[，、,:：\s]*/giu, '')
  .replace(/根據教材(?:的)?(?:內容|内容|證據|证据)?(?:指出|說明|说明)?[，、,:：\s]*/giu, '')
  .replace(/請說明教材中的/giu, '請說明')
  .replace(/教材如何(?:說明|描述|说明|描述)/giu, '請說明')
  .replace(/教材(?:中的|中)?(?:關鍵概念|證據|证据)/giu, '相關概念')
  .replace(/^\s*[，、,:：]+/u, '')
  .replace(/[，、,:：]{2,}/gu, '，')
  .replace(/\s{2,}/gu, ' ')
  .trim();

const stripLegacyDirection = (value: string) => value
  .replace(/請說明「([^」]+)」的定義、主要特性、功能或作用，以及適用的注意事項。?/u, '請說明「$1」')
  .replace(/請以簡答方式回應主要概念，並補充相關特性、功能或適用的注意事項。?/u, '')
  .replace(/請先界定主題，再依序說明原因、相關條件與安全／實務限制。?/u, '')
  .replace(/作答時請交代主題界定、相關條件與限制。?/u, '')
  .replace(/作答方向：先交代個案背景與問題，再說明評估、處理順序及安全界線。?/u, '')
  .replace(/\s{2,}/gu, ' ')
  .replace(/[。！？?]{2,}/gu, '。')
  .trim();

const appendDirectionIfNeeded = (value: string, direction: string, required: RegExp[]) => {
  if (required.every((pattern) => pattern.test(value))) return value;
  return `${removeTerminalPunctuation(value)}。${direction}`;
};

const hasMeaningfulValue = (value: unknown) => typeof value === 'string'
  && value.trim().length > 0
  && !/^(?:待補|metadata_missing|來源資料待補|教材資訊待補)/u.test(value.trim());

const refineDisplayStem = (question: FormalRefinableQuestion) => {
  const existing = question.displayQuestion?.trim() || enhanceDisplayQuestion(question.question, question.type, question);
  const prefix = topicPrefix(existing);
  let body = stripLegacyDirection(stripMaterialPromptResidue(stripTopic(existing)));

  if (isShortAnswer(question.type)) {
    body = appendDirectionIfNeeded(body, shortAnswerDirection, [/定義/u, /主要特性/u, /用途/u, /安全注意事項/u]);
  } else if (isEssay(question.type)) {
    body = appendDirectionIfNeeded(body, essayDirection, [/比較/u, /分析/u, /評估/u]);
  } else if (isCase(question.type)) {
    if (!/^案例情境：/u.test(body)) body = `案例情境：${body}`;
    body = appendDirectionIfNeeded(body, caseDirection, [/個案背景/u, /使用需求/u, /安全限制/u]);
  }

  if (!/[。！？?]$/u.test(body)) body = `${body}。`;
  const refined = `${prefix}${body}`.trim();
  return refined || enhanceDisplayQuestion(question.question, question.type, question);
};

export const refineFormalQuestion = <T extends FormalRefinableQuestion>(question: T): T => {
  const currentDisplay = question.displayQuestion?.trim() || enhanceDisplayQuestion(question.question, question.type, question);
  const displayQuestion = refineDisplayStem(question);
  const languageAudit = auditQuestionLanguage({
    id: question.id,
    type: question.type,
    question: question.question,
    answer: question.answer,
    explanation: question.explanation,
    answerBasis: question.answerBasis,
    category: question.category,
    chapter: question.chapter,
    displayQuestion,
  });
  const manualReviewReasons: string[] = [];
  if (question.questionLanguageAudit?.hasAnswerBasis === false || !hasMeaningfulValue(question.answerBasis)) {
    manualReviewReasons.push('缺答案依據，需人工確認教材與答案對應。');
  }
  if (hasAiGeneratedWording(displayQuestion)) {
    manualReviewReasons.push('顯示題幹仍含教材／AI 提示語，需人工確認。');
  }

  const refinement: FormalQuestionRefinement = {
    status: manualReviewReasons.length > 0 ? 'manual_review' : displayQuestion !== currentDisplay ? 'improved' : 'kept',
    changed: displayQuestion !== currentDisplay,
    displayQuestion,
    issues: languageAudit.issues,
    manualReviewReasons,
  };

  return {
    ...question,
    displayQuestion,
    questionLanguageAudit: languageAudit,
    formalQuestionRefinement: refinement,
  } as T;
};

export const getFormalQuestionRefinement = (question: FormalRefinableQuestion) => question.formalQuestionRefinement;
