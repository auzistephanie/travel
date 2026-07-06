# 旅行規劃 App — CLAUDE.md

> Session context。完整規格見 `TRAVEL_APP_BUILD_SPEC.md`。重大更新後自動更新此檔 + push GitHub。
> **注意**：App 本體由 Claude Code CLI 開發，專案資料夾在 `/Users/stephanieau/Documents/Claude/Projects/Travel App`（2026-07-02 由 `/Users/stephanieau/Desktop/Work-Google Drive/Travel` 搬過嚟）。

---

## 1. 專案概要
- **目標**：手機優先嘅旅行規劃 PWA — 行程、地圖、行李、夾錢、手信一站式，朋友可共編。
- **分享機制**：唔使登入。每個 trip 一個分享碼／連結，朋友撳連結揀返自己個名即可入數。
- **平台**：Web PWA（加到手機主畫面）。

## 2. 技術棧
| 部件 | 選用 |
|---|---|
| 前端 | React (Vite) + PWA |
| 後端/DB | Supabase (Postgres + Realtime + Storage) |
| 部署 | Vercel |
| 地圖/搜尋/路線 | TomTom Search + Routing API（免信用卡）；電車/公共交通 Google Maps 連結（唔叫 API，畀用戶自己查）；便利店/洗手間 OSM Overpass |
| 天氣 | Open-Meteo（免 key） |
| 航班 | AviationStack / FlightAware AeroAPI |
| OCR | Google Cloud Vision / Taggun |
| 匯率 | open.er-api.com（免費，可手動覆蓋） |
| 洗手間 | OpenStreetMap Overpass |

## 3. 資訊架構（4 底部分頁 + Settings）
```
總覽 Overview | 行程 Itinerary(併地圖) | 準備 Prep(行李/心願) | 錢 Money(夾錢/手信)
設定 ⚙️ (右上角，唔佔底部分頁)
```
> 2026-07-02：**地圖併入行程**（原 5 格 → 4 格）。行程頁頂有地圖區（現時 placeholder 靜態底圖，連 Google Maps key 後顯示 pin＋路線）＋搜尋加入今日＋就近提示（離今日行程 km）＋景點序號。`MapPage.tsx/.test` 已無 route 引用（mount 唔俾 sandbox 刪，係 dead code，可手動移除）。

## 4. 核心功能重點
- **總覽**：Hero 卡(目的地插畫背景)、航班列表(API 查詢後用戶確認先加)、出發前準備總進度、開支逐日/分類切換、旅行基本費獨立卡。
- **行程**：day-tab、上午/下午天氣、降雨≥60% 彈室內推介、時間軸(導航掣、洗手間/便利店 chip)、拖拉重排自動調時間、交通連接、順路分析(nearest-neighbor)。
- **地圖**：Places 真實搜尋 → 加入指定一日 itinerary。
- **準備-行李**：智能卡(轉插/簽證/入境現金建議額/溫度建議/每人寄艙額)、衣物數量按日數自動計、100% 蓋印章。行李項目「八達通/當地交通卡」按目的地自動顯示當地卡名（JP Suica/PASMO、KR T-money、TW 悠遊卡…，`destinations.transitCard`，顯示層由 Prep 傳落 PackingChecklist）。
- **準備-心願**：影相上載、AI 搵邊度買+比價、買俾邊個、「買咗」核實流程 → 流入手信。
- **錢-夾錢**：多貨幣、旅行基本費 flag、結算 who-owes-whom 折 HKD、分享碼入數。
- **錢-手信**：影單 OCR(品項/商戶/金額 可改)、按對象分組、同心願打通。

## 5. 視覺系統
- 4 主題：①復古探險地圖 ②東京霓虹夜 ③明信片剪貼簿 ④和風藍染。
- **必須 token 化(CSS variables)**，套用全部 5 分頁，唔可逐頁 hardcode。
- Settings → 主題：縮圖選擇 + 每主題 4 粒強調色 swatch + persist + crossfade 過場。
- 細節：蓋印章代替剔號、撕紙邊分隔、tap ripple。
- 目的地插畫：**原創 SVG/CSS**(避版權)，讀第一程航班到達機場自動判斷目的地，套主題濾鏡。

## 6. Supabase 資料模型
Tables：`trips` `trip_members` `flights` `itinerary_days` `itinerary_stops` `packing_items` `wishlist_items` `expenses` `gifts` `settings`。詳細欄位見 spec 第 9 節。

## 7. Build 順序（每期完成後自己 review 先報告）
1. **P1 骨架**：Vite+React init、Supabase 連接、分享碼、總覽/行程/地圖基本 CRUD、部署 Vercel。
2. **P2 智能提醒**：天氣+室內推介、洗手間/便利店 chip、行李智能卡、拖拉重排+交通+順路。
3. **P3 錢同心願**：夾錢多貨幣+結算、手信 OCR、心願比價+核實流程+打通手信。
4. **P4 視覺系統**：4 主題 token 化、目的地插畫、Settings 揀色 persist、印章/撕紙邊/ripple。
5. **P5 打磨**：PWA manifest、分享連結測試、效能/離線。

## 8. 工作規則
- 方向性決定 → 先 preview，批准先執行。
- 每個 phase / 功能完成 → 實際跑一次(唔止睇 code) confirm 行為，成功先報告。
- 用戶設定(主題/匯率)一律放 Settings，唔散落其他分頁。設定以全螢幕蓋面(bottom sheet)開啟，唔可以疊喺頁底。
- 插畫全原創，唔扒真實圖。
- 重大更新後更新 CLAUDE.md + push GitHub。
- **應用內所有文案一律用書面語繁體中文**（唔用廣東話口語）。
- 對話溝通：繁體中文。

## 8a. 視覺 Redesign（2026-07-02，目標「wow」）
- **手機框外殼**：`#root` max-width 460px 置中、深色畫布，桌面唔再攤開。
- **字體**：去 `Special Elite` 打字機字體 → `Noto Sans TC`(body) + `Noto Serif TC`(heading) + `Fraunces` italic(數字)。
- **配色**：cartography 主題暖橙 accent `#c1683a`(CTA/nav active)、綠 `#2f4a3e`(heading/hero)、米色卡 `#fff8ea`；swatches `[#c1683a,#3f6b4f,#c99a3c,#6b4226]`。
- **Icon**：統一用 `lucide-react`（emoji 全清）。`vite.config` 有 `optimizeDeps.include:['lucide-react']`，加新 dep 後要 restart dev server。
- **總覽**：hero overlay 標題 + 出發倒數卡 + 日數/同行/出發 stat chips + section 空狀態。
- **全部頁面已 redesign**：Landing / TripShell 頂 bar / BottomNav(蓋章 active) / HeroCard / SettingsPanel(蓋面) / Overview(hero+倒數+chips) / 行程 Itinerary(DayTabs pill、天氣 pill、雨天室內卡、時間軸卡、洗手間/便利店/導航 chip) / 錢 Money+手信(總結卡、結算卡、手信分組+心願打通 badge) / 準備 Prep(智能卡 grid、進度環、心願卡) / 地圖 Map(搜尋 bar、地點卡)。
- **加航班表單**：`AddFlightModal` 改蓋面 modal + 卡片式 2 欄排版（查詢掣、關閉 X、取消/加入航班 action bar），Lucide icon。
- **Icon 全用 Lucide**；emoji 全清。**全 app 文案已轉書面語**（連相關 test 一齊改）。
- **加心願表單**：卡片式重排、AI 建議商店卡、相片預覽；**AI 就近配對**自動建議「連結邊一日」= 商店座標 × 每日景點平均座標 haversine 最近，出 comment 可改（`storeSuggestApi` 加 `places.location`；`stopsByDay` 由 Prep 傳落 form）。無座標時 fallback 出提示。
- Mockup 參考：outputs `redesign-mockups.html`、`redesign-mockups-2.html`。
- 測試現況：改動涉及嘅 test 全綠、`tsc` 零錯、`vite build` 乾淨。

## 8b. 自動 push（github_push.py，2026-07-02）
- Sandbox 跑 `git add/commit/push` 會留低 stale `.git/*.lock` 擋住 commit，故改用 `github_push.py` 直接經 GitHub API push（照抄 Venturenix 做法）。
- 用法：`python3 github_push.py "訊息"`。同 **遠端 origin tree** 比對（計 git blob sha），只上傳有差異的檔、刪除遠端多出的檔，idempotent。
- Token 內嵌喺 `remote.origin.url`（本機 `.git/config`，唔 commit）；亦支援 `GITHUB_TOKEN` / `.gh-token`(gitignored)。
- 重大更新後：更新 CLAUDE.md → `python3 github_push.py "…"`。

## 8c. 產品 Showreel（2026-07-04）
- `public/showreel.html`＋`public/vo1–vo4.mp3`：9:16 純 HTML/CSS 產品展示動畫，4 鏡頭（特寫→賣點→使用→CTA）每鏡 5 秒，撕紙轉場＋字幕，cartography 主題色。
- 播一次後定格 CTA 畫面，撳「重播」由頭再播（唔循環）。
- 旁白：edge-tts `zh-HK-HiuMaanNeural` 廣東話，每鏡開始後 0.5s 播；因 autoplay 限制加咗 ▶ 播放掣起動。vo4 用「按一下…」（原句「撳」字 TTS 發音怪，2026-07-04 更換）。
- 線上網址：https://travel-ochre-rho.vercel.app/showreel.html （mp3 要同 HTML 同一目錄）。
- **無聲 debug（2026-07-04）**：三層修復 — ① `sw.js` 跳過 mp3/Range request（SW 攔截會整跛 audio）；② `sw.js` HTML/導航改 network-first（原本 cache-first 令用戶永遠食舊一版 HTML）；③ showreel 音檔 fetch→blob 預載＋播放掣手勢內 muted-unlock 4 個 audio（iOS/Safari 要求）。SW cache 而家係 v3。注意：Chrome MCP 背景視窗完全封鎖 media loading，測聲一定要前景真人測。
- **Landing 合併**：`public/landing-preview.html` 加咗 `#showreel` section（iframe 嵌 showreel，marquee 同 features 之間），nav「產品影片」＋rail dot 都有入口；landing-preview 已搬入 `public/`，線上 https://travel-ochre-rho.vercel.app/landing-preview.html 。

## 8d. 身份識別跨 context 修復（2026-07-04）
- **問題**：同一部機、加咗主畫面圖示又用開 Safari 連結，兩邊會分別跳出「哪位是你？」— iOS 對 home-screen 圖示 same-origin 標準網頁分開兩個獨立 localStorage context，`whoami:分享碼` 存喺其中一邊，另一邊讀唔到。
- **修復**：`TripShell.tsx` 身份識別改做「URL `?m=memberId` 優先，冇先 fallback localStorage」；一旦揀咗/讀到身份，自動用 `setSearchParams(..., {replace:true})` 寫返落網址列（唔留 history），同時仍寫返 localStorage 做 cache。咁樣個「連結」本身就帶身份，唔淨係靠瀏覽器儲存。
- **配套**：Settings 新增「個人連結」section + 「複製我的個人連結」掣（`navigator.clipboard.writeText(window.location.href)`），畀用戶攞返條帶身份嘅連結去重新 pin 主畫面圖示，兩邊就會一致。
- 唔影響朋友入數嘅原本流程（佢哋唔理 URL 有冇 `?m=`，一樣揀名就得）。
- 測試：`TripShell.test.tsx`／`SettingsPanel.test.tsx` 加咗對應 case，全 78 個 test 檔（含新增）全綠、`tsc -b` 零錯、`vite build` 乾淨（實測用 `--outDir` 因為 sandbox 舊 `dist/` 有殘留鎖檔，非代碼問題）。

## 8e. 花磚 vintage tile 裝飾（2026-07-04）
- **Landing page**（`public/landing-preview.html`）：手機橫向可拉動修復——`html`/`body` 雙層 `overflow-x:hidden` + `.hero`(header) 補 `overflow:hidden`（原本 `section{overflow:hidden}` 冇食到 `<header class="hero">`，令 `.cloud`/`.hero-plane` 嘅 `translateX(115vw)` 動畫谷大 scrollWidth）。STOP 02 明信片段 `#about` background 由純圓點紋理換做花磚八瓣花 wash（`#2f4a3e`/`#c1683a`/`#c99a3c`，opacity 0.05–0.07，120px tile）——首版 0.16 太濃似壁紙，已調淡。
- **App**（`src/theme/theme.css`）：Hero 卡相片／內容之間加咗花磚分隔條（菱格細紋，14px strip，`.hero-body::before`）——**4 個主題都有**，各自跟返主題色（cartography 米/綠/金、neon 紫黑/桃紅/青、indigo 靛藍/金/紅、scrapbook 白/胭脂紅/橙）；Settings 主題選擇，現用緊 cartography 嗰張卡加 2×2 花磚角落點綴（`ul[aria-label='主題選擇'] button[aria-pressed='true']::before`，暫時淨 cartography 有）。冇加新色，全部用返各主題原有 token。
- **App**（`src/styles/journalCard.css` `.journal-page`）：未入 trip 前 3 頁（Landing/建立行程/用分享碼加入）共用嘅底層背景，加咗花磚扇形圓弧紋樣（Pattern C）。**刻意用靛藍 `#7f9bb8`／磚紅 `#c1503a`／深靛 `#3a5f8a`，同 journal-card 本身嘅綠/橙/米色唔撞色**；opacity 現定 0.7（用戶要求較顯眼，未跟 skill 建議嘅 0.14–0.22 隱約範圍，日後想調淡可直接改呢 3 個 `fill-opacity` 值）。
- 花磚紋樣庫（8 瓣花/星芒羅盤/扇形圓弧/菱格細紋 4 款 SVG pattern，含配色/用法指引）喺 skill `brand-landing-page` 嘅 `references/tile-patterns.md`，日後其他頁面想加花磚可以再攞。
- 驗證方式：CSS brace 平衡 check、`vitest run HeroCard/SettingsPanel test`（12 個全過）、push 後用 Chrome MCP 清 SW cache 重新 load 實測截圖確認（唔止睇 code）。
- **補做確認（2026-07-04 later）**：之前 4 主題花磚 doc 已寫「都有」，但實際 `theme.css` 淨係 `[data-theme='cartography']` 有規則，neon/indigo/scrapbook 3 個主題冇對應 `.hero-body::before`，用戶截圖對比 3 個主題發現分隔條冇跟色。已補齊 3 段規則令代碼同呢份 doc 一致。`tsc -b` 零錯、`vite build` 乾淨，編譯後 CSS 8 隻新色（`1f1830 ff3ec9 2ee6d6 1f4166 d4af37 c0392b c2434a e8a33d`）各出現一次，確認冇打錯冇重複。

## 8f. Owner-only 登入（2026-07-04）
- **背景**：8d 個 URL token 方案解決咗一部分「跨 context 揀名」問題，但用戶想淨係自己（trip owner）一個人有真.account，其他朋友繼續免登入揀名。
- **做法**：`trip_members` 加 `auth_user_id`（連 `auth.users`）；Supabase Auth email magic link（`signInWithOtp`，`emailRedirectTo` 帶埋而家個網址，即帶埋 `?m=`）；`src/lib/ownerAuth.ts` 包 `sendOwnerLoginLink` / `getCurrentAuthUser` / `onAuthUserChange` / `linkMemberToAuthUser`。
- **TripShell 邏輯**：有 auth session 且 match 到 `trip_members.auth_user_id` → 最高優先自動識別身份（跳過 URL/localStorage/揀名畫面），全新裝置都得；owner 第一次登入（`is_owner` 嗰行仲未 link）就自動幫佢綁定。
- **SettingsPanel**：加「帳戶」section，**得 `is_owner` 嘅人先見到**——未登入顯示 email 輸入 + 「寄登入連結」，登入咗顯示已用邊個 email。
- **重要限制（老實講）**：Supabase 嘅 auth session 底層都係存喺 localStorage，一樣會撞返 iOS「主畫面圖示 vs Safari 分開儲存」嗰個問題——login 唔係就此徹底解決根源，分別在於撞到嗰陣係「請登入」（識做）而唔係亂咁樣嘅揀名畫面，兼且换新裝置都可以憑 email 攞返身份。真正徹底解決要包裝做 native app（用 iOS Keychain），呢個未做。
- **順便發現／修咗**：`trip_members` 表原本 RLS 完全 disabled（同 `schema.sql` 原意唔一致，其他表都有開 RLS + `public access` policy，淨係呢個表冧咗），已跑 migration 補返 `enable row level security`（同其他表一致，注意呢個 app 全部表都係「知個 share_code 即可讀寫」嘅開放式設計，唔係真正嘅多租戶隔離，schema.sql 本身有註明係 MVP 已知限制）。
- **DB migration**：`enable_rls_trip_members`、`add_trip_members_auth_user_id`（已喺 Supabase project `cmtubaxlniglklmdwlzs` 跑咗，`schema.sql` 同步更新）。
- **測試**：新增 `src/lib/ownerAuth.test.ts`（6 個）、`TripShell.test.tsx`／`SettingsPanel.test.tsx` 加咗 owner-login 相關 case，全 80 個 test 檔（480+ 條 test）全綠、`tsc -b` 零錯、`vite build` 乾淨。
- **未驗證**：實際 email 有冇收到 magic link（sandbox 冇辦法寄真 email），Stephanie 要親身入 Settings 試一次先算完全過關。Supabase 內建寄信服務（免費版）有速率限制，一開始測試冇問題，都要留意。

## 8g. 開新行程即刻提示登入（2026-07-04）
- **背景**：8f 個帳戶入口本身收埋喺 Settings 度，要用戶自己揀入去先見到，容易冇人用。用戶想「開新行程」（即係做 owner）嗰下即刻見到登入選項。
- **做法**：`CreateTrip.tsx` 建立行程成功後唔即刻 navigate 入 trip，先顯示一個中間畫面「行程建立成功！」+ email 輸入 + 「寄登入連結」，撳咗會用 `sendOwnerLoginLink(email, redirectTo)` 寄 magic link；`redirectTo` 明確指去 `/t/:shareCode?m=:ownerId`（唔用預設嘅 `window.location.href`，因為呢陣仲喺 `/new` 度，唔想個連結撳咗跳返嚟建立行程頁）。可以撳「遲啲先，直接入去行程」skip，唔會硬性攔住。
- **`ownerAuth.ts` 改動**：`sendOwnerLoginLink(email, redirectTo = window.location.href)` 加咗個可選 `redirectTo` 參數；SettingsPanel 嗰邊冇改，繼續用預設值（本身已喺 trip 頁入面，帶埋 `?m=` 冇問題）。
- **朋友流程完全冇變**：「用分享碼加入」同 Landing page 個「無須註冊帳戶」tagline 都冇改，login 提示淨係出現喺「開新行程」（owner）呢條路，仲係可以 skip。
- **測試**：`CreateTrip.test.tsx` 加咗 3 個新 case（顯示提示畫面、寄連結+入去行程、skip 直入），`ownerAuth.test.ts` 加咗 redirectTo 案例。全部改動涉及嘅 test（`ownerAuth`／`CreateTrip`／`TripShell`／`SettingsPanel`／全 `src/lib`／`src/components`／`src/pages`+`hooks`+`theme`）逐個 chunk 跑晒，全部 0 個 fail，`tsc -b` 零錯、`vite build` 乾淨。
- **未驗證**：同 8f 一樣，實際 email 流程要 Stephanie 親身用真 email 試一次（建立行程 → 寄連結 → 撳連結 → 確認自動登入返個新 trip）。
- **實測（2026-07-04）**：用 Chrome MCP 喺線上 https://travel-ochre-rho.vercel.app 實測「開新行程」→ skip 入去、同「開新行程」→ 寄登入連結（真係寄咗去 `auzistephanie@gmail.com`）兩條路，都成功、冇 console error。

## 8h. Lazy-load chunk 404 全黑修復（2026-07-04）
- **問題**：Stephanie 開新行程後見到全黑畫面。查因：`TripShell.tsx` 4 個分頁（Overview/Itinerary/Prep/Money）用 `React.lazy` + code-split，每次 deploy 啲 chunk 檔名都會變（content hash）；如果個瀏覽器 tab 喺 deploy 之前已經開住（或者岩岩跳過幾個 deploy），佢部機仍然行緊嗰個舊 build 嘅 JS，一去到要 lazy-load 某個分頁，就會攞緊個已經喺伺服器度冇咗嘅舊檔名 → import() 404 → React 冇 error boundary 接住呢種失敗，成棵 tree 靜靜哋 unmount，淨低 app 外殼嘅深色背景 = 全黑。用 Chrome MCP 喺全新 tab 實測建立行程兩條路都正常（見上面 8g 實測），side 印證咗呢個係「舊 tab 撞新 deploy」嘅時間性問題，唔係業務邏輯本身有 bug。
- **修復**：新增 `src/lib/lazyWithReload.ts` 嘅 `lazyImportWithReload` wrapper，包住 4 個 `lazy()` import。攞 chunk 失敗（第一次）就用 `sessionStorage` 記住已經試過，然後 `window.location.reload()` 自動攞返最新版；如果 reload 完仲係攞唔到（真係網絡問題）先正常拋錯，唔會再全黑，亦唔會無限 loop。
- **測試**：新增 `src/lib/lazyWithReload.test.ts`（3 個：成功清 flag／第一次失敗會 reload 且 promise 唔 resolve／已經 reload 過就正常拋錯）；`TripShell.test.tsx` 加咗 `window.location.reload` stub 避免測試環境嘅 jsdom navigation 噪音。`tsc -b` 零錯、`vite build` 乾淨。
- **後續補救建議（未做）**：目前修復係「畀用戶靜雞雞自動 reload 一次」，用戶完全唔會見到發生咗咩事；如果想更透明，可以加一個小提示「偵測到新版本，重新載入緊…」。呢個屬於錦上添花，唔係緊要，未做。

## 8i. Owner 登入由 email magic link 改做 Google OAuth（2026-07-04）
- **問題**：查 Supabase auth log（`get_logs` service=auth）發現：email magic link 撞正 Gmail 自動幫封信「預先掃描」連結做安全檢查，掃描嗰吓已經用咗個一次性 token，搞到 Stephanie 自己撳嗰吓話「連結已失效」（log 見到多個 `error: "One-time token not found"`，remote_addr 嚟自 Google IP range）——唔係我哋個 code 有 bug，係 magic link 呢種機制本身嘅通病。log 亦見到有兩次真係成功登入過，證實個機制本身冇壞，淨係唔穩陣。
- **做法**：`ownerAuth.ts` 嘅 `sendOwnerLoginLink`（email OTP）完全換成 `signInWithGoogle`（`supabase.auth.signInWithOAuth({provider:'google'})`），`SettingsPanel` 帳戶 section 同 `CreateTrip` 建立成功畫面嘅 email 輸入都換做單一「用 Google 登入」掣。TripShell 嗰套「auth session match 到 member 就自動識別身份」邏輯完全唔使改，因為佢唔理你用邊個 provider 登入。
- **前置條件（Stephanie 要做，我做唔到）**：① Google Cloud Console 開 OAuth Client（redirect URI 填 `https://cmtubaxlniglklmdwlzs.supabase.co/auth/v1/callback`）；② Supabase Dashboard → Authentication → Providers → Google，填返 Client ID/Secret 開啟。呢兩步未做之前，撳「用 Google 登入」會出錯（`provider not enabled`），已加咗錯誤處理唔會全黑，會顯示「登入失敗，請遲啲再試」+ 保留「遲啲先」skip 選項。
- **測試**：`ownerAuth.test.ts`／`SettingsPanel.test.tsx`／`CreateTrip.test.tsx`／`TripShell.test.tsx` 全部改咗去對應 Google 登入，加埋新嘅 lazyWithReload test，5 個改動涉及嘅 test 檔（38 條 test）一次過跑晒全綠，`tsc -b` 零錯、`vite build` 乾淨。
- **未驗證**：Stephanie 未做完 Google Cloud + Supabase 嗰兩步前，「用 Google 登入」實際撳落去會見到錯誤訊息係預期行為，唔係新 bug；做完之後要再測一次真實登入流程。

## 8j. Google OAuth 外部設定完成 + 實測成功（2026-07-05）
- **背景**：8i 淨係改咗 code，Google Cloud OAuth Client + Supabase Google provider 呢兩步外部設定原本要 Stephanie 自己做，佢喺 Google Cloud Console 撞到「OAuth consent screen 唔識揀」，改口叫用 Claude in Chrome 代做。
- **Google Cloud**：沿用現有專案 `My Project 31044`（`just-clover-487108-a0`，同 Venturenix FluentSMTP 共用，冇改動佢個 branding）——Audience 加咗 `auzistephanie@gmail.com` 做 test user（consent screen 仲喺 Testing 狀態，得 test user 先登入到）；Clients 新建一個 Web application client「Travel App」（JS origin `https://travel-ochre-rho.vercel.app`、redirect URI `https://cmtubaxlniglklmdwlzs.supabase.co/auth/v1/callback`），攞到 Client ID/Secret。
- **Supabase**：Authentication → Providers → Google 貼咗個 Client ID/Secret 開啟。
- **撞到並修咗嘅 bug**：第一次實測登入成功攞到 token，但跳去咗 `http://localhost:3000` 唔係去個 live app——查因 Supabase **Site URL 仲係預設 `localhost:3000`、Redirect URLs 空白**（呢個同 Google/code 完全無關，純粹外部設定漏咗）。已改 Site URL 做 `https://travel-ochre-rho.vercel.app`，加咗 Redirect URL `https://travel-ochre-rho.vercel.app/**`（wildcard 蓋晒 `/t/:shareCode` 呢啲路徑）。呢個改動改咗production auth 設定，先問過 Stephanie 批准（佢覆「改」）先執行。
- **實測（用 Chrome MCP，真人流程）**：開新行程 → 撳「用 Google 登入」→ 揀 `auzistephanie@gmail.com` → 授權 → 成功跳返 `travel-ochre-rho.vercel.app/t/:shareCode?m=...`、trip 正常載入、Settings 帳戶 section 顯示「已用 auzistephanie@gmail.com 登入，呢部裝置隨時都認得返你」。**Google OAuth owner 登入全流程確認行得通**，8i 嗰個「未驗證」已經解決。
- 遺留：test user cap 100 人（而家淨係 Stephanie 一個），app 仲喺 Google 「Testing」publishing status——如果之後想任何人都可以用呢個 Google login（唔止 Stephanie），要做 Google OAuth consent screen 嘅 verification 先可以出返 Production，呢個未做，亦都冇必要做（得 owner 一個人需要呢個功能）。

## 8k. 邀請朋友連結（2026-07-05）
- **背景**：8f–8j 做齊咗 owner 嘅 Google 登入，但查完成個 app 先發現漏咗一樣更基本嘅嘢——完全冇地方畀 owner 攞到「純分享連結」去傳畀朋友！Settings 原有嘅「個人連結」其實係帶住 `?m=memberId` 嘅個人身份連結（用嚟認返自己跨裝置），唔係用嚟出街分享；朋友加入一直得靠自己手打分享碼入 `/join` 頁。
- **做法**：加多一個獨立功能，同「個人連結」分開：
  - `SettingsPanel.tsx` 新增 `shareCode` prop + 「邀請朋友」section（放喺「個人連結」之前），複製 `{origin}/t/{shareCode}`（**冇** `?m=`），文案講明「唔使登入、唔使開帳戶」。
  - `TripShell.tsx` 傳 `trip.share_code` 落 `SettingsPanel`。
  - `CreateTrip.tsx` 建立成功畫面都加返呢個「邀請朋友」複製掣（放喺 Google 登入之前，因為呢個先係大部分人建立完行程即刻需要嘅嘢），同 Google 登入分開兩個獨立 section。
  - Landing page（`Landing.tsx` 同 marketing 版 `landing-preview.html`）文案已經夠清楚（「一鍵即可加入，無須註冊帳戶」／「一個分享碼、一條連結」），無改動。
- **朋友流程完全冇變**：一樣係撳連結揀名，唔理個連結有冇 `?m=`；呢個純粹係加返一個「點攞到條連結」嘅入口，之前呢步係漏咗。
- **測試**：`SettingsPanel.test.tsx`（+2）、`CreateTrip.test.tsx`（+1）、`TripShell.test.tsx`（+1），改動涉及嘅 3 個檔（32 條 test）全綠、`tsc -b` 零錯、`vite build` 乾淨。

## 8l. 修「同一部機撳邀請連結，無得加自己入行程」（2026-07-05）
- **問題**：Stephanie 用 8k 個邀請連結測試，發現撳完之後冇得揀身份/加自己——用 Chrome MCP 開多個 tab 重現：`localStorage` 係跟瀏覽器嘅，唔係跟 tab；如果呢部機/呢個瀏覽器之前已經對呢個 trip 記低過身份（例如自己就係 owner，一開始建立行程嗰陣已經寫低），噉之後喺**同一部機**任何 tab 撳個冇 `?m=` 嘅邀請連結，`getWhoAmI(shareCode)` 一樣攞到舊身份，會自動跳過「哪位是你？」畫面直接帶返入去做返嗰個人，冇機會揀第二個人或者加新名。連 Google 已連結咗 owner account 嘅情況重會被「auth 自動識別」效果二次確認返，更加走唔甩。
- **做法**：`TripShell.tsx` 行程頭度（trip-header）加多個「切換身份」掣（`Repeat` icon，放喺設定掣隔籬），撳咗會：① `clearWhoAmI(shareCode)` 清走呢部機對呢個 trip 嘅身份記錄；② 網址列刪走 `?m=`；③ 開多個 `manualOverride` state 旗標，喺呢個 session 入面擋住「auth 自動識別」效果搶返身份（否則 owner 一撳「切換身份」就即刻俾自己已連結嘅 Google account 彈返做返 owner，個掣形同虛設）；之後就翻返去「哪位是你？」畫面，可以揀返其他人或者用「自訂新名字」加多個人。
- `src/lib/whoAmI.ts` 加咗 `clearWhoAmI(shareCode)`。
- **已知限制**：`manualOverride` 淨係嗰個 session（即係冇 reload 頁面之前）有效——如果之後用「自訂新名字」加咗一個新人，之後重新整個頁（例如朋友第二日先再開），auth 自動識別效果會重新跑，Google 已連結嘅 owner 帳戶又會贏，跳返做返 owner，唔會記得住個新加嘅人（除非嗰個新人自己嗰部機／瀏覽器揀名）。呢個係「一部機一個 Google 帳戶」設計本身嘅限制，冇喺呢次改埋，日後如果要做到「一部機可以畀唔同人長期記住身份」要再諗過個架構（例如每個 member 各自一個 code，而唔淨係得 owner 個 Google 帳戶咁強勢）。
- **測試**：`TripShell.test.tsx` 加咗 2 個新 case（撳「切換身份」清走記錄翻去揀名畫面；已連結 Google 嘅 owner 撳咗都唔會即刻俾自動識別搶返身份），連原有 12 個一齊全 14 個 test 全綠、`tsc -b` 零錯、`vite build` 乾淨。

## 8m. 「哪位是你？」揀名畫面重新設計（2026-07-05）
- **背景**：Stephanie 截圖畀我睇，發現呢個畫面一直冇跟返 8a 嗰輪 redesign——淨係死白背景、預設 bullet list、無樣式 input/button，同成個 app 嘅視覺系統完全脫節（呢頁本身冇經過 `.journal-card`/`.theme-root` 嘅卡片包裝）。
- **做法**：`WhoAmIPicker.tsx` 改用 `.whoami-page`/`.whoami-card` 包裝，加返 Compass 品牌圈、標題+副標、每個名字做返一粒帶頭像圓圈（攞名首字，同 Overview 個 member avatar 一致風格）嘅 pill 掣、「或」分隔線、「自訂新名字」input+掣獨立一 row（`UserPlus` icon）。全部顏色行 `var(--color-*)` theme tokens，跟返該 trip 揀咗嘅主題（cartography/neon/indigo/scrapbook 都啱），唔係死用 cartography。
- 新增 CSS 喺 `theme.css`「App shell」段，avatar 圓圈刻意 `aria-hidden`，唔影響 button 嘅 accessible name（test 仲係用返 member 個名揾button）。
- **測試**：`WhoAmIPicker.test.tsx`（3 個原有 test 冇改都全過）、`TripShell.test.tsx`（14 個）全綠、`tsc -b` 零錯、`vite build` 乾淨；用 Chrome MCP 喺線上實測撳「切換身份」睇真身版面，確認顏色/卡片/頭像/分隔線都出返晒。

## 8n. 「我的行程」首頁 + 一人多行程 + 首頁登入掣（2026-07-05）
- **背景**：Stephanie 指出 app 第一個版面直接係「開新行程」——如果已經開過行程，冇任何「我的行程」清單入口攞返（只能靠 URL/localStorage 記住條連結）；亦想 login 更前置、一人可以有多個行程。採用方案 C（混合，preview 批準）。
- **做法**：
  - 新增 `src/lib/myTrips.ts`（+`myTrips.test.ts` 8 個）：localStorage「我的行程」清單，`getMyTrips / addMyTrip(upsert) / touchMyTrip / removeMyTrip / mergeMyTrips`，存 `{shareCode,name,role,startDate,endDate,lastOpened}`，按 lastOpened 由新到舊排、容錯 corrupt storage。純本地零登入即用。
  - `tripApi.ts` 加 `getTripsForAuthUser(authUserId)`：登入後由 `trip_members.auth_user_id` join `trips` 攞返所有連結行程（跨裝置同步）。注意 Supabase join `trips` 型別成 array，已正規化成單一物件。
  - `Landing.tsx` 由「淨係開新行程/加入」改成**「我的行程」home**：本地清單有行程 → 顯示行程卡列表（Link 入 `/t/:shareCode`，owner=「我建立」綠 badge、member=「已加入」金 badge）＋開新行程＋用分享碼加入；清單空 → 顯示返原本 cover 卡。**兩態底部都有「用 Google 登入」掣**（保留 journal 復古風：米色底、啡框、Google G 標、虛線分隔），登入後顯示「已用 email 登入」並自動 `mergeMyTrips` 併入雲端行程。**login 顯眼但唔強制**，朋友照樣免登入揀名。
  - `Landing.css` 加 `.journal-trip-list/.journal-trip-card/.journal-login/.journal-login-btn/.journal-google-g` 等樣式，全跟 cartography 手繪風，冇加新色系。
  - 寫入時機：`CreateTrip`（建立成功 role=owner）、`JoinTrip`（分享碼加入 role=member）、`TripShell`（識別身份後按 `is_owner` upsert，令經朋友連結入嚟嘅行程都出現喺清單）。
- **朋友流程完全冇變**：一樣撳連結揀名，唔理 URL 有冇 `?m=`。
- **測試**：`myTrips.test.ts`(8)、`tripApi.test.ts`(7)、`CreateTrip/JoinTrip/TripShell.test.tsx`(23) 全綠共 38 條、`tsc -b` 零錯、`vite build` 乾淨（Landing 打包入主 bundle 非 lazy）。
- **已知限制**：純本地清單換機/清 cache 會唔見（正如設計），要靠 Google 登入嗰層攞返雲端行程。`getTripsForAuthUser` 未寫獨立 unit test（靠 build/tsc 保型別；實際查詢喺線上實測）。

## 8o. 行程可設定 + 可刪（本地移除 / 徹底刪 DB）（2026-07-05）
- **背景**：8n 之後 Stephanie 話「太多 testing 行程」，要「行程可設定可刪」。採用推薦全範圍（preview 批準）。
- **兩層刪除（分清隱藏 vs 真刪，避免手殘）**：
  - **從清單移除**（本地）：`removeMyTrip`，淨係喺呢部裝置 localStorage 隱藏，DB 資料仲喺、朋友照用、日後連結/登入搵得返。
  - **徹底刪除**（owner，DB）：`deleteTripByShareCode` = `delete from trips where share_code`；schema 所有子表 trip_id 都 `on delete cascade`，一句連 members/flights/itinerary/packing/wishlist/expenses/gifts/settings 全清，不可還原，要二次確認。
- **入口**：
  - `Landing.tsx` 每張行程卡右上角加垃圾桶掣 → 確認蓋面（`.journal-confirm-overlay`）：「從清單移除」（人人）／「徹底刪除行程」（淨係 role=owner 先出，紅掣）／取消。垃圾桶掣 `preventDefault+stopPropagation` 唔會誤觸卡片 navigate。
  - `SettingsPanel.tsx`（owner + 有 trip 先出）加「行程設定」section：改名／開始日／結束日／目的地 + 「儲存行程設定」（`updateTrip`）；下面「危險區」inline 二次確認刪除（`deleteTripByShareCode`）。`TripShell` 傳 `trip / onTripChanged=refetch / onTripDeleted`（刪完 `removeMyTrip`+`clearWhoAmI`+`window.location.assign('/')` 返首頁）。
- **tripApi 新增**：`updateTrip(id, {name?,startDate?,endDate?,destinationCountry?})`（只 patch 有傳嘅欄）、`deleteTripByShareCode(shareCode)`。
- **樣式**：Landing.css 加 `.journal-trip-delete`/`.journal-confirm-*`；theme.css 加 `.settings-danger-head`/`.settings-danger-btn`（紅），全用手繪風，冇加新 token。
- **測試**：`tripApi.test.ts`(+3 updateTrip/delete)、`myTrips.test.ts`(8)、`SettingsPanel.test.tsx`(13)、`TripShell.test.tsx`(14) 全綠共 45 條、`tsc -b` 零錯、`vite build` 乾淨。
- **朋友流程冇變**；member 喺清單只有「從清單移除」，冇「徹底刪除」。

## 8p. 開新行程感知已登入狀態（2026-07-05）
- **問題**：Stephanie 反映登入（Google）之後開新行程，`CreateTrip` 仍然：① 硬性要佢再填「你的名字」；② 建立成功畫面又出「用 Google 登入」掣叫佢再登入一次。根因係 `CreateTrip.tsx` 完全冇 check `getCurrentAuthUser()`，當每個人都係未登入嘅陌生人。（行程本身冇壞——入到 `TripShell` 後 owner 會被自動綁定返 account，純粹係流程重複／confusing。）
- **做法**（Stephanie 揀咗「名字欄預填可改」）：
  - `ownerAuth.ts`：`AuthUser` 加 `name`（由 `user_metadata.full_name / name` 讀，即 Google profile 顯示名），`getCurrentAuthUser` / `onAuthUserChange` 一齊回傳。
  - `CreateTrip.tsx`：開頁 `getCurrentAuthUser()` → 有登入就用 Google 個名**預填**「你的名字」（仍可改）；建立成功後如已登入即刻 `linkMemberToAuthUser(owner.id, authUser.id)` 綁定；成功畫面已登入就顯示「已用 xxx 登入…」+「入去行程」掣，**唔再出登入掣**。未登入嘅流程完全不變。
- **朋友流程冇變**：一樣撳連結揀名，唔受影響。
- **測試**：`CreateTrip.test.tsx`（+1，登入預填/自動綁定/唔出登入掣）、`ownerAuth.test.ts`（+1 且更新既有 case 對應新 `name` 欄），`CreateTrip`(8)／`ownerAuth`(8)／`TripShell`(14) 共 30 條全綠、`tsc -b` 零錯、`vite build` 乾淨（211 modules）。
- **未驗證**：實際線上「登入 → 開新行程 → 睇名有冇預填、成功畫面唔再叫登入」要 Stephanie 用真 Google account 行一次確認。
- **已驗證（2026-07-05）**：用 Chrome MCP 真人流程實測——Google 登入 → 開新行程，「你的名字」自動預填「Stephanie Au」、成功畫面顯示「已用 auzistephanie@gmail.com 登入…」冇再出登入掣、撳「入去行程」直入總覽冇彈揀名畫面。三點全部確認。

## 8q. 移除 Settings「行程設定」編輯段（2026-07-05）
- **背景**：Stephanie 睇實測時見到 Settings 內 8o 加嘅「行程設定」（改名/開始日/結束日/目的地 + 儲存掣）排版迫、覺得唔需要，要求拎走；順帶要刪走「危險區」個標題字。
- **做法**：`SettingsPanel.tsx` 移除成段「行程設定」表單（連 `tripName/tripStart/tripEnd/tripDest/savingTrip/tripSaved/tripSaveError` state、`handleSaveTrip`、`updateTrip`／`DESTINATIONS`／`DESTINATION_OPTIONS` import、未再用嘅 `onTripChanged` 解構）。**保留刪除行程功能**，但標題由「危險區」改做「刪除行程」（掣本身已寫「刪除呢個行程」／確認流程不變）。`tripApi.updateTrip` 本身冇刪（仲有 unit test），淨係 UI 唔再用。
- **朋友流程 / owner 刪除流程冇變**；Landing 每張行程卡右上角嗰個「從清單移除 / 徹底刪除」入口都冇郁。
- **測試**：`SettingsPanel.test.tsx`(13)、`TripShell.test.tsx`(14) 全綠、`tsc -b` 零錯、`vite build` 乾淨（211 modules）。呢啲 test 個 Harness 本身冇傳 `trip`，所以冇 exercise 到被移除嗰段，無需改 test。

## 8r. 地圖/交通 provider 由 Google 換做 TomTom + HERE + Overpass（2026-07-06）
- **背景**：查「建立唔到行程」個 bug 過程中發現 Vercel 冇設 Supabase env var（另案已修）；順便診斷到 Google Maps/Places key 一路都未申請（`.env` 留空），而 Google 需要信用卡先攞到 key，Stephanie 想避免。
- **改動範圍**：`src/lib/placesApi.ts`（Places 搜尋）、`src/lib/storeSuggestApi.ts`（心願比價搵店）改用 **TomTom Search API**（`api.tomtom.com/search/2/search`，免信用卡）；`src/lib/directionsApi.ts` 嘅 WALK/DRIVE 改用 **TomTom Routing API**（`api.tomtom.com/routing/1/calculateRoute`）。TRANSIT（電車）原本打算用 HERE Public Transit API，後來發現 HERE free tier 都要信用卡，最終方案見 8s。
- **順便補漏**：`src/lib/facilitiesApi.ts` 嘅 `findNearbyConvenienceStore`（附近便利店 chip）原本都用緊 Google Places，preview 嗰陣漏咗提——實測 TomTom 對呢類日常小店 POI 覆蓋好差（搵到錯嘅 EV 充電站），改用返同 `findNearbyRestroom` 一致嘅 **OSM Overpass**（`shop=convenience`），完全免 key，實測 Shibuya 附近搵到 Ministop/FamilyMart 準確結果。
- **env 變數改名**：`.env`/`.env.example` 攞走 `VITE_GOOGLE_MAPS_KEY`，加 `VITE_TOMTOM_KEY`（已攞到真 key，已寫入本機 `.env`）。**Vercel 度要另外補加 `VITE_TOMTOM_KEY`**（之前個 `VITE_GOOGLE_MAPS_KEY` 本身都係空嘅所以線上冇壞過，但而家 TomTom 有真 key 要記得同步上去先會生效）。
- **已知取捨**：TomTom 搜尋冇 Google 咁準（實測搜「清水寺」揀咗台灣廟宇高過京都清水寺，因為冇傳 geo bias——同 Google 版本行為一致，非新增回歸）；`priceLevel`（心願比價參考價位）TomTom 冇呢個資料，恆定 `null`，UI 已識靜默唔顯示。
- **實測**：用真 TomTom key 直接 curl Search（清水寺/Tokyo Tower）同 Routing（Shibuya→Shinjuku 自駕 9.4 分鐘、Tokyo Station→Shibuya 步行）API，response shape 同寫落 code 嘅一致。`placesApi`/`storeSuggestApi`/`directionsApi`/`facilitiesApi` + `TransportSegment`/`AddWishlistForm` 共 39 個 test 全綠，`tsc -b` 零錯，`vite build` 乾淨（211 modules）。

## 8s. 電車 mode 唔叫 API，改用 Google Maps 連結（2026-07-06）
- **背景**：8r 原本打算「電車」用 HERE Public Transit API，但 Stephanie 實際去 platform.here.com 申請時發現而家 HERE free tier（Base Plan）都要留信用卡先註冊得，同查文檔嗰陣搵到嘅「Limited Plan 免卡」唔一致（可能已經落咗架或者變咗地區限定）。再查過 Rome2Rio（要申請 partner access，唔係即時自助攞 key，軌道覆蓋主力歐洲/印度/中國）同 OpenTripPlanner/Navitia（要自己 host + 逐個目的地搵 GTFS），確認市面冇一個「免信用卡又覆蓋夠亞洲」嘅公共交通 routing API。
- **做法**：Stephanie 提議「電車」直接出個連結畀用戶自己去 Google Maps 查——`src/lib/directionsApi.ts` 加 `googleMapsTransitUrl(from, to)`，回傳 `https://www.google.com/maps/dir/?api=1&origin=...&destination=...&travelmode=transit`（純官方 URL scheme，唔係 Maps API，唔使 key／唔使登入／完全免費）；`fetchTransportEstimate` 遇到 `TRANSIT` 直接回傳 `null`（唔再叫任何 API）。`TransportSegment.tsx` 揀咗「電車」嗰陣，唔顯示分鐘數，改顯示一粒「喺 Google Maps 睇電車路線」連結掣，撳咗開新分頁——用返 Google 自己最強嘅日/韓/台鐵路資料，好過用一個覆蓋唔齊嘅免費 API 呃自己。
- 步行/自駕（TomTom）完全唔受影響，維持 in-app 即時分鐘數。
- **拎走**：`VITE_HERE_API_KEY`（連 `.env`/`.env.example`/README 一齊清）——已經冚旗唔用 HERE，避免留低死 env var 誤導日後嘅人。
- **測試**：`directionsApi.test.ts`（TRANSIT 唔叫 fetch、`googleMapsTransitUrl` 產生正確 URL）、`TransportSegment.test.tsx`（揀「電車」顯示連結而唔係分鐘數）共 11 個 test 全綠，連 `Itinerary.test.tsx`（13 個）一齊跑冇受影響，`tsc -b` 零錯、`vite build` 乾淨（211 modules）。

## 9. 相關連結
- 建置規格：`TRAVEL_APP_BUILD_SPEC_1.md`
- GitHub repo：https://github.com/auzistephanie/travel
- 部署網址：https://travel-ochre-rho.vercel.app

---
*最後更新：2026-07-06（新增 8s 電車改用 Google Maps 連結，取代 8r 原定嘅 HERE 方案）*
