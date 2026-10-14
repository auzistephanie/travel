# 旅行規劃 App

React (Vite) + Supabase 嘅旅行規劃工具。完整功能規格見 [`TRAVEL_APP_BUILD_SPEC.md`](./TRAVEL_APP_BUILD_SPEC.md)；本檔案只講點樣跑同部署。

呢個 repo 目前完成咗 **Phase 1（骨架）**、**Phase 2（智能提醒）** 同大部分 **Phase 3（錢同心願）**：
分享碼開/加入行程、總覽（航班 + 開支洗去邊）、行程（天氣、室內推介、附近設施、拖拉重排、交通連接、
順路分析）、地圖搜尋、行李智能卡 + 清單、夾錢結算、手信（含 OCR 影單）。心願清單同視覺主題等留返
後續 phase（見 spec 第 10 節）。

## 開發環境需求

- Node.js 22+（`node -v` 確認）
- 一個 [Supabase](https://supabase.com) project（免費 tier 就夠）

## 首次設置

1. 安裝套件：

   ```bash
   npm install
   ```

2. 建立 Supabase project：喺 [supabase.com](https://supabase.com) 開一個新 project。

3. 建資料表同鎖 RLS：入 Supabase dashboard 嘅 **SQL Editor**。
   - **全新 project**：貼晒 [`supabase/schema.sql`](./supabase/schema.sql) 執行一次
     （表結構 + 分享碼 RLS 都喺入面）。
   - **已經跑過舊版 schema 嘅 project**：唔好再跑成個 `schema.sql`。
     改貼 [`supabase/migrations/20261013_lock_rls_share_access.sql`](./supabase/migrations/20261013_lock_rls_share_access.sql)。
     詳細順序見下面「現有專案上鎖」。

4. 開 Anonymous sign-in（分享連結要靠佢，朋友仍然唔使註冊）：
   Dashboard → **Authentication → Sign In / Providers → Anonymous Sign-Ins → Enable**。
   **唔好開 CAPTCHA**（Authentication → Bot and Abuse Protection）。開咗嘅話免登入連結會失敗。
   Google provider 維持啟用，只係行程擁有人用來跨裝置認人同徹底刪除。

5. 攞 API 資料：Supabase dashboard → **Settings → API**，複製 `Project URL` 同 `anon public` key。

6. 設定環境變數：

   ```bash
   cp .env.example .env
   ```

   打開 `.env`，填入：

   ```
   VITE_SUPABASE_URL=你個 Project URL
   VITE_SUPABASE_ANON_KEY=你個 anon public key
   ```

   `AVIATIONSTACK_KEY`（航班自動查詢）、`TOMTOM_KEY`（Places fallback、步行/自駕路線）同
   `TAGGUN_API_KEY`（手信影單 OCR）都可以留空 —
   留空嘅話對應功能會自動降級（航班/手信變純手動輸入、TomTom fallback 唔會打），唔會出錯。
   **呢三條唔好加 `VITE_` 前綴。** 瀏覽器只會打 `/api/flights`、`/api/tomtom-search`、
   `/api/tomtom-route`、`/api/taggun`；key 留喺 Vercel function 同 `npm run dev` 嘅 server middleware。
   - AviationStack key：[aviationstack.com](https://aviationstack.com) 註冊攞 free tier key，唔使信用卡。
   - TomTom key：[developer.tomtom.com](https://developer.tomtom.com/user/register) 註冊，
     My Apps → Create App 就有一個通用 key（Search API + Routing API 共用），唔使信用卡。
   - Taggun key：[taggun.io](https://taggun.io) 註冊攞 free tier key。

   便利店/洗手間搜尋用 OpenStreetMap Overpass，完全免 key。電車路線冇 in-app 估算，
   撳掣直接跳去 Google Maps 官方連結查（唔使 key、唔使註冊）。地點搜尋主來源仍然係 Nominatim，都免 key。

## 開發

```bash
npm run dev       # 開發伺服器（預設 http://localhost:5173）
npm test          # 跑 Vitest 測試
npm run build     # 型別檢查 + production build
npm run lint      # Oxlint
```

## 部署（Vercel）

1. 將呢個 repo push 上 GitHub。
2. 喺 [vercel.com](https://vercel.com) 入面 import 呢個 repo（Vercel 會自動偵測 Vite 專案）。
3. 喺 Vercel project 嘅 **Settings → Environment Variables**，填入：
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `AVIATIONSTACK_KEY`（可留空）
   - `TOMTOM_KEY`（可留空）
   - `TAGGUN_API_KEY`（可留空）

   如果之前有 `VITE_AVIATIONSTACK_KEY`、`VITE_TOMTOM_KEY`、`VITE_TAGGUN_API_KEY`，
   新版部署確認航班／路線／影單仍然得之後，**刪走嗰三條舊名**。新 code 唔會再讀佢哋；
   留低只會增加日後被人誤用 `VITE_` 前綴打回瀏覽器嘅機會。
4. Deploy。之後每次 push 去 main 都會自動重新部署。

`vercel.json` 嘅 SPA rewrite 會跳過 `/api/*`，所以 `/t/:shareCode` 重新整理唔會 404，
serverless function 亦唔會被改寫去 `index.html`。

## 現有專案上鎖（merge 之前要做）

分享連結嘅用法唔變：朋友打開 `/t/分享碼` 或者喺加入頁輸入分享碼，唔使註冊、唔使揀帳戶。
瀏覽器會靜靜建立一條 Supabase anonymous session，再用分享碼換 `trip_access`。
未 claim 嘅人用 anon key 都讀唔到其他行程。

請按呢個次序，中間唔好隔太耐（舊前端唔識 claim；新前端又要 SQL function 先讀到資料）：

1. Dashboard → **Authentication → Sign In / Providers → Anonymous Sign-Ins → Enable**。
   確認 **CAPTCHA 係關**。Google provider 保持啟用。
2. Vercel 加好上面三條 **冇 `VITE_` 前綴** 嘅 key（可以先加，舊網站暫時唔受影響）。
3. SQL Editor 貼晒並執行 [`supabase/migrations/20261013_lock_rls_share_access.sql`](./supabase/migrations/20261013_lock_rls_share_access.sql)。
4. 立刻 merge／部署呢個 PR。
5. 用一條現有分享連結開一次行程，確認睇到資料、改到一行（例如行李剔選）。
   再用一個未開過嘅瀏覽器開同一條連結，確認都入到。
6. 刪走 Vercel 上舊嘅 `VITE_AVIATIONSTACK_KEY`、`VITE_TOMTOM_KEY`、`VITE_TAGGUN_API_KEY`。

SQL Editor 用 postgres role，會繞過 RLS，所以喺 Dashboard 仍然睇到全部行。瀏覽器嘅 anon key 唔會。

## 資料庫結構

見 [`supabase/schema.sql`](./supabase/schema.sql)。朋友免登入共編仍然係分享碼：
知碼先可以 claim，RLS 只放行已經 claim 嘅行程（或者已用 Google 綁定嘅擁有人）。
徹底刪除仍然只限已綁 Google、而且唔係 anonymous session 嘅擁有人。
