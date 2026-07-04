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
| 地圖 | Google Maps JS + Places + Directions API |
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

## 9. 相關連結
- 建置規格：`TRAVEL_APP_BUILD_SPEC_1.md`
- GitHub repo：https://github.com/auzistephanie/travel
- 部署網址：https://travel-ochre-rho.vercel.app

---
*最後更新：2026-07-04（新增 8c 產品 Showreel）*
