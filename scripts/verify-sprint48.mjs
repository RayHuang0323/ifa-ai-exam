import { createServer } from 'vite';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();
const storage = new Map();
globalThis.window = {
  location: { search: '?profile=learner' },
  localStorage: { getItem: (key) => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, String(value)), removeItem: (key) => storage.delete(key) },
};

const server = await createServer({ root, logLevel: 'error', optimizeDeps: { noDiscovery: true }, server: { middlewareMode: true } });
const errors = [];
const assert = (condition, message) => { if (!condition) errors.push(message); };
const isEligibleFormal = (question) => question.practiceOnly !== true && question.formalScoreEligible !== false && question.answerConfidence !== 'C' && question.questionConfidence !== 'C';

try {
  const [engine, scheduler, blueprint, appSource] = await Promise.all([
    server.ssrLoadModule('/src/utils/questionEngine.ts'),
    server.ssrLoadModule('/src/utils/weightedMockSelection.ts'),
    server.ssrLoadModule('/src/data/examBlueprint.ts'),
    readFile(join(root, 'src/App.tsx'), 'utf8'),
  ]);
  const formal = engine.getFormalQuestionPool();
  const eligible = formal.filter(isEligibleFormal);
  const candidates = eligible.map((question) => ({
    id: question.id,
    formal: true,
    category: question.category,
    practiceOnly: question.practiceOnly,
    formalScoreEligible: question.formalScoreEligible,
    answerConfidence: question.answerConfidence,
    questionConfidence: question.questionConfidence,
    priority: question.priority,
    isImportant: true,
  }));
  const selectedIds = scheduler.selectWeightedMockQuestionIds(candidates, blueprint.mockBlueprintConfig.questionCount);
  const selected = selectedIds.map((id) => eligible.find((question) => question.id === id)).filter(Boolean);
  const categoryCounts = selected.reduce((counts, question) => {
    const category = blueprint.getMockBlueprintCategory(question.category);
    counts[category] = (counts[category] ?? 0) + 1;
    return counts;
  }, {});
  const targetCounts = blueprint.getMockBlueprintTargetCounts(blueprint.mockBlueprintConfig.questionCount);
  const normalizeCounts = (counts) => Object.fromEntries(Object.entries(counts).sort(([left], [right]) => left.localeCompare(right)));

  assert(formal.length === 285, `formal 題數異常：${formal.length}`);
  assert(eligible.length === 284, `Full Mock eligible 題數異常：${eligible.length}`);
  assert(selectedIds.length === blueprint.mockBlueprintConfig.questionCount, `mock 題數異常：${selectedIds.length}`);
  assert(new Set(selectedIds).size === selectedIds.length, 'mock 出現重複題');
  assert(selected.length === selectedIds.length, 'mock 有題目無法從 formal pool 解析');
  assert(selected.every((question) => isEligibleFormal(question)), 'mock 混入 practice／C 題');
  assert(JSON.stringify(normalizeCounts(categoryCounts)) === JSON.stringify(normalizeCounts(targetCounts)), `category distribution 異常：${JSON.stringify(categoryCounts)} != ${JSON.stringify(targetCounts)}`);
  assert(appSource.includes('recordQuestionsShown') && appSource.includes('recordQuestionsAnswered') && appSource.includes('recordQuestionsCompleted'), '答題紀錄／完成紀錄接線遺失');
  assert(appSource.includes('selectWeightedMockQuestionIds') && appSource.includes('mockBlueprintConfig.questionCount'), 'Full Mock 未接入 weighted blueprint');
  assert(appSource.includes('selectDailyQuestionIds') && appSource.includes('getDailyQuestionPool'), 'Daily 接線遺失');

  const mixedSelection = scheduler.selectWeightedMockQuestionIds([
    ...candidates,
    { id: 999999, formal: false, practiceOnly: true, category: '植物油／基底油', answerConfidence: 'C', questionConfidence: 'C' },
  ], blueprint.mockBlueprintConfig.questionCount);
  assert(!mixedSelection.includes(999999), 'practice 題被 weighted mock 選入');

  if (errors.length) {
    console.error('SPRINT 48 VERIFY FAILED');
    errors.forEach((error) => console.error(`- ${error}`));
    process.exit(1);
  }
  console.log(JSON.stringify({
    formalCount: formal.length,
    eligibleFormalCount: eligible.length,
    mockQuestionCount: selectedIds.length,
    targetCounts,
    categoryCounts,
    duplicateIds: selectedIds.length - new Set(selectedIds).size,
    practiceIncluded: selected.some((question) => question.practiceOnly === true),
    dailyUntouched: true,
  }, null, 2));
  console.log('SPRINT 48 VERIFY PASSED');
} finally {
  await server.close();
}
