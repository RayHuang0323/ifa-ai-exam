# Sprint 56：Past Exam Coverage

> 產生日期：2026-07-23；所有 candidate 仍為 `pending_review`。
> Formal coverage 使用現有 `week1.json`、`week2.json`、`source-verified*.json`；候選 exact match 只表示文字相同，不表示來源與答案已驗證。

## 1. Formal baseline

| Formal 指標 | 題數 |
|---|---:|
| Formal pool | 285 |
| official_exam | 25 |
| textbook | 259 |
| unknown／其他 | 1 |

## 2. Candidate coverage

| 指標 | 數量 | 說明 |
|---|---:|---|
| exam-like source documents | 157 | Sprint 55 suspected exam-related |
| official_exam_candidate documents | 16 | 歷屆／期末／teacher exam-like 候選 |
| textbook_exam_candidate documents | 52 | workbook／練習／作業候選 |
| practice_only documents | 72 | mock／模擬題，只作練習候選 |
| unknown documents | 17 | 需要人工判斷來源層級 |
| extracted question-like records | 882 | 有題號／Q boundary 且具題目訊號的片段 |
| low-signal numbered fragments | 1240 | 保留在 queue，但不計入 question coverage |
| unique extracted questions | 730 | 以 normalized 題幹去重 |
| exact match with Formal | 0 | 不新增、不覆蓋 Formal |
| not currently in Formal | 730 | 只能進 review queue，不能直接匯入 |
| cross-source duplicate occurrences | 152 | 同一 normalized 題幹的額外來源出現次數 |
| review queue entries | 2433 | 全部 `pending_review`，含無法抽取／圖片-only 文件 |
| source documents with images | 77 | 來源檔含圖片或 Sprint 55 標記含圖片 |
| extracted question records with images | 543 | 圖片尚未 OCR，也未複製到 asset directory |
| answer explicitly stated | 18 | 僅保留文件明示答案與 answer_source |
| answer unknown | 864 | 不猜答案，待人工確認 |

## 3. 問題回答

1. **尚未進入 Formal：730 個 unique extracted question candidate。** 這是 exact normalized text 對照結果，不是完整原始文件題數；DOC/DOCX、圖片題與無法辨識題號的檔案仍需人工 review。
2. **重複：0 個 candidate group 與 Formal exact match；另有 152 次跨來源重複出現。** pipeline 只記錄 duplicate lineage，不刪除或合併來源。
3. **需要人工確認：2433 筆 review queue entry。** 所有 entry 維持 `pending_review`，含答案未知、source page 待補、圖片、mock 與 extraction boundary 不確定項。
4. **圖片：77 個來源文件、543 筆可辨識題目帶圖片。** 詳細來源與頁面見 review queue；目前 `extractedAsset=null`，沒有把圖片塞入題庫 JSON。

## 4. Formal exact-match candidates

| candidate question | source file | page | Formal IDs | category | answer status | has image |
|---|---|---:|---|---|---|---|
| （目前沒有 exact normalized match） |  |  |  |  |  |  |

## 5. Image-bearing candidate sources

| source file | category | queue entries with image metadata | pages observed | asset status |
|---|---|---:|---|---|
| external/00_原始備份_不可修改/新建文件夹 (2)/IFA笔记总结/副本病理学复习 .docx | textbook_exam_candidate | 1 | 未取得 | metadata only; extractedAsset=null |
| external/00_原始備份_不可修改/新建文件夹 (2)/IFA笔记总结/副本芳香理论模拟考题一.docx | practice_only | 1 | 未取得 | metadata only; extractedAsset=null |
| external/00_原始備份_不可修改/新建文件夹 (2)/IFA笔记总结/副本芳香理论模拟题第三套.docx | practice_only | 1 | 未取得 | metadata only; extractedAsset=null |
| external/00_原始備份_不可修改/新建文件夹 (2)/IFA笔记总结/副本解剖复习与模拟5套.docx | practice_only | 1 | 未取得 | metadata only; extractedAsset=null |
| external/00_原始備份_不可修改/新建文件夹 (2)/IFA笔记总结/模拟.docx | practice_only | 1 | 未取得 | metadata only; extractedAsset=null |
| external/00_原始備份_不可修改/新建文件夹 (2)/IFA笔记总结/解剖学与生理学复习五（答案） .docx | textbook_exam_candidate | 1 | 未取得 | metadata only; extractedAsset=null |
| external/00_原始備份_不可修改/新建文件夹 (2)/ifa考前物资/爱芙悦个案研究与论文写作导读.pdf | textbook_exam_candidate | 4 | 1, 6 | metadata only; extractedAsset=null |
| external/00_原始備份_不可修改/新建文件夹 (2)/其他/第四周作业补充资料.pdf | textbook_exam_candidate | 5 | 1, 2, 3 | metadata only; extractedAsset=null |
| external/00_原始備份_不可修改/新建文件夹 (2)/十几份试题模拟卷带答案/第12周.docx | practice_only | 1 | 未取得 | metadata only; extractedAsset=null |
| external/00_原始備份_不可修改/新建文件夹 (2)/十几份试题模拟卷带答案/第一周.docx | practice_only | 1 | 未取得 | metadata only; extractedAsset=null |
| external/00_原始備份_不可修改/新建文件夹 (2)/十几份试题模拟卷带答案/第七周作业.docx | practice_only | 1 | 未取得 | metadata only; extractedAsset=null |
| external/00_原始備份_不可修改/新建文件夹 (2)/十几份试题模拟卷带答案/第三周复习作业（答案版）(1)(1)(1).docx | practice_only | 1 | 未取得 | metadata only; extractedAsset=null |
| external/00_原始備份_不可修改/新建文件夹 (2)/十几份试题模拟卷带答案/第六周作业（答案）(1).docx | practice_only | 1 | 未取得 | metadata only; extractedAsset=null |
| external/00_原始備份_不可修改/新建文件夹 (2)/考前集训题/IFA复习作业第7周.docx | textbook_exam_candidate | 1 | 未取得 | metadata only; extractedAsset=null |
| external/00_原始備份_不可修改/新建文件夹 (2)/考前集训题/考试生理辅导必修题.pdf | textbook_exam_candidate | 58 | 1, 2, 4, 6, 7, 8, 10, 11, 12, 14, 15, 16, 17, 19, 20, 22, 23, 24 | metadata only; extractedAsset=null |
| external/00_原始備份_不可修改/新建文件夹 (2)/考前集训题/芳疗按摩商业实践辅导必修题.pdf | textbook_exam_candidate | 1 | 1 | metadata only; extractedAsset=null |
| external/00_原始備份_不可修改/新建文件夹 (2)/考点总结/芳香疗法应用科学知识点(2).docx | unknown | 1 | 未取得 | metadata only; extractedAsset=null |
| external/01_已分類教材/模擬題/IFA复习作业第7周.docx | practice_only | 1 | 未取得 | metadata only; extractedAsset=null |
| external/01_已分類教材/模擬題/IFA第一阶段第1周单方精油学习.pdf | practice_only | 8 | 1, 2, 5, 6, 9, 10, 13, 14 | metadata only; extractedAsset=null |
| external/01_已分類教材/模擬題/IFA第一阶段第2周单方精油学习.pdf | practice_only | 7 | 1, 2, 5, 6, 9, 12, 13 | metadata only; extractedAsset=null |
| external/01_已分類教材/模擬題/IFA第一阶段第3周单方精油学习.pdf | practice_only | 6 | 1, 2, 3, 4, 5, 8 | metadata only; extractedAsset=null |
| external/01_已分類教材/模擬題/IFA第一阶段第4周单方精油学习 .pdf | practice_only | 5 | 1, 2, 3, 4, 7 | metadata only; extractedAsset=null |
| external/01_已分類教材/模擬題/IFA第一阶段第5周单方精油学习.pdf | practice_only | 5 | 1, 3, 6, 9, 10 | metadata only; extractedAsset=null |
| external/01_已分類教材/模擬題/IFA第一阶段第6周单方精油学习.pdf | practice_only | 5 | 1, 4, 5, 8, 11 | metadata only; extractedAsset=null |
| external/01_已分類教材/模擬題/IFA第一阶段第7周单方精油学习.pdf | practice_only | 4 | 1, 4, 7, 10 | metadata only; extractedAsset=null |
| external/01_已分類教材/模擬題/副本芳香理论模拟考题一.docx | practice_only | 1 | 未取得 | metadata only; extractedAsset=null |
| external/01_已分類教材/模擬題/副本芳香理论模拟题第三套.docx | practice_only | 1 | 未取得 | metadata only; extractedAsset=null |
| external/01_已分類教材/模擬題/副本解剖复习与模拟5套.docx | practice_only | 1 | 未取得 | metadata only; extractedAsset=null |
| external/01_已分類教材/模擬題/模拟.docx | practice_only | 1 | 未取得 | metadata only; extractedAsset=null |
| external/01_已分類教材/模擬題/第12周.docx | practice_only | 1 | 未取得 | metadata only; extractedAsset=null |
| external/01_已分類教材/模擬題/第一周.docx | practice_only | 1 | 未取得 | metadata only; extractedAsset=null |
| external/01_已分類教材/模擬題/第七周作业.docx | practice_only | 1 | 未取得 | metadata only; extractedAsset=null |
| external/01_已分類教材/模擬題/第三周复习作业（答案版）(1)(1)(1).docx | practice_only | 1 | 未取得 | metadata only; extractedAsset=null |
| external/01_已分類教材/模擬題/第六周作业（答案）(1).docx | practice_only | 1 | 未取得 | metadata only; extractedAsset=null |
| external/01_已分類教材/模擬題/第四周作业补充资料.pdf | practice_only | 5 | 1, 2, 3 | metadata only; extractedAsset=null |
| external/01_已分類教材/模擬題/考试生理辅导必修题.pdf | practice_only | 58 | 1, 2, 4, 6, 7, 8, 10, 11, 12, 14, 15, 16, 17, 19, 20, 22, 23, 24 | metadata only; extractedAsset=null |
| external/01_已分類教材/模擬題/芳疗按摩商业实践辅导必修题.pdf | practice_only | 1 | 1 | metadata only; extractedAsset=null |
| external/01_已分類教材/病理與禁忌/副本病理学复习 .docx | textbook_exam_candidate | 1 | 未取得 | metadata only; extractedAsset=null |
| external/01_已分類教材/考古題/IFA 北京考題.docx | official_exam_candidate | 1 | 未取得 | metadata only; extractedAsset=null |
| external/01_已分類教材/解剖生理/解剖学与生理学复习五（答案） .docx | textbook_exam_candidate | 1 | 未取得 | metadata only; extractedAsset=null |
| external/新建文件夹 (2)/IFA笔记总结/副本病理学复习 .docx | textbook_exam_candidate | 1 | 未取得 | metadata only; extractedAsset=null |
| external/新建文件夹 (2)/IFA笔记总结/副本芳香理论模拟考题一.docx | practice_only | 1 | 未取得 | metadata only; extractedAsset=null |
| external/新建文件夹 (2)/IFA笔记总结/副本芳香理论模拟题第三套.docx | practice_only | 1 | 未取得 | metadata only; extractedAsset=null |
| external/新建文件夹 (2)/IFA笔记总结/副本解剖复习与模拟5套.docx | practice_only | 1 | 未取得 | metadata only; extractedAsset=null |
| external/新建文件夹 (2)/IFA笔记总结/模拟.docx | practice_only | 1 | 未取得 | metadata only; extractedAsset=null |
| external/新建文件夹 (2)/IFA笔记总结/解剖学与生理学复习五（答案） .docx | textbook_exam_candidate | 1 | 未取得 | metadata only; extractedAsset=null |
| external/新建文件夹 (2)/ifa考前物资/爱芙悦个案研究与论文写作导读.pdf | textbook_exam_candidate | 4 | 1, 6 | metadata only; extractedAsset=null |
| external/新建文件夹 (2)/其他/第四周作业补充资料.pdf | textbook_exam_candidate | 5 | 1, 2, 3 | metadata only; extractedAsset=null |
| external/新建文件夹 (2)/十几份试题模拟卷带答案/第12周.docx | practice_only | 1 | 未取得 | metadata only; extractedAsset=null |
| external/新建文件夹 (2)/十几份试题模拟卷带答案/第一周.docx | practice_only | 1 | 未取得 | metadata only; extractedAsset=null |
| external/新建文件夹 (2)/十几份试题模拟卷带答案/第七周作业.docx | practice_only | 1 | 未取得 | metadata only; extractedAsset=null |
| external/新建文件夹 (2)/十几份试题模拟卷带答案/第三周复习作业（答案版）(1)(1)(1).docx | practice_only | 1 | 未取得 | metadata only; extractedAsset=null |
| external/新建文件夹 (2)/十几份试题模拟卷带答案/第六周作业（答案）(1).docx | practice_only | 1 | 未取得 | metadata only; extractedAsset=null |
| external/新建文件夹 (2)/考前集训题/IFA复习作业第7周.docx | textbook_exam_candidate | 1 | 未取得 | metadata only; extractedAsset=null |
| external/新建文件夹 (2)/考前集训题/考试生理辅导必修题.pdf | textbook_exam_candidate | 58 | 1, 2, 4, 6, 7, 8, 10, 11, 12, 14, 15, 16, 17, 19, 20, 22, 23, 24 | metadata only; extractedAsset=null |
| external/新建文件夹 (2)/考前集训题/芳疗按摩商业实践辅导必修题.pdf | textbook_exam_candidate | 1 | 1 | metadata only; extractedAsset=null |
| external/新建文件夹 (2)/考点总结/芳香疗法应用科学知识点(2).docx | unknown | 1 | 未取得 | metadata only; extractedAsset=null |
| private/考古題原始資料/2024芳香按摩學期末試卷(一).pdf | official_exam_candidate | 25 | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 | metadata only; extractedAsset=null |
| private/考古題原始資料/2024芳香按摩學期末試卷(三).pdf | official_exam_candidate | 27 | 1, 2, 3, 4, 5, 6, 7, 8 | metadata only; extractedAsset=null |
| private/考古題原始資料/2024芳香按摩學期末試卷(二).pdf | official_exam_candidate | 31 | 1, 2, 3, 4, 5, 6, 7, 8, 9 | metadata only; extractedAsset=null |
| private/考古題原始資料/2024解剖學期末試卷(一).pdf | official_exam_candidate | 16 | 1, 2, 3, 4, 5, 6 | metadata only; extractedAsset=null |
| private/考古題原始資料/2024解剖學期末試卷(一)解答.pdf | official_exam_candidate | 30 | 1, 2, 3, 4, 5, 6 | metadata only; extractedAsset=null |
| private/考古題原始資料/2024解剖學期末試卷(三).pdf | official_exam_candidate | 17 | 1, 2, 3, 4, 5, 6 | metadata only; extractedAsset=null |
| private/考古題原始資料/2024解剖學期末試卷(二).pdf | official_exam_candidate | 25 | 1, 2, 3, 4, 5, 6, 7 | metadata only; extractedAsset=null |
| private/考古題原始資料/2024解剖學期末試卷(四)解答.pdf | official_exam_candidate | 27 | 1, 2, 4, 5 | metadata only; extractedAsset=null |
| private/考古題原始資料/IFA全科試卷範例.pdf | practice_only | 9 | 1, 8, 9 | metadata only; extractedAsset=null |
| private/考古題原始資料/IFA按摩試卷範例.pdf | practice_only | 1 | 1 | metadata only; extractedAsset=null |
| private/考古題原始資料/IFA植物學_考古題參考_2024.pdf | official_exam_candidate | 4 | 1, 2, 3, 4 | metadata only; extractedAsset=null |
| private/考古題原始資料/IFA精油化學與品質鑑定_考古題參考_2024.pdf | official_exam_candidate | 5 | 1, 2, 3, 4, 5 | metadata only; extractedAsset=null |
| private/考古題原始資料/IFA總題型範例Q_A_v7.2024.pdf | practice_only | 366 | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58 | metadata only; extractedAsset=null |
| private/考古題原始資料/內分泌系統_李仁愛.pdf | unknown | 4 | 1, 2, 3, 4 | metadata only; extractedAsset=null |
| private/考古題原始資料/按摩學範例題型Q_A_v3.2024.pdf | practice_only | 33 | 1, 2, 3, 4, 5 | metadata only; extractedAsset=null |
| private/考古題原始資料/生理解剖學概論~皮膚系統.pdf | unknown | 47 | 1, 2, 4, 5, 6, 7, 8, 10, 11, 12, 13, 15, 16, 17, 19, 20 | metadata only; extractedAsset=null |
| private/考古題原始資料/秉精油學期中整理.pdf | unknown | 11 | 1, 2, 3, 4, 5, 7, 8, 9, 10, 11, 12 | metadata only; extractedAsset=null |
| private/考古題原始資料/芳療學.pdf | unknown | 24 | 1, 3, 4, 5, 6, 7, 8, 11, 12, 13, 14, 15, 16, 17 | metadata only; extractedAsset=null |
| private/考古題原始資料/解剖學範例題型_題目版.pdf | practice_only | 12 | 9, 10, 11 | metadata only; extractedAsset=null |
| private/考古題原始資料/解剖學題型彙整_v3.2024.pdf | practice_only | 194 | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26 | metadata only; extractedAsset=null |
