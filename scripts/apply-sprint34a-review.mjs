import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();
const questionDir = join(root, 'src', 'data', 'questions');
const docsDir = join(root, 'docs');
const readJson = async (name) => JSON.parse(await readFile(join(questionDir, name), 'utf8'));
const writeJson = async (name, value) => writeFile(join(questionDir, name), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
const ids = (start, end) => Array.from({ length: end - start + 1 }, (_, index) => start + index);

const holdIds = new Set([60001, 60002]);
const downgradeIds = new Set([...ids(60003, 60078), ...ids(60098, 60106)]);
const disableIds = new Set([...ids(60079, 60097), ...ids(60107, 60109)]);
const expectedIds = new Set([...holdIds, ...downgradeIds, ...disableIds]);

const reasonFor = (id, decision) => {
  if (id === 60001) return '高機率考點候選仍缺教材頁碼，正式答案需要人工對照原教材後才能進正式題庫。';
  if (id === 60002) return '原 ID 20020 仍是 verified candidate，先前只列候選、未完成人工確認，不得自動升格。';
  if (id >= 60003 && id <= 60040) return '題幹是「核心答案／答題關鍵詞」的工廠變體，解析仍保留待核對訊息；可作練習，尚不足以作正式模擬考。';
  if (id >= 60041 && id <= 60078) return 'AI 生成選擇題使用跨題共用的無關干擾選項，答案過度明顯且來源頁碼待補；可作練習，尚不足以作正式模擬考。';
  if (id >= 60079 && id <= 60097) return '答案直接重複題目主題，選項沒有提供可判斷的實質答案；停用以避免錯誤學習。';
  if (id >= 60098 && id <= 60106) return 'AI 生成選擇題使用跨題共用的無關干擾選項，答案過度明顯且來源頁碼待補；可作練習，尚不足以作正式模擬考。';
  if (id >= 60107 && id <= 60109) return '非選擇題的參考答案只有題目主題，缺少實質答案與可供正式評分的依據；停用以避免錯誤學習。';
  return `${decision}：未通過 Sprint 34A 正式題庫覆核。`;
};

const [week1, week2, extra, practice] = await Promise.all([
  readJson('week1.json'),
  readJson('week2.json'),
  readJson('verified-extra.json'),
  readJson('exam-practice.json'),
]);

if (extra.length !== 109 || extra.some((question) => !expectedIds.has(question.id)) || expectedIds.size !== 109) {
  throw new Error('Sprint 34A 預期覆核資料不是完整的 109 題，停止套用。');
}

const practiceById = new Map(practice.map((question) => [question.id, question]));
const decisions = [];
for (const promoted of extra) {
  const decision = holdIds.has(promoted.id) ? 'hold_for_human_review' : downgradeIds.has(promoted.id) ? 'downgrade_to_practice' : 'remove_or_disable';
  const original = practiceById.get(promoted.originalPracticeId);
  if (!original) throw new Error(`找不到升格來源題 ${promoted.originalPracticeId}（新 ID ${promoted.id}）。`);

  delete original.relatedVerifiedId;
  original.sprint34aFormerVerifiedId = promoted.id;
  original.sprint34aDecision = decision;
  original.sprint34aReason = reasonFor(promoted.id, decision);
  original.reviewStatus = 'needs_review';
  original.practiceOnly = true;
  original.formalScoreEligible = false;
  if (decision === 'remove_or_disable') {
    original.qualityStatus = 'needs_fix';
    original.isActive = false;
    original.excludeFromPractice = true;
  } else {
    original.qualityStatus = 'needs_review';
    original.isActive = true;
    original.excludeFromPractice = false;
  }

  decisions.push({
    newVerifiedId: promoted.id,
    originalPracticeId: promoted.originalPracticeId,
    type: promoted.type,
    category: promoted.category,
    sourceType: promoted.sourceType,
    sourcePage: promoted.sourcePage,
    decision,
    reason: original.sprint34aReason,
    question: promoted.question,
  });
}

const counts = Object.fromEntries(['keep_verified', 'needs_minor_fix', 'downgrade_to_practice', 'hold_for_human_review', 'remove_or_disable'].map((decision) => [decision, decisions.filter((item) => item.decision === decision).length]));
const eligiblePracticeCount = practice.filter((question) => question.isActive !== false && question.excludeFromPractice !== true && !['unsafe_candidate', 'duplicate_candidate'].includes(question.qualityStatus ?? '')).length;
const formalCount = week1.length + week2.length;
const byType = (items) => Object.fromEntries([...new Set(items.map((item) => item.type))].map((type) => [type, items.filter((item) => item.type === type).length]));
const byCategory = (items) => Object.fromEntries([...new Set(items.map((item) => item.category))].map((category) => [category, items.filter((item) => item.category === category).length]));

await writeJson('verified-extra.json', []);
await writeJson('exam-practice.json', practice);

const table = decisions.map((item) => `| ${item.newVerifiedId} | ${item.originalPracticeId} | ${item.type} | ${item.category} | ${item.sourceType} | ${item.decision} | ${item.reason} |`).join('\n');
const summary = `- 覆核題數：${decisions.length}\n- keep_verified：${counts.keep_verified}\n- needs_minor_fix：${counts.needs_minor_fix}\n- downgrade_to_practice：${counts.downgrade_to_practice}\n- hold_for_human_review：${counts.hold_for_human_review}\n- remove_or_disable：${counts.remove_or_disable}\n- 覆核後 verified：${formalCount} 題（原有 Week1 ${week1.length} 題＋Week2 ${week2.length} 題；原本 41 題未修改）\n- Full Mock 可用題數：${formalCount}\n- examPractice 可抽題數：${eligiblePracticeCount}\n- examPractice 原始題數：${practice.length}`;

await writeFile(join(docsDir, '34A_verified覆核報告.md'), `# Sprint 34A verified 覆核報告\n\n> 覆核範圍：Sprint 34 新升格的 109 題。原本 41 題 verified 未修改。\n\n## 一、總覽\n\n${summary}\n\n本次採全量結構性覆核，沒有把任何不確定題目硬留在正式題庫。檢查內容包含題幹、答案、選項唯一性、解析一致性、來源欄位、AI 生成痕跡、風險語句、正式／練習邊界，以及與既有題目的近似程度。\n\n## 二、覆核方法\n\n- 選擇題：檢查選項是否為同一題的合理干擾項、答案是否唯一、是否把題目主題直接當答案。\n- 非選擇題：檢查參考答案是否有實質內容、題幹是否為可直接作答的考題、解析是否仍宣告待人工核對。\n- 來源：檢查 sourceType、sourceLabel、sourceFile、sourcePage；「待補」本身不等同錯誤，但若同時存在未完成核對訊息，不能視為正式確認。\n- 邊界：安全／法規／醫療高風險題不以 AI 推測正式答案。\n\n## 三、主要發現\n\n1. 109 題的升格資料仍帶有待人工核對或頁碼待補訊息，與正式 verified 已完成確認的語意不一致。\n2. 60003～60040 是「核心答案／答題關鍵詞」的工廠變體，不宜直接作正式模擬考題。\n3. 60041～60078、60098～60106 的選擇題有跨題共用的無關干擾選項，容易因形式而非知識作答。\n4. 60079～60097 的答案直接重複題目主題，無法形成可靠的選擇題答案。\n5. 60107～60109 的非選擇題參考答案只有主題名稱，缺少正式評分所需的實質內容。\n6. 60001、60002 仍需人工對照教材；60002 對應原 verified candidate 20020，本次不升格。\n\n## 四、處置原則\n\n- 保留：只有已完成人工來源／答案確認、題目可直接作答、且沒有正式模擬考品質問題者。\n- 降級：內容仍可作為考前練習，但正式答案、選項或來源仍需人工校準者。原 examPractice 題恢復為 practiceOnly。\n- 待人工確認：題目方向可能有價值，但來源／答案不能由本次資料安全確認者。\n- 停用：答案本身不足或題目結構會造成錯誤學習者。\n\n## 五、逐題結果\n\n| 新 verified ID | 原 examPractice ID | 題型 | 分類 | 原來源 | 處置 | 原因 |\n|---:|---:|---|---|---|---|---|\n${table}\n\n## 六、正式模擬考結論\n\n覆核後 Full Mock 僅使用原本 41 題 verified。Sprint 34 的 109 題全部離開正式池：85 題恢復為練習、2 題列入人工確認、22 題停用。這代表正式題數減少，但可信度優先於湊足題數。\n`, 'utf8');

await writeFile(join(docsDir, '34A_verified保留清單.md'), `# Sprint 34A verified 保留清單\n\n本次覆核後，Sprint 34 新升格題中沒有題目可直接保留為 verified（keep_verified：0）。\n\n- 原 Week1 verified：20 題，未修改。\n- 原 Week2 verified：21 題，未修改。\n- Sprint 34 新題：0 題留在正式池。\n- 覆核後正式 verified：41 題。\n\n原因是本批資料普遍仍帶有待人工核對訊息、來源頁碼待補，且部分選項／參考答案不符合正式模擬考的可信度要求。後續若人工補齊教材頁碼、核對答案並重新設計選項，才可另行提出候選；本文件不代表自動升格。\n`, 'utf8');

await writeFile(join(docsDir, '34A_verified降級清單.md'), `# Sprint 34A verified 降級與停用清單\n\n${summary}\n\n- 降級題：原題恢復到 examPractice，標記 practiceOnly、formalScoreEligible=false、qualityStatus=needs_review。\n- 待人工確認：原題恢復到 examPractice，但需人工補來源與答案核對。\n- 停用題：原題保留在資料檔供追蹤，標記 isActive=false、excludeFromPractice=true、qualityStatus=needs_fix。\n- 沒有刪除原 examPractice 題，也沒有修改原本 41 題 verified 答案。\n\n## 逐題清單\n\n| 新 verified ID | 原 examPractice ID | 題型 | 分類 | 原來源 | 處置 | 原因 |\n|---:|---:|---|---|---|---|---|\n${table}\n`, 'utf8');

await writeFile(join(docsDir, '34A_正式模擬考可信度報告.md'), `# Sprint 34A 正式模擬考可信度報告\n\n## 覆核後狀態\n\n- Full Mock 模式：verified-only。\n- verified 正式題：${formalCount} 題。\n- Sprint 34 新題保留：0 題。\n- examPractice 可抽題：${eligiblePracticeCount} 題。\n- 停用題不進 Daily、Weekly 或 Full Mock。\n- Apps Script：未修改、未部署。\n- 本機規準輔助評分：不受影響，仍不寫入正式成績。\n\n## 題型分布\n\n- verified：${JSON.stringify(byType([...week1, ...week2]))}\n- verified 分類：${JSON.stringify(byCategory([...week1, ...week2]))}\n\n## 可信度判定\n\n目前正式模擬考只使用原先已存在且未被本 Sprint 修改的 41 題。這樣會降低 Full Mock 題量，但能避免把尚未完成來源核對、選項結構不良、答案不足或 AI 工廠痕跡明顯的題目當成正式題。題型分布若需擴充，應以人工核對後的新候選為前提，不以本批資料直接回填。\n\n## 後續人工門檻\n\n重新提出 verified candidate 前，必須完成教材檔案／頁碼定位、答案與解析逐題核對、選項重新設計、與既有 41 題及練習池去重，並由人工在 reviewerDecision 欄位確認；不得只依 AI 生成資料或規準評分結果升格。\n`, 'utf8');

await writeFile(join(docsDir, '34A_review-manifest.json'), `${JSON.stringify({ sprint: '34A', reviewed: decisions.length, counts, originalVerifiedCount: formalCount, fullMockCount: formalCount, practiceOriginalCount: practice.length, practiceEligibleCount: eligiblePracticeCount, decisions }, null, 2)}\n`, 'utf8');

console.log(JSON.stringify({ counts, formalCount, fullMockCount: formalCount, practiceOriginalCount: practice.length, practiceEligibleCount: eligiblePracticeCount }, null, 2));
