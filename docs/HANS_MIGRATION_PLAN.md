# HANS 漢斯服 — Complete Wiki Migration

Date: 2026-11-19. Owner requests **full removal of Coffee game content** and a single HANS-only wiki, retaining fast mobile lookup.

New identity: **RO 倖存者｜漢斯服維基**; repository `lockgipo/ro-survivors-hans-wiki`; expected Pages URL `https://lockgipo.github.io/ro-survivors-hans-wiki/`. GitHub Pages old project path is not automatically redirected. Do not claim new URL live before the HANS main deployment succeeds.

## Completed in Dev

- New audited HANS source snapshot and fail-closed static AST importer
- 523 equipment, 188 cards, 195 monsters, 17 normal selection stages, including 5 Chapter 2
- Actual HANS bonus modifiers used, not traditional RO item flavor descriptions; first-pass Chinese stats/filter support
- Equipment drop-to-monster-to-stage reverse lookup from HANS table and wave/boss config
- HANS hero/footer/index and explicit server isolation; eliminated Coffee thumbnails, old audits, old scripts and tests
- Browser-visible card-monster associations are candidates rather than invented card drop paths
- Source check now watches HANS only; Linux CI does not deploy Dev; public build rejects artwork
- Tier presentation distinguishes HANS Chapter 2 lap-dependent T6–T8 from stage's maximum tier value

## Pending accuracy research / acceptance

1. Card acquisition reality: verify which registered cards are direct monster drops and which come from gacha, events or rewards. Source registration is NOT sufficient evidence.
2. Stage entry availability, seasonality, story-only levels, and Chapter 2 lap unlock requirements. Current `open` means 'listed in stage select', not unlocked on every account.
3. Rare equipment and sources beyond `UA`: item registration does not imply obtainable. Hidden by default; do not invent source or item-specific Tier.
4. HANS artwork: private preview uses HANS-hosted item/card images. Separate rights review before any public fan thumbnails; no old Coffee images. Monster sprite atlas extraction for private preview is incomplete.
5. Verify HANS unusual stat formulas, alternative class/job restrictions, and source names against user running client; test iPhone Safari search, list, stage accordion, drawer and detail links.
6. Explicit owner approval before merging branch to `main` and replacing current GitHub Pages.

## Verify

```sh
npm run typecheck
npm test
VITE_PUBLIC_MODE=1 npm run build
node scripts/verify-public-dist.mjs
npm run check:source
```

Source check exit 0 = unchanged, exit 2 = changed, exit 1 = network/parser error. Source outage does not imply game update. Regeneration requires previously downloaded, manually reviewed, gitignored HANS source files.
