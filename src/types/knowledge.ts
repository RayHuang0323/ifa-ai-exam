export interface KnowledgePoint {
  id: string;
  weekId: string;
  topicId: string;
  title: string;
  description: string;
  parentId: string | null;
  sourceRefs: string[];
  needsReview: boolean;
}
