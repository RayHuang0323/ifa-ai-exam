export const questionSourceTypes = ['official_exam', 'textbook', 'ai_generated', 'unknown'] as const;
export type QuestionSourceType = typeof questionSourceTypes[number];

export const duplicateRisks = ['none', 'low', 'medium', 'high'] as const;
export type DuplicateRisk = typeof duplicateRisks[number];

export interface QuestionPoolMetadata {
  questionSourceType: QuestionSourceType;
  duplicateGroupId?: string;
  duplicateRisk: DuplicateRisk;
}

export interface QuestionPoolMetadataInput {
  id: number;
  question: string;
  options?: unknown;
  category?: string;
  chapter?: string;
  sourceType?: string;
  sourceLabel?: string;
  sourceFile?: string;
  reference?: string;
  reviewStatus?: string;
  generatedBy?: string;
  duplicateOf?: number;
  relatedVerifiedId?: number;
}

const normalize = (value: unknown) => String(value ?? '')
  .normalize('NFKC')
  .toLowerCase()
  .replace(/\s+/g, '')
  .replace(/[「」『』"'`“”‘’，。！？、；：,.!?;:()[\]{}]/g, '');

const hash = (value: string) => {
  let result = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    result ^= value.charCodeAt(index);
    result = Math.imul(result, 16777619);
  }
  return (result >>> 0).toString(36);
};

const contentKey = (question: QuestionPoolMetadataInput) => [
  normalize(question.question),
  Array.isArray(question.options) ? question.options.map(normalize).sort().join('|') : '',
].join('::');

const bigrams = (value: string) => {
  const normalized = normalize(value);
  if (normalized.length < 2) return new Set([normalized]);
  const result = new Set<string>();
  for (let index = 0; index < normalized.length - 1; index += 1) result.add(normalized.slice(index, index + 2));
  return result;
};

const jaccard = (left: Set<string>, right: Set<string>) => {
  if (left.size === 0 || right.size === 0) return 0;
  let intersection = 0;
  left.forEach((value) => { if (right.has(value)) intersection += 1; });
  return intersection / (left.size + right.size - intersection);
};

const isAiSource = (question: QuestionPoolMetadataInput) => {
  const sourceType = normalize(question.sourceType);
  const sourceText = normalize(`${question.sourceLabel ?? ''} ${question.generatedBy ?? ''}`);
  return sourceType.includes('ai_generated') || sourceText.includes('ai') || sourceText.includes('人工智能');
};

/**
 * Source policy for the four runtime labels. `mock`, `high_priority_review`
 * and `verified-practice` remain unknown unless their lineage is explicit;
 * a mock label must never be treated as an official exam source.
 */
export const resolveQuestionSourceType = (question: QuestionPoolMetadataInput): QuestionSourceType => {
  if (isAiSource(question)) return 'ai_generated';
  const sourceType = normalize(question.sourceType);
  const sourceText = normalize(`${question.sourceLabel ?? ''} ${question.reference ?? ''} ${question.sourceFile ?? ''}`);
  if (['extracted_material', 'source_verified', 'lecture', 'textbook'].includes(sourceType)) return 'textbook';
  if (['mock', 'high_priority_review', 'verified-practice', 'student-notes', 'pending-review', 'staging'].includes(sourceType)) return 'unknown';
  if (['past_exam', 'past-exam', 'official_exam', 'official'].includes(sourceType)) {
    return sourceText.includes('術科') || sourceText.includes('考官') ? 'unknown' : 'official_exam';
  }
  if (sourceText.includes('術科') || sourceText.includes('考官')) return 'unknown';
  if (sourceText.includes('歷屆') || sourceText.includes('考古題') || sourceText.includes('期末試卷')) return 'official_exam';
  if (sourceText.includes('教材') || sourceText.includes('講義')) return 'textbook';
  return 'unknown';
};

class DisjointSet {
  private readonly parent = new Map<number, number>();

  constructor(ids: number[]) { ids.forEach((id) => this.parent.set(id, id)); }

  find(id: number): number {
    const parent = this.parent.get(id) ?? id;
    if (parent === id) return id;
    const root = this.find(parent);
    this.parent.set(id, root);
    return root;
  }

  union(left: number, right: number) {
    const leftRoot = this.find(left);
    const rightRoot = this.find(right);
    if (leftRoot !== rightRoot) this.parent.set(rightRoot, leftRoot);
  }
}

/**
 * Builds non-destructive metadata for a runtime pool. Exact content and
 * explicit duplicate lineage are always grouped; high-risk semantic matches
 * use character-bigram Jaccard >= 0.85. The original question records remain
 * untouched.
 */
export const buildQuestionPoolMetadata = (questions: QuestionPoolMetadataInput[]) => {
  const byId = new Map(questions.map((question) => [question.id, question]));
  const disjoint = new DisjointSet(questions.map((question) => question.id));
  const groupsByContent = new Map<string, number[]>();
  questions.forEach((question) => {
    const key = contentKey(question);
    groupsByContent.set(key, [...(groupsByContent.get(key) ?? []), question.id]);
  });
  groupsByContent.forEach((ids) => ids.slice(1).forEach((id) => disjoint.union(ids[0], id)));

  questions.forEach((question) => {
    if (question.duplicateOf !== undefined && byId.has(question.duplicateOf)) disjoint.union(question.id, question.duplicateOf);
    if (question.relatedVerifiedId !== undefined && byId.has(question.relatedVerifiedId)) disjoint.union(question.id, question.relatedVerifiedId);
  });

  const fingerprints = new Map(questions.map((question) => [question.id, bigrams(`${question.question} ${Array.isArray(question.options) ? question.options.join(' ') : ''}`)]));
  const semanticRisk = new Map<number, DuplicateRisk>();
  const category = (question: QuestionPoolMetadataInput) => normalize(question.category ?? question.chapter);
  for (let leftIndex = 0; leftIndex < questions.length; leftIndex += 1) {
    const left = questions[leftIndex];
    for (let rightIndex = leftIndex + 1; rightIndex < questions.length; rightIndex += 1) {
      const right = questions[rightIndex];
      if (category(left) && category(left) !== category(right)) continue;
      const score = jaccard(fingerprints.get(left.id) ?? new Set(), fingerprints.get(right.id) ?? new Set());
      if (score >= 0.85) {
        disjoint.union(left.id, right.id);
        semanticRisk.set(left.id, 'high');
        semanticRisk.set(right.id, 'high');
      } else if (score >= 0.7) {
        if (semanticRisk.get(left.id) !== 'high') semanticRisk.set(left.id, 'medium');
        if (semanticRisk.get(right.id) !== 'high') semanticRisk.set(right.id, 'medium');
      } else if (score >= 0.55) {
        if (!semanticRisk.has(left.id)) semanticRisk.set(left.id, 'low');
        if (!semanticRisk.has(right.id)) semanticRisk.set(right.id, 'low');
      }
    }
  }

  const members = new Map<number, number[]>();
  questions.forEach((question) => {
    const root = disjoint.find(question.id);
    members.set(root, [...(members.get(root) ?? []), question.id]);
  });
  const result = new Map<number, QuestionPoolMetadata>();
  questions.forEach((question) => {
    const group = members.get(disjoint.find(question.id)) ?? [];
    const hasGroup = group.length > 1;
    const duplicateRisk = hasGroup ? (semanticRisk.get(question.id) ?? 'high') : (semanticRisk.get(question.id) ?? 'none');
    result.set(question.id, {
      questionSourceType: resolveQuestionSourceType(question),
      ...(hasGroup ? { duplicateGroupId: `semantic-${hash([...group].sort((a, b) => a - b).join(','))}` } : {}),
      duplicateRisk,
    });
  });
  return result;
};

export const applyQuestionPoolMetadata = <T extends QuestionPoolMetadataInput>(question: T, metadata: QuestionPoolMetadata): T & QuestionPoolMetadata => ({
  ...question,
  ...metadata,
});
