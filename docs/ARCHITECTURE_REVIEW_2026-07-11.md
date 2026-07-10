# 架構審視報告 — Travel App（2026-07-11）

> 審視範圍：全 codebase（src/ 11,700 行、81 個 vitest 測試檔、CLAUDE.md 8a–8v 開發史）。
> Baseline 驗證：81 test 檔全綠、`tsc -b` 零錯、`vite build` 乾淨（審視前實測，唔係齋睇 code）。

---

## 一、整體分層評價

### 乾淨嘅地方（值得保持）

**lib 純函數層係全 app 最健康嘅一層。** `settlement.ts`、`reorder.ts`、`tripDays.ts`、`geo.ts`、`routeOptimize.ts`、`autoClothing.ts`、`expenseGrouping.ts` 等零 React 依賴、零 IO，逐個有對應 unit test。呢層可以放心任摸。

**Repo 層（Supabase 存取）pattern 高度統一。** 7 個 `*Repo.ts` 全部係「query → `if (error) throw` → cast 返 model type」，冇一個例外。`itineraryRepo`/`packingRepo` 對 StrictMode 雙重 effect 引致嘅 unique violation 有 recover 邏輯，註解清楚。

**外部 API 層（`*Api.ts`）pattern 亦統一——但同 Repo 層係另一套。** 8 個 HTTP api wrapper 全部係「冇 key → return null/[]；`!response.ok` → null/[]；exception → null/[]」，即係 graceful degradation，永遠唔會令 UI crash。呢個「Repo throw、Api 靜默降級」嘅二分其實係合理設計（DB 錯誤係 exceptional、第三方 API 跛咗唔應該拖冧成個 app），但**冇任何地方文檔化**，令佢睇落好似「各自為政」——實情係兩套 convention 各自內部一致（詳見第四節）。

**hooks 層 CRUD pattern 一致**：`load / loading / error / optimistic 更新`，5 個 collection hook（expenses/flights/gifts/wishlist/packing）結構幾乎逐行相同——一致係優點，但都係 300+ 行 copy-paste boilerplate（詳見技術債 #3）。

**主題系統真係 token 化咗**：`THEMES` + CSS variables 貫穿 4 主題，冇逐頁 hardcode，同 CLAUDE.md §5 承諾一致。

**測試文化好**：mock pattern 統一（`supabaseQueryMock.makeQuery`）、pure logic 有 unit test、component 有 render/interaction test。

### 有結構性問題嘅地方

1. **TripShell 身份識別四套來源纏繞**（詳見第三節——最痛）。
2. **share_code 開放式 RLS** = 任何人知道（或撞中）6 位 share code 就可以讀寫**兼徹底刪除**成個 trip（技術債 #2）。
3. **localStorage 六個入口、三種防禦水平**：`myTrips` 有完整 try/catch；`whoAmI`／`themeStorage` 完全冇（Safari 私密模式／storage 滿會直接 throw 冧 app）；`lazyWithReload` 用 sessionStorage 都冇 guard。
4. **Dead code／垃圾**：`MapPage.tsx`+test（已確認全 repo 零引用）、root `landing.html`（39KB，係 `public/landing-preview.html` 嘅過時舊版，build 唔會包佢）、本地 4 個 `dist-*` build 殘留（gitignored，唔阻 build 但阻眼）。
5. **文案語言違規**：CLAUDE.md §8 規定「應用內所有文案一律用書面語」，但 `CreateTrip` 成功畫面、`SettingsPanel` 多段 hint、`Landing` 刪除確認框仲係廣東話口語（「佢哋撳開揀返自己個名」「淨係喺呢部裝置隱藏，資料仲喺」）。
6. **常數重覆**：`DESTINATION_OPTIONS` 喺 `CreateTrip` 同 `SettingsPanel` 各抄一份；`UNIQUE_VIOLATION = '23505'` 喺 `tripApi`／`itineraryRepo`／`packingRepo` 定義三次；`TomTomSearchResponse` interface 喺 `placesApi`／`storeSuggestApi` 抄兩份。
7. **分頁 state 唔入 URL**：`activeTab` 純 useState，唔可以 deep link 去「錢」分頁，reload 永遠彈返總覽。小事，但 PWA 加到主畫面後體驗有感。

---

## 二、最痛 5 個技術債

### #1 身份識別四套來源纏繞 —【改動：高風險】
- **現況**：`TripShell.tsx` 一個 component 入面，身份由 4 個來源競爭：① auth session match 到 `trip_members.auth_user_id`（最高優先，effect 自動搶）② URL `?m=`（初始 state）③ `whoami:{shareCode}` localStorage（fallback）④ 手動揀名畫面。仲有第 5 個元素 `manualOverride` flag 專門去「擋住」①。優先次序散落喺 initial state、兩個 effect 同一個 handler 度，冇一個地方講晒全套規則。
- **風險**：8d→8f→8l→8p 四輪補鑊史證明每加一個入口就爆一個新 edge case。已知未解限制（8l 自認）：`manualOverride` 只喺唔 reload 嘅 session 內有效，reload 後 auth 自動識別會再贏。
- **影響半徑**：TripShell + CreateTrip + SettingsPanel + WhoAmIPicker + 對應 4 個 test 檔（30+ 條 test）。
- **建議方案**：抽 `useTripIdentity` hook + 純函數 resolver（詳見第三節方案）。**評級：高風險**——硬規則講明呢類要先出方案批准，今次唔郁，只出方案。

### #2 share_code 開放式 RLS + 匿名可徹底刪除 —【改動：中風險（動 prod DB）】
- **現況**：所有表嘅 RLS policy 係「知 share_code 即可讀寫」（schema.sql 自認 MVP 限制）。8o 加咗 `deleteTripByShareCode` 之後，**anon key + share code = 可以 cascade delete 成個 trip**（連埋所有人嘅夾錢帳目）。Share code 係 32 字母 × 6 位 ≈ 10.7 億組合，靠 Supabase 內建 rate limit 唔係真防線。
- **風險**：惡意或者手殘（朋友撳錯「徹底刪除」冇 owner 限制——UI 有限制但 API 冇，識用 devtools 嘅人可以直接 call）。真實傷害：不可還原資料損失。
- **影響半徑**：DB policy + `tripApi.deleteTripByShareCode` + SettingsPanel/Landing 刪除流程。
- **建議方案（分兩級）**：
  - **最小收窄（推薦先做）**：淨係將 `trips` 表嘅 **DELETE** policy 收窄做「`auth.uid()` match 到該 trip 一個 `is_owner=true` 兼 `auth_user_id` 已綁定嘅 member」。Owner 一定登入咗先刪到；朋友免登入讀寫完全唔受影響。改一條 policy + owner 未登入時 UI 要提示先登入。**評級：中風險**（動 prod DB + 要真人實測刪除流程）。
  - **進階**：其餘表寫入都要 membership 驗證——會動搖「免登入共編」核心設計，唔建議而家做。
- **今次唔郁**（動 prod DB 屬結構性改動，要 preview 批准）。

### #3 hooks 層 300+ 行 copy-paste boilerplate —【改動：中風險】
- **現況**：`useExpenses`/`useFlights`/`useGifts`/`useWishlist`/`usePackingChecklist` 五個 hook 嘅 load/loading/error/optimistic-update 骨架逐行相同，只係換咗 repo function 同錯誤文案。
- **風險**：唔係 bug 溫床（pattern 一致），但每次改行為（例如加 retry、加 realtime）要改 5 次；新功能會繼續抄第 6 份。
- **影響半徑**：5 個 hook + 佢哋 consumer 頁面嘅 test（間接）。
- **建議方案**：抽 generic `useTripCollection<T>(loader, actions)`，5 個 hook 變薄 wrapper（保留現有簽名，consumer 零改動）。**評級：中風險**——hook 冇直接 test，行為靠頁面 test 間接覆蓋，要成批跑晒先安心。列入計劃，唔係今次安全批。

### #4 localStorage 防禦唔統一 —【改動：安全】
- **現況**：`myTrips.ts` 讀寫有 try/catch + corrupt data 過濾（好嘢）；`whoAmI.ts`、`themeStorage.ts` 直接 `localStorage.getItem/setItem` 冇任何 guard；`lazyWithReload.ts` 用 sessionStorage 都係裸call。
- **風險**：Safari 私密模式（舊版 setItem 即 throw）、storage 配額滿、企業裝置封 storage——任何一種情況下 `TripShell` 初始 render 就會 throw，成個 app 白畫面。呢個唔係理論：iOS Safari 就係呢個 app 嘅主要目標環境。
- **影響半徑**：3 個 lib 檔，行為唔變（正常環境下完全一樣），test 唔使動。
- **建議方案**：包一層 safe wrapper（讀失敗回 null／寫失敗靜默）。**評級：安全**——今次做。

### #5 資料層雙 convention 冇文檔化 + 靜默吞錯零遙測 —【改動：安全～低風險】
- **現況**：「Repo throw／Api 降級」二分冇寫低喺任何地方；8 個 Api wrapper 嘅 `catch { return null }` 連 `console.warn` 都冇，第三方 API 跛咗（quota 爆、key 過期）喺用戶同開發者眼中都係「靜靜哋冇嘢出」，debug 要靠 Chrome MCP 睇 network（8v 個案就係咁查出嚟）。
- **風險**：問題唔會浮面，直到用戶投訴「搜尋永遠找不到」。
- **影響半徑**：8 個 `*Api.ts`；加 log 唔改行為，test 唔受影響。
- **建議方案**：① 今次先喺 `src/lib/README.md`（或 CLAUDE.md）文檔化兩套 convention【安全，做】；② 下一步喺 catch 度加 `console.warn`（dev 可見）——test 有機會 assert console 乾淨，要驗證先郁【低風險，列入計劃】。

---

## 三、深入診斷 A：身份識別（TripShell）

### 而家實際嘅優先次序（散落 4 個位，冇單一出處）

```
1. auth session → members.auth_user_id match   （effect，最高優先，manualOverride 可擋）
2. URL ?m=                                      （useState 初始值）
3. localStorage whoami:{shareCode}              （useState 初始值 fallback）
4. WhoAmIPicker 揀名／自訂新名                   （UI fallback）
副作用：一旦確定 → 寫返 URL（replace）+ localStorage + addMyTrip
擋箭牌：manualOverride（session 內有效，reload 即失效——8l 已知限制）
```

### 點解會咁：每一層都係為咗修一個真 bug 而加

| 層 | 引入原因 | 補鑊記錄 |
|---|---|---|
| localStorage | 最初設計 | — |
| URL `?m=` | iOS 主畫面圖示 vs Safari 兩個 storage context 唔通 | 8d |
| auth match | 換新裝置認唔返 owner | 8f/8i/8j |
| manualOverride | 「切換身份」被 auth 自動識別即刻搶返 | 8l |

每層都合理，但**組合行為冇人講得出全貌**——例如「登入咗嘅 owner 撳朋友條 `?m=朋友id` 嘅連結會發生咩事？」答案係 auth 贏、URL 被改寫做自己——啱唔啱意圖，冇 spec 講。

### 建議方案（出畀你批，今次冇郁）

**第一步：抽純函數 resolver（可以獨立 unit test）**

```ts
// src/lib/identityResolver.ts
export type IdentitySource = 'auth' | 'url' | 'storage' | 'none'
export function resolveIdentity(input: {
  members: TripMember[]
  authUserId: string | null
  urlMemberId: string | null
  storedMemberId: string | null
  manualOverride: boolean
}): { memberId: string | null; source: IdentitySource }
```

規則寫晒喺一個 function 度：auth（除非 override）→ url（要 member 存在）→ storage（要 member 存在）→ none。而家仲有個隱藏 bug 級行為：URL/localStorage 嘅 member id **冇驗證過存唔存在**（member 被刪後條舊連結會入到一個 ghost 身份）——resolver 順手修埋。

**第二步：`useTripIdentity(shareCode, members)` hook** 包住 resolver + 副作用（寫 URL/localStorage/綁定 auth/addMyTrip），TripShell 淨返「攞 identity、揀 render 邊個畫面」。

**風險同成本**：TripShell.test（14 case）大部分唔使改期望值，但 harness 要適配；`manualOverride` 跨 reload 語意可以順手升級（寫入 sessionStorage）——呢個係行為改動，要你拍板。**建議下一個 session 做，一個 PR 搞掂，做完先郁其他嘢。**

---

## 四、深入診斷 B：資料層（Repo / Api）

### 實況：唔係「不一致」，係「兩套各自一致但冇講明嘅 convention」

| | `*Repo.ts`（7 個，Supabase） | `*Api.ts`（8 個，第三方 HTTP） |
|---|---|---|
| 錯誤處理 | `if (error) throw` | 全部吞掉，回 `null`/`[]` |
| 冇配置 | n/a（Supabase 必須有） | 冇 key 即回空，UI 降級 |
| 邊個接錯 | hooks 層 catch → 中文錯誤文案 | UI 當「冇結果」 |
| 一致性 | 7/7 一致 | 8/8 一致 |

呢個二分係啱嘅：DB 錯 = 功能斷裂要話畀用戶知；天氣/搜尋/OCR 跛 = 錦上添花冇咗就算。**問題只係：① 冇文檔（下一個開發者好易「統一」錯方向）；② Api 層零遙測（連 console.warn 都冇）；③ 局部重覆（23505 recover 邏輯抄 3 份、TomTom response type 抄 2 份）。**

### 建議
1. 文檔化兩套 convention【安全，今次做——見 `src/lib/README.md`】。
2. `UNIQUE_VIOLATION` 抽去共用常數【安全，今次做】。
3. Api catch 加 `console.warn`【低風險，下次】。
4. 23505「insert 撞 unique 就讀返existing」抽 helper【低風險，下次——邏輯有少少唔同（單欄 vs 雙欄 lookup），要小心泛化】。

---

## 五、優先重構計劃（價值 ÷ 風險排序）

| # | 項目 | 改邊啲檔 | 動唔動 test | 評級 | 今次做？ |
|---|---|---|---|---|---|
| 1 | 刪 dead code：`MapPage.tsx`+`.test.tsx`、root `landing.html`；清本地 `dist-*` 殘留 | 2 個 src 檔刪除、1 個 root html 刪除 | 刪 1 個 dead test 檔（唔係改期望值） | 安全 | ✅ 已做 |
| 2 | localStorage/sessionStorage 防禦統一（safe wrapper） | `whoAmI.ts`、`themeStorage.ts`、`lazyWithReload.ts` | 唔動（行為唔變，加咗新 test） | 安全 | ✅ 已做 |
| 3 | 常數去重：`UNIQUE_VIOLATION` 共用、`DESTINATION_OPTIONS` 抽去 `destinations.ts` | `tripApi`/`itineraryRepo`/`packingRepo`/`CreateTrip`/`SettingsPanel`/`destinations` | 唔動 | 安全 | ✅ 已做 |
| 4 | `getTripsForAuthUser` 補 unit test（8n 自認欠） | `tripApi.test.ts` 加 case | 純加 test | 安全 | ✅ 已做 |
| 5 | 資料層 convention 文檔化 | 新增 `src/lib/README.md` | 唔動 | 安全 | ✅ 已做 |
| 6 | 文案書面語統一（CreateTrip/SettingsPanel/Landing） | 3 個檔 + 對應 test 嘅文案 assert | 動（文案改 test must 跟） | 安全但主觀 | ❌ 文案要你過目先改 |
| 7 | 抽 `useTripIdentity` + identity resolver | TripShell + 新 lib + 4 test 檔 | 動 harness | 中 | ❌ 方案見第三節，批咗先做 |
| 8 | RLS 收窄：trips DELETE 要 owner auth | DB migration + tripApi + UI 提示 | 加 case | 中（動 prod DB） | ❌ 方案見技術債 #2 |
| 9 | hooks 抽 generic `useTripCollection` | 5 hooks | 間接 | 中 | ❌ 列入計劃 |
| 10 | Api catch 加 console.warn 遙測 | 8 個 `*Api.ts` | 要驗證 console assert | 低 | ❌ 下次順手 |
| 11 | activeTab 入 URL（deep link 分頁） | TripShell/BottomNav | 加 case | 低 | ❌ 錦上添花 |

---

## 六、安全性特別備註（唔係今次落刀範圍，但要記錄）

- 技術債 #2（匿名可刪 trip）係而家最大單一風險，建議下一個 session 優先過 identity 重構。
- `photoRepo` 上載去 public bucket，URL 冇簽名——知道 URL 就睇到相。MVP 可接受，記錄在案。
- Share code 6 位已經係設計核心，唔建議改；重點係「知道 code 可以做啲乜」要收窄（先收 DELETE）。
