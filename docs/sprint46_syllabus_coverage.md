# Sprint 46 Syllabus Coverage

> 掃描日期：2026-07-22（Asia/Taipei）
> 範圍：formal pool 285 題、`src/data/knowledge/week1-knowledge.json` 的 20 個 knowledge item。
> 注意：目前 repo 沒有正式考試 blueprint 的 topic 配額，因此本報告分開呈現「現有 category 分布」與「knowledgeId 可追溯 coverage」。

## 一、現有 category coverage

| Category | 題數 | 比例 | Coverage 判定 |
|---|---:|---:|---|
| 植物油／基底油 | 54 | 18.9% | 過度集中候選 |
| 解剖生理 | 49 | 17.2% | 過度集中候選 |
| 精油化學 | 31 | 10.9% | 過度集中候選 |
| 安全禁忌 | 28 | 9.8% | 接近集中警戒線 |
| 配方濃度與稀釋 | 19 | 6.7% | 中等 |
| 精油基礎 | 14 | 4.9% | 中等 |
| 職業倫理 | 12 | 4.2% | 中低 |
| 孕婦安全 | 9 | 3.2% | 中低 |
| 兒童安全 | 8 | 2.8% | 中低 |
| 諮詢流程 | 8 | 2.8% | 中低 |
| 用藥詢問 | 8 | 2.8% | 中低 |
| 疾病與轉介 | 8 | 2.8% | 中低 |
| 考古題 | 6 | 2.1% | 低 |
| 精油個論 | 6 | 2.1% | 低 |
| 按摩與實務 | 5 | 1.8% | 低 |
| 心血管 | 4 | 1.4% | 低 |
| 神經 | 4 | 1.4% | 低 |
| 內分泌 | 4 | 1.4% | 低 |
| 生理學 | 3 | 1.1% | 低 |
| 泌尿 | 2 | 0.7% | 低 |
| 人體解剖 | 2 | 0.7% | 低 |
| 淋巴 | 1 | 0.4% | 缺口候選 |

本報告使用相對門檻：大於 10% 標為過度集中候選；低於 1% 標為缺口候選。這不是正式 blueprint 判定，因為目前沒有取得考試官方 topic weights。

## 二、Knowledge syllabus mapping

`week1-knowledge.json` 共有 20 個 knowledge item，但 formal pool 只有 41 / 285 題帶有 `knowledgeId`；244 題 source-verified 題沒有可直接連到 knowledge item 的 ID。

| Mapping 結果 | 題數／項目 | 意義 |
|---|---:|---|
| formal 題有 `knowledgeId` | 41 / 285 | 可直接追溯到 knowledge item |
| formal 題無 `knowledgeId` | 244 / 285 | 主要為 source-verified，需補 mapping 才能做 syllabus-level coverage |
| knowledge item 有題目 | 19 / 20 | 至少有一題對應 |
| knowledge item 無題目 | 1 / 20 | `LY002`：淋巴液單向流動與四大動力機制 |

目前已 mapping 的 19 個 knowledge item 多為每項 1 題，`EN002` 有 2 題；因此 `knowledgeId` coverage 目前只能作為 mapping completeness，不應被當成完整題數配額。

## 三、Coverage 缺口

### P0：無法判定的 coverage

244 題 source-verified 缺少 `knowledgeId`。在完成 source-to-knowledge mapping 前，無法回答這些題目是否覆蓋既有 syllabus、是否只是同一主題變體，或是否集中於教材單一段落。

### P1：已知低 coverage

`LY002` 沒有任何 formal 題對應。由於沒有官方 blueprint，暫時列為 review／mapping gap，不自動新增題目。

### P1：category 過度集中

植物油／基底油 54 題、解剖生理 49 題、精油化學 31 題合計 134 題，占 formal pool 47.0%。需要依 syllabus 權重確認是否合理，不能直接刪題或降權。

### P2：低量 topic

淋巴、泌尿、人體解剖各僅 1–2 題；心血管、神經、內分泌、生理學也低於 5 題。這些是 coverage review 候選，不代表內容一定缺失，因為部分內容可能被合併標記為解剖生理。

## 四、下一階段校準順序

1. 建立 source question → `knowledgeId` 的人工 mapping，不改題幹與答案。
2. 取得或確認正式 exam blueprint 的 topic weights。
3. 用 blueprint 與 mapping 計算 expected／actual／gap，而不是用題數直覺刪補。
4. 針對 over-concentrated 題群做 duplicate、difficulty、source evidence 三重 review。
5. 對 P0/P1 gap 只建立候選清單，不自動生成或加入正式池。
