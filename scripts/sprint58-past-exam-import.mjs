import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();
const sourcePath = join(root, 'docs', 'sprint58_past_exam_verified.json');
const outputPath = join(root, 'src', 'data', 'questions', 'past-exam-verified.json');

const source = JSON.parse(await readFile(sourcePath, 'utf8'));
const verified = (source.verified ?? []).filter((question) => (
  question.verification_status === 'verified'
  && question.formal_import_eligible === true
));

if (!verified.length) throw new Error('Sprint 58 verified queue is empty; refusing to overwrite runtime output.');

const runtimeQuestions = verified.map((question) => ({
  id: question.runtime_id,
  weekId: 'past-exam',
  type: question.type,
  chapter: question.chapter,
  category: question.category,
  difficulty: question.difficulty,
  question: question.question,
  options: question.options,
  answer: question.answer,
  explanation: question.explanation,
  sourceType: 'past_exam',
  source_type: 'past_exam',
  sourceLabel: question.source_label,
  sourceFile: question.source_file.split('/').at(-1),
  sourcePage: question.source_page,
  sourceChapter: question.source_chapter,
  sourceVersion: question.source_version,
  sourceEvidenceIds: question.source_evidence_ids,
  evidenceExcerpt: question.evidence_excerpt,
  answerBasis: question.answer_basis,
  answerSource: question.answer_source,
  answerConfidence: question.answer_confidence,
  reviewStatus: 'verified',
  verificationStatus: 'verified',
  verificationType: 'past_exam',
  verifiedBy: question.verified_by,
  verifiedAt: question.verified_at,
  sourceConfidence: 'high',
  formalScoreEligible: true,
  practiceOnly: false,
  isActive: true,
  priority: 20,
  imageRequired: false,
  imageReference: null,
  imageMissing: false,
  sourceCandidateId: question.candidate_id,
  sourceQuestionId: question.question_id,
  sourceHash: question.source_hash,
  ifaScope: question.ifa_scope,
}));

await mkdir(join(root, 'src', 'data', 'questions'), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(runtimeQuestions, null, 2)}\n`, 'utf8');
console.log(`Sprint 58 imported ${runtimeQuestions.length} verified past-exam questions into ${outputPath}`);
