import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const projectRoot = process.cwd();
const materialRoot = process.env.IFA_MATERIAL_ROOT || path.resolve(projectRoot, '..', 'IFA_教材資料庫');
const docxCacheRoot = process.env.IFA_DOCX_CACHE_ROOT || '';
const outputPath = path.join(projectRoot, 'src', 'data', 'sourceEvidenceIndex.json');
const reportPath = path.join(projectRoot, 'docs', '35_教材證據索引報告.md');

const readText = (filePath) => fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
const readJson = (filePath) => JSON.parse(readText(filePath));
const normalize = (value) => String(value ?? '').replace(/\s+/g, ' ').trim();
const relativeMaterialPath = (filePath) => path.relative(materialRoot, filePath).split(path.sep).join('/');
const hasText = (value, min = 12) => normalize(value).length >= min;
const docxCacheManifest = (() => {
  if (!docxCacheRoot) return new Map();
  const manifestPath = path.join(docxCacheRoot, 'manifest.json');
  if (!fs.existsSync(manifestPath)) return new Map();
  try {
    const raw = JSON.parse(readText(manifestPath));
    return new Map(Object.entries(raw).map(([key, value]) => [path.resolve(key), value]));
  } catch { return new Map(); }
})();

const xmlDecode = (value) => value
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&apos;/g, "'")
  .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
  .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)));

const extractDocxParagraphs = (filePath) => {
  try {
    const cachedXmlPath = docxCacheManifest.get(path.resolve(filePath));
    const xml = cachedXmlPath && fs.existsSync(cachedXmlPath)
      ? readText(cachedXmlPath)
      : execFileSync('7z', ['e', '-so', filePath, 'word/document.xml'], { encoding: 'utf8', maxBuffer: 80 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] });
    return xml.split(/<\/w:p>/i).map((block) => [...block.matchAll(/<w:t[^>]*>([\s\S]*?)<\/w:t>/gi)].map((match) => xmlDecode(match[1])).join('')).map(normalize).filter(Boolean);
  } catch { return []; }
};

const extractRtfParagraphs = (filePath) => {
  try {
    return readText(filePath).replace(/\\'[0-9a-f]{2}/gi, ' ').replace(/\\[a-z]+\d* ?/gi, ' ').replace(/[{}]/g, ' ').split(/\r?\n/).map(normalize).filter(Boolean);
  } catch { return []; }
};

const walk = (root) => {
  const files = [];
  const visit = (directory) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const fullPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        if (/00_原始備份|03_重複|\.git/i.test(fullPath)) continue;
        visit(fullPath);
      } else files.push(fullPath);
    }
  };
  visit(root);
  return files;
};

const categoryForPath = (filePath) => {
  const value = filePath.toLowerCase();
  if (/基礎油|基础油|植物油|固定油/.test(value)) return '植物油／基底油';
  if (/精油化學|精油化学|芳香化學|芳香化学/.test(value)) return '精油化學';
  if (/解剖|生理|呼吸|淋巴|心臟|心脏|神經|神经|肌肉|消化/.test(value)) return '解剖生理';
  if (/倫理|伦理|諮詢|咨询|按摩|實務|实务/.test(value)) return '諮詢流程與職業倫理';
  if (/精油/.test(value)) return '精油基礎';
  return '其他';
};

const sourceLabelForPath = (filePath) => /整理|筆記|笔记|作業|作业|資料|资料/.test(relativeMaterialPath(filePath))
  ? 'IFA 教材庫可讀整理教材（非官方歷屆題）'
  : 'IFA 教材庫可讀教材（非官方歷屆題）';

const highRiskPattern = /治療|治疗|癌|疾病|孕婦|孕妇|嬰幼兒|婴幼儿|兒童|儿童|老人|長者|長期用藥|用藥|用药|藥物|药物|癲癇|癫痫|哮喘|高血壓|高血压|肝腎|肝肾|交互作用|禁忌|禁用|毒性|危險|危险|濃度|浓度|配方|靜脈曲張|静脉曲张|發炎|发炎|炎症|抗菌|抗病毒|口服|內服|内服|治癒|治愈|療效|疗效|抗癌|消炎/;
const isSafeLowRiskExcerpt = (value) => hasText(value, 18) && value.length <= 360 && !highRiskPattern.test(value);
const keywordsFor = (value, category) => {
  const common = ['IFA', '芳療', '教材', category];
  const terms = [...String(value).matchAll(/[A-Za-z][A-Za-z0-9-]{2,}|[\u4e00-\u9fff]{2,6}/g)].map((match) => match[0]);
  return [...new Set([...common, ...terms].slice(0, 18))];
};

const evidence = [];
const addEvidence = ({ sourceFile, sourceLabel, sourceType, sourceLocation, excerpt, category, riskLevel = 'standard_review', confidence = 'medium' }) => {
  const cleanExcerpt = normalize(excerpt);
  if (!isSafeLowRiskExcerpt(cleanExcerpt)) return false;
  evidence.push({
    evidenceId: `mat-${String(evidence.length + 1).padStart(4, '0')}`,
    sourceFile, sourceLabel, sourceType, sourceLocation, section: sourceLocation,
    excerpt: cleanExcerpt, normalizedKeywords: keywordsFor(cleanExcerpt, category), category,
    riskLevel, confidence, extractedAt: new Date().toISOString(),
  });
  return true;
};

const auditFiles = fs.existsSync(materialRoot) ? walk(materialRoot) : [];
const byExtension = Object.fromEntries([...new Set(auditFiles.map((file) => path.extname(file).toLowerCase() || '[none]'))].map((extension) => [extension, auditFiles.filter((file) => (path.extname(file).toLowerCase() || '[none]') === extension).length]));
const readableFiles = new Set();
const unreadableFiles = [];

const candidatePath = path.join(materialRoot, '05_題庫候選', '10_待驗證題目.json');
if (fs.existsSync(candidatePath)) {
  const candidates = readJson(candidatePath);
  candidates.filter((candidate) => hasText(candidate.answer, 8) && !/模擬題|病理與禁忌|安全濃度與稀釋|個案研究|配方設計/.test(String(candidate.category ?? '')) && !highRiskPattern.test(`${candidate.question ?? ''}${candidate.answer ?? ''}`)).forEach((candidate) => addEvidence({
    sourceFile: 'IFA_教材資料庫/05_題庫候選/10_待驗證題目.json',
    sourceLabel: 'IFA 整理題庫資料（原始候選記錄，非官方歷屆題）',
    sourceType: 'organized_material', sourceLocation: `candidate:${candidate.id}`,
    excerpt: `原始題幹：${candidate.question}；整理答案：${candidate.answer}`,
    category: candidate.category || '其他', confidence: 'medium',
  }));
  readableFiles.add(candidatePath);
}

const relevantPath = /基礎油|基础油|植物油|固定油|精油|芳香化學|芳香化学|化學|化学|解剖|生理|呼吸|淋巴|心臟|心脏|神經|神经|肌肉|按摩|倫理|伦理|諮詢|咨询/;
for (const filePath of auditFiles) {
  const extension = path.extname(filePath).toLowerCase();
  if (!relevantPath.test(filePath)) continue;
  const paragraphs = extension === '.docx' ? extractDocxParagraphs(filePath) : extension === '.rtf' ? extractRtfParagraphs(filePath) : [];
  if (paragraphs.length === 0) {
    if (extension === '.docx' || extension === '.rtf') unreadableFiles.push(relativeMaterialPath(filePath));
    continue;
  }
  readableFiles.add(filePath);
  const category = categoryForPath(filePath);
  paragraphs.filter(isSafeLowRiskExcerpt).slice(0, 120).forEach((paragraph, index) => addEvidence({
    sourceFile: `IFA_教材庫/${relativeMaterialPath(filePath)}`,
    sourceLabel: sourceLabelForPath(filePath), sourceType: 'extracted_material',
    sourceLocation: `word/document.xml 段落 ${index + 1}`, excerpt: paragraph, category, confidence: 'medium',
  }));
}

const result = {
  schemaVersion: 'sprint35-source-evidence-v1', generatedAt: new Date().toISOString(),
  sourceRoot: 'D:/OneDrive/桌面/IFA/IFA_教材資料庫（僅作來源，不隨網站部署）',
  audit: { totalFiles: auditFiles.length, byExtension, readableTextFiles: readableFiles.size, unreadableRelevantFiles: unreadableFiles, unsupportedBinaryExtensions: ['.pdf', '.doc', '.pages', '.xls', '.xlsx', '.jpg', '.png'], note: '索引只保存必要摘錄與定位資訊，不複製 private PDF／DOCX 全文。來源段落來自可直接抽取的 DOCX／RTF 或既有結構化整理記錄。' },
  evidence,
};
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`, 'utf8');

const categoryCounts = Object.entries(evidence.reduce((acc, item) => { acc[item.category] = (acc[item.category] || 0) + 1; return acc; }, {})).sort((a, b) => b[1] - a[1]);
const extensionLines = Object.entries(byExtension).sort((a, b) => b[1] - a[1]).map(([extension, count]) => `- ${extension}：${count}`).join('\n');
const categoryLines = categoryCounts.map(([category, count]) => `- ${category}：${count}`).join('\n');
const report = `# Sprint 35 教材證據索引報告\n\n- 建立時間：${result.generatedAt}\n- 外部教材根目錄：${result.sourceRoot}\n- 掃描檔案數：${auditFiles.length}\n- 可讀文字／結構化來源檔案數：${readableFiles.size}\n- 可抽取但本次未納入證據的相關檔案數：${unreadableFiles.length}\n- 證據段落數：${evidence.length}\n\n## 副檔名盤點\n\n${extensionLines}\n\n## 證據分類\n\n${categoryLines}\n\n## 可追溯範圍\n\n本索引只保存實際讀取到的教材段落或結構化整理記錄的必要摘錄，並附來源檔案與段落定位。PDF、DOC、XLSX 等未由本工具直接抽取的檔案不會被假裝成已讀教材；它們只列在來源稽核與後續缺口中。\n\n## 風險排除\n\n本批證據索引排除包含醫療宣稱、疾病／用藥、孕婦／兒童、禁忌、配方濃度、毒性或治療承諾等高風險語句的段落。這些主題仍保留在原始教材庫與 examPractice，不直接產生 source_verified 正式模擬考題。\n\n## 產物\n\n- src/data/sourceEvidenceIndex.json：供題庫工廠與 validator 使用。\n- private PDF／DOCX 未複製到 dist。\n`;
fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, report, 'utf8');
console.log(JSON.stringify({ evidenceCount: evidence.length, audit: result.audit, categoryCounts }, null, 2));
