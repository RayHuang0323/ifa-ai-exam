# Sprint 44 AI Review Plan

> 目的：準備未來題庫 AI 審核的輸入、判定與人工覆核流程。
> 本文件是規劃，不代表本 Sprint 已執行 AI 審核，也不會自動修改題庫。

## 一、審核範圍與原則

優先順序：`pending-review.json` → `week2.staging.json` → `exam-practice.json` 中的 `needs_review` 題目 → 正式題庫的定期抽樣複核。

AI 只能提出 review suggestion，不能直接：

- 改寫題目文字、選項、答案或解析。
- 補造不存在的教材來源、頁碼或 evidence。
- 將 candidate 自動提升為正式考試題。
- 取代安全、禁忌、濃度、孕婦／兒童、疾病與轉介等高風險題目的人工判定。

每次審核都要保留題目 ID、原始資料 hash、資料檔案、審核版本、模型版本、suggestion、人工決定與時間戳，讓結果可重現、可回溯。

## 二、標準 review record

未來可用 JSONL 或等價表格保存一筆題目一筆結果：

```json
{
  "questionId": 40004,
  "sourceFile": "exam-practice.json",
  "sourceHash": "sha256:...",
  "reviewVersion": "sprint44-v1",
  "checks": {
    "answerVerification": "pass",
    "sourceConfirmation": "needs_human_review",
    "difficultyClassification": "suggested_3",
    "duplicateDetection": "possible_match"
  },
  "aiNotes": [],
  "humanDecision": "pending",
  "reviewedAt": null
}
```

欄位值應使用固定 enum，另保留 `reasonCodes` 與 evidence references；不要只保存一段不可解析的自然語言結論。

## 三、四項 AI 審核

### 1. 答案驗證

1. 先依 `type` 分流：單選、多選、短答、申論、案例。
2. 單選／多選檢查答案是否存在於 options、多選集合是否一致、干擾選項是否造成兩個合理答案。
3. 短答比對 `answer` 與 `referenceAnswer` 的核心概念，不能只用字串完全相等。
4. 申論／案例依 `referenceAnswer`、`keyPoints`、`rubric` 檢查必要概念、危險遺漏與評分邊界。
5. 健康安全題額外檢查禁忌、轉介、濃度與族群限制；任何不確定都標記人工覆核。

### 2. 來源確認

AI 只能使用題目提供的 `sourceLabel`、`sourceFile`、`sourcePage`、`sourceChapter`、`sourceVersion`、`sourceEvidenceIds`、`evidenceExcerpt` 與 `answerBasis`。

- 有可定位 evidence 且答案與 evidence 一致：`pass`。
- 來源存在但頁碼、版本或 evidence 不足：`needs_human_review`。
- 無來源或答案超出來源：`reject` 或 `downgrade_to_practice`。
- 不允許 AI 以常識或網路內容替代指定教材證據。

### 3. 難度分類

AI 先提出 1–5 級建議，人工確認後才回寫 metadata：

- 1：直接辨識、單一概念。
- 2：單一概念的理解或簡單應用。
- 3：多概念整合或一般情境判斷。
- 4：案例分析、風險辨識或多步驟推理。
- 5：高風險、跨章節或需要嚴格條件判斷。

建議必須附理由與依據，不能因題幹較長就直接判定為高難度。

### 4. 重複題偵測

分三層處理：

1. exact：題幹、選項與答案正規化後完全相同。
2. near：同義詞、標點、數字格式或繁簡字差異造成的近似。
3. semantic：題幹不同但考同一知識點、同一答案與同一 evidence。

AI 只建立 duplicate cluster 與相似理由；保留哪一題由人工依來源品質、正式／練習用途、ID 歷史與使用紀錄決定。

## 四、人工 gate 與輸出

建議的最終狀態：

```text
pass
needs_human_review
downgrade_to_practice
reject
duplicate_candidate
```

只有 `pass` 且通過人工 gate 的題目，才可進入下一次正式化批次。每次 promotion 前必須重跑題庫 schema、source evidence、answered-history lock、正式池與 bundle security 驗證。

本 Sprint 的實際決定是：建立 review plan、維持候選資料隔離、保留原始題庫與 metadata，不執行 AI 批次審核。
