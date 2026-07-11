export interface WritingPracticeSample {
  id: number;
  knowledgeId: string;
  type: 'short-answer';
  chapter: string;
  difficulty: number;
  question: string;
  answer: string;
  explanation: string;
  reference: string;
  isSample: true;
  isAiGenerated: false;
  needsReview: true;
  sourceId: 'source-pending-review';
}

export const writingPracticeSamples: WritingPracticeSample[] = [{
  id: 9001,
  knowledgeId: 'CV001',
  type: 'short-answer',
  chapter: '示範題（待審核）',
  difficulty: 2,
  question: '【示範／待審核】請用自己的話說明肺靜脈在血液循環中的功能。',
  answer: '肺靜脈將在肺部完成氣體交換、含氧較高的血液送回左心房。',
  explanation: '此題為簡答／默寫練習示範題，不是正式 IFA 題目；請依參考答案檢核是否說明血液來源、含氧狀態與流向。',
  reference: 'source-pending-review',
  isSample: true,
  isAiGenerated: false,
  needsReview: true,
  sourceId: 'source-pending-review',
}];
