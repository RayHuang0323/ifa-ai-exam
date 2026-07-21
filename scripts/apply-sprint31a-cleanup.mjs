import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const file = path.join(root, 'src', 'data', 'questions', 'exam-practice.json');
const questions = JSON.parse(fs.readFileSync(file, 'utf8'));
const byId = new Map(questions.map((question) => [question.id, question]));

const get = (id) => {
  const question = byId.get(id);
  if (!question) throw new Error(`Sprint31A 找不到題目：${id}`);
  return question;
};

const exactPairs = [
  [20001, 40021], [20002, 40022], [20004, 40023], [20005, 40024], [20006, 40025], [20007, 40026],
  [20009, 40027], [20010, 40028], [20011, 40029], [20012, 40030], [20013, 40031], [20014, 40032],
  [20023, 40033], [20024, 40034], [20025, 40035], [20026, 40036], [20027, 40037], [20029, 40038],
  [20030, 40039], [20031, 40040], [20033, 40041],
];

const verifiedNearPairs = [
  [1021, 20009, 40027], [1022, 20010, 40028], [1024, 20011, 40029], [1025, 20012, 40030],
  [1026, 20013, 40031], [1028, 20014, 40032], [1054, 20027, 40037], [1057, 20030, 40039],
];

const unsafeIds = [20028, 40094, 40095, 40132];

for (const [canonicalId, duplicateId] of exactPairs) {
  get(canonicalId);
  const duplicate = get(duplicateId);
  duplicate.qualityStatus = 'duplicate_candidate';
  duplicate.duplicateOf = canonicalId;
  duplicate.isActive = false;
  duplicate.excludeFromPractice = true;
}

for (const [verifiedId, canonicalPracticeId, duplicatePracticeId] of verifiedNearPairs) {
  const canonical = get(canonicalPracticeId);
  const duplicate = get(duplicatePracticeId);
  canonical.sourceType = 'verified-practice';
  canonical.sourceLabel = 'verified 題練習副本（非正式成績）';
  canonical.qualityStatus = 'near_duplicate_review';
  canonical.relatedVerifiedId = verifiedId;
  duplicate.relatedVerifiedId = verifiedId;
}

for (const id of unsafeIds) {
  const question = get(id);
  question.qualityStatus = 'unsafe_candidate';
  question.isActive = false;
  question.excludeFromPractice = true;
}

fs.writeFileSync(file, `${JSON.stringify(questions, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({
  total: questions.length,
  exactDuplicateExcluded: exactPairs.length,
  unsafeExcluded: unsafeIds.length,
  verifiedNearCanonical: verifiedNearPairs.length,
  eligiblePractice: questions.filter((question) => question.isActive !== false && question.excludeFromPractice !== true && !['unsafe_candidate', 'duplicate_candidate'].includes(question.qualityStatus)).length,
}, null, 2));
