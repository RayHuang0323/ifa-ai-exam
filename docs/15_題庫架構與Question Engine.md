# 題庫架構與 Question Engine

## 模型

- Question：保留正式題庫原文，經 Engine 正規化為 week、題型、knowledgePointIds、難度、來源參考、正式答案與 review 狀態。
- Knowledge Point：以既有 `week1-knowledge.json` 為 Week1 知識點來源；未來統一採 id、weekId、topicId、來源參考與 `needsReview`。
- Source Registry：`sources.json` 管理來源中繼資料；尚未確認的來源只可標為 `source-pending-review`。
- StudySession：新資料保存完整出題 questionIds、correctQuestionIds、wrongQuestionIds、skippedQuestionIds、開始／完成時間與統計。
- WrongAnswer：只保存題目索引與答題結果，不複製題目內容。

## Question Engine 職責

`src/utils/questionEngine.ts` 是唯一題庫查詢入口，提供 Week、題目、題目 ID、覆蓋率與單題統計。Task Planner、每日任務、每週複習、模擬考及未來錯題複習都必須透過它取得正式題庫，不建立重複 JSON 題庫。

## 擴充與覆蓋率

Week2～Week8 新增正式題庫後只需加入 Engine 的 Week registry 與知識點對應。覆蓋率優先以 StudySession.questionIds 計算；舊 Session 缺少該欄位時標示 estimated，不得假裝精確。

## AI Coach 可讀欄位

AI Coach 未來可讀取題目 week、knowledgePointIds、難度、出題／答對／答錯／跳過紀錄與錯題次數；不得改寫正式答案或自行處理來源衝突。
