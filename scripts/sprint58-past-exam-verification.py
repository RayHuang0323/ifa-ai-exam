"""Sprint 58: verify past-exam candidates and build the formal import queue.

This script deliberately has a narrow verification gate.  It reads the Sprint 57
queue, keeps a metadata-only decision for every candidate, and copies question
text/answers only when the answer is explicitly present in an official source.
It never edits an existing canonical question file.
"""

from __future__ import annotations

import json
import re
import unicodedata
from collections import Counter, defaultdict
from datetime import date
from pathlib import Path

from pypdf import PdfReader


ROOT = Path(__file__).resolve().parents[1]
QUEUE_PATH = ROOT / "docs" / "sprint57_formal_candidate_queue.json"
EXTRACTION_PATH = ROOT / "docs" / "sprint56_past_exam_extractions.json"
VERIFIED_PATH = ROOT / "docs" / "sprint58_past_exam_verified.json"
REVIEW_PATH = ROOT / "docs" / "sprint58_past_exam_review.md"


# These are the only candidates allowed through the Sprint 58 automatic gate.
# The question numbers are taken from the printed official answer page.  The
# Sprint 56 question ids are retained as lineage; they are not re-created.
VERIFIED_SPECS = [
    {
        "source_file": "private/考古題原始資料/2024解剖學期末試卷(四)解答.pdf",
        "source_page": 3,
        "exam_question_number": 7,
        "question_id": "s56q-787a0dc734db-p3-001",
        "runtime_id": 73001,
    },
    {
        "source_file": "private/考古題原始資料/2024解剖學期末試卷(四)解答.pdf",
        "source_page": 3,
        "exam_question_number": 9,
        "question_id": "s56q-787a0dc734db-p3-003",
        "runtime_id": 73002,
    },
    {
        "source_file": "private/考古題原始資料/2024解剖學期末試卷(四)解答.pdf",
        "source_page": 3,
        "exam_question_number": 10,
        "question_id": "s56q-787a0dc734db-p3-010",
        "runtime_id": 73003,
    },
    {
        "source_file": "private/考古題原始資料/2024解剖學期末試卷(四)解答.pdf",
        "source_page": 3,
        "exam_question_number": 11,
        "question_id": "s56q-787a0dc734db-p3-011",
        "runtime_id": 73004,
    },
    {
        "source_file": "private/考古題原始資料/2024解剖學期末試卷(四)解答.pdf",
        "source_page": 3,
        "exam_question_number": 12,
        "question_id": "s56q-787a0dc734db-p3-012",
        "runtime_id": 73005,
    },
    {
        "source_file": "private/考古題原始資料/2024解剖學期末試卷(四)解答.pdf",
        "source_page": 3,
        "exam_question_number": 13,
        "question_id": "s56q-787a0dc734db-p3-013",
        "runtime_id": 73006,
    },
    {
        "source_file": "private/考古題原始資料/2024解剖學期末試卷(四)解答.pdf",
        "source_page": 3,
        "exam_question_number": 14,
        "question_id": "s56q-787a0dc734db-p3-014",
        "runtime_id": 73007,
    },
]

VERIFIED_BY = "Sprint 58 official-source verification gate"
VERIFIED_AT = date.today().isoformat()


def read_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def clean_text(value: str | None) -> str:
    value = value or ""
    value = value.replace("\u00a0", " ").replace("\uf09f", "")
    value = re.sub(r"[ \t]+", " ", value)
    value = re.sub(r"\n[ \t]+", "\n", value)
    return value.strip()


def one_line(value: str | None) -> str:
    return re.sub(r"\s+", " ", clean_text(value)).strip()


def normalized(value: str | None) -> str:
    return re.sub(r"\s+", "", unicodedata.normalize("NFKC", value or "")).lower()


def resolve_source(source_file: str) -> Path:
    """Resolve private source files without rewriting their lineage."""
    direct = ROOT / source_file
    if direct.exists():
        return direct
    if source_file.startswith("private/"):
        # The private directory is a workspace link in the local project.
        private_path = ROOT / source_file
        if private_path.exists():
            return private_path
    raise FileNotFoundError(f"Source file is unavailable: {source_file}")


def numbered_blocks(page_text: str, expected_numbers: list[int]) -> dict[int, str]:
    """Split one answer page at printed top-level question numbers."""
    marker = re.compile(r"(?m)^\s*(\d{1,2})\.\s+")
    matches = [match for match in marker.finditer(page_text) if int(match.group(1)) in expected_numbers]
    blocks: dict[int, str] = {}
    for index, match in enumerate(matches):
        number = int(match.group(1))
        end = matches[index + 1].start() if index + 1 < len(matches) else len(page_text)
        blocks[number] = page_text[match.end():end]
    return blocks


def split_question_and_answer(block: str) -> tuple[str, str]:
    """Use the printed percentage marker as the source boundary."""
    block = clean_text(block)
    percent = re.search(r"\s+\d+%", block)
    if percent:
        question = block[:percent.start()]
        answer = block[percent.end():]
    else:
        paragraphs = re.split(r"\n\s*\n", block, maxsplit=1)
        question = paragraphs[0]
        answer = paragraphs[1] if len(paragraphs) > 1 else ""
    return one_line(question), one_line(answer)


def source_basename(source_file: str) -> str:
    return source_file.rsplit("/", 1)[-1]


def candidate_summary(candidate: dict, status: str, reason: str) -> dict:
    return {
        "candidate_id": candidate["candidateId"],
        "question_id": candidate["questionId"],
        "source_file": candidate["sourceFile"],
        "source_page": candidate.get("sourcePage"),
        "category": candidate.get("category"),
        "lineage": candidate.get("lineage"),
        "status": status,
        "verification_status": status,
        "reason": reason,
        "question_detected": candidate.get("questionDetected", False),
        "question_boundary_detected": candidate.get("questionBoundaryDetected", False),
        "answer_status": candidate.get("answerStatus", "unknown"),
        "answer_source": candidate.get("answerSource"),
        "has_image": candidate.get("hasImage", False),
        "confidence": candidate.get("sprint56ExtractionConfidence", "unknown"),
        "duplicate_group_id": candidate.get("duplicateGroupId"),
        "source_hash": candidate.get("sourceHash"),
        "source_lineage": candidate.get("sourceLineage"),
    }


def build_verified_record(spec: dict, candidate: dict, block: str, page_image_count: int) -> dict:
    question, answer = split_question_and_answer(block)
    if not question or not answer:
        raise ValueError(f"Official answer boundary is incomplete for {spec['question_id']}")
    if page_image_count:
        raise ValueError(f"Verified question page unexpectedly contains images: {spec['question_id']}")

    candidate_id = candidate["candidateId"]
    source_file = candidate["sourceFile"]
    source_page = candidate["sourcePage"]
    return {
        "candidate_id": candidate_id,
        "question_id": candidate["questionId"],
        "runtime_id": spec["runtime_id"],
        "question_number": spec["exam_question_number"],
        "question": question,
        "options": [],
        "answer": answer,
        "explanation": answer,
        "type": "shortAnswer",
        "chapter": "解剖與生理",
        "category": "解剖生理",
        "difficulty": 2,
        "source_type": "past_exam",
        "source_file": source_file,
        "source_page": source_page,
        "source_label": "2024 IFA 解剖學與生理學期末評量（官方答案文件）",
        "source_chapter": "解剖與生理",
        "source_version": "2024 official answer document",
        "source_hash": candidate.get("sourceHash"),
        "source_evidence_ids": [candidate_id, candidate["questionId"]],
        "evidence_excerpt": answer,
        "answer_basis": "官方解答文件同頁明示；未以知識推論補答。",
        "answer_source": "official_answer_document_same_page",
        "answer_confidence": "A",
        "verification_status": "verified",
        "verification_type": "past_exam",
        "verification_status_note": "題目、官方答案、頁碼同頁核對；題目不依賴圖片。",
        "verified_by": VERIFIED_BY,
        "verified_at": VERIFIED_AT,
        "ifa_scope": "anatomy_and_physiology",
        "scope_status": "in_scope",
        "scope_evidence": "來源第 1 頁標示英國 IFA 國際芳香療法師認證課程之解剖學與生理學期末評量。",
        "contains_image": False,
        "image": None,
        "formal_import_eligible": True,
        "daily_weekly_eligible": True,
        "mock_exam_eligible": True,
        "source_lineage": {
            "inventory": "docs/sprint55_exam_source_inventory.md",
            "sprint56_extraction": "docs/sprint56_past_exam_extractions.json",
            "sprint57_queue": "docs/sprint57_formal_candidate_queue.json",
            "source_file": source_file,
            "source_page": source_page,
            "source_hash": candidate.get("sourceHash"),
            "sprint56_question_id": candidate["questionId"],
            "sprint57_candidate_id": candidate_id,
        },
    }


def main() -> None:
    queue = read_json(QUEUE_PATH)
    extraction = read_json(EXTRACTION_PATH)
    candidates = queue["candidates"]
    source_documents = {item["sourceFile"]: item for item in queue["sourceDocuments"]}

    candidate_by_question_id = {candidate["questionId"]: candidate for candidate in candidates}
    spec_by_question_id = {spec["question_id"]: spec for spec in VERIFIED_SPECS}
    if len(spec_by_question_id) != len(VERIFIED_SPECS):
        raise ValueError("Duplicate verified question lineage")

    # Load the actual PDF answer page and derive the verified text from it.
    verified: list[dict] = []
    for source_file in sorted({spec["source_file"] for spec in VERIFIED_SPECS}):
        source_path = resolve_source(source_file)
        reader = PdfReader(str(source_path))
        specs = [spec for spec in VERIFIED_SPECS if spec["source_file"] == source_file]
        for page_number in sorted({spec["source_page"] for spec in specs}):
            page = reader.pages[page_number - 1]
            # Delimit against every printed question on the page.  Question 8
            # is intentionally not verified, but it must still terminate Q7's
            # answer block rather than being appended to it.
            page_numbers = list(range(7, 15)) if source_file.endswith("(四)解答.pdf") and page_number == 3 else sorted(spec["exam_question_number"] for spec in specs)
            blocks = numbered_blocks(page.extract_text() or "", page_numbers)
            page_image_count = len(page.images)
            for spec in specs:
                candidate = candidate_by_question_id.get(spec["question_id"])
                if candidate is None:
                    raise ValueError(f"Queue lineage missing: {spec['question_id']}")
                if candidate["sourceFile"] != source_file or candidate.get("sourcePage") != page_number:
                    raise ValueError(f"Queue source/page mismatch: {spec['question_id']}")
                block = blocks.get(spec["exam_question_number"])
                if block is None:
                    raise ValueError(f"Printed question number missing: {spec['exam_question_number']}")
                verified.append(build_verified_record(spec, candidate, block, page_image_count))

    verified_question_ids = {record["question_id"] for record in verified}
    if verified_question_ids != set(spec_by_question_id):
        raise ValueError("Verified records do not match the explicit verification specs")

    # Classify every Sprint 57 queue record.  Decisions are occurrence-level so
    # duplicate source occurrences retain their own lineage and review state.
    classification: list[dict] = []
    for candidate in candidates:
        source_file = candidate["sourceFile"]
        source_doc = source_documents.get(source_file, {})
        category = candidate.get("category") or source_doc.get("category") or "unknown"
        is_teacher_note = "考官" in source_file or "術科" in source_file
        if candidate["questionId"] in verified_question_ids:
            status = "verified"
            reason = "official_same_page_explicit_answer_no_required_image"
        elif is_teacher_note:
            status = "rejected"
            reason = "teacher_exam_note_not_a_discrete_question"
        elif category == "textbook_exam_candidate" and not candidate.get("questionBoundaryDetected", False):
            status = "rejected"
            reason = "textbook_candidate_has_no_stable_question_boundary_for_formal_import"
        elif category == "textbook_exam_candidate":
            status = "needs_review"
            reason = "textbook_candidate_requires_confirmation_that_it_is_an_official_exam_question"
        elif candidate.get("hasImage"):
            status = "needs_review"
            reason = "image_or_page_asset_requires_manual_confirmation"
        elif not candidate.get("questionBoundaryDetected", False):
            status = "needs_review"
            reason = "official_source_question_boundary_uncertain"
        elif candidate.get("answerStatus") != "explicit":
            status = "needs_review"
            reason = "official_source_answer_missing_or_not_marked"
        elif candidate.get("duplicateGroupId"):
            status = "needs_review"
            reason = "duplicate_candidate_requires_cross_source_confirmation"
        else:
            status = "needs_review"
            reason = "official_candidate_requires_content_and_scope_confirmation"
        classification.append(candidate_summary(candidate, status, reason))

    counts = Counter(item["status"] for item in classification)
    verified_count = counts["verified"]
    if verified_count != len(verified):
        raise ValueError(f"Classification verified count mismatch: {verified_count} != {len(verified)}")

    review_items = [item for item in classification if item["status"] == "needs_review"]
    rejected_items = [item for item in classification if item["status"] == "rejected"]
    summary = {
        "queue_candidate_count": len(candidates),
        "verified_count": verified_count,
        "needs_review_count": len(review_items),
        "rejected_count": len(rejected_items),
        "formal_import_count": len(verified),
        "daily_weekly_count": sum(item["daily_weekly_eligible"] for item in verified),
        "mock_exam_count": sum(item["mock_exam_eligible"] for item in verified),
        "verified_image_question_count": sum(item["contains_image"] for item in verified),
        "candidate_image_count": sum(item["has_image"] for item in classification),
        "candidate_image_question_boundary_count": sum(item["has_image"] and item["question_boundary_detected"] for item in classification),
        "official_exam_candidate_count": sum(item["category"] == "official_exam_candidate" for item in classification),
        "textbook_exam_candidate_count": sum(item["category"] == "textbook_exam_candidate" for item in classification),
        "generated_at": VERIFIED_AT,
    }

    output = {
        "pipeline": "sprint58_past_exam_verification_and_formal_import",
        "generated_at": VERIFIED_AT,
        "input_queue": "docs/sprint57_formal_candidate_queue.json",
        "source_extraction": "docs/sprint56_past_exam_extractions.json",
        "rules": {
            "canonical_question_json_modified": False,
            "existing_question_ids_modified": False,
            "answers_guessed": False,
            "image_dependent_questions_verified": False,
            "verified_requires_official_same_page_answer": True,
            "verified_requires_ifa_scope": True,
            "all_candidates_classified": True,
            "source_lineage_preserved": True,
        },
        "summary": summary,
        "verification_policy": [
            "verified requires explicit answer text in an official exam/answer document",
            "unmarked multiple-choice answers are not verified",
            "image-dependent questions remain needs_review unless the required asset is independently verified",
            "textbook/workbook candidates are not treated as official exams without human confirmation",
            "teacher exam notes are rejected as formal question records but remain in the lineage report",
        ],
        "verified": verified,
        "needs_review": review_items,
        "rejected": rejected_items,
    }
    VERIFIED_PATH.write_text(json.dumps(output, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    by_status_reason = defaultdict(Counter)
    by_status_category = defaultdict(Counter)
    for item in classification:
        by_status_reason[item["status"]][item["reason"]] += 1
        by_status_category[item["status"]][item["category"]] += 1

    def md_counts(counter: Counter) -> str:
        return "\n".join(f"| `{key}` | {value} |" for key, value in sorted(counter.items()))

    verified_rows = "\n".join(
        f"| `{item['runtime_id']}` | `{item['candidate_id']}` | `{item['source_file']}` | {item['source_page']} | {item['question_number']} | 否 | A |"
        for item in verified
    )
    review_rows = "\n".join(
        f"| `{reason}` | {count} |" for reason, count in sorted(by_status_reason["needs_review"].items())
    )
    rejected_rows = "\n".join(
        f"| `{reason}` | {count} |" for reason, count in sorted(by_status_reason["rejected"].items())
    )
    report = f"""# Sprint 58 Past Exam Verification Review

產出日期：{VERIFIED_AT}

## 結論

本 Sprint 讀取 `docs/sprint57_formal_candidate_queue.json` 的 {summary['queue_candidate_count']} 筆 occurrence-level candidates，逐筆保留 source lineage 並分類：

| status | 數量 |
|---|---:|
| `verified` | {summary['verified_count']} |
| `needs_review` | {summary['needs_review_count']} |
| `rejected` | {summary['rejected_count']} |

`verified` 共 {summary['formal_import_count']} 題，可進入新增的 `past-exam-verified.json`；其中可供 Daily Task、Weekly Review、Mock Exam 的題目均為 {summary['daily_weekly_count']} 題。這批 verified 題目沒有必要圖片；queue 中有 {summary['candidate_image_question_boundary_count']} 筆具穩定題目邊界的圖片題 occurrence，另有 {summary['candidate_image_count']} 筆僅被標記為頁面含圖片，均保留在 review queue。

## Verified 題目

唯一通過自動驗證門檻的來源是 `private/考古題原始資料/2024解剖學期末試卷(四)解答.pdf` 第 3 頁。該頁第 1 頁封面明示為英國 IFA 認證課程的解剖學與生理學期末評量；第 3 頁題目與答案同頁，且沒有 embedded image object。第 8 題答案敘述不夠精確，因此沒有升格；未將答案補正或以外部知識替換。

| runtime id | Sprint 57 candidate | source file | page | printed question | image required | answer confidence |
|---:|---|---|---:|---:|---|---|
{verified_rows}

完整題目、選項、答案、答案來源、頁碼及 lineage 見 `docs/sprint58_past_exam_verified.json`。

## Needs review

### 依原因

| reason | 數量 |
|---|---:|
{review_rows}

主要人工確認項目：官方考卷沒有答案頁、未圈選的選擇題、圖示／圖片題、題目邊界不穩定、以及教材／作業題是否真的來自正式考試。這些題目沒有進入 runtime 題庫。

### 依來源分類

| category | needs_review |
|---|---:|
{md_counts(by_status_category['needs_review'])}

## Rejected

### 依原因

| reason | 數量 |
|---|---:|
{rejected_rows}

拒絕只代表「目前不可作為正式考試題目匯入」，不刪除原始文件，也不刪除 Sprint 57 lineage。考官建議類文件不是離散題目；沒有穩定題目邊界的教材 occurrence 也不適合直接匯入。

## Import flow and weighting

- `docs/sprint58_past_exam_verified.json` 是 review/lineage 及 verified source record。
- `scripts/sprint58-past-exam-import.mjs` 只會讀取 `verification_status=verified` 且 `formal_import_eligible=true` 的 records，產生新增檔 `src/data/questions/past-exam-verified.json`。
- 既有 canonical question JSON、Daily/Weekly UI、scheduler、Apps Script 均不被改寫；question engine 只增加這個新 formal batch 的讀取。
- source priority：`past_exam` 20、`textbook/source_verified` 至少 10、practice 維持原有 priority，實作為 `past_exam > textbook > practice`。
- 新題目使用新的 runtime id，但每題保留 Sprint 56 question id、Sprint 57 candidate id、source file、source page、source hash；既有 question id 不修改。

## Verification limitations

本次 PDF 文字由 pypdf 讀取，embedded images 以 Sprint 58 的 image inspection workflow 檢查；沒有把私有 PDF 圖片複製到 public assets。任何必須依賴圖片才能作答的候選都沒有進入 verified。
"""
    REVIEW_PATH.write_text(report, encoding="utf-8")

    print(json.dumps(summary, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
