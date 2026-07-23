# Sprint 57：Past Exam Formal Candidate Review

> 產生時間：2026-07-23T07:00:17+00:00；本報告只建立候選池與 review metadata，不匯入正式題庫。
> 來源題文、選項、答案與解析未寫入本報告或 queue；它們仍只保留在本機、被 gitignore 的 `docs/sprint56_past_exam_extractions.json`。

## 1. Scope and guardrails

- 輸入：`docs/sprint56_past_exam_extractions.json`、`docs/sprint56_past_exam_inventory.md` 與現有 Formal JSON 的唯讀 snapshot。
- 分析範圍：16 份 `official_exam_candidate`、52 份 `textbook_exam_candidate`；其餘 Sprint 56 分類不進本 Sprint Formal candidate queue。
- 不猜答案：只有 Sprint 56 文件明示答案標籤才計入 `source_stated`；檔名含「解答」本身不算答案證據。
- 不直接升格：即使有來源答案，仍需人工核對來源頁、版本、題型、風險與重複；因此本 Sprint `formalAddableCount=0`。
- 圖片：只保留 metadata、source lineage 與預定 asset root；沒有複製或 OCR 圖片，`imagePath`／`extractedAsset` 維持 null。

## 2. Executive summary

| 指標 | 數量 | 判讀 |
|---|---:|---|
| official candidate 文件 | 16 | Sprint 56 official_exam_candidate |
| textbook candidate 文件 | 52 | Sprint 56 textbook_exam_candidate |
| 嚴格歷屆／考古題來源文件 | 5 | 檔名明示考古題／past exam；不含單純 parent folder 名稱 |
| 嚴格歷屆／考古題清楚題目紀錄 | 93 | source occurrence；不含未辨識題界線的估計題數 |
| official＋final 清楚題目紀錄 | 225 | 去重後 213 組 |
| textbook 清楚題目紀錄 | 130 | 去重後 65 組 |
| 可直接加入 Formal | 0 | 人工核對閘門尚未完成，故為 0 |
| 需要人工確認 | 1054 | 去重後 review units；queue occurrence 為 1131 |
| 圖片題 | 138 | high-signal question records；去重後 119 組 |
| 重複題群 | 77 | 額外重複 occurrences 77；不刪除來源 |
| 目前 Formal exact duplicate | 0 | 不重複匯入 |

## 3. Official exam candidate review（16 files）

| source file | lineage | year/date | pages | estimated / extracted | answer availability | images | confidence | decision |
|---|---|---|---:|---:|---|---|---|---|
| private/考古題原始資料/2024芳香按摩學期末試卷(一).pdf | final_exam_candidate | 2024 / 未取得 | 10 | 29 / 20 | unknown (0 stated, 20 unknown) | 是 (39 objects; 20 q) | high / source high | do_not_import; human review |
| private/考古題原始資料/2024芳香按摩學期末試卷(二).pdf | final_exam_candidate | 2024 / 未取得 | 9 | 28 / 21 | unknown (0 stated, 21 unknown) | 是 (11 objects; 21 q) | high / source high | do_not_import; human review |
| private/考古題原始資料/2024芳香按摩學期末試卷(三).pdf | final_exam_candidate | 2024 / 未取得 | 8 | 25 / 18 | unknown (0 stated, 18 unknown) | 是 (9 objects; 18 q) | high / source high | do_not_import; human review |
| private/考古題原始資料/2024解剖學期末試卷(一).pdf | final_exam_candidate | 2024 / 未取得 | 6 | 14 / 11 | unknown (0 stated, 11 unknown) | 是 (9 objects; 11 q) | high / source high | do_not_import; human review |
| private/考古題原始資料/2024解剖學期末試卷(一)解答.pdf | final_exam_candidate | 2024 / 未取得 | 6 | 28 / 12 | unknown (0 stated, 12 unknown) | 是 (9 objects; 12 q) | high / source high | do_not_import; human review |
| private/考古題原始資料/2024解剖學期末試卷(二).pdf | final_exam_candidate | 2024 / 未取得 | 7 | 23 / 15 | unknown (0 stated, 15 unknown) | 是 (10 objects; 15 q) | high / source high | do_not_import; human review |
| private/考古題原始資料/2024解剖學期末試卷(三).pdf | final_exam_candidate | 2024 / 未取得 | 6 | 15 / 11 | unknown (0 stated, 11 unknown) | 是 (9 objects; 11 q) | high / source high | do_not_import; human review |
| private/考古題原始資料/2024解剖學期末試卷(四)解答.pdf | final_exam_candidate | 2024 / 未取得 | 5 | 40 / 24 | unknown (0 stated, 24 unknown) | 是 (22 objects; 16 q) | high / source high | do_not_import; human review |
| external/01_已分類教材/考古題/IFA 北京考題.docx | historical_exam_candidate | 未取得 / 未取得 | 未取得 | 未取得 / 0 | unknown (0 stated, 0 unknown) | 是 (2 objects; 0 q) | high / source high | do_not_import; human review |
| private/考古題原始資料/2024術科實踐考核考官建議.pdf | teacher_exam_note_candidate | 2024 / 未取得 | 3 | 未取得 / 0 | unknown (0 stated, 0 unknown) | 否 (0 objects; 0 q) | medium / source medium | do_not_import; human review |
| private/考古題原始資料/2024術科實踐考核考官建議2.0.pdf | teacher_exam_note_candidate | 2024 / 未取得 | 3 | 1 / 0 | unknown (0 stated, 0 unknown) | 否 (0 objects; 0 q) | medium / source medium | do_not_import; human review |
| private/考古題原始資料/2024術科實踐考核考官建議3.0.pdf | teacher_exam_note_candidate | 2024 / 未取得 | 3 | 未取得 / 0 | unknown (0 stated, 0 unknown) | 否 (0 objects; 0 q) | medium / source medium | do_not_import; human review |
| private/考古題原始資料/IFA 芳療考古題.(請勿外流).pdf | historical_exam_candidate | 未取得 / 未取得 | 20 | 149 / 82 | unknown (0 stated, 82 unknown) | 否 (0 objects; 0 q) | high / source high | do_not_import; human review |
| private/考古題原始資料/IFA生理解剖考古題(請勿外流).pdf | historical_exam_candidate | 未取得 / 未取得 | 11 | 59 / 11 | unknown (0 stated, 11 unknown) | 否 (0 objects; 0 q) | high / source high | do_not_import; human review |
| private/考古題原始資料/IFA植物學_考古題參考_2024.pdf | historical_exam_candidate | 2024 / 未取得 | 4 | 18 / 0 | unknown (0 stated, 0 unknown) | 是 (17 objects; 0 q) | high / source high | do_not_import; human review |
| private/考古題原始資料/IFA精油化學與品質鑑定_考古題參考_2024.pdf | historical_exam_candidate | 2024 / 未取得 | 5 | 23 / 0 | unknown (0 stated, 0 unknown) | 是 (28 objects; 0 q) | high / source high | do_not_import; human review |

### Official interpretation

- 嚴格歷屆／考古題：5 份來源文件、93 筆清楚題目紀錄；這是檔名證據下的 candidate count，不是已由老師逐題確認的正式題數。
- 期末試卷：8 份來源文件、132 筆清楚題目紀錄；其中含檔名為解答的 companion 文件，Sprint 57 不將其檔名視為答案證據。
- 考官建議：3 份文件；目前沒有清楚題目邊界，保留為 source-level review，不轉成題目。
- `IFA植物學_考古題參考_2024.pdf`、`IFA精油化學與品質鑑定_考古題參考_2024.pdf` 有 Sprint 55 估計題數與圖片，但本次抽取沒有取得可靠題目邊界；它們不能以估計數量直接列入可加入 Formal。

## 4. Textbook exam candidate review（52 files）

| source file | file type | pages | estimated / extracted | answer availability | images | extraction | confidence | decision |
|---|---|---:|---:|---|---|---|---|---|
| external/00_原始備份_不可修改/新建文件夹 (2)/ifa考前物资/IFA国际芳疗师课程 精油的调配.pdf | pdf | 12 | 5 / 0 | unknown (0 stated, 0 unknown) | 否 (0 objects; 0 q) | read | medium | source-level human review |
| external/00_原始備份_不可修改/新建文件夹 (2)/ifa考前物资/芳香疗法个案咨询表.doc | doc | 未取得 | 未取得 / 0 | unknown (0 stated, 0 unknown) | 否 (0 objects; 0 q) | legacy_office_unavailable_without_office_automation | medium | source-level human review |
| external/00_原始備份_不可修改/新建文件夹 (2)/ifa考前物资/连续个案治疗咨询表.doc | doc | 未取得 | 未取得 / 0 | unknown (0 stated, 0 unknown) | 否 (0 objects; 0 q) | legacy_office_unavailable_without_office_automation | medium | source-level human review |
| external/00_原始備份_不可修改/新建文件夹 (2)/ifa考前物资/爱芙悦个案研究与论文写作导读.pdf | pdf | 6 | 39 / 6 | unknown (0 stated, 6 unknown) | 是 (2 objects; 1 q) | read | medium | duplicate/review |
| external/00_原始備份_不可修改/新建文件夹 (2)/IFA笔记总结/副本病理学复习 .docx | docx | 未取得 | 未取得 / 0 | unknown (0 stated, 0 unknown) | 是 (27 objects; 0 q) | read | medium | source-level human review |
| external/00_原始備份_不可修改/新建文件夹 (2)/IFA笔记总结/解剖学与生理学复习七（答案） .docx | docx | 未取得 | 未取得 / 0 | unknown (0 stated, 0 unknown) | 否 (0 objects; 0 q) | read | medium | source-level human review |
| external/00_原始備份_不可修改/新建文件夹 (2)/IFA笔记总结/解剖学与生理学复习九（答案） .docx | docx | 未取得 | 未取得 / 0 | unknown (0 stated, 0 unknown) | 否 (0 objects; 0 q) | read | medium | source-level human review |
| external/00_原始備份_不可修改/新建文件夹 (2)/IFA笔记总结/解剖学与生理学复习八（答案） .docx | docx | 未取得 | 未取得 / 0 | unknown (0 stated, 0 unknown) | 否 (0 objects; 0 q) | read | medium | source-level human review |
| external/00_原始備份_不可修改/新建文件夹 (2)/IFA笔记总结/解剖学与生理学复习十（答案）.docx | docx | 未取得 | 未取得 / 0 | unknown (0 stated, 0 unknown) | 否 (0 objects; 0 q) | read | medium | source-level human review |
| external/00_原始備份_不可修改/新建文件夹 (2)/IFA笔记总结/解剖学与生理学复习十一（答案） .docx | docx | 未取得 | 未取得 / 0 | unknown (0 stated, 0 unknown) | 否 (0 objects; 0 q) | read | medium | source-level human review |
| external/00_原始備份_不可修改/新建文件夹 (2)/IFA笔记总结/解剖学与生理学复习三答案 .docx | docx | 未取得 | 未取得 / 0 | unknown (0 stated, 0 unknown) | 否 (0 objects; 0 q) | read | medium | source-level human review |
| external/00_原始備份_不可修改/新建文件夹 (2)/IFA笔记总结/解剖学与生理学复习五（答案） .docx | docx | 未取得 | 未取得 / 0 | unknown (0 stated, 0 unknown) | 是 (2 objects; 0 q) | read | medium | source-level human review |
| external/00_原始備份_不可修改/新建文件夹 (2)/IFA笔记总结/解剖学与生理学复习六（答案） .docx | docx | 未取得 | 未取得 / 0 | unknown (0 stated, 0 unknown) | 否 (0 objects; 0 q) | read | medium | source-level human review |
| external/00_原始備份_不可修改/新建文件夹 (2)/IFA笔记总结/解剖学与生理学复习四（答案） .docx | docx | 未取得 | 未取得 / 0 | unknown (0 stated, 0 unknown) | 否 (0 objects; 0 q) | read | medium | source-level human review |
| external/00_原始備份_不可修改/新建文件夹 (2)/IFA笔记总结/解剖学和生理学复习一（答案） .docx | docx | 未取得 | 未取得 / 0 | unknown (0 stated, 0 unknown) | 否 (0 objects; 0 q) | read | medium | source-level human review |
| external/00_原始備份_不可修改/新建文件夹 (2)/IFA笔记总结/解剖学和生理学复习二答案.docx | docx | 未取得 | 未取得 / 0 | unknown (0 stated, 0 unknown) | 否 (0 objects; 0 q) | read | medium | source-level human review |
| external/00_原始備份_不可修改/新建文件夹 (2)/考前集训题/IFA复习作业第7周.docx | docx | 未取得 | 未取得 / 0 | unknown (0 stated, 0 unknown) | 是 (2 objects; 0 q) | read | medium | source-level human review |
| external/00_原始備份_不可修改/新建文件夹 (2)/考前集训题/考试生理辅导必修题.pdf | pdf | 31 | 113 / 14 | unknown (0 stated, 14 unknown) | 是 (21 objects; 5 q) | read | medium | duplicate/review |
| external/00_原始備份_不可修改/新建文件夹 (2)/考前集训题/芳疗按摩商业实践辅导必修题.pdf | pdf | 25 | 153 / 39 | unknown (0 stated, 39 unknown) | 是 (1 objects; 0 q) | read | medium | duplicate/review |
| external/00_原始備份_不可修改/新建文件夹 (2)/其他/第四周作业补充资料.pdf | pdf | 4 | 12 / 6 | source_stated (6 stated, 0 unknown) | 是 (3 objects; 1 q) | read | medium | duplicate/review |
| external/01_已分類教材/病理與禁忌/副本病理学复习 .docx | docx | 未取得 | 未取得 / 0 | unknown (0 stated, 0 unknown) | 是 (27 objects; 0 q) | read | medium | source-level human review |
| external/01_已分類教材/解剖生理/解剖学与生理学复习七（答案） .docx | docx | 未取得 | 未取得 / 0 | unknown (0 stated, 0 unknown) | 否 (0 objects; 0 q) | read | medium | source-level human review |
| external/01_已分類教材/解剖生理/解剖学与生理学复习九（答案） .docx | docx | 未取得 | 未取得 / 0 | unknown (0 stated, 0 unknown) | 否 (0 objects; 0 q) | read | medium | source-level human review |
| external/01_已分類教材/解剖生理/解剖学与生理学复习八（答案） .docx | docx | 未取得 | 未取得 / 0 | unknown (0 stated, 0 unknown) | 否 (0 objects; 0 q) | read | medium | source-level human review |
| external/01_已分類教材/解剖生理/解剖学与生理学复习十（答案）.docx | docx | 未取得 | 未取得 / 0 | unknown (0 stated, 0 unknown) | 否 (0 objects; 0 q) | read | medium | source-level human review |
| external/01_已分類教材/解剖生理/解剖学与生理学复习十一（答案） .docx | docx | 未取得 | 未取得 / 0 | unknown (0 stated, 0 unknown) | 否 (0 objects; 0 q) | read | medium | source-level human review |
| external/01_已分類教材/解剖生理/解剖学与生理学复习三答案 .docx | docx | 未取得 | 未取得 / 0 | unknown (0 stated, 0 unknown) | 否 (0 objects; 0 q) | read | medium | source-level human review |
| external/01_已分類教材/解剖生理/解剖学与生理学复习五（答案） .docx | docx | 未取得 | 未取得 / 0 | unknown (0 stated, 0 unknown) | 是 (2 objects; 0 q) | read | medium | source-level human review |
| external/01_已分類教材/解剖生理/解剖学与生理学复习六（答案） .docx | docx | 未取得 | 未取得 / 0 | unknown (0 stated, 0 unknown) | 否 (0 objects; 0 q) | read | medium | source-level human review |
| external/01_已分類教材/解剖生理/解剖学与生理学复习四（答案） .docx | docx | 未取得 | 未取得 / 0 | unknown (0 stated, 0 unknown) | 否 (0 objects; 0 q) | read | medium | source-level human review |
| external/01_已分類教材/解剖生理/解剖学和生理学复习一（答案） .docx | docx | 未取得 | 未取得 / 0 | unknown (0 stated, 0 unknown) | 否 (0 objects; 0 q) | read | medium | source-level human review |
| external/01_已分類教材/解剖生理/解剖学和生理学复习二答案.docx | docx | 未取得 | 未取得 / 0 | unknown (0 stated, 0 unknown) | 否 (0 objects; 0 q) | read | medium | source-level human review |
| external/新建文件夹 (2)/ifa考前物资/IFA国际芳疗师课程 精油的调配.pdf | pdf | 12 | 5 / 0 | unknown (0 stated, 0 unknown) | 否 (0 objects; 0 q) | read | medium | source-level human review |
| external/新建文件夹 (2)/ifa考前物资/芳香疗法个案咨询表.doc | doc | 未取得 | 未取得 / 0 | unknown (0 stated, 0 unknown) | 否 (0 objects; 0 q) | legacy_office_unavailable_without_office_automation | medium | source-level human review |
| external/新建文件夹 (2)/ifa考前物资/连续个案治疗咨询表.doc | doc | 未取得 | 未取得 / 0 | unknown (0 stated, 0 unknown) | 否 (0 objects; 0 q) | legacy_office_unavailable_without_office_automation | medium | source-level human review |
| external/新建文件夹 (2)/ifa考前物资/爱芙悦个案研究与论文写作导读.pdf | pdf | 6 | 39 / 6 | unknown (0 stated, 6 unknown) | 是 (2 objects; 1 q) | read | medium | duplicate/review |
| external/新建文件夹 (2)/IFA笔记总结/副本病理学复习 .docx | docx | 未取得 | 未取得 / 0 | unknown (0 stated, 0 unknown) | 是 (27 objects; 0 q) | read | medium | source-level human review |
| external/新建文件夹 (2)/IFA笔记总结/解剖学与生理学复习七（答案） .docx | docx | 未取得 | 未取得 / 0 | unknown (0 stated, 0 unknown) | 否 (0 objects; 0 q) | read | medium | source-level human review |
| external/新建文件夹 (2)/IFA笔记总结/解剖学与生理学复习九（答案） .docx | docx | 未取得 | 未取得 / 0 | unknown (0 stated, 0 unknown) | 否 (0 objects; 0 q) | read | medium | source-level human review |
| external/新建文件夹 (2)/IFA笔记总结/解剖学与生理学复习八（答案） .docx | docx | 未取得 | 未取得 / 0 | unknown (0 stated, 0 unknown) | 否 (0 objects; 0 q) | read | medium | source-level human review |
| external/新建文件夹 (2)/IFA笔记总结/解剖学与生理学复习十（答案）.docx | docx | 未取得 | 未取得 / 0 | unknown (0 stated, 0 unknown) | 否 (0 objects; 0 q) | read | medium | source-level human review |
| external/新建文件夹 (2)/IFA笔记总结/解剖学与生理学复习十一（答案） .docx | docx | 未取得 | 未取得 / 0 | unknown (0 stated, 0 unknown) | 否 (0 objects; 0 q) | read | medium | source-level human review |
| external/新建文件夹 (2)/IFA笔记总结/解剖学与生理学复习三答案 .docx | docx | 未取得 | 未取得 / 0 | unknown (0 stated, 0 unknown) | 否 (0 objects; 0 q) | read | medium | source-level human review |
| external/新建文件夹 (2)/IFA笔记总结/解剖学与生理学复习五（答案） .docx | docx | 未取得 | 未取得 / 0 | unknown (0 stated, 0 unknown) | 是 (2 objects; 0 q) | read | medium | source-level human review |
| external/新建文件夹 (2)/IFA笔记总结/解剖学与生理学复习六（答案） .docx | docx | 未取得 | 未取得 / 0 | unknown (0 stated, 0 unknown) | 否 (0 objects; 0 q) | read | medium | source-level human review |
| external/新建文件夹 (2)/IFA笔记总结/解剖学与生理学复习四（答案） .docx | docx | 未取得 | 未取得 / 0 | unknown (0 stated, 0 unknown) | 否 (0 objects; 0 q) | read | medium | source-level human review |
| external/新建文件夹 (2)/IFA笔记总结/解剖学和生理学复习一（答案） .docx | docx | 未取得 | 未取得 / 0 | unknown (0 stated, 0 unknown) | 否 (0 objects; 0 q) | read | medium | source-level human review |
| external/新建文件夹 (2)/IFA笔记总结/解剖学和生理学复习二答案.docx | docx | 未取得 | 未取得 / 0 | unknown (0 stated, 0 unknown) | 否 (0 objects; 0 q) | read | medium | source-level human review |
| external/新建文件夹 (2)/考前集训题/IFA复习作业第7周.docx | docx | 未取得 | 未取得 / 0 | unknown (0 stated, 0 unknown) | 是 (2 objects; 0 q) | read | medium | source-level human review |
| external/新建文件夹 (2)/考前集训题/考试生理辅导必修题.pdf | pdf | 31 | 113 / 14 | unknown (0 stated, 14 unknown) | 是 (21 objects; 5 q) | read | medium | duplicate/review |
| external/新建文件夹 (2)/考前集训题/芳疗按摩商业实践辅导必修题.pdf | pdf | 25 | 153 / 39 | unknown (0 stated, 39 unknown) | 是 (1 objects; 0 q) | read | medium | duplicate/review |
| external/新建文件夹 (2)/其他/第四周作业补充资料.pdf | pdf | 4 | 12 / 6 | source_stated (6 stated, 0 unknown) | 是 (3 objects; 1 q) | read | medium | duplicate/review |

### Textbook disposition

- 52 份文件中，清楚題目邊界的紀錄為 130 筆，去重後 65 組；主要為相同教材在不同 external 路徑的鏡像。
- 可直接轉入 Formal：0。教材練習／作業即使存在來源明示答案，也仍需人工確認它是否為正式考試題、核對答案／版本／風險，不能由 pipeline 自動升格。
- 需要人工確認：題目邊界、答案、教材練習與正式考試的身份，以及圖片依賴；無法讀取的 legacy `.doc` 也保留在 queue。

## 5. Candidate status and duplicate analysis

| status | records | meaning |
|---|---:|---|
| `needs_human_review` | 977 | 題目邊界／答案／來源層級／圖片依賴仍需人工確認 |
| `duplicate_candidate` | 154 | normalized 題幹在候選來源重複；保留全部 lineage，等待人工決定代表來源 |
| `formal_existing_duplicate` | 0 | 已存在 Formal exact match；本 Sprint 不重複匯入 |

- Queue record：1131 筆；同一題在鏡像／不同來源的 occurrence 不刪除。
- 去重後 review unit：1054；重複 additional occurrences：77。
- 候選與 Formal exact normalized match：0 筆；沒有既有 Formal 題目被修改。
- 去重只使用 Sprint 56 已抽出的 normalized 題幹作為保守 exact duplicate signal；未做語意 near-duplicate 自動合併，避免誤刪或錯判。

### Duplicate group inventory

| duplicate group | records | category | source files | pages | Formal IDs | decision |
|---|---:|---|---|---|---|---|
| s57dup-011b8d1f013b | 2 | official_exam_candidate | private/考古題原始資料/2024芳香按摩學期末試卷(三).pdf<br>private/考古題原始資料/2024芳香按摩學期末試卷(二).pdf | 6, 7 | 未取得 | pending_human_dedupe |
| s57dup-0b4a44a71547 | 2 | official_exam_candidate | private/考古題原始資料/2024解剖學期末試卷(一).pdf<br>private/考古題原始資料/2024解剖學期末試卷(一)解答.pdf | 4 | 未取得 | pending_human_dedupe |
| s57dup-0b5d3adc23c9 | 2 | textbook_exam_candidate | external/00_原始備份_不可修改/新建文件夹 (2)/考前集训题/芳疗按摩商业实践辅导必修题.pdf<br>external/新建文件夹 (2)/考前集训题/芳疗按摩商业实践辅导必修题.pdf | 16 | 未取得 | pending_human_dedupe |
| s57dup-0d2219c36f8b | 2 | official_exam_candidate | private/考古題原始資料/2024芳香按摩學期末試卷(三).pdf<br>private/考古題原始資料/2024芳香按摩學期末試卷(二).pdf | 5, 6 | 未取得 | pending_human_dedupe |
| s57dup-122a405cca9f | 2 | textbook_exam_candidate | external/00_原始備份_不可修改/新建文件夹 (2)/考前集训题/芳疗按摩商业实践辅导必修题.pdf<br>external/新建文件夹 (2)/考前集训题/芳疗按摩商业实践辅导必修题.pdf | 23 | 未取得 | pending_human_dedupe |
| s57dup-149bbe4d3680 | 2 | textbook_exam_candidate | external/00_原始備份_不可修改/新建文件夹 (2)/考前集训题/考试生理辅导必修题.pdf<br>external/新建文件夹 (2)/考前集训题/考试生理辅导必修题.pdf | 25 | 未取得 | pending_human_dedupe |
| s57dup-151194495098 | 2 | textbook_exam_candidate | external/00_原始備份_不可修改/新建文件夹 (2)/考前集训题/芳疗按摩商业实践辅导必修题.pdf<br>external/新建文件夹 (2)/考前集训题/芳疗按摩商业实践辅导必修题.pdf | 22 | 未取得 | pending_human_dedupe |
| s57dup-16595048439c | 2 | textbook_exam_candidate | external/00_原始備份_不可修改/新建文件夹 (2)/考前集训题/芳疗按摩商业实践辅导必修题.pdf<br>external/新建文件夹 (2)/考前集训题/芳疗按摩商业实践辅导必修题.pdf | 14 | 未取得 | pending_human_dedupe |
| s57dup-19bb72f1af8f | 2 | textbook_exam_candidate | external/00_原始備份_不可修改/新建文件夹 (2)/考前集训题/考试生理辅导必修题.pdf<br>external/新建文件夹 (2)/考前集训题/考试生理辅导必修题.pdf | 17 | 未取得 | pending_human_dedupe |
| s57dup-1a6ea16f80fb | 2 | textbook_exam_candidate | external/00_原始備份_不可修改/新建文件夹 (2)/考前集训题/芳疗按摩商业实践辅导必修题.pdf<br>external/新建文件夹 (2)/考前集训题/芳疗按摩商业实践辅导必修题.pdf | 9 | 未取得 | pending_human_dedupe |
| s57dup-1aa390ad11f5 | 2 | textbook_exam_candidate | external/00_原始備份_不可修改/新建文件夹 (2)/考前集训题/芳疗按摩商业实践辅导必修题.pdf<br>external/新建文件夹 (2)/考前集训题/芳疗按摩商业实践辅导必修题.pdf | 23 | 未取得 | pending_human_dedupe |
| s57dup-1ac1c1eb2da3 | 2 | textbook_exam_candidate | external/00_原始備份_不可修改/新建文件夹 (2)/考前集训题/考试生理辅导必修题.pdf<br>external/新建文件夹 (2)/考前集训题/考试生理辅导必修题.pdf | 12 | 未取得 | pending_human_dedupe |
| s57dup-1ea4c327ffc7 | 2 | textbook_exam_candidate | external/00_原始備份_不可修改/新建文件夹 (2)/考前集训题/芳疗按摩商业实践辅导必修题.pdf<br>external/新建文件夹 (2)/考前集训题/芳疗按摩商业实践辅导必修题.pdf | 10 | 未取得 | pending_human_dedupe |
| s57dup-2098f3ec0e5b | 2 | textbook_exam_candidate | external/00_原始備份_不可修改/新建文件夹 (2)/考前集训题/芳疗按摩商业实践辅导必修题.pdf<br>external/新建文件夹 (2)/考前集训题/芳疗按摩商业实践辅导必修题.pdf | 15 | 未取得 | pending_human_dedupe |
| s57dup-24e5184eab3a | 2 | textbook_exam_candidate | external/00_原始備份_不可修改/新建文件夹 (2)/ifa考前物资/爱芙悦个案研究与论文写作导读.pdf<br>external/新建文件夹 (2)/ifa考前物资/爱芙悦个案研究与论文写作导读.pdf | 5 | 未取得 | pending_human_dedupe |
| s57dup-2521dd161b25 | 2 | official_exam_candidate | private/考古題原始資料/2024芳香按摩學期末試卷(三).pdf<br>private/考古題原始資料/2024芳香按摩學期末試卷(二).pdf | 5 | 未取得 | pending_human_dedupe |
| s57dup-2786a572c21b | 2 | textbook_exam_candidate | external/00_原始備份_不可修改/新建文件夹 (2)/考前集训题/芳疗按摩商业实践辅导必修题.pdf<br>external/新建文件夹 (2)/考前集训题/芳疗按摩商业实践辅导必修题.pdf | 6 | 未取得 | pending_human_dedupe |
| s57dup-29cbffb70b58 | 2 | textbook_exam_candidate | external/00_原始備份_不可修改/新建文件夹 (2)/考前集训题/芳疗按摩商业实践辅导必修题.pdf<br>external/新建文件夹 (2)/考前集训题/芳疗按摩商业实践辅导必修题.pdf | 4 | 未取得 | pending_human_dedupe |
| s57dup-2c822ef2621c | 2 | textbook_exam_candidate | external/00_原始備份_不可修改/新建文件夹 (2)/考前集训题/考试生理辅导必修题.pdf<br>external/新建文件夹 (2)/考前集训题/考试生理辅导必修题.pdf | 23 | 未取得 | pending_human_dedupe |
| s57dup-30f0a5424ee4 | 2 | textbook_exam_candidate | external/00_原始備份_不可修改/新建文件夹 (2)/考前集训题/芳疗按摩商业实践辅导必修题.pdf<br>external/新建文件夹 (2)/考前集训题/芳疗按摩商业实践辅导必修题.pdf | 9 | 未取得 | pending_human_dedupe |
| s57dup-31e373fd2577 | 2 | textbook_exam_candidate | external/00_原始備份_不可修改/新建文件夹 (2)/考前集训题/芳疗按摩商业实践辅导必修题.pdf<br>external/新建文件夹 (2)/考前集训题/芳疗按摩商业实践辅导必修题.pdf | 4 | 未取得 | pending_human_dedupe |
| s57dup-3496ade11117 | 2 | official_exam_candidate | private/考古題原始資料/2024解剖學期末試卷(一).pdf<br>private/考古題原始資料/2024解剖學期末試卷(三).pdf | 4, 5 | 未取得 | pending_human_dedupe |
| s57dup-355d88363a67 | 2 | textbook_exam_candidate | external/00_原始備份_不可修改/新建文件夹 (2)/考前集训题/芳疗按摩商业实践辅导必修题.pdf<br>external/新建文件夹 (2)/考前集训题/芳疗按摩商业实践辅导必修题.pdf | 14 | 未取得 | pending_human_dedupe |
| s57dup-3599765c903a | 2 | official_exam_candidate | private/考古題原始資料/2024芳香按摩學期末試卷(三).pdf<br>private/考古題原始資料/2024芳香按摩學期末試卷(二).pdf | 3 | 未取得 | pending_human_dedupe |
| s57dup-35c8c9d171b2 | 2 | textbook_exam_candidate | external/00_原始備份_不可修改/新建文件夹 (2)/考前集训题/芳疗按摩商业实践辅导必修题.pdf<br>external/新建文件夹 (2)/考前集训题/芳疗按摩商业实践辅导必修题.pdf | 18 | 未取得 | pending_human_dedupe |
| s57dup-35d14ad5334b | 2 | textbook_exam_candidate | external/00_原始備份_不可修改/新建文件夹 (2)/考前集训题/芳疗按摩商业实践辅导必修题.pdf<br>external/新建文件夹 (2)/考前集训题/芳疗按摩商业实践辅导必修题.pdf | 16 | 未取得 | pending_human_dedupe |
| s57dup-361520ad8eaf | 2 | official_exam_candidate | private/考古題原始資料/2024芳香按摩學期末試卷(三).pdf<br>private/考古題原始資料/2024芳香按摩學期末試卷(二).pdf | 4, 5 | 未取得 | pending_human_dedupe |
| s57dup-39fece420d63 | 2 | official_exam_candidate | private/考古題原始資料/2024解剖學期末試卷(一).pdf<br>private/考古題原始資料/2024解剖學期末試卷(一)解答.pdf | 5 | 未取得 | pending_human_dedupe |
| s57dup-3b34053141d7 | 2 | textbook_exam_candidate | external/00_原始備份_不可修改/新建文件夹 (2)/ifa考前物资/爱芙悦个案研究与论文写作导读.pdf<br>external/新建文件夹 (2)/ifa考前物资/爱芙悦个案研究与论文写作导读.pdf | 2 | 未取得 | pending_human_dedupe |
| s57dup-3db68f86a69a | 2 | official_exam_candidate | private/考古題原始資料/2024解剖學期末試卷(一).pdf<br>private/考古題原始資料/2024解剖學期末試卷(三).pdf | 4 | 未取得 | pending_human_dedupe |
| s57dup-3ebf01b5c3eb | 2 | textbook_exam_candidate | external/00_原始備份_不可修改/新建文件夹 (2)/考前集训题/芳疗按摩商业实践辅导必修题.pdf<br>external/新建文件夹 (2)/考前集训题/芳疗按摩商业实践辅导必修题.pdf | 15 | 未取得 | pending_human_dedupe |
| s57dup-48491c07f490 | 2 | official_exam_candidate | private/考古題原始資料/2024芳香按摩學期末試卷(三).pdf<br>private/考古題原始資料/2024芳香按摩學期末試卷(二).pdf | 4 | 未取得 | pending_human_dedupe |
| s57dup-4d2b2f7ac83c | 2 | textbook_exam_candidate | external/00_原始備份_不可修改/新建文件夹 (2)/考前集训题/芳疗按摩商业实践辅导必修题.pdf<br>external/新建文件夹 (2)/考前集训题/芳疗按摩商业实践辅导必修题.pdf | 24 | 未取得 | pending_human_dedupe |
| s57dup-4f6b2c3b68c9 | 2 | textbook_exam_candidate | external/00_原始備份_不可修改/新建文件夹 (2)/考前集训题/芳疗按摩商业实践辅导必修题.pdf<br>external/新建文件夹 (2)/考前集训题/芳疗按摩商业实践辅导必修题.pdf | 13 | 未取得 | pending_human_dedupe |
| s57dup-5242e5afe85c | 2 | textbook_exam_candidate | external/00_原始備份_不可修改/新建文件夹 (2)/考前集训题/芳疗按摩商业实践辅导必修题.pdf<br>external/新建文件夹 (2)/考前集训题/芳疗按摩商业实践辅导必修题.pdf | 19 | 未取得 | pending_human_dedupe |
| s57dup-542bbfc8eb1b | 2 | textbook_exam_candidate | external/00_原始備份_不可修改/新建文件夹 (2)/考前集训题/考试生理辅导必修题.pdf<br>external/新建文件夹 (2)/考前集训题/考试生理辅导必修题.pdf | 31 | 未取得 | pending_human_dedupe |
| s57dup-54398490a726 | 2 | textbook_exam_candidate | external/00_原始備份_不可修改/新建文件夹 (2)/考前集训题/考试生理辅导必修题.pdf<br>external/新建文件夹 (2)/考前集训题/考试生理辅导必修题.pdf | 26 | 未取得 | pending_human_dedupe |
| s57dup-631c2ae76e87 | 2 | textbook_exam_candidate | external/00_原始備份_不可修改/新建文件夹 (2)/考前集训题/芳疗按摩商业实践辅导必修题.pdf<br>external/新建文件夹 (2)/考前集训题/芳疗按摩商业实践辅导必修题.pdf | 14 | 未取得 | pending_human_dedupe |
| s57dup-678fb87bc509 | 2 | textbook_exam_candidate | external/00_原始備份_不可修改/新建文件夹 (2)/考前集训题/芳疗按摩商业实践辅导必修题.pdf<br>external/新建文件夹 (2)/考前集训题/芳疗按摩商业实践辅导必修题.pdf | 15 | 未取得 | pending_human_dedupe |
| s57dup-6c8f9abbe9a8 | 2 | textbook_exam_candidate | external/00_原始備份_不可修改/新建文件夹 (2)/考前集训题/芳疗按摩商业实践辅导必修题.pdf<br>external/新建文件夹 (2)/考前集训题/芳疗按摩商业实践辅导必修题.pdf | 10 | 未取得 | pending_human_dedupe |
| s57dup-6cc6954f1d3e | 2 | textbook_exam_candidate | external/00_原始備份_不可修改/新建文件夹 (2)/考前集训题/考试生理辅导必修题.pdf<br>external/新建文件夹 (2)/考前集训题/考试生理辅导必修题.pdf | 25 | 未取得 | pending_human_dedupe |
| s57dup-6e0dd4b2ccb7 | 2 | textbook_exam_candidate | external/00_原始備份_不可修改/新建文件夹 (2)/考前集训题/考试生理辅导必修题.pdf<br>external/新建文件夹 (2)/考前集训题/考试生理辅导必修题.pdf | 18 | 未取得 | pending_human_dedupe |
| s57dup-7e63a9f5354c | 2 | textbook_exam_candidate | external/00_原始備份_不可修改/新建文件夹 (2)/其他/第四周作业补充资料.pdf<br>external/新建文件夹 (2)/其他/第四周作业补充资料.pdf | 4 | 未取得 | pending_human_dedupe |
| s57dup-826bd4cc483e | 2 | textbook_exam_candidate | external/00_原始備份_不可修改/新建文件夹 (2)/考前集训题/芳疗按摩商业实践辅导必修题.pdf<br>external/新建文件夹 (2)/考前集训题/芳疗按摩商业实践辅导必修题.pdf | 8 | 未取得 | pending_human_dedupe |
| s57dup-8b1af9fe2b63 | 2 | textbook_exam_candidate | external/00_原始備份_不可修改/新建文件夹 (2)/ifa考前物资/爱芙悦个案研究与论文写作导读.pdf<br>external/新建文件夹 (2)/ifa考前物资/爱芙悦个案研究与论文写作导读.pdf | 1 | 未取得 | pending_human_dedupe |
| s57dup-8b85ff15b8ab | 2 | textbook_exam_candidate | external/00_原始備份_不可修改/新建文件夹 (2)/其他/第四周作业补充资料.pdf<br>external/新建文件夹 (2)/其他/第四周作业补充资料.pdf | 4 | 未取得 | pending_human_dedupe |
| s57dup-8f4869aa36bd | 2 | textbook_exam_candidate | external/00_原始備份_不可修改/新建文件夹 (2)/ifa考前物资/爱芙悦个案研究与论文写作导读.pdf<br>external/新建文件夹 (2)/ifa考前物资/爱芙悦个案研究与论文写作导读.pdf | 2 | 未取得 | pending_human_dedupe |
| s57dup-8f6b530a4af3 | 2 | textbook_exam_candidate | external/00_原始備份_不可修改/新建文件夹 (2)/其他/第四周作业补充资料.pdf<br>external/新建文件夹 (2)/其他/第四周作业补充资料.pdf | 4 | 未取得 | pending_human_dedupe |
| s57dup-95dd772c6f4f | 2 | textbook_exam_candidate | external/00_原始備份_不可修改/新建文件夹 (2)/考前集训题/考试生理辅导必修题.pdf<br>external/新建文件夹 (2)/考前集训题/考试生理辅导必修题.pdf | 18 | 未取得 | pending_human_dedupe |
| s57dup-9b93b9c32c74 | 2 | textbook_exam_candidate | external/00_原始備份_不可修改/新建文件夹 (2)/考前集训题/芳疗按摩商业实践辅导必修题.pdf<br>external/新建文件夹 (2)/考前集训题/芳疗按摩商业实践辅导必修题.pdf | 5 | 未取得 | pending_human_dedupe |
| s57dup-9ba788bb2479 | 2 | official_exam_candidate | private/考古題原始資料/2024芳香按摩學期末試卷(三).pdf<br>private/考古題原始資料/2024芳香按摩學期末試卷(二).pdf | 5 | 未取得 | pending_human_dedupe |
| s57dup-9c8400460afe | 2 | textbook_exam_candidate | external/00_原始備份_不可修改/新建文件夹 (2)/考前集训题/芳疗按摩商业实践辅导必修题.pdf<br>external/新建文件夹 (2)/考前集训题/芳疗按摩商业实践辅导必修题.pdf | 5 | 未取得 | pending_human_dedupe |
| s57dup-9d13a7ef73d1 | 2 | textbook_exam_candidate | external/00_原始備份_不可修改/新建文件夹 (2)/考前集训题/考试生理辅导必修题.pdf<br>external/新建文件夹 (2)/考前集训题/考试生理辅导必修题.pdf | 30 | 未取得 | pending_human_dedupe |
| s57dup-ab34abb58cb8 | 2 | textbook_exam_candidate | external/00_原始備份_不可修改/新建文件夹 (2)/考前集训题/芳疗按摩商业实践辅导必修题.pdf<br>external/新建文件夹 (2)/考前集训题/芳疗按摩商业实践辅导必修题.pdf | 9 | 未取得 | pending_human_dedupe |
| s57dup-ac8707eeae33 | 2 | textbook_exam_candidate | external/00_原始備份_不可修改/新建文件夹 (2)/考前集训题/芳疗按摩商业实践辅导必修题.pdf<br>external/新建文件夹 (2)/考前集训题/芳疗按摩商业实践辅导必修题.pdf | 19 | 未取得 | pending_human_dedupe |
| s57dup-ae91f4e9a888 | 2 | textbook_exam_candidate | external/00_原始備份_不可修改/新建文件夹 (2)/考前集训题/考试生理辅导必修题.pdf<br>external/新建文件夹 (2)/考前集训题/考试生理辅导必修题.pdf | 26 | 未取得 | pending_human_dedupe |
| s57dup-b1570f9e2748 | 2 | textbook_exam_candidate | external/00_原始備份_不可修改/新建文件夹 (2)/考前集训题/芳疗按摩商业实践辅导必修题.pdf<br>external/新建文件夹 (2)/考前集训题/芳疗按摩商业实践辅导必修题.pdf | 23 | 未取得 | pending_human_dedupe |
| s57dup-b2ea98c08581 | 2 | textbook_exam_candidate | external/00_原始備份_不可修改/新建文件夹 (2)/考前集训题/考试生理辅导必修题.pdf<br>external/新建文件夹 (2)/考前集训题/考试生理辅导必修题.pdf | 31 | 未取得 | pending_human_dedupe |
| s57dup-b57c63eceeed | 2 | textbook_exam_candidate | external/00_原始備份_不可修改/新建文件夹 (2)/考前集训题/芳疗按摩商业实践辅导必修题.pdf<br>external/新建文件夹 (2)/考前集训题/芳疗按摩商业实践辅导必修题.pdf | 13 | 未取得 | pending_human_dedupe |
| s57dup-c55b35ead290 | 2 | textbook_exam_candidate | external/00_原始備份_不可修改/新建文件夹 (2)/考前集训题/芳疗按摩商业实践辅导必修题.pdf<br>external/新建文件夹 (2)/考前集训题/芳疗按摩商业实践辅导必修题.pdf | 12 | 未取得 | pending_human_dedupe |
| s57dup-c62a8ca63f13 | 2 | textbook_exam_candidate | external/00_原始備份_不可修改/新建文件夹 (2)/考前集训题/芳疗按摩商业实践辅导必修题.pdf<br>external/新建文件夹 (2)/考前集训题/芳疗按摩商业实践辅导必修题.pdf | 13 | 未取得 | pending_human_dedupe |
| s57dup-ce4dc5526899 | 2 | textbook_exam_candidate | external/00_原始備份_不可修改/新建文件夹 (2)/考前集训题/芳疗按摩商业实践辅导必修题.pdf<br>external/新建文件夹 (2)/考前集训题/芳疗按摩商业实践辅导必修题.pdf | 16 | 未取得 | pending_human_dedupe |
| s57dup-cfa332783d83 | 2 | textbook_exam_candidate | external/00_原始備份_不可修改/新建文件夹 (2)/考前集训题/芳疗按摩商业实践辅导必修题.pdf<br>external/新建文件夹 (2)/考前集训题/芳疗按摩商业实践辅导必修题.pdf | 19 | 未取得 | pending_human_dedupe |
| s57dup-d24c6108479f | 2 | official_exam_candidate | private/考古題原始資料/2024芳香按摩學期末試卷(三).pdf<br>private/考古題原始資料/2024芳香按摩學期末試卷(二).pdf | 7, 8 | 未取得 | pending_human_dedupe |
| s57dup-d591807f68bd | 2 | textbook_exam_candidate | external/00_原始備份_不可修改/新建文件夹 (2)/考前集训题/考试生理辅导必修题.pdf<br>external/新建文件夹 (2)/考前集训题/考试生理辅导必修题.pdf | 4 | 未取得 | pending_human_dedupe |
| s57dup-d5fb8c0a3e76 | 2 | textbook_exam_candidate | external/00_原始備份_不可修改/新建文件夹 (2)/考前集训题/芳疗按摩商业实践辅导必修题.pdf<br>external/新建文件夹 (2)/考前集训题/芳疗按摩商业实践辅导必修题.pdf | 24 | 未取得 | pending_human_dedupe |
| s57dup-d73948bafb31 | 2 | textbook_exam_candidate | external/00_原始備份_不可修改/新建文件夹 (2)/ifa考前物资/爱芙悦个案研究与论文写作导读.pdf<br>external/新建文件夹 (2)/ifa考前物资/爱芙悦个案研究与论文写作导读.pdf | 5 | 未取得 | pending_human_dedupe |
| s57dup-f0bb2197c54c | 2 | textbook_exam_candidate | external/00_原始備份_不可修改/新建文件夹 (2)/考前集训题/芳疗按摩商业实践辅导必修题.pdf<br>external/新建文件夹 (2)/考前集训题/芳疗按摩商业实践辅导必修题.pdf | 12 | 未取得 | pending_human_dedupe |
| s57dup-f17ee3020ef4 | 2 | textbook_exam_candidate | external/00_原始備份_不可修改/新建文件夹 (2)/考前集训题/芳疗按摩商业实践辅导必修题.pdf<br>external/新建文件夹 (2)/考前集训题/芳疗按摩商业实践辅导必修题.pdf | 16 | 未取得 | pending_human_dedupe |
| s57dup-f2c475f526a4 | 2 | textbook_exam_candidate | external/00_原始備份_不可修改/新建文件夹 (2)/其他/第四周作业补充资料.pdf<br>external/新建文件夹 (2)/其他/第四周作业补充资料.pdf | 4 | 未取得 | pending_human_dedupe |
| s57dup-f2e6590b03e3 | 2 | textbook_exam_candidate | external/00_原始備份_不可修改/新建文件夹 (2)/考前集训题/考试生理辅导必修题.pdf<br>external/新建文件夹 (2)/考前集训题/考试生理辅导必修题.pdf | 2 | 未取得 | pending_human_dedupe |
| s57dup-f327f58ed5b7 | 2 | textbook_exam_candidate | external/00_原始備份_不可修改/新建文件夹 (2)/其他/第四周作业补充资料.pdf<br>external/新建文件夹 (2)/其他/第四周作业补充资料.pdf | 4 | 未取得 | pending_human_dedupe |
| s57dup-f3399cb79c95 | 2 | textbook_exam_candidate | external/00_原始備份_不可修改/新建文件夹 (2)/ifa考前物资/爱芙悦个案研究与论文写作导读.pdf<br>external/新建文件夹 (2)/ifa考前物资/爱芙悦个案研究与论文写作导读.pdf | 2 | 未取得 | pending_human_dedupe |
| s57dup-f4e5eb9e93a3 | 2 | textbook_exam_candidate | external/00_原始備份_不可修改/新建文件夹 (2)/考前集训题/芳疗按摩商业实践辅导必修题.pdf<br>external/新建文件夹 (2)/考前集训题/芳疗按摩商业实践辅导必修题.pdf | 9 | 未取得 | pending_human_dedupe |
| s57dup-f6a3764657c1 | 2 | textbook_exam_candidate | external/00_原始備份_不可修改/新建文件夹 (2)/考前集训题/芳疗按摩商业实践辅导必修题.pdf<br>external/新建文件夹 (2)/考前集训题/芳疗按摩商业实践辅导必修题.pdf | 19 | 未取得 | pending_human_dedupe |
| s57dup-fac84c972dbe | 2 | textbook_exam_candidate | external/00_原始備份_不可修改/新建文件夹 (2)/考前集训题/芳疗按摩商业实践辅导必修题.pdf<br>external/新建文件夹 (2)/考前集训题/芳疗按摩商业实践辅导必修题.pdf | 23 | 未取得 | pending_human_dedupe |
| s57dup-ffa977e87e48 | 2 | textbook_exam_candidate | external/00_原始備份_不可修改/新建文件夹 (2)/其他/第四周作业补充资料.pdf<br>external/新建文件夹 (2)/其他/第四周作业补充资料.pdf | 3 | 未取得 | pending_human_dedupe |

## 6. Image question inventory

共有 138 筆 high-signal image question records，去重後 119 組。圖片未被複製至 `public/question-assets/`，因此 `imagePath` 與 `extractedAsset` 均為 null；這是預期的 review-only 狀態。

| image path | related question | source document | page | candidate status | lineage |
|---|---|---|---:|---|---|
| 未取得 | s56q-5a2f1c6a026a-p3-001 | private/考古題原始資料/2024芳香按摩學期末試卷(一).pdf | 3 | needs_human_review | 5a2f1c6a026a0f1c06958b60a108e53748717d6c6bc7ca5b70f0e3098a01e091 |
| 未取得 | s56q-5a2f1c6a026a-p3-002 | private/考古題原始資料/2024芳香按摩學期末試卷(一).pdf | 3 | needs_human_review | 5a2f1c6a026a0f1c06958b60a108e53748717d6c6bc7ca5b70f0e3098a01e091 |
| 未取得 | s56q-5a2f1c6a026a-p3-003 | private/考古題原始資料/2024芳香按摩學期末試卷(一).pdf | 3 | needs_human_review | 5a2f1c6a026a0f1c06958b60a108e53748717d6c6bc7ca5b70f0e3098a01e091 |
| 未取得 | s56q-5a2f1c6a026a-p3-004 | private/考古題原始資料/2024芳香按摩學期末試卷(一).pdf | 3 | needs_human_review | 5a2f1c6a026a0f1c06958b60a108e53748717d6c6bc7ca5b70f0e3098a01e091 |
| 未取得 | s56q-5a2f1c6a026a-p3-005 | private/考古題原始資料/2024芳香按摩學期末試卷(一).pdf | 3 | needs_human_review | 5a2f1c6a026a0f1c06958b60a108e53748717d6c6bc7ca5b70f0e3098a01e091 |
| 未取得 | s56q-5a2f1c6a026a-p4-001 | private/考古題原始資料/2024芳香按摩學期末試卷(一).pdf | 4 | needs_human_review | 5a2f1c6a026a0f1c06958b60a108e53748717d6c6bc7ca5b70f0e3098a01e091 |
| 未取得 | s56q-5a2f1c6a026a-p4-003 | private/考古題原始資料/2024芳香按摩學期末試卷(一).pdf | 4 | needs_human_review | 5a2f1c6a026a0f1c06958b60a108e53748717d6c6bc7ca5b70f0e3098a01e091 |
| 未取得 | s56q-5a2f1c6a026a-p5-001 | private/考古題原始資料/2024芳香按摩學期末試卷(一).pdf | 5 | needs_human_review | 5a2f1c6a026a0f1c06958b60a108e53748717d6c6bc7ca5b70f0e3098a01e091 |
| 未取得 | s56q-5a2f1c6a026a-p5-002 | private/考古題原始資料/2024芳香按摩學期末試卷(一).pdf | 5 | needs_human_review | 5a2f1c6a026a0f1c06958b60a108e53748717d6c6bc7ca5b70f0e3098a01e091 |
| 未取得 | s56q-5a2f1c6a026a-p5-003 | private/考古題原始資料/2024芳香按摩學期末試卷(一).pdf | 5 | needs_human_review | 5a2f1c6a026a0f1c06958b60a108e53748717d6c6bc7ca5b70f0e3098a01e091 |
| 未取得 | s56q-5a2f1c6a026a-p5-004 | private/考古題原始資料/2024芳香按摩學期末試卷(一).pdf | 5 | needs_human_review | 5a2f1c6a026a0f1c06958b60a108e53748717d6c6bc7ca5b70f0e3098a01e091 |
| 未取得 | s56q-5a2f1c6a026a-p6-001 | private/考古題原始資料/2024芳香按摩學期末試卷(一).pdf | 6 | needs_human_review | 5a2f1c6a026a0f1c06958b60a108e53748717d6c6bc7ca5b70f0e3098a01e091 |
| 未取得 | s56q-5a2f1c6a026a-p6-002 | private/考古題原始資料/2024芳香按摩學期末試卷(一).pdf | 6 | needs_human_review | 5a2f1c6a026a0f1c06958b60a108e53748717d6c6bc7ca5b70f0e3098a01e091 |
| 未取得 | s56q-5a2f1c6a026a-p6-003 | private/考古題原始資料/2024芳香按摩學期末試卷(一).pdf | 6 | needs_human_review | 5a2f1c6a026a0f1c06958b60a108e53748717d6c6bc7ca5b70f0e3098a01e091 |
| 未取得 | s56q-5a2f1c6a026a-p6-004 | private/考古題原始資料/2024芳香按摩學期末試卷(一).pdf | 6 | needs_human_review | 5a2f1c6a026a0f1c06958b60a108e53748717d6c6bc7ca5b70f0e3098a01e091 |
| 未取得 | s56q-5a2f1c6a026a-p7-001 | private/考古題原始資料/2024芳香按摩學期末試卷(一).pdf | 7 | needs_human_review | 5a2f1c6a026a0f1c06958b60a108e53748717d6c6bc7ca5b70f0e3098a01e091 |
| 未取得 | s56q-5a2f1c6a026a-p7-002 | private/考古題原始資料/2024芳香按摩學期末試卷(一).pdf | 7 | needs_human_review | 5a2f1c6a026a0f1c06958b60a108e53748717d6c6bc7ca5b70f0e3098a01e091 |
| 未取得 | s56q-5a2f1c6a026a-p7-003 | private/考古題原始資料/2024芳香按摩學期末試卷(一).pdf | 7 | needs_human_review | 5a2f1c6a026a0f1c06958b60a108e53748717d6c6bc7ca5b70f0e3098a01e091 |
| 未取得 | s56q-5a2f1c6a026a-p7-004 | private/考古題原始資料/2024芳香按摩學期末試卷(一).pdf | 7 | needs_human_review | 5a2f1c6a026a0f1c06958b60a108e53748717d6c6bc7ca5b70f0e3098a01e091 |
| 未取得 | s56q-5a2f1c6a026a-p8-001 | private/考古題原始資料/2024芳香按摩學期末試卷(一).pdf | 8 | needs_human_review | 5a2f1c6a026a0f1c06958b60a108e53748717d6c6bc7ca5b70f0e3098a01e091 |
| 未取得 | s56q-cac4cab9f9a5-p3-001 | private/考古題原始資料/2024芳香按摩學期末試卷(三).pdf | 3 | needs_human_review | cac4cab9f9a5403a51b2c5cd0ccb9eeef541f984e68bd844c0300c8dd2414c19 |
| 未取得 | s56q-cac4cab9f9a5-p3-002 | private/考古題原始資料/2024芳香按摩學期末試卷(三).pdf | 3 | duplicate_candidate | cac4cab9f9a5403a51b2c5cd0ccb9eeef541f984e68bd844c0300c8dd2414c19 |
| 未取得 | s56q-cac4cab9f9a5-p3-004 | private/考古題原始資料/2024芳香按摩學期末試卷(三).pdf | 3 | needs_human_review | cac4cab9f9a5403a51b2c5cd0ccb9eeef541f984e68bd844c0300c8dd2414c19 |
| 未取得 | s56q-cac4cab9f9a5-p4-002 | private/考古題原始資料/2024芳香按摩學期末試卷(三).pdf | 4 | duplicate_candidate | cac4cab9f9a5403a51b2c5cd0ccb9eeef541f984e68bd844c0300c8dd2414c19 |
| 未取得 | s56q-cac4cab9f9a5-p4-003 | private/考古題原始資料/2024芳香按摩學期末試卷(三).pdf | 4 | needs_human_review | cac4cab9f9a5403a51b2c5cd0ccb9eeef541f984e68bd844c0300c8dd2414c19 |
| 未取得 | s56q-cac4cab9f9a5-p4-004 | private/考古題原始資料/2024芳香按摩學期末試卷(三).pdf | 4 | needs_human_review | cac4cab9f9a5403a51b2c5cd0ccb9eeef541f984e68bd844c0300c8dd2414c19 |
| 未取得 | s56q-cac4cab9f9a5-p4-005 | private/考古題原始資料/2024芳香按摩學期末試卷(三).pdf | 4 | duplicate_candidate | cac4cab9f9a5403a51b2c5cd0ccb9eeef541f984e68bd844c0300c8dd2414c19 |
| 未取得 | s56q-cac4cab9f9a5-p5-001 | private/考古題原始資料/2024芳香按摩學期末試卷(三).pdf | 5 | duplicate_candidate | cac4cab9f9a5403a51b2c5cd0ccb9eeef541f984e68bd844c0300c8dd2414c19 |
| 未取得 | s56q-cac4cab9f9a5-p5-002 | private/考古題原始資料/2024芳香按摩學期末試卷(三).pdf | 5 | needs_human_review | cac4cab9f9a5403a51b2c5cd0ccb9eeef541f984e68bd844c0300c8dd2414c19 |
| 未取得 | s56q-cac4cab9f9a5-p5-003 | private/考古題原始資料/2024芳香按摩學期末試卷(三).pdf | 5 | needs_human_review | cac4cab9f9a5403a51b2c5cd0ccb9eeef541f984e68bd844c0300c8dd2414c19 |
| 未取得 | s56q-cac4cab9f9a5-p5-004 | private/考古題原始資料/2024芳香按摩學期末試卷(三).pdf | 5 | duplicate_candidate | cac4cab9f9a5403a51b2c5cd0ccb9eeef541f984e68bd844c0300c8dd2414c19 |
| 未取得 | s56q-cac4cab9f9a5-p5-005 | private/考古題原始資料/2024芳香按摩學期末試卷(三).pdf | 5 | duplicate_candidate | cac4cab9f9a5403a51b2c5cd0ccb9eeef541f984e68bd844c0300c8dd2414c19 |
| 未取得 | s56q-cac4cab9f9a5-p5-006 | private/考古題原始資料/2024芳香按摩學期末試卷(三).pdf | 5 | needs_human_review | cac4cab9f9a5403a51b2c5cd0ccb9eeef541f984e68bd844c0300c8dd2414c19 |
| 未取得 | s56q-cac4cab9f9a5-p5-007 | private/考古題原始資料/2024芳香按摩學期末試卷(三).pdf | 5 | needs_human_review | cac4cab9f9a5403a51b2c5cd0ccb9eeef541f984e68bd844c0300c8dd2414c19 |
| 未取得 | s56q-cac4cab9f9a5-p6-003 | private/考古題原始資料/2024芳香按摩學期末試卷(三).pdf | 6 | needs_human_review | cac4cab9f9a5403a51b2c5cd0ccb9eeef541f984e68bd844c0300c8dd2414c19 |
| 未取得 | s56q-cac4cab9f9a5-p6-004 | private/考古題原始資料/2024芳香按摩學期末試卷(三).pdf | 6 | needs_human_review | cac4cab9f9a5403a51b2c5cd0ccb9eeef541f984e68bd844c0300c8dd2414c19 |
| 未取得 | s56q-cac4cab9f9a5-p6-005 | private/考古題原始資料/2024芳香按摩學期末試卷(三).pdf | 6 | duplicate_candidate | cac4cab9f9a5403a51b2c5cd0ccb9eeef541f984e68bd844c0300c8dd2414c19 |
| 未取得 | s56q-cac4cab9f9a5-p7-001 | private/考古題原始資料/2024芳香按摩學期末試卷(三).pdf | 7 | duplicate_candidate | cac4cab9f9a5403a51b2c5cd0ccb9eeef541f984e68bd844c0300c8dd2414c19 |
| 未取得 | s56q-1aa1b6f33374-p3-001 | private/考古題原始資料/2024芳香按摩學期末試卷(二).pdf | 3 | needs_human_review | 1aa1b6f333748d24c5ed18ce5e1a20099b81bca3694fa2b944de8320cf01448c |
| 未取得 | s56q-1aa1b6f33374-p3-003 | private/考古題原始資料/2024芳香按摩學期末試卷(二).pdf | 3 | needs_human_review | 1aa1b6f333748d24c5ed18ce5e1a20099b81bca3694fa2b944de8320cf01448c |
| 未取得 | s56q-1aa1b6f33374-p3-004 | private/考古題原始資料/2024芳香按摩學期末試卷(二).pdf | 3 | duplicate_candidate | 1aa1b6f333748d24c5ed18ce5e1a20099b81bca3694fa2b944de8320cf01448c |
| 未取得 | s56q-1aa1b6f33374-p3-006 | private/考古題原始資料/2024芳香按摩學期末試卷(二).pdf | 3 | needs_human_review | 1aa1b6f333748d24c5ed18ce5e1a20099b81bca3694fa2b944de8320cf01448c |
| 未取得 | s56q-1aa1b6f33374-p3-007 | private/考古題原始資料/2024芳香按摩學期末試卷(二).pdf | 3 | needs_human_review | 1aa1b6f333748d24c5ed18ce5e1a20099b81bca3694fa2b944de8320cf01448c |
| 未取得 | s56q-1aa1b6f33374-p4-003 | private/考古題原始資料/2024芳香按摩學期末試卷(二).pdf | 4 | needs_human_review | 1aa1b6f333748d24c5ed18ce5e1a20099b81bca3694fa2b944de8320cf01448c |
| 未取得 | s56q-1aa1b6f33374-p4-004 | private/考古題原始資料/2024芳香按摩學期末試卷(二).pdf | 4 | duplicate_candidate | 1aa1b6f333748d24c5ed18ce5e1a20099b81bca3694fa2b944de8320cf01448c |
| 未取得 | s56q-1aa1b6f33374-p4-005 | private/考古題原始資料/2024芳香按摩學期末試卷(二).pdf | 4 | needs_human_review | 1aa1b6f333748d24c5ed18ce5e1a20099b81bca3694fa2b944de8320cf01448c |
| 未取得 | s56q-1aa1b6f33374-p5-001 | private/考古題原始資料/2024芳香按摩學期末試卷(二).pdf | 5 | needs_human_review | 1aa1b6f333748d24c5ed18ce5e1a20099b81bca3694fa2b944de8320cf01448c |
| 未取得 | s56q-1aa1b6f33374-p5-002 | private/考古題原始資料/2024芳香按摩學期末試卷(二).pdf | 5 | duplicate_candidate | 1aa1b6f333748d24c5ed18ce5e1a20099b81bca3694fa2b944de8320cf01448c |
| 未取得 | s56q-1aa1b6f33374-p5-003 | private/考古題原始資料/2024芳香按摩學期末試卷(二).pdf | 5 | duplicate_candidate | 1aa1b6f333748d24c5ed18ce5e1a20099b81bca3694fa2b944de8320cf01448c |
| 未取得 | s56q-1aa1b6f33374-p5-004 | private/考古題原始資料/2024芳香按摩學期末試卷(二).pdf | 5 | needs_human_review | 1aa1b6f333748d24c5ed18ce5e1a20099b81bca3694fa2b944de8320cf01448c |
| 未取得 | s56q-1aa1b6f33374-p5-005 | private/考古題原始資料/2024芳香按摩學期末試卷(二).pdf | 5 | needs_human_review | 1aa1b6f333748d24c5ed18ce5e1a20099b81bca3694fa2b944de8320cf01448c |
| 未取得 | s56q-1aa1b6f33374-p5-006 | private/考古題原始資料/2024芳香按摩學期末試卷(二).pdf | 5 | duplicate_candidate | 1aa1b6f333748d24c5ed18ce5e1a20099b81bca3694fa2b944de8320cf01448c |
| 未取得 | s56q-1aa1b6f33374-p6-001 | private/考古題原始資料/2024芳香按摩學期末試卷(二).pdf | 6 | duplicate_candidate | 1aa1b6f333748d24c5ed18ce5e1a20099b81bca3694fa2b944de8320cf01448c |
| 未取得 | s56q-1aa1b6f33374-p6-002 | private/考古題原始資料/2024芳香按摩學期末試卷(二).pdf | 6 | needs_human_review | 1aa1b6f333748d24c5ed18ce5e1a20099b81bca3694fa2b944de8320cf01448c |
| 未取得 | s56q-1aa1b6f33374-p6-005 | private/考古題原始資料/2024芳香按摩學期末試卷(二).pdf | 6 | needs_human_review | 1aa1b6f333748d24c5ed18ce5e1a20099b81bca3694fa2b944de8320cf01448c |
| 未取得 | s56q-1aa1b6f33374-p7-001 | private/考古題原始資料/2024芳香按摩學期末試卷(二).pdf | 7 | needs_human_review | 1aa1b6f333748d24c5ed18ce5e1a20099b81bca3694fa2b944de8320cf01448c |
| 未取得 | s56q-1aa1b6f33374-p7-002 | private/考古題原始資料/2024芳香按摩學期末試卷(二).pdf | 7 | needs_human_review | 1aa1b6f333748d24c5ed18ce5e1a20099b81bca3694fa2b944de8320cf01448c |
| 未取得 | s56q-1aa1b6f33374-p7-003 | private/考古題原始資料/2024芳香按摩學期末試卷(二).pdf | 7 | duplicate_candidate | 1aa1b6f333748d24c5ed18ce5e1a20099b81bca3694fa2b944de8320cf01448c |
| 未取得 | s56q-1aa1b6f33374-p8-001 | private/考古題原始資料/2024芳香按摩學期末試卷(二).pdf | 8 | duplicate_candidate | 1aa1b6f333748d24c5ed18ce5e1a20099b81bca3694fa2b944de8320cf01448c |
| 未取得 | s56q-f301f8539e5a-p3-001 | private/考古題原始資料/2024解剖學期末試卷(一).pdf | 3 | needs_human_review | f301f8539e5a09d6a7aa659555efccf0a09991fc04beda25f2905c0d9f125318 |
| 未取得 | s56q-f301f8539e5a-p3-002 | private/考古題原始資料/2024解剖學期末試卷(一).pdf | 3 | needs_human_review | f301f8539e5a09d6a7aa659555efccf0a09991fc04beda25f2905c0d9f125318 |
| 未取得 | s56q-f301f8539e5a-p3-004 | private/考古題原始資料/2024解剖學期末試卷(一).pdf | 3 | needs_human_review | f301f8539e5a09d6a7aa659555efccf0a09991fc04beda25f2905c0d9f125318 |
| 未取得 | s56q-f301f8539e5a-p4-001 | private/考古題原始資料/2024解剖學期末試卷(一).pdf | 4 | needs_human_review | f301f8539e5a09d6a7aa659555efccf0a09991fc04beda25f2905c0d9f125318 |
| 未取得 | s56q-f301f8539e5a-p4-002 | private/考古題原始資料/2024解剖學期末試卷(一).pdf | 4 | duplicate_candidate | f301f8539e5a09d6a7aa659555efccf0a09991fc04beda25f2905c0d9f125318 |
| 未取得 | s56q-f301f8539e5a-p4-003 | private/考古題原始資料/2024解剖學期末試卷(一).pdf | 4 | duplicate_candidate | f301f8539e5a09d6a7aa659555efccf0a09991fc04beda25f2905c0d9f125318 |
| 未取得 | s56q-f301f8539e5a-p5-001 | private/考古題原始資料/2024解剖學期末試卷(一).pdf | 5 | duplicate_candidate | f301f8539e5a09d6a7aa659555efccf0a09991fc04beda25f2905c0d9f125318 |
| 未取得 | s56q-f301f8539e5a-p5-002 | private/考古題原始資料/2024解剖學期末試卷(一).pdf | 5 | duplicate_candidate | f301f8539e5a09d6a7aa659555efccf0a09991fc04beda25f2905c0d9f125318 |
| 未取得 | s56q-f301f8539e5a-p5-003 | private/考古題原始資料/2024解剖學期末試卷(一).pdf | 5 | needs_human_review | f301f8539e5a09d6a7aa659555efccf0a09991fc04beda25f2905c0d9f125318 |
| 未取得 | s56q-f301f8539e5a-p6-001 | private/考古題原始資料/2024解剖學期末試卷(一).pdf | 6 | needs_human_review | f301f8539e5a09d6a7aa659555efccf0a09991fc04beda25f2905c0d9f125318 |
| 未取得 | s56q-f301f8539e5a-p6-003 | private/考古題原始資料/2024解剖學期末試卷(一).pdf | 6 | needs_human_review | f301f8539e5a09d6a7aa659555efccf0a09991fc04beda25f2905c0d9f125318 |
| 未取得 | s56q-56f28886b8d7-p3-001 | private/考古題原始資料/2024解剖學期末試卷(一)解答.pdf | 3 | needs_human_review | 56f28886b8d71c0e103637d863fec105b9ab96d51a72c8fcd8ad9c064c3945e4 |
| 未取得 | s56q-56f28886b8d7-p3-002 | private/考古題原始資料/2024解剖學期末試卷(一)解答.pdf | 3 | needs_human_review | 56f28886b8d71c0e103637d863fec105b9ab96d51a72c8fcd8ad9c064c3945e4 |
| 未取得 | s56q-56f28886b8d7-p3-010 | private/考古題原始資料/2024解剖學期末試卷(一)解答.pdf | 3 | needs_human_review | 56f28886b8d71c0e103637d863fec105b9ab96d51a72c8fcd8ad9c064c3945e4 |
| 未取得 | s56q-56f28886b8d7-p4-001 | private/考古題原始資料/2024解剖學期末試卷(一)解答.pdf | 4 | needs_human_review | 56f28886b8d71c0e103637d863fec105b9ab96d51a72c8fcd8ad9c064c3945e4 |
| 未取得 | s56q-56f28886b8d7-p4-002 | private/考古題原始資料/2024解剖學期末試卷(一)解答.pdf | 4 | duplicate_candidate | 56f28886b8d71c0e103637d863fec105b9ab96d51a72c8fcd8ad9c064c3945e4 |
| 未取得 | s56q-56f28886b8d7-p4-003 | private/考古題原始資料/2024解剖學期末試卷(一)解答.pdf | 4 | needs_human_review | 56f28886b8d71c0e103637d863fec105b9ab96d51a72c8fcd8ad9c064c3945e4 |
| 未取得 | s56q-56f28886b8d7-p5-001 | private/考古題原始資料/2024解剖學期末試卷(一)解答.pdf | 5 | needs_human_review | 56f28886b8d71c0e103637d863fec105b9ab96d51a72c8fcd8ad9c064c3945e4 |
| 未取得 | s56q-56f28886b8d7-p5-002 | private/考古題原始資料/2024解剖學期末試卷(一)解答.pdf | 5 | duplicate_candidate | 56f28886b8d71c0e103637d863fec105b9ab96d51a72c8fcd8ad9c064c3945e4 |
| 未取得 | s56q-56f28886b8d7-p5-003 | private/考古題原始資料/2024解剖學期末試卷(一)解答.pdf | 5 | needs_human_review | 56f28886b8d71c0e103637d863fec105b9ab96d51a72c8fcd8ad9c064c3945e4 |
| 未取得 | s56q-56f28886b8d7-p5-007 | private/考古題原始資料/2024解剖學期末試卷(一)解答.pdf | 5 | needs_human_review | 56f28886b8d71c0e103637d863fec105b9ab96d51a72c8fcd8ad9c064c3945e4 |
| 未取得 | s56q-56f28886b8d7-p6-001 | private/考古題原始資料/2024解剖學期末試卷(一)解答.pdf | 6 | needs_human_review | 56f28886b8d71c0e103637d863fec105b9ab96d51a72c8fcd8ad9c064c3945e4 |
| 未取得 | s56q-56f28886b8d7-p6-007 | private/考古題原始資料/2024解剖學期末試卷(一)解答.pdf | 6 | needs_human_review | 56f28886b8d71c0e103637d863fec105b9ab96d51a72c8fcd8ad9c064c3945e4 |
| 未取得 | s56q-49b6eee5eba8-p3-002 | private/考古題原始資料/2024解剖學期末試卷(三).pdf | 3 | needs_human_review | 49b6eee5eba8dbd307c8fa8556c3d967229239dd0293be44634f4a2a9b35d222 |
| 未取得 | s56q-49b6eee5eba8-p3-004 | private/考古題原始資料/2024解剖學期末試卷(三).pdf | 3 | needs_human_review | 49b6eee5eba8dbd307c8fa8556c3d967229239dd0293be44634f4a2a9b35d222 |
| 未取得 | s56q-49b6eee5eba8-p4-001 | private/考古題原始資料/2024解剖學期末試卷(三).pdf | 4 | duplicate_candidate | 49b6eee5eba8dbd307c8fa8556c3d967229239dd0293be44634f4a2a9b35d222 |
| 未取得 | s56q-49b6eee5eba8-p4-002 | private/考古題原始資料/2024解剖學期末試卷(三).pdf | 4 | needs_human_review | 49b6eee5eba8dbd307c8fa8556c3d967229239dd0293be44634f4a2a9b35d222 |
| 未取得 | s56q-49b6eee5eba8-p4-003 | private/考古題原始資料/2024解剖學期末試卷(三).pdf | 4 | needs_human_review | 49b6eee5eba8dbd307c8fa8556c3d967229239dd0293be44634f4a2a9b35d222 |
| 未取得 | s56q-49b6eee5eba8-p4-004 | private/考古題原始資料/2024解剖學期末試卷(三).pdf | 4 | duplicate_candidate | 49b6eee5eba8dbd307c8fa8556c3d967229239dd0293be44634f4a2a9b35d222 |
| 未取得 | s56q-49b6eee5eba8-p5-002 | private/考古題原始資料/2024解剖學期末試卷(三).pdf | 5 | needs_human_review | 49b6eee5eba8dbd307c8fa8556c3d967229239dd0293be44634f4a2a9b35d222 |
| 未取得 | s56q-49b6eee5eba8-p5-003 | private/考古題原始資料/2024解剖學期末試卷(三).pdf | 5 | needs_human_review | 49b6eee5eba8dbd307c8fa8556c3d967229239dd0293be44634f4a2a9b35d222 |
| 未取得 | s56q-49b6eee5eba8-p5-004 | private/考古題原始資料/2024解剖學期末試卷(三).pdf | 5 | needs_human_review | 49b6eee5eba8dbd307c8fa8556c3d967229239dd0293be44634f4a2a9b35d222 |
| 未取得 | s56q-49b6eee5eba8-p6-001 | private/考古題原始資料/2024解剖學期末試卷(三).pdf | 6 | needs_human_review | 49b6eee5eba8dbd307c8fa8556c3d967229239dd0293be44634f4a2a9b35d222 |
| 未取得 | s56q-49b6eee5eba8-p6-003 | private/考古題原始資料/2024解剖學期末試卷(三).pdf | 6 | needs_human_review | 49b6eee5eba8dbd307c8fa8556c3d967229239dd0293be44634f4a2a9b35d222 |
| 未取得 | s56q-cf62f64a5071-p3-002 | private/考古題原始資料/2024解剖學期末試卷(二).pdf | 3 | needs_human_review | cf62f64a50715ee2e408056d5f43348b2c507f127bc1ca9df63a29c654f5d3d6 |
| 未取得 | s56q-cf62f64a5071-p3-003 | private/考古題原始資料/2024解剖學期末試卷(二).pdf | 3 | needs_human_review | cf62f64a50715ee2e408056d5f43348b2c507f127bc1ca9df63a29c654f5d3d6 |
| 未取得 | s56q-cf62f64a5071-p3-004 | private/考古題原始資料/2024解剖學期末試卷(二).pdf | 3 | needs_human_review | cf62f64a50715ee2e408056d5f43348b2c507f127bc1ca9df63a29c654f5d3d6 |
| 未取得 | s56q-cf62f64a5071-p3-005 | private/考古題原始資料/2024解剖學期末試卷(二).pdf | 3 | needs_human_review | cf62f64a50715ee2e408056d5f43348b2c507f127bc1ca9df63a29c654f5d3d6 |
| 未取得 | s56q-cf62f64a5071-p3-006 | private/考古題原始資料/2024解剖學期末試卷(二).pdf | 3 | needs_human_review | cf62f64a50715ee2e408056d5f43348b2c507f127bc1ca9df63a29c654f5d3d6 |
| 未取得 | s56q-cf62f64a5071-p4-001 | private/考古題原始資料/2024解剖學期末試卷(二).pdf | 4 | needs_human_review | cf62f64a50715ee2e408056d5f43348b2c507f127bc1ca9df63a29c654f5d3d6 |
| 未取得 | s56q-cf62f64a5071-p4-002 | private/考古題原始資料/2024解剖學期末試卷(二).pdf | 4 | needs_human_review | cf62f64a50715ee2e408056d5f43348b2c507f127bc1ca9df63a29c654f5d3d6 |
| 未取得 | s56q-cf62f64a5071-p4-003 | private/考古題原始資料/2024解剖學期末試卷(二).pdf | 4 | needs_human_review | cf62f64a50715ee2e408056d5f43348b2c507f127bc1ca9df63a29c654f5d3d6 |
| 未取得 | s56q-cf62f64a5071-p4-004 | private/考古題原始資料/2024解剖學期末試卷(二).pdf | 4 | needs_human_review | cf62f64a50715ee2e408056d5f43348b2c507f127bc1ca9df63a29c654f5d3d6 |
| 未取得 | s56q-cf62f64a5071-p4-005 | private/考古題原始資料/2024解剖學期末試卷(二).pdf | 4 | needs_human_review | cf62f64a50715ee2e408056d5f43348b2c507f127bc1ca9df63a29c654f5d3d6 |
| 未取得 | s56q-cf62f64a5071-p5-001 | private/考古題原始資料/2024解剖學期末試卷(二).pdf | 5 | needs_human_review | cf62f64a50715ee2e408056d5f43348b2c507f127bc1ca9df63a29c654f5d3d6 |
| 未取得 | s56q-cf62f64a5071-p5-002 | private/考古題原始資料/2024解剖學期末試卷(二).pdf | 5 | needs_human_review | cf62f64a50715ee2e408056d5f43348b2c507f127bc1ca9df63a29c654f5d3d6 |
| 未取得 | s56q-cf62f64a5071-p5-003 | private/考古題原始資料/2024解剖學期末試卷(二).pdf | 5 | needs_human_review | cf62f64a50715ee2e408056d5f43348b2c507f127bc1ca9df63a29c654f5d3d6 |
| 未取得 | s56q-cf62f64a5071-p5-005 | private/考古題原始資料/2024解剖學期末試卷(二).pdf | 5 | needs_human_review | cf62f64a50715ee2e408056d5f43348b2c507f127bc1ca9df63a29c654f5d3d6 |
| 未取得 | s56q-cf62f64a5071-p7-002 | private/考古題原始資料/2024解剖學期末試卷(二).pdf | 7 | needs_human_review | cf62f64a50715ee2e408056d5f43348b2c507f127bc1ca9df63a29c654f5d3d6 |
| 未取得 | s56q-787a0dc734db-p2-001 | private/考古題原始資料/2024解剖學期末試卷(四)解答.pdf | 2 | needs_human_review | 787a0dc734db54be0268cdafcc4d4840e527d1fb9898497c00f263b8cd624245 |
| 未取得 | s56q-787a0dc734db-p2-002 | private/考古題原始資料/2024解剖學期末試卷(四)解答.pdf | 2 | needs_human_review | 787a0dc734db54be0268cdafcc4d4840e527d1fb9898497c00f263b8cd624245 |
| 未取得 | s56q-787a0dc734db-p2-003 | private/考古題原始資料/2024解剖學期末試卷(四)解答.pdf | 2 | needs_human_review | 787a0dc734db54be0268cdafcc4d4840e527d1fb9898497c00f263b8cd624245 |
| 未取得 | s56q-787a0dc734db-p2-006 | private/考古題原始資料/2024解剖學期末試卷(四)解答.pdf | 2 | needs_human_review | 787a0dc734db54be0268cdafcc4d4840e527d1fb9898497c00f263b8cd624245 |
| 未取得 | s56q-787a0dc734db-p2-007 | private/考古題原始資料/2024解剖學期末試卷(四)解答.pdf | 2 | needs_human_review | 787a0dc734db54be0268cdafcc4d4840e527d1fb9898497c00f263b8cd624245 |
| 未取得 | s56q-787a0dc734db-p2-008 | private/考古題原始資料/2024解剖學期末試卷(四)解答.pdf | 2 | needs_human_review | 787a0dc734db54be0268cdafcc4d4840e527d1fb9898497c00f263b8cd624245 |
| 未取得 | s56q-787a0dc734db-p4-001 | private/考古題原始資料/2024解剖學期末試卷(四)解答.pdf | 4 | needs_human_review | 787a0dc734db54be0268cdafcc4d4840e527d1fb9898497c00f263b8cd624245 |
| 未取得 | s56q-787a0dc734db-p4-002 | private/考古題原始資料/2024解剖學期末試卷(四)解答.pdf | 4 | needs_human_review | 787a0dc734db54be0268cdafcc4d4840e527d1fb9898497c00f263b8cd624245 |
| 未取得 | s56q-787a0dc734db-p4-003 | private/考古題原始資料/2024解剖學期末試卷(四)解答.pdf | 4 | needs_human_review | 787a0dc734db54be0268cdafcc4d4840e527d1fb9898497c00f263b8cd624245 |
| 未取得 | s56q-787a0dc734db-p4-004 | private/考古題原始資料/2024解剖學期末試卷(四)解答.pdf | 4 | needs_human_review | 787a0dc734db54be0268cdafcc4d4840e527d1fb9898497c00f263b8cd624245 |
| 未取得 | s56q-787a0dc734db-p4-005 | private/考古題原始資料/2024解剖學期末試卷(四)解答.pdf | 4 | needs_human_review | 787a0dc734db54be0268cdafcc4d4840e527d1fb9898497c00f263b8cd624245 |
| 未取得 | s56q-787a0dc734db-p4-006 | private/考古題原始資料/2024解剖學期末試卷(四)解答.pdf | 4 | needs_human_review | 787a0dc734db54be0268cdafcc4d4840e527d1fb9898497c00f263b8cd624245 |
| 未取得 | s56q-787a0dc734db-p4-007 | private/考古題原始資料/2024解剖學期末試卷(四)解答.pdf | 4 | needs_human_review | 787a0dc734db54be0268cdafcc4d4840e527d1fb9898497c00f263b8cd624245 |
| 未取得 | s56q-787a0dc734db-p5-001 | private/考古題原始資料/2024解剖學期末試卷(四)解答.pdf | 5 | needs_human_review | 787a0dc734db54be0268cdafcc4d4840e527d1fb9898497c00f263b8cd624245 |
| 未取得 | s56q-787a0dc734db-p5-010 | private/考古題原始資料/2024解剖學期末試卷(四)解答.pdf | 5 | needs_human_review | 787a0dc734db54be0268cdafcc4d4840e527d1fb9898497c00f263b8cd624245 |
| 未取得 | s56q-787a0dc734db-p5-011 | private/考古題原始資料/2024解剖學期末試卷(四)解答.pdf | 5 | needs_human_review | 787a0dc734db54be0268cdafcc4d4840e527d1fb9898497c00f263b8cd624245 |
| 未取得 | s56q-21efce98110e-p1-002 | external/00_原始備份_不可修改/新建文件夹 (2)/ifa考前物资/爱芙悦个案研究与论文写作导读.pdf | 1 | duplicate_candidate | 21efce98110eca8de5668fbbb3bce6b68617f0acef4600de79ab2a0d3b275cce |
| 未取得 | s56q-d6135c9a85f4-p3-002 | external/00_原始備份_不可修改/新建文件夹 (2)/其他/第四周作业补充资料.pdf | 3 | duplicate_candidate | d6135c9a85f44ae552ade4d16092f09ce5dbfe00834d906862c0cf1f7a1b8edd |
| 未取得 | s56q-aaa08379f7ad-p2-001 | external/00_原始備份_不可修改/新建文件夹 (2)/考前集训题/考试生理辅导必修题.pdf | 2 | duplicate_candidate | aaa08379f7ad287920440a6a22a2c903b9a7c3f64a5b22c65badb9f4a6c326fc |
| 未取得 | s56q-aaa08379f7ad-p4-003 | external/00_原始備份_不可修改/新建文件夹 (2)/考前集训题/考试生理辅导必修题.pdf | 4 | duplicate_candidate | aaa08379f7ad287920440a6a22a2c903b9a7c3f64a5b22c65badb9f4a6c326fc |
| 未取得 | s56q-aaa08379f7ad-p12-003 | external/00_原始備份_不可修改/新建文件夹 (2)/考前集训题/考试生理辅导必修题.pdf | 12 | duplicate_candidate | aaa08379f7ad287920440a6a22a2c903b9a7c3f64a5b22c65badb9f4a6c326fc |
| 未取得 | s56q-aaa08379f7ad-p17-003 | external/00_原始備份_不可修改/新建文件夹 (2)/考前集训题/考试生理辅导必修题.pdf | 17 | duplicate_candidate | aaa08379f7ad287920440a6a22a2c903b9a7c3f64a5b22c65badb9f4a6c326fc |
| 未取得 | s56q-aaa08379f7ad-p23-002 | external/00_原始備份_不可修改/新建文件夹 (2)/考前集训题/考试生理辅导必修题.pdf | 23 | duplicate_candidate | aaa08379f7ad287920440a6a22a2c903b9a7c3f64a5b22c65badb9f4a6c326fc |
| 未取得 | s56q-21efce98110e-p1-002 | external/新建文件夹 (2)/ifa考前物资/爱芙悦个案研究与论文写作导读.pdf | 1 | duplicate_candidate | 21efce98110eca8de5668fbbb3bce6b68617f0acef4600de79ab2a0d3b275cce |
| 未取得 | s56q-d6135c9a85f4-p3-002 | external/新建文件夹 (2)/其他/第四周作业补充资料.pdf | 3 | duplicate_candidate | d6135c9a85f44ae552ade4d16092f09ce5dbfe00834d906862c0cf1f7a1b8edd |
| 未取得 | s56q-aaa08379f7ad-p2-001 | external/新建文件夹 (2)/考前集训题/考试生理辅导必修题.pdf | 2 | duplicate_candidate | aaa08379f7ad287920440a6a22a2c903b9a7c3f64a5b22c65badb9f4a6c326fc |
| 未取得 | s56q-aaa08379f7ad-p4-003 | external/新建文件夹 (2)/考前集训题/考试生理辅导必修题.pdf | 4 | duplicate_candidate | aaa08379f7ad287920440a6a22a2c903b9a7c3f64a5b22c65badb9f4a6c326fc |
| 未取得 | s56q-aaa08379f7ad-p12-003 | external/新建文件夹 (2)/考前集训题/考试生理辅导必修题.pdf | 12 | duplicate_candidate | aaa08379f7ad287920440a6a22a2c903b9a7c3f64a5b22c65badb9f4a6c326fc |
| 未取得 | s56q-aaa08379f7ad-p17-003 | external/新建文件夹 (2)/考前集训题/考试生理辅导必修题.pdf | 17 | duplicate_candidate | aaa08379f7ad287920440a6a22a2c903b9a7c3f64a5b22c65badb9f4a6c326fc |
| 未取得 | s56q-aaa08379f7ad-p23-002 | external/新建文件夹 (2)/考前集训题/考试生理辅导必修题.pdf | 23 | duplicate_candidate | aaa08379f7ad287920440a6a22a2c903b9a7c3f64a5b22c65badb9f4a6c326fc |

## 7. Answers and formal-import decision

- Sprint 57 queue 中只有 24 筆 question record 被 Sprint 56 標為 `source_stated`；其餘 1107 筆維持 `unknown`。
- `answerSource` 只保留文件標示類型；本輸出不帶答案文字，也不會以教材常識、檔名或模型推論補答案。
- `formalAddableCount=0`：沒有任何 candidate 同時通過人工來源頁／版本、答案、題型、風險、圖片與重複核對，因此本 Sprint 不產生 canonical question patch。

## 8. Next Sprint recommendation

1. 先人工核對 strict historical sources 與 final exam sources，逐題補 source page、exam version/date、answer basis、reviewer 與 decision。
2. 優先處理無圖片且答案明示的教材 candidate；確認其是否真為正式考題，否則維持 textbook practice。
3. 對 image inventory 逐頁建立 approved asset mapping；完成前不得把依賴圖片的題目送入 Formal。
4. 完成 duplicate group decision 後，再由獨立 Sprint 建立 canonical import patch；本 Sprint 不新增 question ID、不修改 runtime。

## 9. Output files

- `docs/sprint57_past_exam_review.md`
- `docs/sprint57_formal_candidate_queue.json`
- `scripts/sprint57-past-exam-review.py`
- Input only: `docs/sprint56_past_exam_extractions.json`（local ignored artifact; not committed）

Formal files read: week1.json, week2.json, verified-extra.json, source-verified.json, source-verified-sprint36.json, source-verified-sprint37.json; Formal baseline: 285 questions.
