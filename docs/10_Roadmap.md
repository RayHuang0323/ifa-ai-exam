# Roadmap

Sprint 09：學習進度與提醒

Sprint 10：刷題與錯題複習

Sprint 10.3：學習策略定義與首頁 UX 優化

Sprint 11：錯題複習頁面與簡答／默寫／主動回憶

Sprint 12：間隔重複

後續：Dashboard、AI Coach、匯出匯入、推播通知

考前 14 天：錯題、歷屆題與高風險主題優先，並逐步加入混合模擬考與簡答／默寫。

## 已完成：Sprint 13.1

- 首頁考試日期資訊、模式化動態計時與錯題複習排程已完成。
- formal-exam 維持 90 分鐘；daily／recovery、weeklyCatchUp、reviewWrong 依實際題組計時。
- 同日 improving 錯題不重複排入 reviewWrong，且首頁待複習數與入口一致。

## 已完成：Sprint 14

- 完整錯題本 v1 已完成：可查看狀態摘要、篩選所有錯題，並從可複習的篩選結果進入 reviewWrong。
- 後續仍保留跨週混題、完整間隔重複、簡答／默寫、Dashboard 與 AI Coach，不在本 Sprint 實作。

## 已完成：Sprint 15

- 已完成最小考前學習閉環：真實最近學習紀錄、每日任務混入可複習錯題、規則型首頁提醒。
- 後續仍保留跨週混題、完整間隔重複、Dashboard 與 AI Coach。

## 已完成：Sprint 16

- 已完成最小簡答／默寫自我檢核流程，並接入 StudySession、錯題與 Recent Activity。
- 後續仍保留正式簡答題庫擴充、完整間隔重複與 AI Coach，不在本 Sprint 實作。

## 已完成：Sprint 17

- 首頁已定位為今日學習儀表板，練習中心負責各練習模式入口。
- 後續仍保留正式簡答題庫擴充、跨週混題、完整間隔重複與 AI Coach，不在本 Sprint 實作。

## 已完成：Sprint 19

- 已完成 Google 登入基礎、coach／learner／unauthorized 雙人 email allowlist 與 localStorage session。
- 已完成學員 localStorage 進度摘要、Apps Script Google Sheet upsert／read 範本、教練只讀摘要雛形與 Result 非阻塞同步接線。
- 正式網站仍為 GitHub Pages；未建立正式帳號資料庫、未使用 Supabase、未接入 Sprint 18 staging 題庫。
- 實際 Google Cloud、Apps Script 與 Sheet 建立、部署、token 驗證強化仍待人工完成。

## 已完成：Sprint 19.1

- Apps Script 已補上 Google ID token tokeninfo 驗證、audience／issuer／expiration／email_verified 檢查與後端角色判定。
- 前端不再把 email／role 當作 Apps Script 授權依據；Progress Sheet 依名稱取得並驗證表頭。
- OAuth Client ID、Apps Script Web App `/exec` URL、正式 `.env` 與 GitHub Pages 部署仍待人工設定，本 Sprint 不部署。
# Sprint 24A 完成

已接上 Google Apps Script + Google Sheets 的簡易學習紀錄同步；localStorage 仍是主流程。下一 Sprint 建議建立 Coach Dashboard，非登入、OAuth 或會員系統。
# Sprint 24B

Coach Dashboard now reads Bella official sessions only; future work may improve trends and weak-area visualization without adding login or membership.

# Sprint 24C-0 完成

Coach 查看碼可選擇記住此裝置並可清除；非選擇題改為待自評，Result 已分離自動判分與待自評統計。下一個建議 Sprint 為 Daily Task v2 架構（30 題與 carryover），但尚未開始執行。

# Sprint 24C-1 完成

Daily Task v2 已提供 30 題目標、45 題顯示上限與 carryover，不以重複題補足不足題庫；Coach Dashboard 對比已修正。下一 Sprint 建議為 Day2 題庫包／經人工確認的補題，但尚未開始執行。

# Sprint 24D 完成

正式題庫池已擴充至 Week1／Week2 共 41 題，Daily v2、完整模擬考與錯題複習已共用；12 題 needs_review 未進正式池。下一 Sprint 建議人工核對 staging 來源頁與專業聲明，或提供 Week3 正式資料，不自動建立 mock。

# Sprint 24E 完成

正式進度以 Google Sheet remote summary 為主，baseline 從 2026-07-14 起算；Daily Task 可安全本機重置，Weekly Review 已建立。下一 Sprint 建議是人工核對 Week1/Week2 staging 題，或提供 Week3 正式資料，再擴充 verified 題庫；不自動產生或偽裝正式題。

# Sprint 25（規劃，尚未執行）

題庫大盤點與正式匯入：完整掃描 private 原始資料、staging、pending-review 與整理副本，分類 Week1–Week4，建立人工核對與 verified 匯入流程。Question Engine 將繼續供 Daily Task、Weekly Review、完整模擬考共用；不部署 private PDF/DOCX、不猜答案、不把 needs_review 或未標示 mock 題目送進正式池。

# Sprint 25.1 完成

首頁所有正式統計已改為 Google Sheet remote-first，coverage 由 AnswerRecords 與 Question Engine verified 題號集合計算；localStorage 僅作草稿、離線與遠端失敗時的明示 fallback。

# Sprint 26 完成

已定位外部大型教材庫並完成候選分層與匯入準備；新增 verified 仍為 0。下一步是人工核對 32 題 high_priority_review、隔離 15 題 mock 與 13 題 blocked，再分批建立 Week3／Week4 正式池；本次不執行。

# Sprint 26A 完成

- 候選題人工核對清單、33 組重複候選去重報告與 verified 匯入欄位規格已建立。
- 下一步是由人工逐題填寫 reviewer／decision／verifiedAnswer／notes，再以小批次方式匯入 verified；本 Sprint 不執行匯入。

# Sprint 26B 完成

# Sprint 27 完成

# Sprint 28 完成

- `examPractice` 達 430 題，AI 教材萃取題 260 題，verified 維持 41 題。
- 1000 題長期目標尚差 570 題；下一階段優先補植物油／基底油、配方設計、法規倫理、諮詢流程與更多安全案例。
- 不自動轉 verified；先建立人工抽樣核對、來源頁追溯與 AI 題錯誤回收流程。

- 完成 50 天題庫工廠 v1：`examPractice` 170 題、verified 41 題。
- Week3～Week8 規劃：Week3 精油化學／植物油、Week4 安全禁忌、Week5 配方設計、Week6 案例題、Week7 總複習、Week8 模擬與弱點補強。
- 下一步只做人工來源／答案核對與題型平衡，不自動轉 verified。

- 完成兩週內候選題審查與既有 verified 去重；本次未新增正式題，未建立 Week3。
- 下一步仍是人工補齊來源頁／答案決策後的小批次匯入，不以重複或未確認題目湊數。

# Sprint 29 完成

- `examPractice` 達 720 題，新增 290 題；verified 維持 41 題，1000 題目標尚差 280 題。
- 已補強植物油、配方、案例、法規／IFA、諮詢流程、職業倫理與轉介、精油個論。
- 下一步是人工抽樣核對來源頁／版本、醫療宣稱、重複問法與 Week5／Week8 題量；不自動轉 verified、不執行 AI 申論評分。

# Sprint 30 完成

- `examPractice` 達 1021 題，1000 題長期目標已達成，verified 仍為 41 題獨立正式池。
- Week5 配方新增 90 題、Week8 綜合新增 80 題；後續以人工品質抽查、法規版本核對、案例安全措辭與重複題清理為主。
- 不執行 AI 申論評分、不自動轉 verified、不修改 Apps Script；Full Mock 繼續 verified-only。

# Sprint 31 完成

- 1000 題目標維持完成：examPractice 1,021 題、verified 41 題獨立。
- 工作重心由擴充數量切換至品質控管：80 題 safety、40 題配方、40 題案例、30 題法規／倫理抽查，並完成全庫近似題掃描。
- 下一階段先處理 4 題 unsafe candidate、21 組 exact duplicate 與 16 組 verified 近似群，再進行來源頁／版本補齊與小批次人工核准；不自動升格。

# Sprint 31A 完成

- 以 metadata 完成 4 題 unsafe 與 21 題 exact duplicate 副本封存，examPractice 原始 1,021 題、可抽 practice pool 996 題。
- 8 題 verified practice canonical 保留 `near_duplicate_review`，正式 verified 維持 41 題；20020 繼續待人工確認。
- 下一步是人工安全措辭、來源頁／版本與歷史作答紀錄核對，不直接刪題、不自動升格。

# Sprint 31C 完成

- 已修正未作答學習流程：交卷後可查看答案／參考答案與解析，未作答不等同答錯、不視為完成。
- Daily Task 會保存未完成保留題並於下一次優先安排；Weekly Review 也優先納入未完成題；Full Mock 仍只使用 41 題 verified。
- 下一步先實測跨日保留、重新作答移除與 Google Sheet 狀態保存，再處理來源頁／版本及人工 verified 候選；不新增大量題目、不自動升格。

# Sprint 32 完成

- 521 題非選擇題已具備參考答案、示範答案、評分重點、解析與來源狀態；examPractice 仍 1,021 題、verified 仍 41 題。
- AI 輔助評分完成前端、本機保存與 Apps Script proxy source；採 0～3 分或需人工確認，不進正式 verified 正確率。
- 下一步是重新部署 Apps Script Web App、設定 Script Properties 後做小批次實測，再人工補來源頁碼與檢查高風險題；不自動升格 verified。

# Sprint 33 完成

- 已建立只在 `coach-test` 顯示的 AI 輔助評分健康檢查，覆蓋未啟用、非 JSON、缺欄位、可評分與需人工確認情境。
- 下一步是由管理者完成 Apps Script Script Properties 與 Web App 新版本部署，再以固定安全題做真實 endpoint smoke test；之後才評估接入複習優先排序。
- 不新增題目、不自動升格 verified、不把 AI 分數寫入正式統計，Full Mock 仍 verified-only。

# Sprint 33A 完成

- 本機規準輔助評分已正式成為非選擇題預設流程，無 API Key 即可輸出 0～3 分、命中／漏答、風險與補強建議；無法可靠判斷時保留「需人工確認」。
- Result 與 coach-test 健康檢查已移除遠端呼叫依賴；OpenAI／Gemini 僅保留未來選配邊界，不在本 Sprint 實作或設定。
- `Code.gs` 完整性稽核通過，既有進度同步、Learner summary、Coach 查詢與認證契約維持；現階段不需重新部署 Apps Script。
- 下一階段應先做人工抽樣與來源頁／版本補齊，再評估把 0／1／需人工確認結果接入複習優先排序；不得自動升格 verified。

# Sprint 34 完成

- Daily Task 已改為基本 30 題、可選加做至 90 題；未完成保留題優先，超過上限分批安排。
- verified 正式題庫第一批由 41 題擴充至 150 題；examPractice 原始 1,021 題不刪除，升格來源排除後可抽 887 題，Daily／Weekly 合併來源池 1,037 題。
- Full Mock 已維持 verified-only，並可使用新的 150 題正式池；Apps Script、正式答案、規準評分與 Google 登入邊界未改動。
- 下一階段目標：先人工覆核本批 109 題與來源頁，再規劃 verified 兩週題庫（約 420 題）；同時處理 near-duplicate、來源版本與跨裝置每日任務狀態，不再無限制增加題數。

# Sprint 34A 完成：品質優先於正式題數

- Sprint 34 新升格 109 題已完成全量覆核；verified 維持 41 題，暫停自動擴充第二批。
- 85 題回到 practiceOnly、2 題待人工確認、22 題停用；Full Mock 可信度檢查通過，仍只讀 verified。
- 下一階段建議：先建立人工逐題核對流程（來源頁／版本、答案、解析、選項去重、風險決策），再以小批次提出 250～300 題正式題庫規劃；本 Sprint 不執行。
## Sprint 35：教材證據式正式題庫與歷史保護

- 建立 source_verified：84 題；每題具有實際 evidenceExcerpt、answerBasis、sourceEvidenceIds 與來源檔。
- 人工 verified 仍為 41 題；Full Mock 使用 verified + source_verified，共 125 題。
- Daily／Weekly 使用正式池 + 974 題可抽 examPractice，共 1,099 題；30／90 題規則不變。
- 原訂 120 題未達，因高風險、片段黏連、答案衝突或來源不足而排除，禁止為數量硬湊。
- 已作答或可能同步過的既有題目核心欄位不可修改；錯題採 deprecated + supersededBy + 新 ID。
- source_verified 與人工 verified 分層，無需逐題人工確認，但必須可由教材證據直接支持。

## Sprint 35.1：正式題庫上線確認

- 已完成正式池 125 題上線確認與 production 版本標記。
- 下一階段再進行教材抽取強化及 source_verified 第二批；本階段不擴題。
- 無 OpenAI／Gemini API 依賴；Apps Script 未修改。後續技術債為擴充高品質可抽文字教材與遠端 AnswerRecords 唯讀鎖定清單。

## Sprint 35B 完成：先覆蓋、後重刷

- 已建立 Question Scheduler v2：Daily／Weekly 優先新題並抑制近期重複，Full Mock 只在正式題範圍內保留少量重要題重複。
- 已加入第一輪完成率與 Stage A／B／C 考前策略；目前不啟動第二批 source_verified。
- 下一階段先以教材證據小批擴充 shortAnswer，再評估 essay／case；同步觀察 Bella 實際 7 日重複率與第一輪覆蓋率，不追求無限制增加題數。

## Sprint 36：source_verified 第二批完成

- 已新增 60 題教材證據式非選擇題：shortAnswer 40、essay 15、case_study 5；source_verified 總數 144、Full Mock 正式池 185。
- 下一階段不以數量為唯一目標；先補來源頁／版本與低風險諮詢／倫理證據，再評估第三批簡答／申論／案例。
- Daily／Weekly 仍以第一輪覆蓋與近期避重為優先；本機規準分數只作學習參考，不自動升格 verified。


## Sprint 36A：結果學習化

已完成非選擇題交卷後自動本機規準評分、空白作答狀態修正與來源追溯欄位顯示。下一步是安全補齊教材頁碼／章節／版本 metadata，再評估將低分規準結果接入複習排序。

## Sprint 36B：正式題池來源追溯第一批

- 已完成正式 185 題的 metadata 稽核與 source_verified 144 題段落定位補強。
- 下一階段優先取得原始教材的頁碼與版本資訊，再補 verified 41 題的可核對答案依據；不以猜測填滿欄位。
- 一般 examPractice 的 metadata 先維持缺口報告，避免大量低可信改寫；Daily／Weekly 覆蓋率與 Full Mock 正式池優先維持穩定。

## Sprint 37：source_verified 第三批完成

- 已新增 100 題安全、案例與專業流程 source_verified，總數 244 題，正式模擬考題池 285 題。
- 已涵蓋安全禁忌、孕婦／兒童安全、疾病轉介、用藥詢問、諮詢、倫理、教材比例與保守案例分析；未把敏感主題排除為規則本身，也未超出教材。
- Daily／Weekly 維持 Sprint 35B 的 30／90、近 3 日、近 7 日與正式模擬考避重策略；本 Sprint 只增加正式池容量。
- 下一 Sprint 建議先補來源頁碼／版本與敏感題人工抽查，再考慮新的 source_verified 批次。

## Sprint 40～40C 完成：品質治理與可信度分級

- 題庫擴充暫停，先以 display audit、選項公平性、缺圖、解析完整性與來源可信度治理正式題。
- 下一階段優先補可定位的教材版本／頁碼與人工核對，不以 A/B/C 分級或題數取代證據品質。

## Sprint 41 完成：B 級題評估

- 先完成 196 題 B 級題的逐題評估；下一步處理保留 B 題的人工教材核對與 metadata 補齊。

## Sprint 42～42.1 完成：正式題顯示層 refinement

- 正式題使用 `displayQuestion` 呈現自然、正式的考試語氣，canonical 題目與答案維持不可變；Result 來源欄位使用安全 fallback。
- 下一階段以人工確認 41 題答案依據、補來源版本／頁碼與小批修正 Daily 題庫為主；不自動升格、不新增大量題目、不 deploy Apps Script。

## Sprint 56 完成：Past Exam Extraction Pipeline

- 已完成 157 個 exam-like source document 的候選分類、可讀文件抽取、答案狀態、圖片 metadata、review queue 與 Formal coverage report。
- 下一 Sprint 應先人工處理 official_exam_candidate：核對文件是否真的為正式／歷屆試卷、題目邊界、來源頁、答案頁、版本、圖片題與跨來源重複；未完成前不得匯入 Formal。
- practice-only 與 unknown 候選維持隔離；不以 extraction records 或 review queue 數量作為正式題數承諾，也不改 scheduler、blueprint、UI 或 Apps Script。

## Sprint 57 完成：Past Exam Formal Candidate Review

- 已建立 16 份 official 與 52 份 textbook candidate 的正式候選 review metadata、formal candidate queue、duplicate group inventory 與 image question inventory。
- 嚴格歷屆／考古題來源目前有 5 份、93 筆清楚題目紀錄；official＋final 去重後 213 組；textbook 去重後 65 組。這些都仍是待審候選，不是正式題數承諾。
- 下一 Sprint 優先逐題核對 official／final source 的來源頁、版本／日期、答案頁與圖片；再處理 textbook 題的正式性判定與 duplicate representative。完成人工 decision 前，Formal 維持 0 筆新增。
- 圖片題須先完成受控 asset extraction 與 source lineage 綁定；不得把 private PDF／DOCX、猜測答案或未核對 image question 送入 runtime。

## Sprint 58 完成：Past Exam Verified Formal Import

- 已將 Sprint 57 queue 的 1,131 筆 occurrence 全部分類；7 題通過官方同頁答案與 IFA scope gate，539 題待人工核對，585 題不作為目前正式匯入候選。
- 7 題新增為獨立 `past-exam-verified.json` formal batch，Daily／Weekly／Mock 共用；既有題目檔、UI、scheduler、blueprint 與 Apps Script 不變。
- 下一 Sprint 優先處理 539 筆 needs_review，尤其是答案未標示、圖片依賴、選擇題未圈選、以及 textbook candidate 是否真正屬正式考試的判定；不要以 queue 數量直接升格。
