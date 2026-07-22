/**
 * Sprint 48 estimated blueprint for Full Mock calibration.
 *
 * This is review/config data only. It contains category weights and aliases,
 * never question IDs or question content. The official IFA exam blueprint is
 * not present in this repository, so these weights must not be treated as an
 * official exam specification.
 */
export const mockBlueprintConfig = {
  schemaVersion: 'sprint48-estimated-v1',
  official: false,
  questionCount: 60,
  categories: [
    { category: 'Anatomy & Physiology', weight: 20, aliases: ['解剖生理', '心血管', '神經', '內分泌', '生理學', '泌尿', '人體解剖', '淋巴'] },
    { category: 'Essential Oil Chemistry', weight: 12, aliases: ['精油化學'] },
    { category: 'Carrier Oil', weight: 10, aliases: ['植物油／基底油'] },
    { category: 'Safety / Contraindications', weight: 20, aliases: ['安全禁忌', '孕婦安全', '兒童安全', '用藥詢問', '疾病與轉介'] },
    { category: 'Blending Theory', weight: 10, aliases: ['配方濃度與稀釋'] },
    { category: 'Essential Oil Foundations', weight: 8, aliases: ['精油基礎'] },
    { category: 'Essential Oil Materia Medica', weight: 6, aliases: ['精油個論'] },
    { category: 'Consultation Practice', weight: 5, aliases: ['諮詢流程'] },
    { category: 'Professional Practice', weight: 4, aliases: ['按摩與實務'] },
    { category: 'Ethics', weight: 3, aliases: ['職業倫理'] },
    { category: 'Cross-topic / Exam Practice', weight: 2, aliases: ['考古題'] },
  ],
} as const;

export type MockBlueprintCategory = typeof mockBlueprintConfig.categories[number]['category'];

const categoryByAlias = new Map<string, MockBlueprintCategory>(
  mockBlueprintConfig.categories.flatMap((item) => item.aliases.map((alias) => [alias, item.category] as const)),
);

export const getMockBlueprintCategory = (rawCategory: string | undefined): MockBlueprintCategory => {
  return categoryByAlias.get(rawCategory ?? '') ?? 'Cross-topic / Exam Practice';
};

export const getMockBlueprintCategoryWeights = () => mockBlueprintConfig.categories.map(({ category, weight }) => ({ category, weight }));

/** Largest-remainder allocation keeps the configured weights reproducible. */
export const getMockBlueprintTargetCounts = (questionCount?: number): Record<MockBlueprintCategory, number> => {
  const safeCount = Math.max(0, Math.floor(questionCount ?? mockBlueprintConfig.questionCount));
  const totalWeight = mockBlueprintConfig.categories.reduce((sum, item) => sum + item.weight, 0);
  const base = mockBlueprintConfig.categories.map((item, index) => {
    const exact = totalWeight === 0 ? 0 : safeCount * item.weight / totalWeight;
    return { category: item.category, count: Math.floor(exact), remainder: exact - Math.floor(exact), index };
  });
  let remaining = safeCount - base.reduce((sum, item) => sum + item.count, 0);
  [...base].sort((left, right) => right.remainder - left.remainder || left.index - right.index).forEach((item) => {
    if (remaining <= 0) return;
    item.count += 1;
    remaining -= 1;
  });
  return Object.fromEntries(base.map((item) => [item.category, item.count])) as Record<MockBlueprintCategory, number>;
};
