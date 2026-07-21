import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const distRoot = join(root, 'dist');
const walk = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path));
    else files.push(path);
  }
  return files;
};
const files = await walk(distRoot);
const text = (await Promise.all(files.map((file) => readFile(file, 'utf8').catch(() => '')))).join('\n');
const required = ['ifa-answered-question-history-v1', 'ifa-answered-question-history-sync-queue-v1', 'saveAnsweredQuestionHistory', 'getAnsweredQuestionHistory'];
const forbidden = [
  /AI_GRADING_API_KEY/i,
  /OPENAI_API_KEY/i,
  /GEMINI_API_KEY/i,
  /AI_PROVIDER_(?:API_KEY|SECRET)/i,
  /sk-[A-Za-z0-9]{20,}/,
  /AIza[A-Za-z0-9_-]{20,}/,
  /(?:^|[\\/])private(?:[\\/]|$)/i,
  /IFA_教材庫|新建文件夹/i,
  /\.(?:pdf|docx)(?:['"`?\s]|$)/i,
  /google\.accounts|accounts\.google\.com|Google OAuth|Google Login/i,
];
const missing = required.filter((marker) => !text.includes(marker));
const violations = forbidden.filter((pattern) => pattern.test(text)).map(String);
if (missing.length || violations.length) {
  console.error('PRODUCTION BUNDLE SECURITY FAILED');
  if (missing.length) console.error(`Missing required Sprint 39 markers: ${missing.join(', ')}`);
  if (violations.length) console.error(`Forbidden production content: ${violations.join(', ')}`);
  process.exit(1);
}
console.log(JSON.stringify({
  requiredMarkers: Object.fromEntries(required.map((marker) => [marker, true])),
  allowedSyncConfig: ['VITE_PROGRESS_API_URL', 'VITE_PROGRESS_WRITE_KEY'],
  forbiddenProviderSecrets: true,
  privateSourcesExcluded: true,
  googleLoginExcluded: true,
}, null, 2));
console.log('PRODUCTION BUNDLE SECURITY PASSED');
