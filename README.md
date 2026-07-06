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

3. 建資料表：入 Supabase dashboard 嘅 **SQL Editor**，貼晒 [`supabase/schema.sql`](./supabase/schema.sql)
   成個檔案內容，執行一次（呢個檔案已包含晒 spec 第 9 節嘅全部 table + RLS policy）。

4. 攞 API 資料：Supabase dashboard → **Settings → API**，複製 `Project URL` 同 `anon public` key。

5. 設定環境變數：

   ```bash
   cp .env.example .env
   ```

   打開 `.env`，填入：

   ```
   VITE_SUPABASE_URL=你個 Project URL
   VITE_SUPABASE_ANON_KEY=你個 anon public key
   ```

   `VITE_AVIATIONSTACK_KEY`（航班自動查詢）、`VITE_TOMTOM_KEY`（Places 搜尋、步行/自駕路線）、
   `VITE_HERE_API_KEY`（電車/公共交通路線）同 `VITE_TAGGUN_API_KEY`（手信影單 OCR）都可以留空 —
   留空嘅話對應功能會自動降級（航班/手信變純手動輸入、地圖搜尋會回傳空結果、交通時間唔顯示），唔會出錯。
   - AviationStack key：[aviationstack.com](https://aviationstack.com) 註冊攞 free tier key，唔使信用卡。
   - TomTom key：[developer.tomtom.com](https://developer.tomtom.com/user/register) 註冊，
     My Apps → Create App 就有一個通用 key（Search API + Routing API 共用），唔使信用卡。
   - HERE key：[platform.here.com](https://platform.here.com/portal) 註冊，
     建 project → Access Manager → Register app → Create API key（電車/公共交通用，唔使信用卡）。
   - Taggun key：[taggun.io](https://taggun.io) 註冊攞 free tier key。

   便利店/洗手間搜尋用 OpenStreetMap Overpass，完全免 key。

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
3. 喺 Vercel project 嘅 **Settings → Environment Variables**，填入同 `.env` 一樣嘅變數
   （`VITE_SUPABASE_URL`、`VITE_SUPABASE_ANON_KEY`，同埋已配置嘅 `VITE_AVIATIONSTACK_KEY` /
   `VITE_TOMTOM_KEY` / `VITE_HERE_API_KEY` / `VITE_TAGGUN_API_KEY`）。
4. Deploy。之後每次 push 去 main 都會自動重新部署。

`vercel.json` 已包含 SPA rewrite 設定，確保 `/t/:shareCode` 呢類前端路由喺重新整理頁面時唔會 404。

## 資料庫結構

見 [`supabase/schema.sql`](./supabase/schema.sql)。呢個 app 冇帳號登入，用「分享碼」做存取
控制，所以每張表嘅 RLS policy 都係開放式嘅（知 URL 就有得讀寫）——呢個係 MVP 階段嘅已知限制，
唔係嚴謹嘅多租戶隔離，spec 第 11 節有提及。
