# Changelog

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
