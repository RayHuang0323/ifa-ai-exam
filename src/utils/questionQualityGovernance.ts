import { isQuestionProtected } from './answeredQuestionLock';
import { assessQuestionQuality, assessSourceVerified, auditQuestionLanguage, displaySourceValue, formatTextbookLocation, getMetadataMissingFields, hasAiGeneratedWording, hasImageDependency as detectsImageDependency, questionNaturalnessAudit, resolveAnswerConfidence, resolveMetadataCompleteness, resolveQuestionConfidence, type AnswerConfidence, type MetadataCompleteness, type OptionQualityMetadata, type QuestionConfidence, type QuestionLanguageAudit, type QuestionNaturalnessAudit, type QuestionQualityMetadata, type SourceReviewMetadata } from './questionQualityAudit';

type QualityQuestion = {
  id: number;
  type: string;
  question: string;
  category?: string;
  chapter?: string;
  options?: string[];
  answer: string | string[];
  referenceAnswer?: string | string[];
  sampleAnswer?: string;
  explanation?: string;
  answerGuide?: string;
  keyPoints?: string[] | string;
  rubric?: Array<{ score: number; label: string; description: string }> | number | RubricMetadata;
  commonOmissions?: string[] | string;
  sourceType?: string;
  sourceFile?: string;
  sourceLabel?: string;
  sourceLocation?: string;
  sourcePage?: string | number;
  sourceChapter?: string;
  sourceVersion?: string;
  sourceEvidenceIds?: string[];
  evidenceExcerpt?: string;
  answerBasis?: string;
  qualityStatus?: string;
  reviewStatus?: string;
  verificationType?: string;
  metadataStatus?: 'complete' | 'metadata_missing';
  sourceQualityLevel?: 'A' | 'B' | 'C';
  questionConfidence?: QuestionConfidence;
  answerConfidence?: AnswerConfidence;
  metadataCompleteness?: MetadataCompleteness;
  metadataMissingFields?: string[];
  questionNaturalnessAudit?: QuestionNaturalnessAudit;
  questionLanguageAudit?: QuestionLanguageAudit;
  formalScoreEligible?: boolean;
  practiceOnly?: boolean;
  displayQuestion?: string;
  displayOptions?: string[];
  displayAnswer?: string | string[];
  displayReferenceAnswer?: string | string[];
  displayEvidenceExcerpt?: string;
  displayAnswerBasis?: string;
  displaySourceFile?: string;
  displaySourceLabel?: string;
  displaySourceLocation?: string;
  displaySourceChapter?: string;
  displaySourceVersion?: string;
  displaySourcePage?: string | number;
  displayTextbookLocation?: string;
  displayExplanation?: string;
  highScoreGuidance?: string[];
  questionQuality?: QuestionQualityMetadata;
  optionQuality?: OptionQualityMetadata;
  sourceReview?: SourceReviewMetadata;
  imageRequired?: boolean;
  imageSource?: string | { source_file?: string; source_page?: string | number; source_hash?: string };
  imageAlt?: string;
  imageReference?: { source: string; alt: string; verified: boolean } | null;
  imageMissing?: boolean;
};

export interface RubricMetadata {
  fullScore: string[];
  partialScore: string[];
  lowScore: string[];
  zeroScore: string[];
  requiredConcepts: string[];
  forbiddenPatterns: string[];
  minimumAnswerLength: number;
}

const characterSequence = '儿兒个個卫衛马馬与與丰豐为為从從内內区區历歷双雙开開无無气氣见見车車们們兰蘭写寫发發叶葉处處头頭对對旧舊记記长長龙龍亚亞产產会會伞傘传傳关關动動协協压壓尽盡当當机機杀殺红紅约約级級观觀许許负負页頁两兩严嚴体體别別坚堅寿壽层層岛島应應彻徹扰擾护護时時来來杨楊沟溝没沒状狀玛瑪疗療纸紙肠腸过過间間阳陽鸡雞侧側净凈势勢单單学學实實态態拢攏构構环環线線组組细細织織经經罗羅肤膚肾腎肿腫节節芸蕓试試责責质質转轉软軟运運这這进進远遠连連邻鄰际際陈陳饱飽举舉亲親养養复復带帶挥揮柠檸标標浅淺浓濃点點独獨种種类類结結给給统統脉脈茎莖视視轴軸轻輕顺順倾傾准準圆圓将將样樣热熱疱皰积積称稱紧緊脏臟脑腦调調较較适適顾顧减減弹彈敛斂渗滲着著离離续續维維绿綠羟羥跃躍躯軀递遞颈頸黄黃属屬强強缓緩缔締谢謝释釋链鏈锁鎖摄攝数數榈櫚莱萊键鍵随隨稳穩缩縮营營静靜鲜鮮颜顏额額鳄鱷髋髖';
const characterArray = Array.from(characterSequence);
const characterMap: Record<string, string> = Object.fromEntries(characterArray.filter((_, index) => index % 2 === 0).map((source, index) => [source, characterArray[index * 2 + 1]]));

const imageQuestionOverrides: Record<number, string> = {
  1042: '請列出呼吸系統的主要構造名稱，並依氣流通過的順序說明。',
  20023: '請列出呼吸系統的主要構造名稱，並依氣流通過的順序說明。',
  40033: '請列出呼吸系統的主要構造名稱，並依氣流通過的順序說明。',
  40084: '請用一句話整理呼吸系統的主要構造及氣流通過順序。',
  40085: '請列出呼吸系統的主要構造及其氣流通過順序。',
  40127: '列出呼吸系統主要構造與氣流通過順序的關鍵詞。',
  50033: '下列哪一項最符合呼吸系統主要構造及氣流通過順序？',
  50107: '請回憶呼吸系統的主要構造，並列出至少一項氣流路徑重點。',
  50210: '請以條理化方式說明呼吸系統的主要構造與氣流通過順序。',
  50273: '下列何者是呼吸系統主要構造與氣流通過順序的核心重點？',
};

export const toTraditional = (value: string) => value.replace(/[\u3400-\u9fff]/g, (character) => characterMap[character] ?? character);
const convertValue = (value: string | string[] | undefined) => Array.isArray(value) ? value.map(toTraditional) : typeof value === 'string' ? toTraditional(value) : value;
const asList = (value: string[] | string | undefined, fallback: string[]) => Array.isArray(value) ? value.map(toTraditional) : typeof value === 'string' && value.trim() ? value.split(/[，,]/).map((item) => toTraditional(item.trim())).filter(Boolean) : fallback;
const hasValue = (value: unknown) => Array.isArray(value)
  ? value.length > 0
  : typeof value === 'string'
    ? value.trim().length > 0 && value !== '待補'
    : value !== undefined && value !== null;
const isNonChoice = (type: string) => ['shortAnswer', 'short_answer', 'essay', 'case_study', 'case'].includes(type);
const isEssay = (type: string) => ['essay', '申論', 'writing'].includes(type);
const isCase = (type: string) => ['case', 'case-study', 'case_study'].includes(type);
const isGenericPoint = (point: string) => /回答需涵蓋|題目要求的核心|必要關係|教材中的關鍵名詞|核心概念/.test(point);
const defaultRubricDescriptions = {
  fullScore: ['主要概念完整，回應題目要求，表達具體且沒有教材未支持的推論。'],
  partialScore: ['掌握主要方向，但缺少部分重要概念、條件或限制。'],
  lowScore: ['僅有片面描述或單一關鍵詞，尚不足以證明完整理解。'],
  zeroScore: ['空白、無關、測試文字、灌水文字或明顯違反教材安全界線。'],
};

const rubricItems = (value: QualityQuestion['rubric']) => Array.isArray(value) ? value.filter((item): item is { score: number; label: string; description: string } => Boolean(item) && typeof item === 'object' && typeof item.score === 'number' && typeof item.description === 'string') : [];
const cleanPoint = (point: string) => point.replace(/^核心內容[：:]?\s*/, '').replace(/^回答需涵蓋.*$/u, '').replace(/^使用教材中的關鍵名詞.*$/u, '').trim();
const requiredConcepts = (question: QualityQuestion) => {
  const listed = asList(question.keyPoints, []).map(cleanPoint).filter((point) => point.length >= 2 && !isGenericPoint(point));
  if (listed.length) return listed;
  const answer = Array.isArray(question.answer) ? question.answer.join('、') : question.answer;
  return String(answer ?? '').split(/[\n。；;]/).map((point) => point.trim()).filter((point) => point.length >= 2).slice(0, 5);
};
const buildRubricMetadata = (question: QualityQuestion): RubricMetadata => {
  const existing = rubricItems(question.rubric);
  const points = requiredConcepts(question);
  const minimumAnswerLength = isEssay(question.type) ? 24 : ['case', 'case_study'].includes(question.type) ? 20 : 6;
  return {
    fullScore: existing.filter((item) => item.score === 3).map((item) => toTraditional(item.description)).length ? existing.filter((item) => item.score === 3).map((item) => toTraditional(item.description)) : defaultRubricDescriptions.fullScore,
    partialScore: existing.filter((item) => item.score === 2).map((item) => toTraditional(item.description)).length ? existing.filter((item) => item.score === 2).map((item) => toTraditional(item.description)) : defaultRubricDescriptions.partialScore,
    lowScore: existing.filter((item) => item.score === 1).map((item) => toTraditional(item.description)).length ? existing.filter((item) => item.score === 1).map((item) => toTraditional(item.description)) : defaultRubricDescriptions.lowScore,
    zeroScore: existing.filter((item) => item.score === 0).map((item) => toTraditional(item.description)).length ? existing.filter((item) => item.score === 0).map((item) => toTraditional(item.description)) : defaultRubricDescriptions.zeroScore,
    requiredConcepts: points,
    forbiddenPatterns: ['不知道', '不清楚', 'test', 'testtest', 'abc', '無關內容'],
    minimumAnswerLength,
  };
};
const buildHighScoreGuidance = (question: QualityQuestion, metadata: RubricMetadata) => {
  const guidance = metadata.requiredConcepts.slice(0, 5).map((point) => `涵蓋「${point.slice(0, 32)}${point.length > 32 ? '…' : ''}」`);
  if (isCase(question.type)) guidance.unshift('先交代個案評估、風險／禁忌判斷，再提出處理順序。');
  if (isEssay(question.type)) guidance.unshift('先界定主題，再依題目要求分段說明原因、條件與限制。');
  guidance.push('避免加入教材未支持的推論；涉及安全疑慮時說明必要的轉介界線。');
  return guidance.slice(0, 7);
};

export const hasAiPromptWording = hasAiGeneratedWording;

const hasMissingMetadata = (question: QualityQuestion) => ['sourceFile', 'sourceChapter', 'sourceVersion', 'sourceEvidenceIds', 'evidenceExcerpt', 'answerBasis']
  .some((field) => !hasValue(question[field as keyof QualityQuestion]));

export const applyQuestionQualityGovernance = <T extends QualityQuestion>(question: T): T => {
  const protectedQuestion = isQuestionProtected(question.id);
  const referenceAnswer = question.referenceAnswer ?? question.answer;
  const metadataMissing = hasMissingMetadata(question);
  const base = {
    ...question,
    sourceFile: question.sourceFile ?? '待補',
    sourceChapter: question.sourceChapter ?? '待補',
    sourceVersion: question.sourceVersion ?? '待補',
    sourceEvidenceIds: question.sourceEvidenceIds ?? [],
    evidenceExcerpt: question.evidenceExcerpt ?? '待補',
    answerBasis: question.answerBasis ?? '來源資料待補；本題保留原有答案內容，未新增或推論教材依據。',
    referenceAnswer,
    sampleAnswer: question.sampleAnswer ?? `高分示範答案：${Array.isArray(referenceAnswer) ? referenceAnswer.join('、') : referenceAnswer}`,
    keyPoints: asList(question.keyPoints, [Array.isArray(referenceAnswer) ? referenceAnswer.join('、') : referenceAnswer]),
    rubric: isNonChoice(question.type) ? buildRubricMetadata(question) : Array.isArray(question.rubric) ? question.rubric : question.rubric,
    commonOmissions: asList(question.commonOmissions, ['僅列出結論，未完整回應題目要求的方向。']),
    answerGuide: question.answerGuide ?? (question.type === 'essay' ? '請先界定主題，再依序回應題目要求的重點、關係與限制。' : undefined),
    qualityStatus: metadataMissing ? question.qualityStatus ?? 'metadata_missing' : question.qualityStatus,
    metadataStatus: metadataMissing ? 'metadata_missing' as const : 'complete' as const,
  };
  const rubricMetadata = isNonChoice(question.type) && !Array.isArray(base.rubric) && base.rubric && typeof base.rubric === 'object' ? base.rubric as RubricMetadata : undefined;
  const imageRequired = question.imageRequired === true || detectsImageDependency(question.question);
  // Past-exam imports may carry image provenance metadata in imageSource rather
  // than a renderable URL. Only a string is safe to pass to <img src>; the
  // structured value remains available through the source fields and should
  // render as the existing missing-image warning.
  const imageSource = typeof question.imageSource === 'string' ? question.imageSource.trim() : '';
  const languageAudit = auditQuestionLanguage({ ...question, answerBasis: question.answerBasis, explanation: question.explanation });
  const naturalness = questionNaturalnessAudit(toTraditional(question.question), question.type);
  const displayQuestion = imageQuestionOverrides[question.id] ?? languageAudit.displayQuestion;
  languageAudit.displayQuestion = displayQuestion;
  const questionQuality = assessQuestionQuality(question.question, displayQuestion);
  const sourceReview = question.reviewStatus === 'source_verified' || question.verificationType === 'source_verified'
    ? assessSourceVerified({ questionQuality, sourceEvidenceIds: base.sourceEvidenceIds, evidenceExcerpt: base.evidenceExcerpt, answerBasis: base.answerBasis })
    : undefined;
  const downgradedToPractice = sourceReview?.disposition === 'DOWNGRADE';
  const metadataCompleteness = resolveMetadataCompleteness(base);
  const metadataMissingFields = getMetadataMissingFields(question);
  const imageAlt = question.imageAlt?.trim() || (imageRequired ? '題目所需圖片（來源資料待補）' : '');
  const imageReference = imageSource ? { source: imageSource, alt: imageAlt, verified: true } : null;
  const answerConfidence = resolveAnswerConfidence({ ...base, sourceReview, questionQuality, sourceType: question.sourceType, reviewStatus: question.reviewStatus, practiceOnly: downgradedToPractice ? true : question.practiceOnly, formalScoreEligible: downgradedToPractice ? false : question.formalScoreEligible });
  const displayFields = {
    displayQuestion,
    displayOptions: Array.isArray(base.options) ? base.options.map(toTraditional) : base.options,
    displayAnswer: convertValue(base.answer),
    displayReferenceAnswer: convertValue(referenceAnswer),
    displayExplanation: toTraditional(question.explanation ?? question.answerGuide ?? '來源資料待補'),
    displayEvidenceExcerpt: displaySourceValue(toTraditional(base.evidenceExcerpt ?? ''), '來源資料待補'),
    displayAnswerBasis: displaySourceValue(toTraditional(base.answerBasis ?? ''), '來源資料待補'),
    displaySourceFile: displaySourceValue(typeof base.sourceFile === 'string' ? toTraditional(base.sourceFile) : base.sourceFile, '教材檔案待補'),
    displaySourceLabel: displaySourceValue(typeof base.sourceLabel === 'string' ? toTraditional(base.sourceLabel) : base.sourceLabel, '教材來源待補'),
    displaySourceLocation: displaySourceValue(typeof base.sourceLocation === 'string' ? toTraditional(base.sourceLocation) : base.sourceLocation, ''),
    displaySourceChapter: displaySourceValue(typeof base.sourceChapter === 'string' ? toTraditional(base.sourceChapter) : base.sourceChapter, '教材章節待補'),
    displaySourceVersion: displaySourceValue(typeof base.sourceVersion === 'string' ? toTraditional(base.sourceVersion) : base.sourceVersion, '教材版本待補'),
    displaySourcePage: displaySourceValue(typeof base.sourcePage === 'string' ? toTraditional(base.sourcePage) : base.sourcePage, '教材頁碼待補'),
    displayTextbookLocation: formatTextbookLocation(base.sourceChapter, base.sourceLocation),
    highScoreGuidance: rubricMetadata ? buildHighScoreGuidance(question, rubricMetadata) : undefined,
    questionQuality,
    sourceReview,
    questionNaturalnessAudit: naturalness,
    questionLanguageAudit: languageAudit,
    metadataCompleteness,
    metadataMissingFields,
    answerConfidence,
    formalScoreEligible: downgradedToPractice ? false : question.formalScoreEligible,
    practiceOnly: downgradedToPractice ? true : question.practiceOnly,
    questionConfidence: resolveQuestionConfidence({ ...base, sourceReview, questionQuality, sourceType: question.sourceType, reviewStatus: question.reviewStatus, practiceOnly: downgradedToPractice ? true : question.practiceOnly, formalScoreEligible: downgradedToPractice ? false : question.formalScoreEligible }),
    imageRequired,
    imageSource,
    imageAlt,
    imageReference,
    imageMissing: imageRequired && !imageSource,
  };
  if (protectedQuestion) return { ...base, ...displayFields } as T;
  return {
    ...base,
    ...displayFields,
    // Preserve canonical wording, answers, explanations and evidence. UI reads display* fields.
    question: question.question,
    options: question.options,
    answer: question.answer,
    referenceAnswer: question.referenceAnswer ?? question.answer,
    explanation: question.explanation,
  } as T;
};

export const hasImageDependency = detectsImageDependency;
export const hasEvidencePromptWording = hasAiGeneratedWording;
export const hasSimplifiedCharacters = (value: string) => Object.keys(characterMap).some((character) => value.includes(character));
