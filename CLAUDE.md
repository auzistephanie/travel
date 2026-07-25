# 旅行規劃 App — CLAUDE.md

手機優先旅行規劃 PWA（行程／地圖／行李／夾錢／手信，朋友免登入共編）。Vite React + Supabase + Vercel。

**完整規格 → `TRAVEL_APP_BUILD_SPEC.md`**（資訊架構、五大功能、視覺系統/4 主題、Supabase schema、P1–P5 build 順序全部喺嗰度，唔喺本檔）。
改動記錄 → `CHANGELOG.md` · 架構審視 → `docs/ARCHITECTURE_REVIEW_2026-07-11.md`（+ 交接手記 `docs/HANDOVER_2026-07-11.md`）

## ⚙️ Standards（MANDATORY — 正本：`stephanie-personal/docs/ai-governance/06-STANDARDS.md`，改規則只改正本）

Push（`github_push.py` 永不 git CLI・HTTPS・一次 run 一 commit）・寫入分流（改動記錄 → `CHANGELOG.md` **頂部**，唔准 append 落本檔；本檔上限 100 行/6KB）・清理 mv `_to_delete/`・改舊檔先 `.bak-YYYYMMDD`・方向性決定先 preview・改完以用家身份 run 一次先報完成・governance 00–05（派 subagent 先讀 01+03；報完成前過 02 §R2；冇 mount stephanie-personal → 叫 Stephanie 連埋）。詳文＋例外表 → 正本。

## Gotchas（本 repo 特有，估唔到／估錯會出事）

- **API 選型有原因，唔好自作主張換**：TomTom Search+Routing（**免信用卡**）、Open-Meteo（**免 key**）、匯率 open.er-api.com（免費、可手動覆蓋）、洗手間/便利店用 OSM Overpass；公共交通**只出 Google Maps 連結，唔叫 API**（畀用戶自己查）。
- **`MapPage.tsx` / `MapPage.test` 係 dead code** —— 2026-07-02 地圖併入行程頁（原 5 分頁 → 4 分頁）之後已無 route 引用；mount 唔俾 sandbox 刪，要手動移除。
- **主題必須 token 化（CSS variables）**，唔可以逐頁 hardcode 顏色 —— 4 個主題全部靠佢，散咗就冧。
- **App 內所有文案一律書面語繁體中文**（唔用廣東話口語）；同 Stephanie 對話先用廣東話。
- **用戶設定（主題/匯率）一律入 Settings 頁**，用全螢幕蓋面 bottom sheet 開，唔可以疊喺頁底。
- **插畫全原創 SVG/CSS**，唔扒真實圖（版權）。

## ✅ 完成前檢查（本 repo 專屬 DoD；通用四格 → 02-JUDGMENT §R2）

1. 前端有改 → `npm run build` 過到 ＋ 實開部署網址或本機 `npm run dev` 行一次受影響 flow
2. Push：`python3 scripts/github_push.py "<msg>"`＋核實 GitHub HEAD（→ Standards §S1）

## 連結

GitHub `auzistephanie/travel` · 生產 https://travel-ochre-rho.vercel.app
