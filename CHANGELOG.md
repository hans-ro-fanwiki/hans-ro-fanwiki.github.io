# Changelog

## 2026-11-27 遊戲機制主導覽

- 戰鬥機制改名遊戲機制，桌面移至頁首，手機保留底部七項等寬導覽；舊 combat 深連結不變，裝備／卡片保留尋寶率捷徑。

## 2026-11-27 尋寶率與掉落機制

- 戰鬥機制加入尋寶率 FAQ、品質權重試算與王卡掉落說明；裝備／卡片圖鑑連至該區。核對維修後客戶端，區分品質與掉落率，未變更圖鑑掉落資料。

## 2026-11-27 經驗計算機實戰校準

- 預設 Base Lv60、怪物／事件 2000%，以單場總經驗排序；免填結算，移除清怪比例、遊戲速度及刷關耗時，保留開局進度。
- 核對 V0.16.0 來源，補上 Job ÷√怪物數量倍率，怪物潮供給只計一次；實戰校準限同關卡／週目，以實測與模型相對變化比較不同倍率。
- 新增理論擊殺數，未推測跨圖清怪效率；保留不同關卡的波次與最後首領排程。

## 2026-11-27 V0.16.0 平衡同步

- 新增 13 個三轉職業、67 招首領／菁英技能傷害倍率；獨立顯示於技能圖鑑與平衡紀錄，不變更基礎技能數值。
- 補登 11/27 副本、畫面及穩定性改善與 11/25 V0.15.2 公告。斐揚及第三章僅預告。

## 2026-11-27 公開維基更新紀錄

- 共用頁尾增加低調、預設收合的維基維護紀錄，收錄自 11/19 HANS 正式上線起的公開更新，按日期合併並可展開較早紀錄。
- 最後更新時間由建置注入，以台灣時間顯示日期與分鐘；不隨重新整理變動。

## 2026-11-26 屬性譯名與搜尋統一

- 卡片、裝備、天賦、戰鬥機制採用已核對 HANS 客戶端屬性名稱，包括雙倍投擲、範圍、暈眩機率及傷害減免。新增屬性 ID／新舊譯名與英文搜尋、雙倍投擲等屬性篩選。
- 保留既有數值、GS、掉落與配點，69 項單元測試通過。

## 2026-11-24 計算機用詞與預設值統一

- 急速不再限定換裝，額外增加與目前角色屬性預設 0，其他戰鬥計算機同步採零加成及明確範例。
- 經驗計算機補充總倍率、每場額外耗時、經驗倍率與比較示例，保留原公式與既有預設。

## 2026-11-24 戰鬥機制導航修正

- 修復四個工具選項點擊後被全站捲動還原覆蓋的問題；改為直接切換分頁、顯示選取狀態、保留輸入與既有分享連結。新增手機觸控與桌面點擊回歸測試。

## 2026-11-24 急速勘誤與互動戰鬥試算

- 修正裝備、卡片、三轉天賦、技能相性和榜單詞綴的急速顯示，分開施法急速；保留原始基礎冷卻及官方道具名稱、數值、GS。
- 戰鬥機制新增冷卻／換裝比較、技能搜尋與相性查詢、施法時間、範圍遞減、一般承傷四種互動試算。公式採 HANS V0.15.1 客戶端已核實規則，明示特例及實測限制。

## 2026-11-23 角色榜單更新與瀏覽器防護

- 支援管理員從本機更新各職業系戰力前五名，整批通過驗證後才發布。
- 首頁與角色榜單頁限制腳本、圖片來源與網路連線，並停止傳送來源網址。

## 2026-11-23 副本卡搜尋與 GS

- 一般卡與副本版使用各自的遊戲 ID、來源、效果與 GS。搜尋、排行、關卡掉落和詳情共用計分。獸人英雄一般版一週目為 30 GS，副本版為 92 GS，與使用者提供的遊戲畫面吻合。
- 裝備、卡片、關卡和怪物掉落共用結果列。跨分類搜尋結果改為有結果時才顯示的摺疊區。

## 0.3.0-dev.26 — 2026-11-23（副本掉落查詢）

- 裝備、卡片及關卡都可依團隊副本搜尋與篩選。列表直接顯示副本 Tier、裝備適用職業與基礎屬性，以及副本卡的實際效果。

## 0.3.0-dev.25 — 2026-11-23（副本遠征與玩家回報）

- 「關卡」新增團隊副本。收錄 V0.15.0 正式開放的 8 關、289 筆裝備池關聯、15 張副本卡及各關首通和材料預覽。裝備、卡片詳情可反查副本。
- 上線免 GitHub 登入的 Tally 表單，頁首、頁尾、資料詳情及各副本都可回報或許願。回報集中在既有 Google Sheets。

## 0.3.0-dev.24 — 2026-11-22（卡片 GS 全卡稽核）
- 逐一對照 HANS V0.14.5 客戶端 202 張卡、347 個效果參數、三種權重、六週目倍率／Boss 保底，並以獨立公式校驗 188 × 6 × 3 = 3,384 組 GS，均無已核實差異；結果和未能驗證的副本卡限制記錄在 `docs/HANS_CARD_GS_AUDIT_20261122.md`。
- 歐西里斯 4144 官方用戶端例外仍會讓原始效果與 `cardScore` 六週目保持 +60，但依玩家回報先在**維基顯示層**試算乘上週目倍率（60／90／120／150／180／210 GS）。卡名後標「GS 待確認」、詳情解釋與官方規則的差異。僅影響此卡的預覽／詳情／GS 排行，不動其他 187 張一般卡與 15 張副本卡變體。
- 新增包含 202 卡來源指紋、347 效果數值及 3,384 組官方獨立算式對照的回歸測試；另測單卡待確認試算與 15 種副本變體，不公開遊戲原始 JS／素材。

## 2026-11-22 — V0.14.5 與職業系瀏覽

- 平衡紀錄新增 29 個職業的整體傷害倍率、6 招神槍手系技能的前後數值，並同步更新技能圖鑑。
- 改用版本選單和職業系按鈕，單頁只顯示選定職業系，共用技能合併成一列。

## 2026-11-22 — 平衡紀錄依職業瀏覽

- 平衡紀錄按一、二、三轉排列職業，可展開特定職業查看技能變動。

## 0.3.0-dev.21 — 2026-11-22

- 新增「平衡紀錄」，收錄 11/13 起 HANS 戰鬥相關公告，並列出 V0.14.1、V0.14.3 的冷卻與基礎傷害變動。
- 技能圖鑑更新至 HANS V0.14.4，244 種技能均有繁中介紹。基礎值採可靜態核對的客戶端設定。

## 0.3.0-dev.20 — 2026-11-22

- 裝備詳情與關卡篩選共用 HANS 職業中文名稱，補齊技能名稱、技能標籤及少數裝備與怪物漏譯。
- 增補第二章解鎖、節慶機制、無限之塔進度和世界王公告。
- 核對 11/22 晚間用戶端，收錄 8 個團隊副本、15 張副本版卡片及其效果倍率。實際開放、個別獎池與掉落仍以遊戲內為準。

## 0.3.0-dev.19 — 2026-11-21 (sticky desktop talent inspector)

- Keep the **selected desktop skill description panel visible beneath the fixed site header** as users scroll down long talent trees. Only the active inspector becomes sticky; an empty placeholder remains in normal document flow.
- Remove the desktop-only talent page overflow clipping that prevented CSS sticky, reserve 76px under the real header and limit expanded detail height/scroll to preserve tree interaction. Do not change the existing mobile bottom inspector.
- Preserve all 50/50/70 point budgets, skill ranks, prerequisites, mouse left/right-click allocation, compact share URLs and source data. Regression check the user's 50/50 Crusader link and browser scrolling at desktop 761/900/1280px plus mobile 320–430px.

## 0.3.0-dev.18 — 2026-11-21 (make all HANS Chapter 2 stages discoverable)

- Confirm the audited HANS catalog already includes five Chapter 2 maps (Lv 71–99), 34 normal-monster and 24 Boss stage appearances, 229 verified equipment/card stage-drop references, six-lap T6–8 tiers and source-derived GS limits. No source registration or drop chance is invented or replaced.
- Split the stages page into chapter-filtered navigation: **全部章節（17）／第二章（5）／第一章（12）** and distinct grouped sections, with Chapter 2 first in the default combined view. Chapter selection is shareable via `?page=stages&ch=2`, including back/forward/reload compatibility.
- Expanded stages now expose native HANS normal monster and Boss pools, including marked intruder bosses, with links to the existing monster detail and drop cross-references. Preserve the existing per-stage equipment/card filters, artwork, level bands, six-lap Tier/GS and source verification state.
- Add regression tests for all five Chapter 2 stages, 229 stage-drop references, all six lap GS/tier tables, grouping and legacy type filters, and mobile browser coverage for Chapter 2 display, monster details and short-link reload.

## 0.3.0-dev.17 — 2026-11-21 (Chinese-first HANS talent descriptions)

- Fix the third-job talent screen showing raw English: all 16 jobs and 48 branches now display Chinese job/branch descriptions, 192 Chinese path labels with Chinese mechanic summaries, and 1,488 distinguishable Chinese-first talent labels. Preserve the audited English original names under expanded information for comparison rather than falsely claiming official translations.
- Reuse the verified HANS `skills.json` name registry for the 96 third-job learn-skill nodes and job-skill tooltip labels; include only source-backed Traditional Chinese skill descriptions when available. Non-skill talent and path labels are **editorial functional descriptions**, not official HANS translations.
- Read the audited `talents.json` and `skills.json` together at runtime; leave raw game data, talents IDs, icons, point caps, prerequisites, sharing format and source hash unchanged. Normalize existing Flee/EXP/INT abbreviations in one-/two-job descriptions without inventing attributes.
- Add four localization regressions checking all 41 jobs, 1,488 translated labels, 192 paths, 96 official skill names, source-mismatch behavior, branch name uniqueness and share identifier invariants.

## 0.3.0-dev.16 — 2026-11-21 (simplify card GS scoring selector)

- Replace the 41-job native `計算職業` select in the card detail with three touch-friendly, dark-themed scoring group buttons: **近戰系／魔法系／遠程系**.
- Ground each button in HANS `lapRules.jobs[].scaling` and `lapRules.scoring.classes` (melee 20, magic 10, ranged 11); retain 41-job source mapping and the original `cardScore()` calculation, lap rules, Osiris exception and mini/MVP floors.
- Preserve `gsjob` deep links for earlier first/second/third professions: e.g. `gsjob=wizard` and `gsjob=warlock` still select Magic with exactly the prior GS. New selection uses a source-backed first-job representative and updates the URL.
- Add 188-card × six-lap × 41-job invariant tests for every class having identical results within its shared weights; browser checks for three buttons, legacy URLs, reload, lap and mobile layouts at 320/375/390/430px.
- Do not imply the HANS-derived estimated GS has been separately calibrated against every live in-game card; only the interface is simplified. Resolves GitHub Issue #12.


## 0.3.0-dev.15 — 2026-11-21 (career-path-first skill encyclopedia)

- Replace the long first/second/third career dropdown with **nine starter-job buttons and their one or two genuine HANS career paths**. Selecting a base immediately opens its first path; switching paths displays only that first/second/third lineage. The grid folds into a compact header until “更換職業” is selected.
- Handle unusual Ninja and Gunslinger progression from audited job base/rank relationships instead of guessing branches. Keep skill names, icons, 244-skill registration, and data provenance unchanged.
- Show **no giant skill list on an initial visit** with no route; a direct skill name/description search instead searches globally (deduplicated), with optional job-name shortcuts and stage filters.
- Remember the last selected path in local storage, while respecting explicit old `sj`/`sk` deep links and browser history. Class/path changes push history; typing changes replace URL to avoid cluttering history.
- Extend unit/browser regressions for nine roots, sixteen routes, Ninja/Gunslinger, global search, empty start, legacy share links, last-used route recovery, keyboard focus, 320–430px mobile layouts and desktop navigation.
- Keep unrelated existing GitHub Issue #11 (stage loot filters) and #12 (card GS occupation picker) deferred.


## 0.3.0-dev.14 — 2026-11-21 (collapsible job picker and verified third-job Chinese names)

- Replace iOS native 41-item class select with a compact, height-bounded in-page accordion: all jobs / first / second / third. One stage expands at a time; choice, Escape or tapping outside closes the picker; keyboard and mobile touch remain supported.
- Remove visible second-job “開發中” tags in both skill encyclopedia and talent simulator, without deleting upstream provenance or altering talent/job logic.
- Fix source parser to read SHA-verified `Object.assign(aA,{...})` appended HANS translations as well as the initial translation dictionaries. Confirm all 96 third-job skill titles have native HANS Traditional Chinese names (e.g. 彗星術, 讚頌, 迴旋斬) while original English remains searchable.
- Add source-backed unit and public build assertions for all 96 third-job translations, expanded accordion/browser tests and an updated data URL to avoid stale cached skills.json.
- Preserve existing class routes, three-stage talent sharing and HANS-only safety policy.


## 0.3.0-dev.13 — 2026-11-21 (HANS class skill encyclopedia)

- Add a separate fifth navigation page “技能” to search registered first-, second-, and third-job skills, separate from the talent-point simulator. Selecting a job shows its corresponding transfer path, while filters support all/first/second/third and Chinese or English skill search.
- Statically extract 41 professions, 256 job-skill references (244 unique registered skills), official HANS skill names/icons, 170 confirmed Traditional Chinese effect descriptions, 101 upgrade descriptions, and 180 source-backed base cooldown values. All imports are SHA-pinned to the audited HANS game snapshot; no game bundle or icon assets are distributed.
- Make skill cards expandable with verified effect text, cooldown, tags, source notes, unavailable-description labels and shareable `?page=skills&sj=...&sk=...` links.
- Improve five-item mobile/desktop navigation fit without changing existing four-page behavior; retain legacy card/stage/talent URLs.
- Add new HANS skill catalog unit tests, published-asset safety checks, and Chrome responsive/real skill-icon/deep-link tests.
- Track the deferred “依關卡看掉落搜尋與篩選” optimization in GitHub Issue #11 rather than changing that behavior with this feature.


## 0.3.0-dev.12 — 2026-11-20 (unified HANS dark theme and site UX review)

- Restyle all talent simulator surfaces against the site’s existing dark slate / mint tokens, retaining official HANS images, card status, tree paths, direct allocation and responsive split/stack behavior. Larger touch targets and accessible focus states are preserved.
- Review all four pages with OpenChatX design-taste-review and apple-design skills; add a practical review document with delivered work and deferred usability priorities.
- Display labels for active advanced filters even when the drawer is collapsed, and provide a one-click filter/search reset on empty results.
- Improve equipment/card detail dialog accessibility: focus opens on its close control, Escape dismisses, keyboard Tab stays in the dialog, and focus returns to the originating card when available.
- Extend Chrome smoke tests for cross-page visual consistency, empty-state recovery, keyboard dialog operation, existing HANS art and talent share links.


## 0.3.0-dev.11 — 2026-11-20 (fixed talent inspector and direct desktop allocation)

- Replace the mouse-following 200ms hover popup with a fixed-height, in-flow desktop inspector above all three talent trees; hover and keyboard focus update the inspector, never overlay another skill icon.
- Keep desktop direct left-click +1 / right-click -1 and keyboard + / - / Esc; allow continuous allocations without repositioning the pointer around a floating tooltip.
- Mobile keeps tap-to-select and bottom navigation-safe compact allocation bar, with a separate intentional expansion for full skill notes and prerequisites.
- Remove obsolete position calculations, hover dismissal timers and extra popup interaction controls; reserve desktop inspector height to avoid layout jumps.
- Extend responsive browser tests with continuous left/right-click allocations, fixed inspector bounds, persistent preview and full-detail expansion without obscuring the tree.


## 0.3.0-dev.10 — 2026-11-20 (six-lap cards, per-job GS and stage tiers)

- Import audited HANS lap multipliers, card ID offsets, exception card IDs, scoring weights and 41 job scaling profiles; retain 188 canonical cards with raw modifier metadata, rather than copying thousands of variants.
- Add lap-aware card lists and detailed card view, preserving the chosen lap in URL; card details include effects for that lap and computed GS contribution for a selected job, including boss score floors and special unscaled cards.
- Add stage lap picker showing the source-derived tier and GS entry requirement for all 17 stages; Chapter 2 uses its separate progression and story-only instances do not fake higher laps.
- Keep equipment pages focused on source, base effects and gear tier, explicitly distinguishing random quality, refine and star enhancements rather than inventing per-item fixed GS.
- Extend unit tests across all 188 cards × six laps × 41 jobs and browser smoke regressions for card display, GS, lap deep links, stage thresholds and responsive layouts.
- Keep static HANS-only SHA source checks, publicly unbundled artwork, and original talent share links.


## 0.3.0-dev.9 — 2026-11-20 (map previews, cards and streamlined filters)

- Remove the duplicate talent “分享配點” action; keep a single primary “複製連結” button for the existing compact three-rank share URL.
- Read stage map IDs and thumbnails from the SHA-audited HANS stage rules and manifest; display 17 source-hosted minimaps with image-error fallback, without shipping artwork.
- Show the HANS card socket slot in card lists and stage drops, with a dedicated card socket filter and consistent detail labels.
- Consolidate card/combat stat filters into shared character, combat and survival groups; migrate legacy card effect links.
- Make all 17 stages discoverable by default; add All, Normal, Event and Story filters while retaining compatibility with legacy open=1 links.
- Extend unit and browser regressions for stage categories, official images, card sockets, old links and mobile widths.


## 0.3.0-dev.8 — 2026-11-20 (career-wide talent planning and short share links)

- Reduce desktop talent hover dismissal from 320ms to 200ms without losing popup re-entry grace.
- Keep one first/second/third-job progression together; switching between compatible stages retains independent build allocations, with explicit stage buttons and specialization selectors.
- Replace lengthy v1 single-stage share URLs with compact stateless `?t=` links that encode all three stages using a sparse scheme with revision and checksum validation; old links remain readable.
- Make full reset clear all three stages while preserving the selected career; add targeted unit and responsive browser regressions for restoration, sharing and 200ms dismissal.


## 0.3.0-dev.7 — 2026-11-20 (talent popup placement and hover grace)

- Move desktop talent details below the hovered skill and center horizontally; clamp to viewport edges and flip above only when below has insufficient space.
- Close desktop details after a 320 ms mouse-leave grace period. Entering the popover cancels dismissal so its allocation buttons remain usable; leaving the popover restarts the timer.
- Keep keyboard controls and the separate mobile bottom-sheet interaction unchanged. Add browser regression coverage for positioning, delayed dismissal and interaction inside the popup.


## 0.3.0-dev.6 — 2026-11-20 (HANS talent tree desktop and mobile interactions)

- Refined the skill-tree interface against HANS's official talent layout while preserving its actual branch positions, source icons and connecting paths.
- Desktop: hovering or keyboard focus previews the selected talent in a nearby viewport-clamped panel, left click allocates, right click unallocates (without browser context menu), +/- keyboard shortcuts and Escape to dismiss; Shift+click also unallocates.
- Mobile: first tap only selects and previews without changing points; explicit 48px +/- controls manage allocations in a compact bottom sheet, with optional expanded prerequisites and effects.
- Made branch switching sticky on mobile and reduced nonessential skill-bar clutter; respected the bottom navigation and small 320px viewports.
- Extended Playwright coverage for pointer/touch, right-click, keyboard, popover placement, share URL, resets, mobile details and sticky tabs, while keeping original remote image loading and validation rules.


## 0.3.0-dev.5 — 2026-11-20

- Verify HANS card drops against the monster-kill routine and include four intruder boss routes.
- Link card and equipment sources to shareable, expanded stage views, including seasonal maps. Keep card effects applied in the stage view and clarify the regular expedition filter.
- Add an explicit reset for all points in the current talent tree, including the build in the URL.

## 0.3.0-dev.4 — 2026-11-20 (desktop navigation fix)

- Fixed missing desktop navigation: the single four-tab menu had been hidden at widths above 760px.
- Placed the category menu in the header for desktop layouts, retaining the existing fixed bottom bar on phones without duplicate navigation state.
- Added responsive desktop 761/900/1280px visibility, overflow and four-page click-through browser regression tests, plus mobile fixed-position navigation checks.


## 0.3.0-dev.3 — 2026-11-20 (visible HANS item/card/talent icons)

- Restored public page source-linked artwork for equipment, cards, and all first/second/third-job talent tiles; the previous VITE_PUBLIC_MODE image guard mistakenly left every public entry as a generic icon.
- Image requests use HANS allowlisted HTTPS icon/item/card URLs; missing assets fall back to local Lucide icons. Equipment list thumbnails are larger for recognition.
- Public Git and Pages artifact still ship zero HANS image files. The copyright notice explicitly states remote referencing does not grant image reuse rights.
- Isolated Chrome regression checks successful load for all four art categories, mobile widths and safe remote URL destinations.


## 0.3.0-dev.2 — 2026-11-20 (HANS third-job talent trees; published to Pages)

- Added 16 game-registered third jobs, 48 third-job branches and 1,488 talent nodes by static AST inspection of a pinned HANS game bundle; 41 total jobs, 123 branches, 3,168 talents.
- Third jobs use separate 70-point caps, 12-row tree layouts, 55-point ultimate unlock tiers, specialization and path-exclusive point validation.
- Added source-checked job names, icons metadata, rank limits, basic effect summaries and readable Chinese job/branch labels. No game code or artwork shipped.
- Preserved source job ID for the two HANS second/third ID collisions (`kagerou`, `rebellion`) while giving the simulator distinct share IDs.
- Added tests for all 48 ultimate routes, share restore and third-job mobile layouts; the standalone HANS talent page still lists only first/second jobs, so third-job source and validation limits are explicit.


## 0.3.0-dev.1 — 2026-11-20 (HANS-style 25-job talent tree redesign)

- Rebuilt the talent screen around HANS's actual three-tree layout, tier lines, dependency connectors, icon tiles, and contextual skill details; mobile now uses compact job selection and branch switching.
- Added 16 second-job trees alongside 9 first jobs: 25 officially listed jobs, 75 branches and 1,680 nodes, including descriptions, rank limits and prerequisites.
- Added second-job one-branch specialization and mutually exclusive skill paths. Second jobs are visibly marked as in development by HANS; third-job trees are not yet on the official talent page.
- Kept versioned share links, reset and point allocations. Public build uses original vector substitutes; only private Dev may request HANS's remote artwork.
- Updated normalization workflow and responsive browser regression tests, with no game JS or icon image bundles distributed.

## 0.3.0-dev — 2026-11-20 (first-job talent simulator preview)

- Added a fourth Talents tab with nine HANS first-job trees, 27 branches and 444 audited talent nodes.
- Added 50-point budgeting, prerequisite/tier enforcement, increment/decrement, reset, build serialization and revision-checked share links.
- Added isolated AST-only HANS talent topology importer and source hash pinning, without redistributing game scripts or unlicensed images.
- Added four talent tests and responsive Chrome smoke tests at 320/375/390/430px.
- Second/third-job trees, individual talent effects and original artwork remain pending verification. Dev only; production unchanged.

## 0.2.1 — 2026-11-19 (HANS fan wiki organization migration)

- Transferred original repository to the free `hans-ro-fanwiki` GitHub Organization while retaining repository ID, Git history, Issues, PRs, and branches.
- Renamed the same repository to `hans-ro-fanwiki.github.io` for a short GitHub Pages organization homepage URL.
- Updated website name to **RO 倖存者｜HANS 粉絲維基** and emphasized independent, nonofficial fan production.
- Updated canonical, attribution/footer, issue-reporting, and source-code links for the new organization URL.
- No HANS game data or images changed in this release.

## 0.2.0 — 2026-11-19 (HANS production release)

- Complete pivot to HANS-only RO Survivors wiki, retaining repository and mobile layout.
- Removed previous Coffee-based catalog, photos, acquisition audits, scripts and tests from active branch.
- Static-imported HANS registrations and source tables: 523 equipment, 188 cards, 195 monsters, 17 stages.
- Implemented actual HANS stat modifier decoding for attribute filters, plus Chapter 2 Tier presentation.
- Retained unknown-source filtering, card-source uncertainty, stage-based reverse lookup and HANS-only version checks.
- Removed prior fan-thumbnail assets; public build explicitly blocks unreviewed image publication.
- Rebuilt automated tests, public artifact safety check and change-detection origin.
- Renamed website to「RO 倖存者｜漢斯服維基」, repository and Pages path to `ro-survivors-hans-wiki`, and published the HANS-only catalog with the owner's approval.
- Owner approved directly deploying future wiki changes after verification.
