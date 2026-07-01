# 旅行規劃 App — Build Spec

> 呢份文件係俾 Claude Code CLI 用嘅完整建置規格。所有功能決定已經喺 preview 階段同用家確認過，直接照起。
> 專案資料夾：`/Users/stephanieau/Desktop/Work-Google Drive/Travel`

---

## 0. 技術棧

| 部件 | 選用 | 理由 |
|---|---|---|
| 前端 | React (Vite) + PWA | 手機加到主畫面、似真 app |
| 後端 / 資料庫 | Supabase (Postgres + Realtime + Storage) | 免費、跨裝置即時同步、朋友共編 |
| 部署 | Vercel | 一 push 自動上線 |
| 地圖 | Google Maps JavaScript API + Places API + Directions API | 搜尋景點、路線、導航深連結 |
| 天氣 | Open-Meteo（免費，唔使 API key） | 逐日 + 逐半日降雨機率、溫度 |
| 航班查詢 | AviationStack 或 FlightAware AeroAPI | 打航班號自動 fill 航線/時間/客運大樓 |
| 收據 OCR | Google Cloud Vision API 或 Taggun | 影單自動讀品項/商戶/金額 |
| 匯率 | open.er-api.com（免費） | 提供預設值，用戶可以手動覆蓋 |

**分享機制**：唔用帳號登入。每個 trip 生成一個分享碼／連結，朋友撳連結揀返自己個名就可以入數，唔使註冊。

---

## 1. 資訊架構（5 個底部分頁）

```
總覽 (Overview)
行程 (Itinerary)
地圖 (Map)
準備 (Prep)     → sub-tab: 行李 / 心願
錢   (Money)    → sub-tab: 夾錢 / 手信
```

設定（⚙️，右上角進入，唔佔底部分頁）。

---

## 2. 總覽 Overview

- **Hero 卡**：行程名、日期、成員頭像、日數/行程數/人均統計
  - Hero 背景用**目的地插畫**（見第 7 節），套用當前主題嘅濾鏡
- **航班列表**：
  - 每張航班卡：航班號、出發/到達機場+時間、登機口、客運大樓、座位、確認碼
  - **＋加入航班**：輸入航班號 + 日期 →查航班 API 自動 fill 航線/時間/客運大樓 → 用戶確認先加入（唔全自動信任 API，畀用戶睇一次先撳確認）
- **出發前準備總進度**（新卡片，撳可跳轉）：
  - 行李完成 %（圓環）
  - 心願清單未買幾多樣
  - 夾錢未清幾多人
- **撕紙邊分隔**（視覺，見第 8 節）
- **開支洗去邊**：
  - 切換「📅 逐日洗費」/「📊 分類總覽」
  - 機票／酒店等**旅行基本費**（跨日、唔屬單一日）獨立一張卡放最頂，唔計入逐日
  - 分類總覽：交通/住宿/餐飲/門票/購物，bar 顯示金額+佔比

---

## 3. 行程 Itinerary

- 日曆式 day-tab 切換
- **天氣**：分上午/下午顯示（icon、溫度、降雨 %），數據來自 Open-Meteo
  - 任一半日降雨 ≥60% → 彈室內好去處推介卡（商場/博物館/水族館，用 Google Places 搵當日行程附近嘅室內地點）
- **心願清單提醒**：當日有連結嘅未買心願會喺呢度彈出，撳「買咗」跳去「準備→心願」開核實流程（見第 5 節）
- **行程時間軸**：
  - 每個景點：時間、名稱、地點、🧭 導航掣（開 Google Maps 深連結）
  - 附近設施 chip：🚻 洗手間 / 🏪 便利店（用 OpenStreetMap Overpass 搵洗手間、Google Places 搵便利店），撳落去直接開 Google Maps 導航
  - **拖拉重排**：手指拖拉景點順序，鬆手後時間自動跟返順序調整
  - **交通連接**：相鄰兩個景點之間顯示步行/電車/自駕嘅預計時間（Google Directions API），可以撳選邊種交通方式
- **地圖 & 順路分析**：
  - 撳掣顯示當日路線圖（Google Maps 靜態/JS API 畫景點連線）
  - 計算路線總距離，若非最短路徑 → 提示「可以更順路，慳 Xkm」+ 建議次序 + 一鍵套用（nearest-neighbor 演算法，第一站固定）

---

## 4. 地圖 Map

- Google Maps 互動地圖 + Places 搜尋（真實搜尋，唔係 mock）
- 搜尋結果可以「加入邊一日」（揀日子），加入後真係寫落嗰日嘅 itinerary，唔止畫個標記

---

## 5. 準備 Prep（sub-tab：行李 / 心願）

### 5.1 行李 Packing

- **智能提醒卡**（目的地自動讀第一程航班嘅到達機場判斷，唔使用戶揀）：
  - 🔌 轉插頭 + 電壓（按目的地）
  - 🛂 簽證提醒（按護照 + 目的地）
  - 💵 入境現金提醒：包括法定要求 + **建議帶幾多**（有金額，非純文字），自動用 Settings 嘅匯率折算 HKD
  - 🌡️ 溫度建議（跟整程行程最高/最低溫）：
    - 熱（≥28°）→ 提示帶手提風扇
    - 涼（17°以下）→ 提示帶薄外套
    - 凍（12°以下）→ 提示帶厚外套
    - 任何一日降雨 ≥50% → 提示帶摺疊遮
    - 目的地蚊蟲多（按地區資料）→ 提示帶蚊拍/蚊怕水
  - 🧳 寄艙行李額：**每人一行**，各自跟自己張機票嘅艙等/航空公司實際 KG（唔係全團一個數）
- **清單**：分類 checklist（證件/電子/衣物/藥物…）
  - 衣物類「上衣、褲、內衣、襪」數量**自動跟行程日數計算**（褲隔日著 ÷2 進位），標「自動」tag
  - 100% 執完 → 蓋印章視覺（"執晒"）

### 5.2 心願清單 Wishlist

- **＋加心願**：
  - 相片欄位（用戶可以真係影相/上載，存 Supabase Storage）
  - 打想買嘅嘢 → **AI 搜尋邊度買**，回傳 2-3 間分店 + 價錢區間比較（真實版：可用 web search / Google Places 商戶資料庫，或維護一個目的地商店知識庫）
  - **買俾邊個**：自己 / 已知名單 / 自訂新名字
  - 連去邊一日行程（optional，冇連會有提示「記得手動去買」）
- **心願 = 手信嘅前置規劃**，兩者概念上打通：
  - 任何心願（包括買俾自己）確認買咗，都會流入「手信」記錄，唔止買俾人嗰啲
  - 撳「✓ 買咗」**唔即刻 confirm**，會彈一張「核實買咗」卡：預填計劃嘅店名/價錢，但用戶可以改（因為好可能改咗去第度買/唔同價）→ 用**實際**資料流入手信
  - 已買嘅心願可以撤銷返做未買（但已入手信嘅記錄唔會自動刪走，避免誤刪帳目，要刪要喺手信頁手動刪）

---

## 6. 錢 Money（sub-tab：夾錢 / 手信）

### 6.1 夾錢 Split

- 每筆開支：項目、金額、**貨幣**（可揀多種，唔限 HKD）、俾錢人、邊幾位分攤、分類（交通/住宿/餐飲/門票/購物/其他）
- 機票/酒店等**旅行基本費**要有 flag（`is_trip_base: true`），呢類唔計入「總覽」逐日檢視，但計入分類總覽
- **結算**：who owes whom，自動用 Settings 嘅匯率折算做 HKD 顯示
- 分享連結／碼俾朋友入數，唔使登入

### 6.2 手信 Gift

- 影單 OCR：自動讀**品項 + 商戶 + 金額**，用戶可以手動修正（OCR 有機會讀錯）
- 分組顯示：按「買俾邊個」分組（包括「自己」），每組小計
- 同心願清單打通（見 5.2），亦可以直接喺呢度手動新增（唔一定要經心願）

---

## 7. 目的地插畫系統

- 每個支援嘅目的地（日本／泰國／韓國／台灣／越南……可擴充）有一套**原創插畫**（唔係翻版真實相片，避開版權問題）：
  - 獨特天空色調（唔同時段/氣候感覺）
  - 獨特地標剪影（例如東京鐵塔／泰式佛塔／韓式飛簷／台北塔式建築／下龍灣石灰岩山）
  - 獨特細節元素（燈籠、帆船、廟頂等）
- 目的地**自動判斷**：讀行程第一程航班嘅到達機場代碼，唔使用戶手動揀
- 插畫套用喺 Hero 卡背景、心願縮圖等，並根據當前主題套用對應濾鏡（見第 8 節）

---

## 8. 視覺主題系統

### 8.1 四個內置主題

| 主題 | 色調 | 字體個性 | 招牌動態效果 |
|---|---|---|---|
| ① 復古探險地圖 Cartography | 羊皮紙米黃 + 深綠/赤陶 | 打字機 + 襯線標題 | 指南針擺動、路線虛線持續移動 |
| ② 東京霓虹夜 Neon | 近黑紫 + 霓虹粉/青 | 科技感等寬字 | 標題霓虹閃爍、背景掃描線、按鈕發光脈動 |
| ③ 明信片剪貼簿 Scrapbook | 米白 + 手寫感 | 手寫字 + 襯線 | 和紙膠帶擺動、印章彈入動畫、卡片撳落有反饋 |
| ④ 和風藍染 Indigo | 靛藍 + 朱紅/金 | 明體標題 | 背景波紋流動、金線畫入動畫、按鈕內光反饋 |

### 8.2 主題套用範圍

- **必須套用喺全部 5 個分頁**，唔止總覽（token 化：CSS variables／design tokens 系統，唔可以逐頁 hardcode 顏色）
- 用「蓋印章」視覺代替純剔號做「完成」標記（行李執晒、心願買咗）
- 分頁 / 主要卡片區塊之間用「撕紙邊」分隔線強化手帳感（可設計成主題共用元素，或者跟主題有變化）
- 通用 tap ripple 效果（顏色跟主題強調色）

### 8.3 自訂主題（重要 — 一定要落 Settings）

- **Settings → 主題** 入面：
  - 揀 4 個內置主題其中一個（縮圖式選擇，每個縮圖顯示目的地插畫套住嗰個主題嘅濾鏡效果，唔淨係文字）
  - 微調主色：每個主題提供 4 粒可揀嘅強調色 swatch，即時預覽
  - 呢個設定要 persist（存落 Supabase 或最少 local storage），下次開返 app 記得用戶揀嘅主題
- 主題切換要有 **crossfade 過場**，唔可以硬跳

---

## 9. Supabase 資料模型（建議 table 結構）

```
trips
  id, name, start_date, end_date, share_code, created_at

trip_members
  id, trip_id, name, color, is_owner

flights
  id, trip_id, code, from_airport, to_airport, from_time, to_time,
  date, gate, terminal, seat, pnr, baggage_kg, member_id (乘客)

itinerary_days
  id, trip_id, date, order_index

itinerary_stops
  id, day_id, time, title, place_name, lat, lng, order_index,
  transport_mode_to_next, icon

packing_items
  id, trip_id, category, name, checked, auto_qty (bool)

wishlist_items
  id, trip_id, name, photo_url, buy_at, price_lo, price_hi,
  tip, linked_day_id, to_member, bought, actual_store, actual_amt,
  synced_to_gift (bool)

expenses
  id, trip_id, title, amount, currency, payer_id, split_member_ids[],
  day_id (nullable), category, is_trip_base (bool)

gifts
  id, trip_id, item, store, amount, to_member, source (manual/wishlist/ocr)

settings
  trip_id, exchange_rates (jsonb), theme, custom_accent_color
```

---

## 10. 建議 Build 順序（分期，每期完成後自己 review 先報告）

**Phase 1 — 骨架 + 核心資料**
- Vite + React 專案 init，Supabase 連接，分享碼機制
- 總覽（航班手動 + API 查詢）、行程時間軸（唔連天氣先）、地圖搜尋加行程
- 部署上 Vercel，行到基本 CRUD

**Phase 2 — 智能提醒**
- 天氣（Open-Meteo）+ 落雨室內推介
- 附近洗手間/便利店 chip + 導航
- 行李智能卡（轉插/簽證/現金/溫度建議）+ 每人行李額
- 拖拉重排 + 交通連接 + 順路分析

**Phase 3 — 錢同心願**
- 夾錢多貨幣 + 結算 + 分類/逐日檢視
- 手信 OCR flow
- 心願清單 + 比價 + 買咗核實流程 + 同手信打通

**Phase 4 — 視覺系統**
- 4 個主題 token 化，套用全部分頁
- 目的地插畫系統（自動判斷 + SVG 插畫 + 濾鏡）
- Settings 主題揀色 + 自訂主色 + persist
- 蓋印章／撕紙邊／ripple 等細節效果

**Phase 5 — 打磨**
- PWA manifest（加到主畫面）
- 分享連結測試（朋友真係入到數）
- 效能/離線基本處理

---

## 11. 注意事項

- 每個 phase 完成後：實際跑一次（唔止睇 code），confirm 行為啱先開始下一個 phase
- 主題色系／匯率呢啲用戶設定，必須放喺 **Settings**，唔好散落喺其他分頁
- 版權：所有插畫用原創 SVG／CSS 生成，唔好直接扒真實圖片
- 完成重大更新後記得更新 CLAUDE.md 同 push GitHub
