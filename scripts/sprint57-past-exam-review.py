#!/usr/bin/env python3
"""Build Sprint 57 past-exam formal candidate metadata.

This script consumes the local Sprint 56 extraction artifact and emits only
review metadata.  It deliberately does not copy source question text,
options, answers, explanations, or binary image assets into committed files.
The Sprint 56 extraction artifact is ignored by git because it may contain
private source-derived content.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import unicodedata
from collections import Counter, defaultdict
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_EXTRACTIONS = ROOT / "docs" / "sprint56_past_exam_extractions.json"
QUEUE_PATH = ROOT / "docs" / "sprint57_formal_candidate_queue.json"
REPORT_PATH = ROOT / "docs" / "sprint57_past_exam_review.md"

FORMAL_FILES = [
    "week1.json",
    "week2.json",
    "verified-extra.json",
    "source-verified.json",
    "source-verified-sprint36.json",
    "source-verified-sprint37.json",
]

OFFICIAL_CATEGORY = "official_exam_candidate"
TEXTBOOK_CATEGORY = "textbook_exam_candidate"
RELEVANT_CATEGORIES = {OFFICIAL_CATEGORY, TEXTBOOK_CATEGORY}

QUESTION_BOUNDARY_STATUS = "question_boundary_detected"


def normalize(value: Any) -> str:
    if value is None:
        return ""
    normalized = unicodedata.normalize("NFKC", str(value)).lower()
    return "".join(char for char in normalized if char.isalnum())


def sha_id(prefix: str, value: str) -> str:
    return f"{prefix}-{hashlib.sha256(value.encode('utf-8')).hexdigest()[:12]}"


def display(value: Any) -> str:
    if value is None or value == "":
        return "未取得"
    return str(value)


def markdown_escape(value: Any) -> str:
    return display(value).replace("|", "\\|").replace("\n", " ")


def load_json(path: Path) -> Any:
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def load_formal_questions() -> tuple[list[dict[str, Any]], list[str]]:
    questions: list[dict[str, Any]] = []
    loaded_files: list[str] = []
    question_dir = ROOT / "src" / "data" / "questions"
    for filename in FORMAL_FILES:
        path = question_dir / filename
        if not path.exists():
            continue
        value = load_json(path)
        if isinstance(value, list):
            questions.extend(item for item in value if isinstance(item, dict))
            loaded_files.append(filename)
    return questions, loaded_files


def formal_index(questions: list[dict[str, Any]]) -> dict[str, list[str]]:
    index: dict[str, list[str]] = defaultdict(list)
    for question in questions:
        key = normalize(question.get("question"))
        if key:
            index[key].append(str(question.get("id", "")))
    return {key: sorted(set(ids)) for key, ids in index.items()}


def source_basename(source_file: str) -> str:
    return source_file.replace("\\", "/").rsplit("/", 1)[-1]


def source_lineage(source_file: str) -> tuple[str, str, str]:
    """Return (lineage, label, confidence) from explicit source naming only.

    The generic parent directory `考古題原始資料` is intentionally ignored;
    it is a storage folder, not evidence that every file is a past exam.
    """

    basename = source_basename(source_file)
    historical_re = re.compile(
        r"考古題|考古题|北京考題|北京考题|past[ _-]*exam|historical[ _-]*paper",
        re.IGNORECASE,
    )
    final_re = re.compile(r"期末試卷|期末试卷|final[ _-]*exam", re.IGNORECASE)
    teacher_re = re.compile(r"考官建議|考官建议|teacher[ _-]*(exam|note)|assessor", re.IGNORECASE)

    if historical_re.search(basename):
        return "historical_exam_candidate", "explicit historical/past-exam filename", "high"
    if final_re.search(basename):
        return "final_exam_candidate", "explicit final-exam filename", "high"
    if teacher_re.search(basename):
        return "teacher_exam_note_candidate", "explicit teacher/assessor filename", "medium"
    return "textbook_exam_candidate", "Sprint 56 textbook/workbook classification", "medium"


def extract_year_and_date(source_file: str) -> tuple[int | None, str | None, str]:
    basename = source_basename(source_file)
    date_match = re.search(
        r"(?<!\d)(20\d{2})[-/.年](\d{1,2})[-/.月](\d{1,2})日?(?!\d)",
        basename,
        re.IGNORECASE,
    )
    year_match = re.search(r"(?<!\d)(20\d{2})(?!\d)", basename)
    year = int(year_match.group(1)) if year_match else None
    if date_match:
        exam_date = f"{date_match.group(1)}-{int(date_match.group(2)):02d}-{int(date_match.group(3)):02d}"
        return year, exam_date, "explicit_filename_date"
    if year is not None:
        return year, None, "explicit_filename_year_only"
    return None, None, "not_stated"


def answer_availability(question_records: list[dict[str, Any]]) -> tuple[str, int, int, str]:
    high_signal = [item for item in question_records if item.get("extractionStatus") == QUESTION_BOUNDARY_STATUS]
    stated = [item for item in high_signal if item.get("answer_status") == "source_stated"]
    if not high_signal:
        availability = "unknown"
    elif len(stated) == len(high_signal):
        availability = "source_stated"
    elif stated:
        availability = "partial_source_stated"
    else:
        availability = "unknown"
    note = (
        "Answer status is derived only from Sprint 56 explicit answer labels; no answer was inferred."
    )
    if "解答" in source_basename(question_records[0]["sourceFile"]) if question_records else False:
        note += " Filename suggests an answer companion, but a filename was not treated as answer evidence."
    return availability, len(stated), len(high_signal) - len(stated), note


def document_metadata(record: dict[str, Any], question_records: list[dict[str, Any]]) -> dict[str, Any]:
    lineage, lineage_reason, lineage_confidence = source_lineage(record["sourceFile"])
    exam_year, exam_date, date_status = extract_year_and_date(record["sourceFile"])
    high_signal = [item for item in question_records if item.get("extractionStatus") == QUESTION_BOUNDARY_STATUS]
    image_questions = [item for item in high_signal if item.get("hasImage")]
    answer_state, answer_stated_count, answer_unknown_count, answer_note = answer_availability(question_records)
    return {
        "sourceFile": record["sourceFile"],
        "displayName": record.get("displayName"),
        "fileType": record.get("fileType"),
        "category": record.get("category"),
        "pages": record.get("pages"),
        "examYear": exam_year,
        "examDate": exam_date,
        "examDateStatus": date_status,
        "lineage": lineage,
        "lineageReason": lineage_reason,
        "estimatedQuestionCount": record.get("estimatedQuestionCount"),
        "extractedQuestionCount": len(high_signal),
        "extractionRecordCount": len(question_records),
        "extractionStatus": record.get("extractionStatus"),
        "extractionMethod": record.get("extractionMethod"),
        "answerAvailability": answer_state,
        "answerStatedCount": answer_stated_count,
        "answerUnknownCount": answer_unknown_count,
        "answerEvidenceNote": answer_note,
        "containsImages": bool(record.get("containsImages")),
        "imageObjectCount": record.get("imageCount", 0) or 0,
        "imageQuestionCount": len(image_questions),
        "imageAssetStatus": "not_extracted" if record.get("containsImages") else "none_detected",
        "sourceConfidence": record.get("confidence"),
        "reviewConfidence": lineage_confidence,
        "sourceHash": record.get("sourceHash"),
        "sourceLineage": {
            "inventory": "docs/sprint55_exam_source_inventory.md",
            "sprint56Extraction": "docs/sprint56_past_exam_extractions.json",
            "sourceFile": record["sourceFile"],
            "sourceHash": record.get("sourceHash"),
        },
    }


def image_metadata(candidate: dict[str, Any]) -> dict[str, Any]:
    source_image = candidate.get("image") or {}
    source_file = candidate["sourceFile"]
    source_page = candidate.get("sourcePage")
    return {
        "imagePath": None,
        "assetRoot": "public/question-assets/",
        "imagePathStatus": "not_extracted",
        "sourceFile": source_file,
        "page": source_page,
        "type": source_image.get("type", "embedded_image"),
        "extractedAsset": None,
        "description": source_image.get(
            "description",
            "Image detected by Sprint 56; visual content was not OCR'd or copied.",
        ),
        "sourceHash": candidate.get("sourceHash"),
        "imageIndex": source_image.get("imageIndex"),
    }


def build_queue_candidate(
    candidate: dict[str, Any],
    document_by_source: dict[str, dict[str, Any]],
    duplicate_groups: dict[str, list[dict[str, Any]]],
) -> dict[str, Any]:
    question_text = candidate.get("question")
    question_key = normalize(question_text) if candidate.get("extractionStatus") == QUESTION_BOUNDARY_STATUS else ""
    group = duplicate_groups.get(question_key, []) if question_key else []
    formal_matches = sorted(set(candidate.get("formalMatchIds") or []))
    if formal_matches:
        status = "formal_existing_duplicate"
    elif group and len(group) > 1:
        status = "duplicate_candidate"
    else:
        status = "needs_human_review"

    source_doc = document_by_source[candidate["sourceFile"]]
    lineage = source_doc["lineage"]
    return {
        "candidateId": sha_id("s57c", candidate["questionId"]),
        "questionId": candidate["questionId"],
        "sourceFile": candidate["sourceFile"],
        "sourceHash": candidate.get("sourceHash"),
        "sourcePage": candidate.get("sourcePage"),
        "category": candidate["category"],
        "lineage": lineage,
        "examYear": source_doc.get("examYear"),
        "examDate": source_doc.get("examDate"),
        "questionDetected": bool(question_text),
        "questionBoundaryDetected": candidate.get("extractionStatus") == QUESTION_BOUNDARY_STATUS,
        "questionLength": len(str(question_text)) if question_text else 0,
        "optionCount": len(candidate.get("options") or []),
        "answerStatus": candidate.get("answer_status", "unknown"),
        "answerSource": candidate.get("answer_source"),
        "hasImage": bool(candidate.get("hasImage")),
        "image": image_metadata(candidate) if candidate.get("hasImage") else None,
        "formalMatchIds": formal_matches,
        "duplicateGroupId": sha_id("s57dup", question_key) if group and len(group) > 1 else None,
        "duplicateGroupSize": len(group) if group else 0,
        "sprint56ExtractionStatus": candidate.get("extractionStatus"),
        "sprint56ExtractionConfidence": candidate.get("extractionConfidence"),
        "status": status,
        "requiresHumanConfirmation": True,
        "importDecision": "do_not_import_in_sprint57",
        "sourceLineage": {
            "inventory": "docs/sprint55_exam_source_inventory.md",
            "sprint56Extraction": "docs/sprint56_past_exam_extractions.json",
            "sourceFile": candidate["sourceFile"],
            "sourcePage": candidate.get("sourcePage"),
            "sourceHash": candidate.get("sourceHash"),
            "sprint56QuestionId": candidate["questionId"],
        },
    }


def build_image_inventory(queue_candidates: list[dict[str, Any]]) -> list[dict[str, Any]]:
    inventory: list[dict[str, Any]] = []
    for item in queue_candidates:
        if not item["hasImage"] or not item["questionBoundaryDetected"]:
            continue
        inventory.append(
            {
                "imagePath": item["image"]["imagePath"],
                "assetRoot": item["image"]["assetRoot"],
                "imagePathStatus": item["image"]["imagePathStatus"],
                "relatedQuestion": {
                    "questionId": item["questionId"],
                    "text": None,
                    "textStatus": "retained_in_local_sprint56_extraction",
                    "questionBoundaryDetected": True,
                },
                "sourceDocument": item["sourceFile"],
                "sourcePage": item["sourcePage"],
                "sourceHash": item["sourceHash"],
                "candidateId": item["candidateId"],
                "status": item["status"],
                "sourceLineage": item["sourceLineage"],
            }
        )
    return inventory


def build_duplicate_inventory(queue_candidates: list[dict[str, Any]]) -> list[dict[str, Any]]:
    groups: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for item in queue_candidates:
        if item.get("duplicateGroupId"):
            groups[item["duplicateGroupId"]].append(item)
    output: list[dict[str, Any]] = []
    for group_id, items in sorted(groups.items()):
        output.append(
            {
                "duplicateGroupId": group_id,
                "recordCount": len(items),
                "categories": sorted({item["category"] for item in items}),
                "sourceFiles": sorted({item["sourceFile"] for item in items}),
                "sourcePages": sorted({item["sourcePage"] for item in items if item["sourcePage"] is not None}),
                "formalMatchIds": sorted({match_id for item in items for match_id in item["formalMatchIds"]}),
                "status": "duplicate_candidate_pending_human_dedupe",
                "sourceLineage": [item["sourceLineage"] for item in items],
            }
        )
    return output


def build_summary(
    documents: list[dict[str, Any]],
    queue_candidates: list[dict[str, Any]],
    image_inventory: list[dict[str, Any]],
    duplicate_inventory: list[dict[str, Any]],
    formal_total: int,
) -> dict[str, Any]:
    high_signal = [item for item in queue_candidates if item["questionBoundaryDetected"]]
    groups = {item["duplicateGroupId"] for item in queue_candidates if item.get("duplicateGroupId")}
    # A duplicate occurrence is counted once beyond the first record in each
    # group; question text itself is intentionally not emitted.
    duplicate_occurrences = sum(
        max(0, group_size - 1)
        for group_size in {
            item["duplicateGroupId"]: item["duplicateGroupSize"]
            for item in queue_candidates
            if item.get("duplicateGroupId")
        }.values()
    )
    unique_high_signal = len(high_signal) - duplicate_occurrences
    # Every low-signal record has no safe normalized key and therefore remains an independent review unit.
    low_signal = len(queue_candidates) - len(high_signal)
    manual_review_units = unique_high_signal + low_signal
    historical_docs = [item for item in documents if item["lineage"] == "historical_exam_candidate"]
    final_docs = [item for item in documents if item["lineage"] == "final_exam_candidate"]
    teacher_docs = [item for item in documents if item["lineage"] == "teacher_exam_note_candidate"]
    historical_records = sum(item["extractedQuestionCount"] for item in historical_docs)
    final_records = sum(item["extractedQuestionCount"] for item in final_docs)
    official_records = sum(item["extractedQuestionCount"] for item in documents if item["category"] == OFFICIAL_CATEGORY)
    official_unique = len({
        item["duplicateGroupId"] or item["questionId"]
        for item in queue_candidates
        if item["category"] == OFFICIAL_CATEGORY and item["questionBoundaryDetected"]
    })
    textbook_records = sum(item["extractedQuestionCount"] for item in documents if item["category"] == TEXTBOOK_CATEGORY)
    textbook_unique = len({
        item["duplicateGroupId"] or item["questionId"]
        for item in queue_candidates
        if item["category"] == TEXTBOOK_CATEGORY and item["questionBoundaryDetected"]
    })
    image_groups = len({
        item["duplicateGroupId"] or item["questionId"]
        for item in queue_candidates
        if item["hasImage"] and item["questionBoundaryDetected"]
    })
    formal_matches = sum(1 for item in queue_candidates if item["formalMatchIds"])
    duplicate_records = sum(1 for item in queue_candidates if item["status"] == "duplicate_candidate")
    duplicate_occurrences = sum(max(0, item["recordCount"] - 1) for item in duplicate_inventory)
    return {
        "formalPoolBaseline": formal_total,
        "officialDocumentCount": sum(item["category"] == OFFICIAL_CATEGORY for item in documents),
        "textbookDocumentCount": sum(item["category"] == TEXTBOOK_CATEGORY for item in documents),
        "historicalExamDocumentCount": len(historical_docs),
        "finalExamDocumentCount": len(final_docs),
        "teacherExamNoteDocumentCount": len(teacher_docs),
        "historicalExamQuestionRecords": historical_records,
        "finalExamQuestionRecords": final_records,
        "officialExamQuestionRecords": official_records,
        "officialExamUniqueQuestionGroups": official_unique,
        "textbookQuestionRecords": textbook_records,
        "textbookUniqueQuestionGroups": textbook_unique,
        "questionBoundaryRecordCount": len(high_signal),
        "uniqueQuestionGroupCount": unique_high_signal,
        "lowSignalReviewRecordCount": low_signal,
        "queueRecordCount": len(queue_candidates),
        "manualReviewUnitCount": manual_review_units,
        "manualReviewRecordCount": len(queue_candidates),
        "formalExistingDuplicateRecordCount": formal_matches,
        "formalAddableCount": 0,
        "candidateReadyButNotFormalCount": 0,
        "duplicateGroupCount": len(groups),
        "duplicateCandidateRecordCount": duplicate_records,
        "duplicateAdditionalOccurrences": duplicate_occurrences,
        "imageQuestionRecordCount": len(image_inventory),
        "uniqueImageQuestionGroupCount": image_groups,
        "sourceDocumentsWithImages": sum(item["containsImages"] for item in documents),
        "imageObjectCount": sum(item["imageObjectCount"] for item in documents),
        "explicitAnswerQuestionRecordCount": sum(item["answerStatus"] == "source_stated" for item in queue_candidates),
        "answerUnknownQuestionRecordCount": sum(item["answerStatus"] == "unknown" for item in queue_candidates),
    }


def build_report(
    generated_at: str,
    summary: dict[str, Any],
    documents: list[dict[str, Any]],
    queue_candidates: list[dict[str, Any]],
    image_inventory: list[dict[str, Any]],
    duplicate_inventory: list[dict[str, Any]],
    formal_files: list[str],
) -> str:
    official_docs = [item for item in documents if item["category"] == OFFICIAL_CATEGORY]
    textbook_docs = [item for item in documents if item["category"] == TEXTBOOK_CATEGORY]
    status_counts = Counter(item["status"] for item in queue_candidates)
    category_counts = Counter(item["category"] for item in queue_candidates)
    lines = [
        "# Sprint 57：Past Exam Formal Candidate Review",
        "",
        f"> 產生時間：{generated_at}；本報告只建立候選池與 review metadata，不匯入正式題庫。",
        "> 來源題文、選項、答案與解析未寫入本報告或 queue；它們仍只保留在本機、被 gitignore 的 `docs/sprint56_past_exam_extractions.json`。",
        "",
        "## 1. Scope and guardrails",
        "",
        "- 輸入：`docs/sprint56_past_exam_extractions.json`、`docs/sprint56_past_exam_inventory.md` 與現有 Formal JSON 的唯讀 snapshot。",
        "- 分析範圍：16 份 `official_exam_candidate`、52 份 `textbook_exam_candidate`；其餘 Sprint 56 分類不進本 Sprint Formal candidate queue。",
        "- 不猜答案：只有 Sprint 56 文件明示答案標籤才計入 `source_stated`；檔名含「解答」本身不算答案證據。",
        "- 不直接升格：即使有來源答案，仍需人工核對來源頁、版本、題型、風險與重複；因此本 Sprint `formalAddableCount=0`。",
        "- 圖片：只保留 metadata、source lineage 與預定 asset root；沒有複製或 OCR 圖片，`imagePath`／`extractedAsset` 維持 null。",
        "",
        "## 2. Executive summary",
        "",
        "| 指標 | 數量 | 判讀 |",
        "|---|---:|---|",
        f"| official candidate 文件 | {summary['officialDocumentCount']} | Sprint 56 official_exam_candidate |",
        f"| textbook candidate 文件 | {summary['textbookDocumentCount']} | Sprint 56 textbook_exam_candidate |",
        f"| 嚴格歷屆／考古題來源文件 | {summary['historicalExamDocumentCount']} | 檔名明示考古題／past exam；不含單純 parent folder 名稱 |",
        f"| 嚴格歷屆／考古題清楚題目紀錄 | {summary['historicalExamQuestionRecords']} | source occurrence；不含未辨識題界線的估計題數 |",
        f"| official＋final 清楚題目紀錄 | {summary['officialExamQuestionRecords']} | 去重後 {summary['officialExamUniqueQuestionGroups']} 組 |",
        f"| textbook 清楚題目紀錄 | {summary['textbookQuestionRecords']} | 去重後 {summary['textbookUniqueQuestionGroups']} 組 |",
        f"| 可直接加入 Formal | {summary['formalAddableCount']} | 人工核對閘門尚未完成，故為 0 |",
        f"| 需要人工確認 | {summary['manualReviewUnitCount']} | 去重後 review units；queue occurrence 為 {summary['manualReviewRecordCount']} |",
        f"| 圖片題 | {summary['imageQuestionRecordCount']} | high-signal question records；去重後 {summary['uniqueImageQuestionGroupCount']} 組 |",
        f"| 重複題群 | {summary['duplicateGroupCount']} | 額外重複 occurrences {summary['duplicateAdditionalOccurrences']}；不刪除來源 |",
        f"| 目前 Formal exact duplicate | {summary['formalExistingDuplicateRecordCount']} | 不重複匯入 |",
        "",
        "## 3. Official exam candidate review（16 files）",
        "",
        "| source file | lineage | year/date | pages | estimated / extracted | answer availability | images | confidence | decision |",
        "|---|---|---|---:|---:|---|---|---|---|",
    ]
    for item in official_docs:
        lines.append(
            f"| {markdown_escape(item['sourceFile'])} | {markdown_escape(item['lineage'])} | "
            f"{markdown_escape(item['examYear'])} / {markdown_escape(item['examDate'])} | {markdown_escape(item['pages'])} | "
            f"{markdown_escape(item['estimatedQuestionCount'])} / {item['extractedQuestionCount']} | "
            f"{markdown_escape(item['answerAvailability'])} ({item['answerStatedCount']} stated, {item['answerUnknownCount']} unknown) | "
            f"{'是' if item['containsImages'] else '否'} ({item['imageObjectCount']} objects; {item['imageQuestionCount']} q) | "
            f"{markdown_escape(item['reviewConfidence'])} / source {markdown_escape(item['sourceConfidence'])} | do_not_import; human review |"
        )
    lines.extend(
        [
            "",
            "### Official interpretation",
            "",
            f"- 嚴格歷屆／考古題：{summary['historicalExamDocumentCount']} 份來源文件、{summary['historicalExamQuestionRecords']} 筆清楚題目紀錄；這是檔名證據下的 candidate count，不是已由老師逐題確認的正式題數。",
            f"- 期末試卷：{summary['finalExamDocumentCount']} 份來源文件、{summary['finalExamQuestionRecords']} 筆清楚題目紀錄；其中含檔名為解答的 companion 文件，Sprint 57 不將其檔名視為答案證據。",
            f"- 考官建議：{summary['teacherExamNoteDocumentCount']} 份文件；目前沒有清楚題目邊界，保留為 source-level review，不轉成題目。",
            "- `IFA植物學_考古題參考_2024.pdf`、`IFA精油化學與品質鑑定_考古題參考_2024.pdf` 有 Sprint 55 估計題數與圖片，但本次抽取沒有取得可靠題目邊界；它們不能以估計數量直接列入可加入 Formal。",
            "",
            "## 4. Textbook exam candidate review（52 files）",
            "",
            "| source file | file type | pages | estimated / extracted | answer availability | images | extraction | confidence | decision |",
            "|---|---|---:|---:|---|---|---|---|---|",
        ]
    )
    for item in textbook_docs:
        lines.append(
            f"| {markdown_escape(item['sourceFile'])} | {markdown_escape(item['fileType'])} | {markdown_escape(item['pages'])} | "
            f"{markdown_escape(item['estimatedQuestionCount'])} / {item['extractedQuestionCount']} | "
            f"{markdown_escape(item['answerAvailability'])} ({item['answerStatedCount']} stated, {item['answerUnknownCount']} unknown) | "
            f"{'是' if item['containsImages'] else '否'} ({item['imageObjectCount']} objects; {item['imageQuestionCount']} q) | "
            f"{markdown_escape(item['extractionStatus'])} | {markdown_escape(item['reviewConfidence'])} | "
            f"{'duplicate/review' if item['extractedQuestionCount'] else 'source-level human review'} |"
        )
    lines.extend(
        [
            "",
            "### Textbook disposition",
            "",
            f"- 52 份文件中，清楚題目邊界的紀錄為 {summary['textbookQuestionRecords']} 筆，去重後 {summary['textbookUniqueQuestionGroups']} 組；主要為相同教材在不同 external 路徑的鏡像。",
            "- 可直接轉入 Formal：0。教材練習／作業即使存在來源明示答案，也仍需人工確認它是否為正式考試題、核對答案／版本／風險，不能由 pipeline 自動升格。",
            "- 需要人工確認：題目邊界、答案、教材練習與正式考試的身份，以及圖片依賴；無法讀取的 legacy `.doc` 也保留在 queue。",
            "",
            "## 5. Candidate status and duplicate analysis",
            "",
            "| status | records | meaning |",
            "|---|---:|---|",
        ]
    )
    status_descriptions = {
        "needs_human_review": "題目邊界／答案／來源層級／圖片依賴仍需人工確認",
        "duplicate_candidate": "normalized 題幹在候選來源重複；保留全部 lineage，等待人工決定代表來源",
        "formal_existing_duplicate": "已存在 Formal exact match；本 Sprint 不重複匯入",
    }
    for status in ["needs_human_review", "duplicate_candidate", "formal_existing_duplicate"]:
        lines.append(f"| `{status}` | {status_counts.get(status, 0)} | {status_descriptions[status]} |")
    lines.extend(
        [
            "",
            f"- Queue record：{len(queue_candidates)} 筆；同一題在鏡像／不同來源的 occurrence 不刪除。",
            f"- 去重後 review unit：{summary['manualReviewUnitCount']}；重複 additional occurrences：{summary['duplicateAdditionalOccurrences']}。",
            f"- 候選與 Formal exact normalized match：{summary['formalExistingDuplicateRecordCount']} 筆；沒有既有 Formal 題目被修改。",
            "- 去重只使用 Sprint 56 已抽出的 normalized 題幹作為保守 exact duplicate signal；未做語意 near-duplicate 自動合併，避免誤刪或錯判。",
            "",
            "### Duplicate group inventory",
            "",
            "| duplicate group | records | category | source files | pages | Formal IDs | decision |",
            "|---|---:|---|---|---|---|---|",
        ]
    )
    for group in duplicate_inventory:
        lines.append(
            f"| {group['duplicateGroupId']} | {group['recordCount']} | {markdown_escape(', '.join(group['categories']))} | "
            f"{markdown_escape('<br>'.join(group['sourceFiles']))} | {markdown_escape(', '.join(str(page) for page in group['sourcePages']))} | "
            f"{markdown_escape(', '.join(group['formalMatchIds']))} | pending_human_dedupe |"
        )
    if not duplicate_inventory:
        lines.append("| none | 0 |  |  |  |  |  |")
    lines.extend(
        [
            "",
            "## 6. Image question inventory",
            "",
            f"共有 {len(image_inventory)} 筆 high-signal image question records，去重後 {summary['uniqueImageQuestionGroupCount']} 組。圖片未被複製至 `public/question-assets/`，因此 `imagePath` 與 `extractedAsset` 均為 null；這是預期的 review-only 狀態。",
            "",
            "| image path | related question | source document | page | candidate status | lineage |",
            "|---|---|---|---:|---|---|",
        ]
    )
    for item in image_inventory:
        lines.append(
            f"| {markdown_escape(item['imagePath'])} | {markdown_escape(item['relatedQuestion']['questionId'])} | "
            f"{markdown_escape(item['sourceDocument'])} | {markdown_escape(item['sourcePage'])} | "
            f"{markdown_escape(item['status'])} | {markdown_escape(item['sourceLineage']['sourceHash'])} |"
        )
    lines.extend(
        [
            "",
            "## 7. Answers and formal-import decision",
            "",
            f"- Sprint 57 queue 中只有 {summary['explicitAnswerQuestionRecordCount']} 筆 question record 被 Sprint 56 標為 `source_stated`；其餘 {summary['answerUnknownQuestionRecordCount']} 筆維持 `unknown`。",
            "- `answerSource` 只保留文件標示類型；本輸出不帶答案文字，也不會以教材常識、檔名或模型推論補答案。",
            "- `formalAddableCount=0`：沒有任何 candidate 同時通過人工來源頁／版本、答案、題型、風險、圖片與重複核對，因此本 Sprint 不產生 canonical question patch。",
            "",
            "## 8. Next Sprint recommendation",
            "",
            "1. 先人工核對 strict historical sources 與 final exam sources，逐題補 source page、exam version/date、answer basis、reviewer 與 decision。",
            "2. 優先處理無圖片且答案明示的教材 candidate；確認其是否真為正式考題，否則維持 textbook practice。",
            "3. 對 image inventory 逐頁建立 approved asset mapping；完成前不得把依賴圖片的題目送入 Formal。",
            "4. 完成 duplicate group decision 後，再由獨立 Sprint 建立 canonical import patch；本 Sprint 不新增 question ID、不修改 runtime。",
            "",
            "## 9. Output files",
            "",
            "- `docs/sprint57_past_exam_review.md`",
            "- `docs/sprint57_formal_candidate_queue.json`",
            "- `scripts/sprint57-past-exam-review.py`",
            "- Input only: `docs/sprint56_past_exam_extractions.json`（local ignored artifact; not committed）",
            "",
            f"Formal files read: {', '.join(formal_files)}; Formal baseline: {summary['formalPoolBaseline']} questions.",
            "",
        ]
    )
    return "\n".join(lines)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--extractions", type=Path, default=DEFAULT_EXTRACTIONS)
    parser.add_argument("--queue", type=Path, default=QUEUE_PATH)
    parser.add_argument("--report", type=Path, default=REPORT_PATH)
    args = parser.parse_args()

    extraction_path = args.extractions if args.extractions.is_absolute() else ROOT / args.extractions
    if not extraction_path.exists():
        raise SystemExit(
            f"Sprint 57 requires local Sprint 56 extraction artifact: {extraction_path}. "
            "Run report:sprint56 first; no source text is generated by this review-only script."
        )

    extraction = load_json(extraction_path)
    all_documents = [item for item in extraction.get("documents", []) if isinstance(item, dict)]
    relevant_records = [item for item in all_documents if item.get("category") in RELEVANT_CATEGORIES]
    if len([item for item in relevant_records if item.get("category") == OFFICIAL_CATEGORY]) != 16:
        raise SystemExit("Sprint 57 guard failed: expected exactly 16 official_exam_candidate documents.")
    if len([item for item in relevant_records if item.get("category") == TEXTBOOK_CATEGORY]) != 52:
        raise SystemExit("Sprint 57 guard failed: expected exactly 52 textbook_exam_candidate documents.")

    formal_questions, formal_files = load_formal_questions()
    formal_by_norm = formal_index(formal_questions)
    document_by_source = {item["sourceFile"]: item for item in relevant_records}
    raw_candidates = [
        item
        for item in extraction.get("questionCandidates", [])
        if item.get("category") in RELEVANT_CATEGORIES and item.get("sourceFile") in document_by_source
    ]

    raw_high_signal = [item for item in raw_candidates if item.get("extractionStatus") == QUESTION_BOUNDARY_STATUS and item.get("question")]
    duplicate_groups: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for item in raw_high_signal:
        key = normalize(item.get("question"))
        if key:
            duplicate_groups[key].append(item)

    # Recompute Formal exact matches from the current read-only Formal snapshot;
    # Sprint 56 matches are retained only as lineage and are not trusted blindly.
    for item in raw_candidates:
        key = normalize(item.get("question")) if item.get("extractionStatus") == QUESTION_BOUNDARY_STATUS else ""
        item["formalMatchIds"] = formal_by_norm.get(key, []) if key else []

    documents = [
        document_metadata(
            record,
            [item for item in raw_candidates if item.get("sourceFile") == record.get("sourceFile")],
        )
        for record in relevant_records
    ]
    queue_candidates = [build_queue_candidate(item, {doc["sourceFile"]: doc for doc in documents}, duplicate_groups) for item in raw_candidates]
    queue_candidates.sort(key=lambda item: (item["category"], item["sourceFile"], item["sourcePage"] is None, item["sourcePage"] or 0, item["questionId"]))
    image_inventory = build_image_inventory(queue_candidates)
    duplicate_inventory = build_duplicate_inventory(queue_candidates)
    summary = build_summary(documents, queue_candidates, image_inventory, duplicate_inventory, len(formal_questions))
    generated_at = datetime.now(timezone.utc).replace(microsecond=0).isoformat()

    output = {
        "pipeline": "sprint57_past_exam_formal_candidate_review",
        "generatedAt": generated_at,
        "input": {
            "sprint56Extraction": "docs/sprint56_past_exam_extractions.json",
            "sprint56Inventory": "docs/sprint56_past_exam_inventory.md",
            "formalFiles": formal_files,
        },
        "rules": {
            "canonicalQuestionJsonModified": False,
            "runtimeModified": False,
            "dailyWeeklyModified": False,
            "answersGuessed": False,
            "formalAutoImport": False,
            "sourceLineagePreserved": True,
            "imageAssetsCopied": False,
            "questionTextIncluded": False,
            "formalAddableRequiresHumanVerification": True,
        },
        "summary": summary,
        "sourceDocuments": documents,
        "candidates": queue_candidates,
        "imageQuestionInventory": image_inventory,
        "duplicateGroups": duplicate_inventory,
    }

    queue_path = args.queue if args.queue.is_absolute() else ROOT / args.queue
    report_path = args.report if args.report.is_absolute() else ROOT / args.report
    queue_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.parent.mkdir(parents=True, exist_ok=True)
    queue_path.write_text(json.dumps(output, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    report_path.write_text(
        build_report(generated_at, summary, documents, queue_candidates, image_inventory, duplicate_inventory, formal_files),
        encoding="utf-8",
    )
    print(json.dumps({"summary": summary, "queue": str(queue_path), "report": str(report_path)}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
