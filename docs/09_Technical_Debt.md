# Technical Debt

-   未安裝 Tailwind 編譯流程，目前以 `src/index.css` 的最小 utility fallback 支援既有頁面樣式。
-   學習紀錄已涵蓋目前可用的正式測驗、指定題數任務與錯題複習；尚未涵蓋混合刷題。
-   尚無自動化測試覆蓋 localStorage migration、提醒規則與日期邊界。
-   AI Coach 尚未實作。
-   Week1 未完成測驗草稿目前為單一 localStorage draft，尚未提供跨裝置或多份草稿管理。
-   尚無跨週混題、完整間隔重複與 AI Coach 真實分析；簡答／默寫目前僅有 sample 自我檢核，未有正式題庫與自動判分。
-   已有 Sprint 10.2 與 Sprint 13.1 瀏覽器驗證覆蓋草稿恢復、指定題數任務、錯題複習完整交卷與 Result；尚未涵蓋 localStorage migration、提醒規則與日期邊界。
-   Week1 題庫覆蓋率從新 StudySession 的 `questionIds` 與既有錯題索引計算；舊 Session 未保存題目 ID，無法回推精確覆蓋率。

## Sprint 13.1 已移除

- 已移除正式模擬考、今日任務與錯題複習共用 90 分鐘造成的時間接線風險。
- 已移除首頁待複習數與錯題複習入口題組可能不一致的風險；兩者共用 `isReviewableToday`。
- 已補上錯題複習答對、Result 統計與同日 improving 排除的瀏覽器驗證。

## 仍存在

- 尚無跨週混題、完整間隔重複與 AI Coach 真實分析；簡答／默寫目前僅有 sample 自我檢核，未有正式題庫與自動判分。

## Sprint 16 已移除

- 已移除沒有簡答／默寫互動流程的缺口；目前可完成文字作答、參考答案／Rubric 自我檢核與錯題整合。

## Sprint 14 已移除

- 已提供完整錯題本 v1，包含狀態摘要、狀態篩選、空狀態與既有 reviewWrong 入口。
- 已補上從首頁進入錯題本、顯示正式題目與從篩選結果開始複習的瀏覽器驗證。
- 尚無自動化測試覆蓋 localStorage migration、提醒規則與日期邊界。

## Sprint 15 已移除

- 已移除首頁 Recent Activity 僅顯示 placeholder 的 Technical Debt；現在安全呈現最近 3 筆真實 StudySession。
- 已移除每日任務完全未混入可複習錯題的缺口；仍未實作完整間隔重複演算法。

## Sprint 17 已移除

- 已移除首頁同時充當完整功能總選單的資訊架構負擔；練習模式已集中到練習中心。
- 已補上首頁與練習中心入口、錯題 localStorage 狀態的瀏覽器驗證。

## Sprint 17 仍存在

- 練習中心的簡答／默寫仍只有 sample 題；正式題目需在後續講義整理後加入。

## Sprint 19 新增

- Google 登入第一版只在前端解析 credential 並以 email allowlist 判斷角色；Apps Script 尚未驗證 Google ID token 的簽章與 audience。
- Apps Script Web App 使用 API key＋兩人 email allowlist；正式擴大使用者規模前需改用更完整的身份驗證架構。
- 進度同步只送出 localStorage 摘要；同步失敗保留 pending 狀態，尚未實作背景重試與衝突解決。
- `dailyTaskCompleted` 與 `weakestCategory` 目前沒有可靠的既有 localStorage 欄位，因此摘要保留 `null`。
- Google Cloud OAuth、Apps Script Web App、Script Properties 與 Google Sheet 權限仍需人工建立與驗證。

## Sprint 19.1 新增

- Apps Script 第一版改用 Google tokeninfo endpoint 驗證 ID token；tokeninfo 有外部請求、可用性與配額限制，正式擴大使用者規模前需評估後端驗證方案。
- `VITE_PROGRESS_API_KEY` 仍會進入前端 bundle，只能作輔助請求識別，不能單獨視為秘密或身份驗證。
- session 目前在 localStorage 暫存 ID token 直到 token `exp`；雖會在過期時清除，仍存在 XSS／本機儲存風險。
- Apps Script 目前只保存摘要，不處理完整答題紀錄、背景重試或同步衝突。
# Sprint 24A

Google Sheets 同步為背景附加功能，離線事件保留在受上限保護的 localStorage queue；WRITE_KEY 位於前端 bundle，只是防誤寫而非高安全驗證。Coach Dashboard 留待下一 Sprint。

## Sprint 24A.1

profile 是本機瀏覽器標記，不是權限或身份驗證；使用者需用 `?profile=coach-test` 在每個測試裝置啟用 Ray Test，並可用 `?profile=learner` 切回 Bella。
# Sprint 24B

Coach Dashboard uses an Apps Script read key stored only in browser sessionStorage. This remains a two-person read-only convenience, not an account or authorization system.

# Sprint 24C-0

- 記住的 Coach 查看碼仍是兩人自用便利功能，存在本機 localStorage，並非帳號、登入或真正權限機制。
- 簡答、申論與 Case 目前採自評／人工確認；尚未導入 AI 評閱或正式 rubric 自動評分。
- Daily Task v2、30 題目標與未完成題 carryover 尚未執行。Apps Script 本次未變更，無需重新部署。

# Sprint 24C-1

- Daily Task v2 不會以重複正式題填滿 30 題；在 Week1 題庫只有 20 題的現況，首頁會明確提示可用題數不足。
- Day2 正式題庫包與任何模擬題仍未建立；未來補題必須遵守題庫維護規範與人工確認流程。

# Sprint 24D

- 正式池目前 41 題，已足以提供單日 30 題，但跨多日避免立即重複後仍會耗盡；Week3 與更多 verified 資料尚未建立。
- 12 題 staging 候選仍需人工核對，其中包含學生筆記、專業／醫療聲明與 1 題 mock；不得直接升格。
- Week1 保留舊題型與舊 metadata 格式，由 Question Engine 提供相容層；後續若遷移需逐題驗證，不得機械改寫答案。

# Sprint 24E

- Google Sheet 的 `wrongAnswerCount` 目前是含答錯的 session 數，不是本機錯題本的「已複習／已熟練」狀態；若要遠端化錯題生命週期，需另行設計資料契約。
- Week1/Week2 verified 總計 41 題，遠不足以 7 天完全不重複的 210 題；12 題候選仍需人工核對，不能為湊數升格。

## Sprint 25（規劃）

- 需要建立大量題庫盤點與匯入管線：掃描 private／staging／pending-review／分類副本，統計來源與可轉 verified 題量，再分配 Week1–Week4。
- private 原始檔不得部署；不得猜正式答案；needs_review 必須隔離；mock 題需明確標示非歷屆試題。

## Sprint 25.1

- 覆蓋率遠端計算依前端傳入 verified 題號集合；若未來題庫週次變動，需同步更新 Question Engine 與 coverage set，不可用舊 localStorage 估算冒充正式統計。

## Sprint 26

- 外部資料庫已定位，但 60 題 canonical 候選仍缺人工來源頁／答案核對；目前 verified 題庫仍只有 41 題。
- 若要支援一週每日 30 題，需先完成候選去重、來源分層與人工審核，不可用外部檔案數量直接推算可用題數。

## Sprint 26A

- 已完成候選題人工核對表與 33 組重複 candidate ID 報告，但尚未完成逐題 reviewer 決策。
- 後續匯入風險集中在來源頁缺失、答案衝突、醫療／禁忌／安全題核對，以及與既有 verified 題的近似重複。
- `export:review-candidates` 可重跑產生報告；正式匯入前仍需人工填寫決策，不可把報告輸出直接當作 runtime 題庫。

## Sprint 26B

## Sprint 27：50 天題庫工廠技術債

## Sprint 28：AI 題庫工廠技術債

- `AnswerRecords` 尚未直接保存 `questionSourceType`、`scoreEligible`、`riskLevel`；本 Sprint 不改 Apps Script，後續需補欄位以支援 Coach 報表精準分層。
- 題庫目前以單一 `exam-practice.json` 搭配 `practiceWeek`／`weekTag`，尚未拆成 Week3～Week8 runtime 檔案。
- AI 生成題已達 260 題，但安全／法規／配方的來源頁與措辭仍需人工逐題核對，不能直接轉 verified。

- `examPractice` 已有 `topicCategory`、`practiceWeek`、`sourceType` 與 `practiceOnly`，但正式 AnswerRecords 仍可再補 `scoreEligible`／`questionSourceType` 欄位以強化遠端報表區分。
- 題型比例受來源限制，目前為 multipleChoice 16、shortAnswer 105、case_study 3、essay 46；後續需人工補充選擇題與案例題，不以猜測答案填量。
- Week3～Week8 目前以 metadata 規劃，尚未拆成獨立 runtime 檔案；可在資料量與人工核對完成後再拆檔。

- 兩週內候選雖有 23 題 approved past-exam／course-workbook，但 21 題是既有 verified 重複，2 題有專業風險標籤；因此正式池仍只有 41 題。
- 目前主要缺口是來源頁／版本與逐題人工 decision，不是 Question Engine 功能；需先完成核對再批次匯入。

## Sprint 29：1000 題目標第二階段技術債

- `examPractice` 已達 720 題，距離 1000 題尚差 280 題；AI 題量不代表人工核准，不能直接轉 verified。
- AnswerRecords 尚未保存 `questionSourceType`、`scoreEligible`、`riskLevel`；本 Sprint 不改 Apps Script，後續需補欄位分離 practice 與正式成績。
- 植物油／精油 XLSX 與候選資料的 sourcePage、版本及部分法規措辭仍待人工逐題補齊。
- 題庫仍為單一 `exam-practice.json` 搭配 `practiceWeek`／`weekTag`；Week4、Week6 偏高，需以任務配額與去重改善。
- 模板已做 normalized 題幹去重，但同一來源重點可能有多個問法；需人工抽樣檢查選項品質、案例答案與語意重複。

## Sprint 30：1000 題目標收斂技術債

- `examPractice` 已達 1021 題，超過 1000 目標 21 題；總量達標不代表 851 題 AI 題已人工核准，仍不可直接轉 verified。
- Week5 94 題、Week8 81 題已補足，但 Week6 238 題仍偏高；後續需以 Daily／Weekly 去重與配額避免案例題過度抽取。
- AnswerRecords 仍未保存 `questionSourceType`、`scoreEligible`、`riskLevel`；本 Sprint 不修改 Apps Script。

## Sprint 34A：verified 覆核技術債

- Sprint 34 原升格的 109 題已全部離開正式池；後續若要重提，需逐題補教材頁碼／版本、人工核對答案與解析，並重新設計選項。
- 原始 examPractice 仍保留 1,021 題；85 題恢復可抽練習、22 題停用、2 題待人工確認。歷史作答與降級決策目前以題庫 metadata／文件追蹤，尚未進 AnswerRecords schema。
- Full Mock 題型分布目前以原 41 題為準；正式題量與題型平衡需要新一批經人工確認的候選，不得由規準分數或 AI 來源自動補足。
- near-duplicate、sourcePage／版本與高風險題仍需人工處理；本 Sprint 不修改 Apps Script、不同步新欄位，也不接入複習排序。

## Sprint 34：Daily 上限與 verified 第一批擴充技術債

- 正式池已由 41 題增加至 150 題，但本批 109 題仍需人工補來源頁碼、教材版本與選項唯一性；目前補充題 sourcePage 以「待補」保存。
- 本批包含 69 題 AI 教材萃取後通過保守規則的正式題；這不是人工逐題核准，也不是歷屆試題認證。下一階段需依題型與來源逐題抽查，必要時降回 practiceOnly 或封存。
- examPractice 原始 1,021 題仍保留，升格後可抽 887 題；歷史作答與 `relatedVerifiedId` 尚未同步到 AnswerRecords，若要跨裝置避免重複需另設 schema。
- Daily Task 的 30／90 題與未完成保留目前為本機儲存；跨裝置同步、不同裝置的加做狀態與更細緻的複習優先排序仍待後續設計。
- 題庫近似問法仍可能存在；本批只做 exact normalized 題幹排除與同一批核心變體上限，未取代完整 near-duplicate 審核。
- Full Mock、Learner summary 與 Coach 查詢仍依既有契約運作；Apps Script 未因本 Sprint 修改，正式題庫覆蓋數與遠端統計欄位仍需實測校準。

## Sprint 33A：本機評分與 Apps Script 稽核技術債

- 本機規準評分是可解釋的關鍵概念比對，不等同語意理解；同義詞未收錄、複雜否定句與跨段落論述仍可能需要人工確認。
- 目前 521 題非選擇題的 sourcePage 仍多為「待補」；來源不足或安全／法規風險題不得因本機規則分數自動轉 verified。
- `aiReviewStore` 只保存本機規準結果，尚未同步 Google Sheet，也尚未接入 Daily／Weekly 複習排序；若要接入需先建立人工覆核與高風險題閘門。
- 專案內 `Code.gs` 已稽核既有 progress sync、Learner summary、Coach API、認證、eventId 去重、lock finally 與 AI 分支；目前 AI 屬性可刪除或留空，外部 Apps Script 不需為本機評分重新部署。
- 未來若選配 Gemini 或其他 provider，必須由單一遠端 provider 邊界切換、重新定義資料保留與費用政策；本 Sprint 不申請、不設定、不呼叫。

## Sprint 31A：清理後技術債

- examPractice 原始檔仍保留 1,021 題，但可抽 practice pool 為 996 題；後續若要永久移除停用題，需先處理歷史作答與來源追蹤。
- `qualityStatus`、`isActive`、`excludeFromPractice`、`duplicateOf`、`relatedVerifiedId` 已進入題庫與 validator，但 AnswerRecords 尚未保存這些品質欄位。
- 8 題 `near_duplicate_review` 仍需人工判斷是否有足夠學習價值；目前只保留每個 verified 題一個 canonical practice copy。
- 4 題 unsafe 尚未改寫原答案，只以封存避免抽題；後續需人工安全與醫療措辭複核。
- sourcePage／版本補齊仍未完成；清理 metadata 不取代來源核對。
- Week8 綜合題與配方計算題需人工抽樣核對公式、來源版本、選項唯一性與安全措辭；法規／IFA 題需確認實際適用版本。

## Sprint 31C：未作答流程技術債

- 前端已將所有題目送入完成事件，並以 `status` 保存未作答與待自評；Apps Script 尚未修改，遠端 AnswerRecords 是否保存新增狀態欄位仍需實測確認。
- AnswerRecords 仍未完整保存 `questionSourceType`、`scoreEligible`、`riskLevel`；目前以前端 payload 與本機統計維持 practiceOnly／verified 分流，後續可在不破壞既有欄位的前提下補欄位。
- 未完成保留題目前以本機儲存保存；跨裝置或清除瀏覽器資料後無法共享，若要跨裝置同步需另行設計 Apps Script schema，本 Sprint 不處理。
- `getResultStats` 已保留所有題目供交卷後解析；後續可補專用 UI 測試，涵蓋多選、案例與安全題的顯示內容。

## Sprint 32：非選擇題與 AI 評分技術債

- 521 題非選擇題目前以既有教材答案與保守模板補齊學習 metadata；來源頁碼仍為「待補」，需後續逐題補版本與頁碼。
- AI 評分目前保存於本機 `ifa-ai-reviews-v1`，尚未同步 Google Sheet；若要跨裝置查看，需另行設計欄位與權限，不在本 Sprint 修改 Apps Script Sheet schema。
- `aiGradeAnswer` 代理已加入 Code.gs，但實際 Web App 需重新貼上、建立版本並部署；未設定 AI Script Properties 時，前端會安全顯示停用或暫時不可用。
- AI provider 目前採 OpenAI-compatible JSON chat 介面，模型與 endpoint 由 Script Properties 控制；需人工確認實際供應商的 JSON 格式、費用、速率限制與資料保留政策。
- AI 分數只作學習參考；後續若要用於複習排序，需先建立人工覆核與高風險題回收規則，不得直接寫入 verified 或正式統計。

## Sprint 33：AI 健康檢查技術債

- 健康檢查已加入 `coach-test` Home，但真實 provider 呼叫仍依賴人工在 Apps Script 設定 `AI_GRADING_API_KEY`、provider、model 並建立新 Web App 版本；GitHub Pages deploy 不會更新外部 Apps Script。
- 本 Sprint 以固定題與 mock response 驗證前端格式、fallback 與分數隔離；尚未在實際 Script Properties 下執行真實 provider smoke test，需由管理者手動設定後重按健康檢查。
- AI 評分仍只保存本機，尚未接入每日複習優先排序；下一 Sprint 才評估 0／1／需人工確認的候選佇列與人工覆核閘門。

## Sprint 31：品質控管技術債

- 1,021 題 examPractice 的 `sourcePage` 目前全數缺漏；sourceFile 雖可追溯，但仍需人工補頁碼、版本或明確的不可得說明。
- near-duplicate 掃描得到 329 組配對，其中 21 組為 practice 內 exact duplicate、16 組與 verified 題高度近似；需保留來源與作答紀錄後再決定封存。
- 4 題答案含「可平衡荷爾蒙」式醫療表述，已列 unsafe candidate，需人工改寫與安全複核；本 Sprint 未直接改 runtime。
- 題庫目前未寫入逐題 `qualityStatus`；本次以 `docs/31_examPractice品質抽查報告.md` 與候選清單記錄，後續可評估將審核狀態納入 validator 與審核工具。
- AnswerRecords 仍未保存 `questionSourceType`、`scoreEligible`、`riskLevel`；本 Sprint 不修改 Apps Script。
## Sprint 35：教材證據式正式題庫與歷史保護

- 建立 source_verified：84 題；每題具有實際 evidenceExcerpt、answerBasis、sourceEvidenceIds 與來源檔。
- 人工 verified 仍為 41 題；Full Mock 使用 verified + source_verified，共 125 題。
- Daily／Weekly 使用正式池 + 974 題可抽 examPractice，共 1,099 題；30／90 題規則不變。
- 原訂 120 題未達，因高風險、片段黏連、答案衝突或來源不足而排除，禁止為數量硬湊。
- 已作答或可能同步過的既有題目核心欄位不可修改；錯題採 deprecated + supersededBy + 新 ID。
- source_verified 與人工 verified 分層，無需逐題人工確認，但必須可由教材證據直接支持。
- 無 OpenAI／Gemini API 依賴；Apps Script 未修改。後續技術債為擴充高品質可抽文字教材與遠端 AnswerRecords 唯讀鎖定清單。

## Sprint 35B：Scheduler 技術債

- Scheduler 出現紀錄目前保存在本機 localStorage；跨裝置或清除瀏覽器後無法共享，遠端 AnswerRecords 的歷史出現資料仍需日後設計唯讀匯入契約。
- Full Mock 維持既有完整正式池題數；正式池全部出現後，重複比例會受題庫容量限制，Coach 指標後續可再區分必要 fallback 與策略性重複。
- Stage B／C 目前提供策略函式與文件，尚未做自動切換 UI；本機規準輔助評分的低掌握結果也尚未直接接入 Scheduler 排序。

## Sprint 36：證據式非選擇題技術債

- 新增 60 題 source_verified 已有 evidenceExcerpt 與 answerBasis，但 sourcePage 多數仍為「待補」；後續應補教材版本／頁碼或穩定段落定位。
- 本批案例只涵蓋低風險植物油／基底油情境；諮詢流程、職業倫理與高風險案例仍需更乾淨、可定位的教材證據，不能用現有片段硬湊。
- source_verified 第二批目前以獨立 JSON 檔接入，後續若建立跨批次索引需維持全域 ID 與 answered question lock 相容。
- 本機規準評分已支援新題，但仍不是語意理解；essay／case 複雜答案若含教材未列同義表達，需保守顯示人工確認。
- Full Mock 目前 185 題；未來仍需觀察正式題型平衡與實際作答品質，不得以數量取代來源證據與品質覆核。


## Sprint 36A：來源追溯與歷史評分

- 非選擇題本機規準結果目前只保存本機，尚未同步到 Google Sheet。
- sourcePage、sourceChapter、sourceVersion 仍有缺口，需依教材證據索引補齊，不得猜造。
- 舊遠端 AnswerRecords 不含本機規準分數；顯示層以未作答／尚未執行規準輔助評分區分。

## Sprint 36B：正式題池來源 metadata 缺口

- source_verified 144 題已補 evidence section 段落定位；正式池仍有 185 題待補頁碼、185 題待補版本，因現有索引沒有明確 page／version 欄位。
- verified 41 題沒有可直接對應的 sourceEvidenceIds，因此 answerBasis／evidenceExcerpt 仍待取得可追溯教材證據。
- 一般 examPractice 的來源 metadata 尚未全面補齊；下一批需先建立帶頁碼、版本與章節的可讀教材索引，不應以題庫內容反推來源。
- 遠端 AnswerRecords 仍未提供完整遠端已作答鎖定清單；本 Sprint 只維持本機 answered question lock，不修改 Apps Script。

## Sprint 37：高風險 evidence 題庫技術債

- Sprint 37 新增 100 題已具 section／段落定位，但 sourcePage 與 sourceVersion 各有 100 題待補，必須取得原始教材 metadata 後再補，不得反推。
- 新批次把 safety_review 題納入正式池，後續需要以人工抽查確認敏感題的題幹與答案仍只涵蓋教材原文。
- `source-verified-sprint37.json` 目前以獨立 batch 接入；未來若合併跨批索引，需維持 72001～72100 ID、歷史查詢與 answered lock 相容。
- Full Mock 285 題已達 Sprint 37 目標區間，但題量不取代教材證據品質；下一批應優先補正式頁碼／版本與 evidence 衝突稽核。

## Sprint 40～40C：正式題品質治理技術債

- 正式題仍沒有 A 級題；來源版本／頁碼與部分 verified 題的 evidence 仍待取得，不能以題庫內容反推。
- 選項中度相似、缺圖與 extraction fragment 已標記或隔離，但仍需人工確認；不自動發明干擾選項或生成醫療圖片。
- 可信度雙軸目前是 runtime metadata，尚未取代人工題庫審核流程；答案可信度與 metadata 完整度必須持續分開維護。

## Sprint 41：B 級題人工確認缺口

- 44 題保留 B，主要因課程整理來源、選項相似或仍需人工對照教材；升為 A 前需補可定位的版本／頁碼與人工決策。

## Sprint 42～42.1：顯示層 refinement 後續工作

- 顯示題幹已自然化，但 41 題仍缺答案依據，應由人工核對教材後補 evidence；不得由 display layer 反推或改寫答案。
- Daily 題庫仍有大量來源依據與自然度缺口，下一步應優先做小批人工複核，不以自動模板大量升格。
- Result 來源對缺少章節／頁碼／版本的題目只能顯示待補；不能暴露 `word/document.xml`、段落編號或 source id。
