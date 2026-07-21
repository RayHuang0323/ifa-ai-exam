import { createServer } from 'vite';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const storage = new Map();
globalThis.window = { location: { search: '' }, localStorage: { getItem: (key) => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, String(value)), removeItem: (key) => storage.delete(key) } };
const root = fileURLToPath(new URL('..', import.meta.url));
const server = await createServer({ root, logLevel: 'error', optimizeDeps: { noDiscovery: true }, server: { middlewareMode: true } });
const read = (relativePath) => readFile(new URL(relativePath, import.meta.url), 'utf8');
try {
  const lock = await server.ssrLoadModule('/src/utils/answeredQuestionLock.ts');
  const engine = await server.ssrLoadModule('/src/utils/questionEngine.ts');
  const [week1, week2, practice, sourceVerifiedBase, sourceVerifiedSprint36, sourceVerifiedSprint37] = await Promise.all([
    read('../src/data/questions/week1.json').then(JSON.parse),
    read('../src/data/questions/week2.json').then(JSON.parse),
    read('../src/data/questions/exam-practice.json').then(JSON.parse),
    read('../src/data/questions/source-verified.json').then(JSON.parse),
    read('../src/data/questions/source-verified-sprint36.json').then(JSON.parse),
    read('../src/data/questions/source-verified-sprint37.json').then(JSON.parse),
  ]);
  const sourceVerified = [...sourceVerifiedBase, ...sourceVerifiedSprint36, ...sourceVerifiedSprint37];
  storage.set('ifa-study-progress-v1', JSON.stringify({ sessions: [{ questionIds: [1, 20020], correctQuestionIds: [1], wrongQuestionIds: [20020], skippedQuestionIds: [] }] }));
  storage.set('ifa-ai-reviews-v1', JSON.stringify([{ questionId: 70001, sessionId: 'test', aiReviewStatus: 'partial' }]));
  const known = lock.getKnownAnsweredQuestionIds();
  if (![1, 20020, 70001].every((id) => known.includes(id))) throw new Error('未能從本機 progress／AI review 取得已知題目 ID');
  lock.protectQuestionIds([70161]);
  if (!lock.isQuestionProtected(70161) || lock.canMutateQuestionCore(70161)) throw new Error('新題保護清單未生效');
  const existingIds = new Set([...week1, ...week2, ...practice].map((question) => question.id));
  if (sourceVerified.some((question) => existingIds.has(question.id))) throw new Error('source_verified 覆蓋既有題目 ID');
  if (sourceVerified.some((question) => question.deprecated === true && engine.getFormalQuestionPool().some((formal) => formal.id === question.id))) throw new Error('deprecated 題進入 Full Mock');
  for (const question of sourceVerified) if (engine.getQuestionById(question.id)?.id !== question.id) throw new Error(`題目 ${question.id} 無法由歷史查詢解析`);
  console.log(JSON.stringify({ knownProtectedIds: known, newQuestionCount: sourceVerified.length, formalCount: engine.getFormalQuestionPool().length, historicalLookupPreserved: true }, null, 2));
  console.log('ANSWERED QUESTION LOCK VERIFY PASSED');
} finally { await server.close(); }
