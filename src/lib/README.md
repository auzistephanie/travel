# src/lib — 資料層 convention（請跟，唔好「統一」錯方向）

呢個資料夾有兩類檔案，錯誤處理係**刻意唔同**嘅兩套 convention：

## `*Repo.ts` + `tripApi.ts` — Supabase 存取層
- **錯誤處理：`if (error) throw`**。DB 錯 = 功能斷裂，一定要浮上去。
- 邊個接：hooks 層（`useExpenses` 等）catch 之後 set 做中文錯誤文案畀 UI 顯示。
- Insert 撞 unique constraint（`UNIQUE_VIOLATION`，見 `postgrestErrors.ts`）通常唔算錯：
  StrictMode 雙重 effect / 兩個分頁同時 seed 會撞，處理方法係「讀返 existing 行嚟用」
  （見 `itineraryRepo.createDay`、`packingRepo.insertPackingItem`）或 retry（`tripApi.createTrip` 撞 share code）。

## `*Api.ts`（除 `tripApi`）— 第三方 HTTP API wrapper
（TomTom / Open-Meteo / Overpass / AviationStack / Taggun / open.er-api）
- **錯誤處理：全部吞掉，回 `null` / `[]`**。呢啲係錦上添花功能（天氣、搜尋、OCR、匯率），
  第三方跛咗唔應該拖冧成個 app，UI 直接當「冇結果」降級。
- 冇 API key（env 未設定）→ 一樣回 `null`/`[]`，唔 throw。
- **已知取捨**：catch 連 `console.warn` 都冇，第三方 API 出事喺 dev 都唔會見到
  （改善計劃見 docs/ARCHITECTURE_REVIEW_2026-07-11.md #5）。

## 其他
- 純函數（`settlement` / `reorder` / `geo` / `tripDays`…）：無 IO、必須有 unit test。
- storage 存取一律經 `safeStorage.ts`（私密模式/配額滿唔冧 app），唔好直接摸 `localStorage`。
