export const NORMAL_REVIEW = 'NORMAL_REVIEW' as const;
export const FINAL_REVIEW = 'FINAL_REVIEW' as const;

export type ReviewMode = typeof NORMAL_REVIEW | typeof FINAL_REVIEW;

// Sprint 39 只建立能力；考前最後一週需經人工確認後才能改為 true。
export const FINAL_REVIEW_MODE = false;
export const currentReviewMode: ReviewMode = FINAL_REVIEW_MODE ? FINAL_REVIEW : NORMAL_REVIEW;

export const finalReviewWeights = {
  wrongAnswer: 100,
  marked: 60,
  important: 30,
  normal: 0,
} as const;
