"""Sprint 56: read-only past-exam extraction and review-queue pipeline.

This script never edits src/data/questions, runtime code, UI, scheduler,
blueprints, Apps Script, or source files. It reads the Sprint 55 inventory and
local source files, creates review-only extraction artifacts, and preserves
source lineage for every record.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
import unicodedata
import zipfile
from collections import Counter, defaultdict
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Any, Iterable
from xml.etree import ElementTree as ET


REPO_ROOT = Path(__file__).resolve().parents[1]
INVENTORY_PATH = REPO_ROOT / "docs" / "sprint55_exam_source_inventory.md"
QUESTIONS_DIR = REPO_ROOT / "src" / "data" / "questions"
OUTPUT_INVENTORY = REPO_ROOT / "docs" / "sprint56_past_exam_inventory.md"
OUTPUT_EXTRACTIONS = REPO_ROOT / "docs" / "sprint56_past_exam_extractions.json"
OUTPUT_QUEUE = REPO_ROOT / "docs" / "sprint56_past_exam_review_queue.json"
OUTPUT_COVERAGE = REPO_ROOT / "docs" / "sprint56_past_exam_coverage.md"

FORMAL_FILES = {
    "week1.json",
    "week2.json",
    "source-verified.json",
    "source-verified-sprint36.json",
    "source-verified-sprint37.json",
}

SOURCE_EXTENSIONS = {
    ".pdf",
    ".docx",
    ".doc",
    ".ppt",
    ".pptx",
    ".xls",
    ".xlsx",
    ".rtf",
    ".pages",
    ".textclipping",
    ".jpg",
    ".jpeg",
    ".png",
}

EXAM_CATEGORIES = {
    "歷屆考古題",
    "期末考卷",
    "模擬試卷",
    "教材練習題",
}

QUESTION_START_RE = re.compile(
    r"^\s*(?:(?:第\s*)?(?P<num>\d{1,3})\s*[.)、．:：]|(?:Q|Question)\s*(?P<qnum>\d{1,3})\s*[.)、．:：]?)\s*(?P<text>.*)$",
    re.IGNORECASE,
)
OPTION_RE = re.compile(
    r"^\s*(?:[（(【\[]\s*)?(?P<label>[A-HＡ-Ｈ])\s*[）)】\].、．:：]\s*(?P<text>.+)$",
    re.IGNORECASE,
)
ANSWER_RE = re.compile(
    r"^\s*(?P<label>正確答案|正解|參考答案|参考答案|老師答案|老师答案|教師答案|教师答案|解答|答案|Answer)\s*[：:、．.]?\s*(?P<text>.*)$",
    re.IGNORECASE,
)
EXPLANATION_RE = re.compile(
    r"^\s*(?P<label>解析|解釋|解释|說明|说明|Explanation)\s*[：:、．.]?\s*(?P<text>.*)$",
    re.IGNORECASE,
)
BOUNDARY_RE = re.compile(
    r"^\s*(?:題目|题目|選項|选项|答案|正確答案|正解|解答|解析|解釋|解释|說明|说明|Answer|Explanation)\b",
    re.IGNORECASE,
)


def normalize(value: Any) -> str:
    if value is None:
        return ""
    normalized = unicodedata.normalize("NFKC", str(value)).lower()
    return "".join(char for char in normalized if char.isalnum())


def clean_text(value: str) -> str:
    value = value.replace("\u0000", " ").replace("\r", "")
    return re.sub(r"[ \t]+", " ", value).strip()


def parse_int(value: str) -> int | None:
    if not value or value == "未取得":
        return None
    match = re.search(r"\d+", value)
    return int(match.group(0)) if match else None


def parse_markdown_row(line: str) -> list[str]:
    if not line.startswith("|"):
        return []
    return [part.strip().replace("\\|", "|") for part in line[1:-1].split("|")]


def load_inventory() -> list[dict[str, Any]]:
    records: list[dict[str, Any]] = []
    for line in INVENTORY_PATH.read_text(encoding="utf-8").splitlines():
        cells = parse_markdown_row(line)
        if len(cells) != 8 or cells[0] in {"文件名稱", "---"}:
            continue
        if cells[0].startswith("---") or set(cells[0]) == {"-"}:
            continue
        source_file, relative_path, source_category, pages, images, suspected, estimate, imported = cells
        if suspected != "是" or source_category not in EXAM_CATEGORIES | {"講義"}:
            continue
        records.append(
            {
                "sourceFile": relative_path,
                "displayName": source_file,
                "fileType": Path(source_file).suffix.lower().lstrip("."),
                "pages": parse_int(pages),
                "containsImages": images == "是",
                "imageStatus": images,
                "estimatedQuestionCount": parse_int(estimate),
                "inventoryCategory": source_category,
                "suspectedExam": suspected == "是",
                "existingJsonMatch": imported,
            }
        )
    return records


def find_external_root() -> Path | None:
    for child in REPO_ROOT.parent.iterdir():
        if child.is_dir() and child.name.startswith("IFA_") and child.name != "IFA_Project_Wiki_v1.0":
            return child
    return None


def resolve_source(relative_path: str, external_root: Path | None) -> Path:
    if relative_path.startswith("private/"):
        return REPO_ROOT / relative_path.replace("/", "\\")
    if relative_path.startswith("external/") and external_root:
        return external_root / relative_path[len("external/") :].replace("/", "\\")
    return REPO_ROOT / relative_path.replace("/", "\\")


def sha256_file(path: Path) -> str | None:
    try:
        digest = hashlib.sha256()
        with path.open("rb") as handle:
            for chunk in iter(lambda: handle.read(1024 * 1024), b""):
                digest.update(chunk)
        return digest.hexdigest()
    except OSError:
        return None


def classify(record: dict[str, Any]) -> tuple[str, str, str]:
    relative_path = record["sourceFile"].replace("\\", "/")
    signal_path = re.sub(
        r"(?:^|/)private/考古題原始資料/|(?:^|/)external/00_原始備份_不可修改/|(?:^|/)external/01_已分類教材/",
        "/",
        relative_path,
        flags=re.IGNORECASE,
    )
    haystack = f"{signal_path} {record['displayName']}".lower()
    has_official_signal = bool(
        re.search(r"考古|歷屆|past[ _-]?exam|historical[ _-]?(paper|exam)|期末|期中(?:考|試卷|試題)|midterm[ _-]?(paper|exam)|final[ _-]?exam", haystack)
    )
    has_mock_signal = bool(
        re.search(r"模擬|模拟|mock|範例題型|范例题型|範例試卷|范例试卷|試卷範例|试卷范例|題型範例|题型范例|題型彙整|题型汇总", haystack)
    )
    if has_mock_signal and not re.search(r"考古|歷屆|past[ _-]?exam|historical", haystack):
        return "practice_only", "medium", "mock／simulation classification"
    if has_official_signal:
        return "official_exam_candidate", "high", "歷屆／期末／historical exam filename or path"
    if re.search(r"教師|老师|老師|考官|teacher[ _-]?exam", haystack):
        return "official_exam_candidate", "medium", "teacher／考官 exam-like filename or path; official status still needs review"
    if record["inventoryCategory"] == "模擬試卷":
        return "practice_only", "medium", "mock／simulation classification"
    if record["inventoryCategory"] == "教材練習題" or re.search(
        r"練習|练习|作業|作业|考前|複習|复习|workbook|practice|worksheet|quiz", haystack
    ):
        return "textbook_exam_candidate", "medium", "workbook／practice classification"
    return "unknown", "low", "exam-like heuristic without a reliable exam category"


def load_formal_questions() -> tuple[dict[str, list[str]], Counter[str], int]:
    by_norm: dict[str, list[str]] = defaultdict(list)
    source_types: Counter[str] = Counter()
    total = 0
    for filename in sorted(FORMAL_FILES):
        path = QUESTIONS_DIR / filename
        if not path.exists():
            continue
        try:
            payload = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            continue
        items = payload if isinstance(payload, list) else payload.get("questions", payload.get("items", []))
        for item in items if isinstance(items, list) else []:
            if not isinstance(item, dict):
                continue
            total += 1
            explicit_source_type = str(item.get("sourceType", "")).lower()
            reference = f"{item.get('reference', '')} {item.get('sourceLabel', '')} {item.get('sourceFile', '')}"
            if explicit_source_type in {"past_exam", "official_exam"} or (
                filename == "week1.json" and re.search(r"試卷|考古|past|final", reference, re.IGNORECASE)
            ):
                source_types["official_exam"] += 1
            elif explicit_source_type in {"extracted_material", "textbook", "lecture"}:
                source_types["textbook"] += 1
            else:
                source_types["unknown"] += 1
            question = normalize(item.get("question"))
            if len(question) < 8:
                continue
            question_id = str(item.get("id", ""))
            if question_id:
                by_norm[question].append(question_id)
    return dict(by_norm), source_types, total


def read_text_file(path: Path) -> tuple[list[dict[str, Any]], int | None, int, str]:
    """Return page/slide-like text records, page count, image count, method."""
    extension = path.suffix.lower()
    if extension == ".pdf":
        try:
            from pypdf import PdfReader

            reader = PdfReader(str(path), strict=False)
            pages: list[dict[str, Any]] = []
            image_count = 0
            for page_number, page in enumerate(reader.pages, start=1):
                text = page.extract_text() or ""
                page_images = 0
                try:
                    page_images = len(page.images)
                except Exception:
                    page_images = 0
                image_count += page_images
                pages.append({"page": page_number, "text": text, "imageCount": page_images})
            return pages, len(reader.pages), image_count, "pypdf"
        except Exception as error:
            return [], None, 0, f"pdf_unavailable: {error}"

    if extension == ".docx":
        return read_docx(path)
    if extension == ".pptx":
        return read_pptx(path)
    if extension == ".rtf" or extension == ".textclipping":
        try:
            raw = path.read_bytes()
            for encoding in ("utf-8", "utf-16", "cp950", "gb18030"):
                try:
                    text = raw.decode(encoding)
                    break
                except UnicodeDecodeError:
                    text = ""
            if extension == ".rtf":
                text = re.sub(r"\\'[0-9a-fA-F]{2}|\\[a-zA-Z]+\d* ?|[{}]", " ", text)
            return [{"page": None, "text": text, "imageCount": 0}], None, 0, "plain-text"
        except OSError as error:
            return [], None, 0, f"plain_text_unavailable: {error}"

    if extension in {".pages", ".xlsx"}:
        return read_generic_zip_xml(path)

    if extension in {".doc", ".ppt", ".xls"}:
        return [], None, 0, "legacy_office_unavailable_without_office_automation"
    return [], None, 0, "unsupported"


def xml_text(xml_bytes: bytes) -> str:
    try:
        root = ET.fromstring(xml_bytes)
    except ET.ParseError:
        return ""
    return " ".join(clean_text(node.text or "") for node in root.iter() if node.text and clean_text(node.text or ""))


def read_docx(path: Path) -> tuple[list[dict[str, Any]], int | None, int, str]:
    try:
        with zipfile.ZipFile(path) as archive:
            document_text = xml_text(archive.read("word/document.xml"))
            image_names = [name for name in archive.namelist() if name.lower().startswith("word/media/")]
            return [{"page": None, "text": document_text, "imageCount": len(image_names)}], None, len(image_names), "docx-xml"
    except Exception as error:
        return [], None, 0, f"docx_unavailable: {error}"


def read_pptx(path: Path) -> tuple[list[dict[str, Any]], int | None, int, str]:
    try:
        with zipfile.ZipFile(path) as archive:
            slide_names = sorted(
                (name for name in archive.namelist() if re.fullmatch(r"ppt/slides/slide\d+\.xml", name)),
                key=lambda name: int(re.search(r"(\d+)", name).group(1)),
            )
            image_count = len([name for name in archive.namelist() if name.lower().startswith("ppt/media/")])
            pages = [{"page": index, "text": xml_text(archive.read(name)), "imageCount": 0} for index, name in enumerate(slide_names, start=1)]
            return pages, len(slide_names), image_count, "pptx-xml"
    except Exception as error:
        return [], None, 0, f"pptx_unavailable: {error}"


def read_generic_zip_xml(path: Path) -> tuple[list[dict[str, Any]], int | None, int, str]:
    try:
        with zipfile.ZipFile(path) as archive:
            texts: list[str] = []
            for name in archive.namelist():
                if name.lower().endswith(".xml"):
                    try:
                        text = xml_text(archive.read(name))
                    except Exception:
                        text = ""
                    if text:
                        texts.append(text)
            image_count = len([name for name in archive.namelist() if re.search(r"(^|/)media/", name, re.IGNORECASE)])
            return [{"page": None, "text": "\n".join(texts), "imageCount": image_count}], None, image_count, "zip-xml"
    except Exception as error:
        return [], None, 0, f"zip_unavailable: {error}"


def answer_source(label: str) -> str:
    if re.search(r"老師|老师|教師|教师", label):
        return "teacher_answer"
    if re.search(r"解答|正確答案|正解|參考答案|参考答案", label, re.IGNORECASE):
        return "solution_page"
    return "document_answer_label"


def question_starts(lines: list[str]) -> list[tuple[int, str]]:
    starts: list[tuple[int, str]] = []
    for index, line in enumerate(lines):
        match = QUESTION_START_RE.match(line)
        if not match:
            continue
        text = clean_text(match.group("text"))
        if text and not OPTION_RE.match(line):
            starts.append((index, text))
    return starts


def extract_blocks(text: str) -> list[dict[str, Any]]:
    lines = [clean_text(line) for line in text.replace("\u000b", "\n").splitlines()]
    lines = [line for line in lines if line]
    starts = question_starts(lines)
    if not starts:
        return []
    blocks: list[dict[str, Any]] = []
    for start_index, (line_index, first_text) in enumerate(starts):
        end = starts[start_index + 1][0] if start_index + 1 < len(starts) else len(lines)
        block_lines = lines[line_index:end]
        question_lines = [first_text]
        options: list[str] = []
        answer: str | None = None
        answer_label: str | None = None
        explanation_lines: list[str] = []
        explanation_started = False
        answer_started = False
        for line in block_lines[1:]:
            option_match = OPTION_RE.match(line)
            answer_match = ANSWER_RE.match(line)
            explanation_match = EXPLANATION_RE.match(line)
            if option_match and not answer_started and not explanation_started:
                options.append(clean_text(option_match.group("text")))
                continue
            if answer_match:
                answer_started = True
                answer_label = answer_match.group("label")
                inline_answer = clean_text(answer_match.group("text"))
                if inline_answer:
                    answer = inline_answer
                continue
            if explanation_match:
                explanation_started = True
                inline_explanation = clean_text(explanation_match.group("text"))
                if inline_explanation:
                    explanation_lines.append(inline_explanation)
                continue
            if explanation_started:
                explanation_lines.append(line)
            elif answer_started:
                if answer is None:
                    answer = line
                else:
                    answer = f"{answer} {line}"
            elif not BOUNDARY_RE.match(line):
                question_lines.append(line)
        question = clean_text(" ".join(question_lines))
        if answer is not None:
            answer = clean_text(answer)
        question_like = bool(options) or bool(re.search(r"[?？]", question)) or bool(
            re.search(r"^(?:請|请|下列|何|哪|什麼|什么|如何|是否|簡述|简述|列舉|列举|說明|说明|選出|选出|判斷|判断)", question)
        )
        blocks.append(
            {
                "question": question,
                "options": options,
                "answer": answer,
                "answerStatus": "source_stated" if answer else "unknown",
                "answerSource": answer_source(answer_label) if answer and answer_label else None,
                "explanation": clean_text(" ".join(explanation_lines)) or None,
                "extractionConfidence": "high" if question and len(question) >= 8 and question_like else "low",
            }
        )
    return blocks


def image_metadata(source_file: str, page: int | None, image_count: int, source_hash: str | None) -> dict[str, Any]:
    return {
        "sourceFile": source_file,
        "page": page,
        "type": "embedded_image" if image_count else "unknown",
        "extractedAsset": None,
        "description": (
            f"Detected {image_count} embedded image object(s); visual text and answer content were not OCR'd."
            if image_count
            else "Image presence comes from Sprint 55 inventory; asset was not extracted."
        ),
        "sourceHash": source_hash,
        "imageIndex": 1 if image_count else None,
    }


def build_document(record: dict[str, Any], external_root: Path | None, formal_by_norm: dict[str, list[str]]) -> tuple[dict[str, Any], list[dict[str, Any]]]:
    category, confidence, reason = classify(record)
    path = resolve_source(record["sourceFile"], external_root)
    source_hash = sha256_file(path)
    pages, extracted_pages, image_count, method = read_text_file(path) if path.exists() else ([], None, 0, "missing_source")
    source_pages = pages
    if not source_pages and record["containsImages"]:
        source_pages = [{"page": None, "text": "", "imageCount": 0}]
    extraction_status = "read" if method in {"pypdf", "docx-xml", "pptx-xml", "plain-text", "zip-xml"} else method
    document = {
        "sourceFile": record["sourceFile"],
        "displayName": record["displayName"],
        "fileType": record["fileType"],
        "sourceHash": source_hash,
        "pages": extracted_pages if extracted_pages is not None else record["pages"],
        "containsImages": record["containsImages"] or image_count > 0,
        "imageCount": image_count if image_count else (1 if record["containsImages"] else 0),
        "estimatedQuestionCount": record["estimatedQuestionCount"],
        "category": category,
        "confidence": confidence,
        "categoryReason": reason,
        "inventoryCategory": record["inventoryCategory"],
        "extractionMethod": method,
        "extractionStatus": extraction_status,
        "existingJsonMatch": record["existingJsonMatch"],
        "questionCandidateCount": 0,
    }
    candidates: list[dict[str, Any]] = []
    for page_record in source_pages:
        page_number = page_record.get("page")
        text = page_record.get("text", "") or ""
        blocks = extract_blocks(text)
        if blocks:
            for index, block in enumerate(blocks, start=1):
                question_text = block["question"]
                candidate_key = normalize(question_text)
                question_id = f"s56q-{(source_hash or hashlib.sha256(record['sourceFile'].encode()).hexdigest())[:12]}-p{page_number or 'na'}-{index:03d}"
                has_page_image = bool(page_record.get("imageCount", 0)) or (extracted_pages is None and record["containsImages"])
                image = image_metadata(record["sourceFile"], page_number, page_record.get("imageCount", 0), source_hash) if has_page_image else None
                candidates.append(
                    {
                        "questionId": question_id,
                        "sourceFile": record["sourceFile"],
                        "sourceHash": source_hash,
                        "sourcePage": page_number,
                        "category": category,
                        "confidence": confidence,
                        "question": question_text,
                        "options": block["options"],
                        "answer": block["answer"],
                        "answer_status": block["answerStatus"],
                        "answer_source": block["answerSource"],
                        "explanation": block["explanation"],
                        "hasImage": bool(image),
                        "image": image,
                        "formalMatchIds": formal_by_norm.get(candidate_key, []),
                        "extractionStatus": "question_boundary_detected" if block["extractionConfidence"] == "high" else "manual_review_required_low_question_signal",
                        "extractionConfidence": block["extractionConfidence"],
                        "sourceLineage": {
                            "inventory": "docs/sprint55_exam_source_inventory.md",
                            "extractionMethod": method,
                            "sourceFile": record["sourceFile"],
                            "sourcePage": page_number,
                            "sourceHash": source_hash,
                        },
                    }
                )
        elif text.strip() or page_record.get("imageCount", 0) or record["containsImages"]:
            question_id = f"s56q-{(source_hash or hashlib.sha256(record['sourceFile'].encode()).hexdigest())[:12]}-p{page_number or 'na'}-review"
            has_page_image = bool(page_record.get("imageCount", 0)) or (extracted_pages is None and record["containsImages"])
            image = image_metadata(record["sourceFile"], page_number, page_record.get("imageCount", 0), source_hash) if has_page_image else None
            candidates.append(
                {
                    "questionId": question_id,
                    "sourceFile": record["sourceFile"],
                    "sourceHash": source_hash,
                    "sourcePage": page_number,
                    "category": category,
                    "confidence": confidence,
                    "question": None,
                    "options": [],
                    "answer": None,
                    "answer_status": "unknown",
                    "answer_source": None,
                    "explanation": None,
                    "hasImage": bool(image),
                    "image": image,
                    "formalMatchIds": [],
                    "extractionStatus": "manual_review_required_no_question_boundary",
                    "extractionConfidence": "low",
                    "sourceLineage": {
                        "inventory": "docs/sprint55_exam_source_inventory.md",
                        "extractionMethod": method,
                        "sourceFile": record["sourceFile"],
                        "sourcePage": page_number,
                        "sourceHash": source_hash,
                    },
                }
            )
    if not candidates:
        question_id = f"s56q-{(source_hash or hashlib.sha256(record['sourceFile'].encode()).hexdigest())[:12]}-source-review"
        candidates.append(
            {
                "questionId": question_id,
                "sourceFile": record["sourceFile"],
                "sourceHash": source_hash,
                "sourcePage": None,
                "category": category,
                "confidence": confidence,
                "question": None,
                "options": [],
                "answer": None,
                "answer_status": "unknown",
                "answer_source": None,
                "explanation": None,
                "hasImage": record["containsImages"],
                "image": image_metadata(record["sourceFile"], None, 1, source_hash) if record["containsImages"] else None,
                "formalMatchIds": [],
                "extractionStatus": "manual_review_required_unreadable_or_unsupported",
                "extractionConfidence": "low",
                "sourceLineage": {
                    "inventory": "docs/sprint55_exam_source_inventory.md",
                    "extractionMethod": method,
                    "sourceFile": record["sourceFile"],
                    "sourcePage": None,
                    "sourceHash": source_hash,
                },
            }
        )
    document["questionCandidateCount"] = sum(
        1 for item in candidates if item.get("question") and item.get("extractionConfidence") == "high"
    )
    document["reviewRecordCount"] = len(candidates)
    return document, candidates


def markdown_inventory(documents: list[dict[str, Any]]) -> str:
    category_order = {"official_exam_candidate": 0, "textbook_exam_candidate": 1, "practice_only": 2, "unknown": 3}
    ordered = sorted(documents, key=lambda item: (category_order[item["category"]], item["sourceFile"]))
    counts = Counter(item["category"] for item in documents)
    lines = [
        "# Sprint 56：Past Exam Inventory",
        "",
        f"> 產生日期：{date.today().isoformat()}；來源基準：`docs/sprint55_exam_source_inventory.md`。",
        "> 本文件只列 review candidate，不代表歷屆試題已驗證，也不會直接進入正式題庫。",
        "",
        "## 分類摘要",
        "",
        "| 分類 | 文件數 | 分類邏輯 |",
        "|---|---:|---|",
        f"| official_exam_candidate | {counts['official_exam_candidate']} | 歷屆／期末／historical／teacher exam-like；仍需人工確認正式性 |",
        f"| textbook_exam_candidate | {counts['textbook_exam_candidate']} | workbook／練習／作業／考前複習型文件 |",
        f"| practice_only | {counts['practice_only']} | mock／模擬／範例題型；不得當成歷屆題 |",
        f"| unknown | {counts['unknown']} | exam-like heuristic，但無法可靠判斷來源層級 |",
        f"| **合計** | **{len(documents)}** | Sprint 55 suspected exam-related 文件 |",
        "",
        "## 文件 inventory",
        "",
        "| source file | file type | pages | contains images | estimated question count | category | confidence | extraction status |",
        "|---|---|---:|---|---:|---|---|---|",
    ]
    for item in ordered:
        def display(value: Any) -> str:
            return "未取得" if value is None else str(value).replace("|", "\\|")

        lines.append(
            f"| {display(item['sourceFile'])} | {display(item['fileType'])} | {display(item['pages'])} | "
            f"{('是' if item['containsImages'] else '否')} | {display(item['estimatedQuestionCount'])} | "
            f"{item['category']} | {item['confidence']} | {display(item['extractionStatus'])} |"
        )
    return "\n".join(lines) + "\n"


def markdown_coverage(documents: list[dict[str, Any]], candidates: list[dict[str, Any]], formal_by_norm: dict[str, list[str]], formal_types: Counter[str], formal_total: int) -> str:
    question_candidates = [
        item for item in candidates if item.get("question") and item.get("extractionConfidence") == "high"
    ]
    low_signal_fragments = sum(
        1 for item in candidates if item.get("question") and item.get("extractionConfidence") == "low"
    )
    grouped: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for item in question_candidates:
        grouped[normalize(item["question"])].append(item)
    formal_matched = {key: group for key, group in grouped.items() if any(item["formalMatchIds"] for item in group)}
    new_candidates = {key: group for key, group in grouped.items() if key not in formal_matched}
    duplicate_occurrences = sum(max(0, len(group) - 1) for group in grouped.values())
    image_documents = [item for item in documents if item["containsImages"]]
    image_questions = [item for item in question_candidates if item["hasImage"]]
    answer_counts = Counter(item["answer_status"] for item in question_candidates)
    category_counts = Counter(item["category"] for item in documents)
    queue_count = len(candidates)
    lines = [
        "# Sprint 56：Past Exam Coverage",
        "",
        f"> 產生日期：{date.today().isoformat()}；所有 candidate 仍為 `pending_review`。",
        "> Formal coverage 使用現有 `week1.json`、`week2.json`、`source-verified*.json`；候選 exact match 只表示文字相同，不表示來源與答案已驗證。",
        "",
        "## 1. Formal baseline",
        "",
        "| Formal 指標 | 題數 |",
        "|---|---:|",
        f"| Formal pool | {formal_total} |",
        f"| official_exam | {formal_types.get('official_exam', 0)} |",
        f"| textbook | {formal_types.get('textbook', 0)} |",
        f"| unknown／其他 | {formal_total - formal_types.get('official_exam', 0) - formal_types.get('textbook', 0)} |",
        "",
        "## 2. Candidate coverage",
        "",
        "| 指標 | 數量 | 說明 |",
        "|---|---:|---|",
        f"| exam-like source documents | {len(documents)} | Sprint 55 suspected exam-related |",
        f"| official_exam_candidate documents | {category_counts['official_exam_candidate']} | 歷屆／期末／teacher exam-like 候選 |",
        f"| textbook_exam_candidate documents | {category_counts['textbook_exam_candidate']} | workbook／練習／作業候選 |",
        f"| practice_only documents | {category_counts['practice_only']} | mock／模擬題，只作練習候選 |",
        f"| unknown documents | {category_counts['unknown']} | 需要人工判斷來源層級 |",
        f"| extracted question-like records | {len(question_candidates)} | 有題號／Q boundary 且具題目訊號的片段 |",
        f"| low-signal numbered fragments | {low_signal_fragments} | 保留在 queue，但不計入 question coverage |",
        f"| unique extracted questions | {len(grouped)} | 以 normalized 題幹去重 |",
        f"| exact match with Formal | {len(formal_matched)} | 不新增、不覆蓋 Formal |",
        f"| not currently in Formal | {len(new_candidates)} | 只能進 review queue，不能直接匯入 |",
        f"| cross-source duplicate occurrences | {duplicate_occurrences} | 同一 normalized 題幹的額外來源出現次數 |",
        f"| review queue entries | {queue_count} | 全部 `pending_review`，含無法抽取／圖片-only 文件 |",
        f"| source documents with images | {len(image_documents)} | 來源檔含圖片或 Sprint 55 標記含圖片 |",
        f"| extracted question records with images | {len(image_questions)} | 圖片尚未 OCR，也未複製到 asset directory |",
        f"| answer explicitly stated | {answer_counts.get('source_stated', 0)} | 僅保留文件明示答案與 answer_source |",
        f"| answer unknown | {answer_counts.get('unknown', 0)} | 不猜答案，待人工確認 |",
        "",
        "## 3. 問題回答",
        "",
        f"1. **尚未進入 Formal：{len(new_candidates)} 個 unique extracted question candidate。** 這是 exact normalized text 對照結果，不是完整原始文件題數；DOC/DOCX、圖片題與無法辨識題號的檔案仍需人工 review。",
        f"2. **重複：{len(formal_matched)} 個 candidate group 與 Formal exact match；另有 {duplicate_occurrences} 次跨來源重複出現。** pipeline 只記錄 duplicate lineage，不刪除或合併來源。",
        f"3. **需要人工確認：{queue_count} 筆 review queue entry。** 所有 entry 維持 `pending_review`，含答案未知、source page 待補、圖片、mock 與 extraction boundary 不確定項。",
        f"4. **圖片：{len(image_documents)} 個來源文件、{len(image_questions)} 筆可辨識題目帶圖片。** 詳細來源與頁面見 review queue；目前 `extractedAsset=null`，沒有把圖片塞入題庫 JSON。",
        "",
        "## 4. Formal exact-match candidates",
        "",
        "| candidate question | source file | page | Formal IDs | category | answer status | has image |",
        "|---|---|---:|---|---|---|---|",
    ]
    for key, group in sorted(formal_matched.items()):
        first = group[0]
        ids = sorted({match_id for item in group for match_id in item["formalMatchIds"]})
        lines.append(
            f"| {first['question'].replace('|', '\\|')} | {first['sourceFile'].replace('|', '\\|')} | "
            f"{first['sourcePage'] if first['sourcePage'] is not None else '未取得'} | {', '.join(ids)} | "
            f"{first['category']} | {first['answer_status']} | {'是' if any(item['hasImage'] for item in group) else '否'} |"
        )
    if not formal_matched:
        lines.append("| （目前沒有 exact normalized match） |  |  |  |  |  |  |")
    lines.extend(
        [
            "",
            "## 5. Image-bearing candidate sources",
            "",
            "| source file | category | queue entries with image metadata | pages observed | asset status |",
            "|---|---|---:|---|---|",
        ]
    )
    image_groups: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for candidate in candidates:
        if candidate["hasImage"]:
            image_groups[candidate["sourceFile"]].append(candidate)
    for source_file, group in sorted(image_groups.items()):
        first = group[0]
        pages = sorted({item["sourcePage"] for item in group if item["sourcePage"] is not None})
        lines.append(
            f"| {source_file.replace('|', '\\|')} | {first['category']} | {len(group)} | "
            f"{', '.join(str(page) for page in pages) if pages else '未取得'} | "
            "metadata only; extractedAsset=null |"
        )
    return "\n".join(lines) + "\n"


def main() -> int:
    global INVENTORY_PATH
    parser = argparse.ArgumentParser()
    parser.add_argument("--inventory", default=str(INVENTORY_PATH))
    args = parser.parse_args()
    INVENTORY_PATH = Path(args.inventory).resolve()

    inventory = load_inventory()
    if not inventory:
        raise RuntimeError(f"No suspected exam-like records found in {INVENTORY_PATH}")
    external_root = find_external_root()
    formal_by_norm, formal_types, formal_total = load_formal_questions()
    documents: list[dict[str, Any]] = []
    candidates: list[dict[str, Any]] = []
    for record in inventory:
        document, document_candidates = build_document(record, external_root, formal_by_norm)
        documents.append(document)
        candidates.extend(document_candidates)

    generated_at = datetime.now(timezone.utc).isoformat()
    extraction_payload = {
        "pipeline": "sprint56-past-exam-extraction",
        "generatedAt": generated_at,
        "sourceInventory": "docs/sprint55_exam_source_inventory.md",
        "runtimeQuestionFilesRead": sorted(FORMAL_FILES),
        "rules": {
            "readOnly": True,
            "noFormalImport": True,
            "answerPolicy": "Only explicit answer labels are retained; missing answers remain unknown.",
            "imagePolicy": "Image metadata only; no binary asset is copied and no OCR is performed.",
            "candidateQuestionIdPolicy": "s56q-* is a review-only extraction reference, not a runtime question ID.",
        },
        "documents": documents,
        "questionCandidates": candidates,
    }
    OUTPUT_EXTRACTIONS.write_text(json.dumps(extraction_payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    queue: list[dict[str, Any]] = []
    for candidate in candidates:
        queue.append(
            {
                "sourceFile": candidate["sourceFile"],
                "sourceHash": candidate["sourceHash"],
                "questionId": candidate["questionId"],
                "category": candidate["category"],
                "confidence": candidate["confidence"],
                "hasImage": candidate["hasImage"],
                "sourcePage": candidate["sourcePage"],
                "image": candidate["image"],
                "formalMatchIds": candidate["formalMatchIds"],
                "extractionStatus": candidate["extractionStatus"],
                "status": "pending_review",
                "sourceLineage": candidate["sourceLineage"],
            }
        )
    OUTPUT_QUEUE.write_text(json.dumps(queue, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    OUTPUT_INVENTORY.write_text(markdown_inventory(documents), encoding="utf-8")
    OUTPUT_COVERAGE.write_text(markdown_coverage(documents, candidates, formal_by_norm, formal_types, formal_total), encoding="utf-8")

    print(
        "SUMMARY|"
        f"documents={len(documents)}|"
        f"official={sum(1 for item in documents if item['category'] == 'official_exam_candidate')}|"
        f"textbook={sum(1 for item in documents if item['category'] == 'textbook_exam_candidate')}|"
        f"practice={sum(1 for item in documents if item['category'] == 'practice_only')}|"
        f"unknown={sum(1 for item in documents if item['category'] == 'unknown')}|"
        f"questionCandidates={sum(1 for item in candidates if item.get('question') and item.get('extractionConfidence') == 'high')}|"
        f"queue={len(queue)}|"
        f"imageQueue={sum(1 for item in queue if item['hasImage'])}|"
        f"formalMatches={sum(1 for item in candidates if item.get('question') and item['formalMatchIds'])}|"
        f"outputs={OUTPUT_INVENTORY},{OUTPUT_EXTRACTIONS},{OUTPUT_QUEUE},{OUTPUT_COVERAGE}"
    )
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as error:
        print(f"ERROR|{error}", file=sys.stderr)
        raise
