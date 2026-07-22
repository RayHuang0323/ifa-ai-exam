import { getMockBlueprintCategory, getMockBlueprintTargetCounts, mockBlueprintConfig, type MockBlueprintCategory } from '../data/examBlueprint';
import { selectMockQuestionIds, type SchedulerCandidate } from './questionScheduler';

export type WeightedMockCandidate = SchedulerCandidate & { category?: string };

const eligibleFormalCandidates = (candidates: WeightedMockCandidate[]) => {
  const unique = [...new Map(candidates
    .filter((candidate) => Number.isFinite(candidate.id))
    .map((candidate) => [candidate.id, candidate])).values()];
  return unique.filter((candidate) => candidate.formal === true
    && candidate.practiceOnly !== true
    && candidate.questionConfidence !== 'C'
    && candidate.answerConfidence !== 'C'
    && candidate.isActive !== false
    && candidate.deprecated !== true);
};

const getAvailableCategoryCounts = (candidates: WeightedMockCandidate[]) => candidates.reduce<Record<string, number>>((counts, candidate) => {
  const category = getMockBlueprintCategory(candidate.category);
  counts[category] = (counts[category] ?? 0) + 1;
  return counts;
}, {});

const allocateWithCapacity = (requested: number, targets: Record<MockBlueprintCategory, number>, available: Record<string, number>) => {
  const allocations = new Map<MockBlueprintCategory, number>();
  let deficit = 0;
  mockBlueprintConfig.categories.forEach(({ category }) => {
    const target = targets[category] ?? 0;
    const capacity = available[category] ?? 0;
    const selected = Math.min(target, capacity);
    allocations.set(category, selected);
    deficit += target - selected;
  });
  while (deficit > 0) {
    const receiver = mockBlueprintConfig.categories
      .map(({ category, weight }, index) => ({ category, weight, index, remaining: (available[category] ?? 0) - (allocations.get(category) ?? 0) }))
      .filter((item) => item.remaining > 0)
      .sort((left, right) => right.remaining - left.remaining || right.weight - left.weight || left.index - right.index)[0];
    if (!receiver) break;
    allocations.set(receiver.category, (allocations.get(receiver.category) ?? 0) + 1);
    deficit -= 1;
  }
  const allocated = [...allocations.values()].reduce((sum, count) => sum + count, 0);
  if (allocated < requested) throw new Error(`Weighted mock blueprint cannot allocate ${requested} questions; allocated ${allocated}`);
  return allocations;
};

/**
 * Selects a fixed-size formal mock by estimated syllabus weights.
 * The scheduler's existing score order remains the tie-breaker, so shown
 * history and confidence prioritisation are retained without affecting Daily.
 */
export const selectWeightedMockQuestionIds = (candidates: WeightedMockCandidate[], count = mockBlueprintConfig.questionCount) => {
  const formal = eligibleFormalCandidates(candidates);
  const requested = Math.min(Math.max(0, Math.floor(count)), formal.length);
  if (requested === 0) return [];

  const rankedIds = selectMockQuestionIds(formal, formal.length);
  const byId = new Map(formal.map((candidate) => [candidate.id, candidate]));
  const ranked = [
    ...rankedIds.map((id) => byId.get(id)).filter((candidate): candidate is WeightedMockCandidate => Boolean(candidate)),
    ...formal.filter((candidate) => !rankedIds.includes(candidate.id)),
  ];
  const available = getAvailableCategoryCounts(ranked);
  const targets = getMockBlueprintTargetCounts(requested);
  const allocations = allocateWithCapacity(requested, targets, available);
  const selectedByCategory = new Map<MockBlueprintCategory, number>();
  const selectedIds = ranked.filter((candidate) => {
    const category = getMockBlueprintCategory(candidate.category);
    const selected = selectedByCategory.get(category) ?? 0;
    const limit = allocations.get(category) ?? 0;
    if (selected >= limit) return false;
    selectedByCategory.set(category, selected + 1);
    return true;
  }).slice(0, requested).map((candidate) => candidate.id);
  if (selectedIds.length !== requested || new Set(selectedIds).size !== selectedIds.length) {
    throw new Error(`Weighted mock selection invariant failed: expected ${requested}, got ${selectedIds.length}`);
  }
  return selectedIds;
};
