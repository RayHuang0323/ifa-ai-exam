# Sprint 42.1 完成報告

## 狀態

Sprint 42.1 功能與驗證完成。本次未新增功能、未修改正式答案、未 commit、未 deploy。

## 修改內容

### 題目與顯示層

- 正式題池維持 285 題，其中 217 題完成 display refinement、68 題保留，41 題標記人工確認。
- 以 `displayQuestion` 提供學員看到的正式題幹；原始 `question`、`answer`、`evidenceExcerpt` 與 `answerBasis` 保留不變。
- 清理 AI／教材提示語、技術抽取位置與不自然句型；非選擇題補上定義、特性、用途／安全、比較分析或案例評估方向。
- Result 來源顯示教材名稱、章節、頁碼與版本；缺資料時使用安全 fallback，不顯示 `word/document.xml`、段落編號或 source id。

### 保護與驗證

- 保護已作答題核心欄位、source_verified evidence、Bella history、Apps Script 與 Answered Question Lock。
- 更新既有 Sprint 10.2 E2E 斷言，使其符合目前練習中心、Daily Task v2 與 285 題正式題池流程。
- 補齊 Sprint 40～42.1 的功能進度、Sprint 紀錄、Technical Debt 與 Roadmap 文件索引。

### Sprint 42.1 相關檔案

- 題目治理與 refinement：`src/utils/formalQuestionRefinement.ts`、`src/utils/questionQualityAudit.ts`、`src/utils/questionQualityGovernance.ts`、`src/utils/questionEngine.ts`。
- 顯示與結果：`src/components/Result.tsx`。
- 驗證與報告：`scripts/verify-sprint42.mjs`、`scripts/verify-sprint42-1.mjs`、`scripts/build-sprint42-report.mjs`、`scripts/build-sprint42-1-report.mjs`、`docs/42_question_language_audit.md`、`docs/42_1_formal_question_refinement.md`。
- 相關契約與回歸驗收：`package.json`、`tests/e2e/sprint-10-2.spec.ts`、`docs/05_功能進度.md`、`docs/06_Sprint紀錄.md`、`docs/09_Technical_Debt.md`、`docs/10_Roadmap.md`。

## 驗證結果

| 檢查 | 結果 |
|---|---|
| `npm.cmd run verify:sprint42-1` | 通過；正式題 285 題、source_verified 244 題、核心欄位／history 保護通過 |
| 其中 Build | 通過 |
| 其中 production bundle security | 通過；private sources、Google login 與 provider secrets 未進 bundle |
| `npm.cmd run build` | 通過 |
| `npm.cmd run test:e2e` | 4/4 測試通過；測試完成後 runner 未正常 cleanup，指令回傳 exit 124 |

## 已知限制

- Playwright 的 4 個測試案例均已通過，但 Windows／Vite runner 在測試完成後未退出；本次不為此大幅修改架構。
- `git status` 仍顯示大量未 staged 與 untracked 的 Sprint 19～42.1 相關修改；本報告不替其分批、刪除或 commit。
- 正式題仍有來源版本／頁碼與 41 題答案依據待人工確認；refinement layer 不會自動補寫來源或答案。
- Build 有 chunk size warning，但沒有編譯錯誤。

## Commit／Deploy 判定

Sprint 42.1 可進入 commit／deploy 前置流程：核心驗證與 Build 通過，且 Playwright 已達 4/4 通過。正式 commit 前仍須由維護者確認目前工作樹中所有 Sprint 19～42.1 修改的納入範圍；本次未執行 commit 或 deploy。
