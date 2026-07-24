# Sprint 58 Past Exam Verification Review

產出日期：2026-07-24

## 結論

本 Sprint 讀取 `docs/sprint57_formal_candidate_queue.json` 的 1131 筆 occurrence-level candidates，逐筆保留 source lineage 並分類：

| status | 數量 |
|---|---:|
| `verified` | 7 |
| `needs_review` | 539 |
| `rejected` | 585 |

`verified` 共 7 題，可進入新增的 `past-exam-verified.json`；其中可供 Daily Task、Weekly Review、Mock Exam 的題目均為 7 題。這批 verified 題目沒有必要圖片；queue 中有 138 筆具穩定題目邊界的圖片題 occurrence，另有 352 筆僅被標記為頁面含圖片，均保留在 review queue。

## Verified 題目

唯一通過自動驗證門檻的來源是 `private/考古題原始資料/2024解剖學期末試卷(四)解答.pdf` 第 3 頁。該頁第 1 頁封面明示為英國 IFA 認證課程的解剖學與生理學期末評量；第 3 頁題目與答案同頁，且沒有 embedded image object。第 8 題答案敘述不夠精確，因此沒有升格；未將答案補正或以外部知識替換。

| runtime id | Sprint 57 candidate | source file | page | printed question | image required | answer confidence |
|---:|---|---|---:|---:|---|---|
| `73001` | `s57c-39127a835a88` | `private/考古題原始資料/2024解剖學期末試卷(四)解答.pdf` | 3 | 7 | 否 | A |
| `73002` | `s57c-7209064a63d2` | `private/考古題原始資料/2024解剖學期末試卷(四)解答.pdf` | 3 | 9 | 否 | A |
| `73003` | `s57c-3613367d4e3b` | `private/考古題原始資料/2024解剖學期末試卷(四)解答.pdf` | 3 | 10 | 否 | A |
| `73004` | `s57c-8b714eac0e80` | `private/考古題原始資料/2024解剖學期末試卷(四)解答.pdf` | 3 | 11 | 否 | A |
| `73005` | `s57c-f4b01db767b4` | `private/考古題原始資料/2024解剖學期末試卷(四)解答.pdf` | 3 | 12 | 否 | A |
| `73006` | `s57c-5ee12510afa0` | `private/考古題原始資料/2024解剖學期末試卷(四)解答.pdf` | 3 | 13 | 否 | A |
| `73007` | `s57c-2fa354743ac6` | `private/考古題原始資料/2024解剖學期末試卷(四)解答.pdf` | 3 | 14 | 否 | A |

完整題目、選項、答案、答案來源、頁碼及 lineage 見 `docs/sprint58_past_exam_verified.json`。

## Needs review

### 依原因

| reason | 數量 |
|---|---:|
| `image_or_page_asset_requires_manual_confirmation` | 208 |
| `official_source_answer_missing_or_not_marked` | 94 |
| `official_source_question_boundary_uncertain` | 107 |
| `textbook_candidate_requires_confirmation_that_it_is_an_official_exam_question` | 130 |

主要人工確認項目：官方考卷沒有答案頁、未圈選的選擇題、圖示／圖片題、題目邊界不穩定、以及教材／作業題是否真的來自正式考試。這些題目沒有進入 runtime 題庫。

### 依來源分類

| category | needs_review |
|---|---:|
| `official_exam_candidate` | 409 |
| `textbook_exam_candidate` | 130 |

## Rejected

### 依原因

| reason | 數量 |
|---|---:|
| `teacher_exam_note_not_a_discrete_question` | 9 |
| `textbook_candidate_has_no_stable_question_boundary_for_formal_import` | 576 |

拒絕只代表「目前不可作為正式考試題目匯入」，不刪除原始文件，也不刪除 Sprint 57 lineage。考官建議類文件不是離散題目；沒有穩定題目邊界的教材 occurrence 也不適合直接匯入。

## Import flow and weighting

- `docs/sprint58_past_exam_verified.json` 是 review/lineage 及 verified source record。
- `scripts/sprint58-past-exam-import.mjs` 只會讀取 `verification_status=verified` 且 `formal_import_eligible=true` 的 records，產生新增檔 `src/data/questions/past-exam-verified.json`。
- 既有 canonical question JSON、Daily/Weekly UI、scheduler、Apps Script 均不被改寫；question engine 只增加這個新 formal batch 的讀取。
- source priority：`past_exam` 20、`textbook/source_verified` 至少 10、practice 維持原有 priority，實作為 `past_exam > textbook > practice`。
- 新題目使用新的 runtime id，但每題保留 Sprint 56 question id、Sprint 57 candidate id、source file、source page、source hash；既有 question id 不修改。

## Verification limitations

本次 PDF 文字由 pypdf 讀取，embedded images 以 Sprint 58 的 image inspection workflow 檢查；沒有把私有 PDF 圖片複製到 public assets。任何必須依賴圖片才能作答的候選都沒有進入 verified。
