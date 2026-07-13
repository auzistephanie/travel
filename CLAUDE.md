# 旅行規劃 App — CLAUDE.md

> 手機優先旅行規劃 PWA（行程／地圖／行李／夾錢／手信，朋友免登入共編）。完整規格見 `TRAVEL_APP_BUILD_SPEC.md`；改動記錄見 `CHANGELOG.md`。
> **位置**：`~/Desktop/Stephanie-Google Drive/dev/Travel App`（唯一正本，2026-07-12 搬入 Google Drive Mirror）。App 本體由 Claude Code CLI 開發。

## ✍️ 寫入分流（MANDATORY — 想更新本檔前先讀）

- **改動記錄／開發史** → root `CHANGELOG.md` **頂部**，唔准 append 落本檔；本檔硬上限 **100 行／6KB**
- 本檔只准改：路由行、現行規則本身變咗。完整分流表 → `stephanie-personal/docs/ai-governance/04-MAINTENANCE.md` §0

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

## 9. 相關連結
- 建置規格：`TRAVEL_APP_BUILD_SPEC.md`
- 架構審視報告：`docs/ARCHITECTURE_REVIEW_2026-07-11.md`（+ 交接手記 `docs/HANDOVER_2026-07-11.md`）
- GitHub repo：https://github.com/auzistephanie/travel
- 部署網址：https://travel-ochre-rho.vercel.app

---
*最後更新：2026-07-13（CLAUDE.md 瘦身：§8a–§8ab dated log 搬去 CHANGELOG.md）*
