# Public artwork policy — RO Survivors fan test wiki (2026-11-17)

This is an independent, open-source, **noncommercial fan-made reference site still under testing**. Its intent is to help players identify RO Survivors equipment, cards and monsters, then reverse-lookup the relevant stages. The site is not affiliated with the RO Survivors author, Gravity, GungHo or other rights holders.

## What is published

- **ID-mapped RO Survivors identification thumbnails:** 287 indexed equipment art thumbnails, 287 tiny equipment icon alternatives, 98 card thumbnails and 107 individual monster representative sprites, totaling **779 small WebP files** (988,616 bytes).
- Equipment images max 96×96, icon alternatives max 48×48; cards max 96×128; monsters max 96×96. Artwork is displayed at small scale only for item identification in wiki lists and details.
- Two monsters `ink_snake` and `ink_serpent` currently lack reliably matching sprite frames; they use neutral placeholders. No guessing.
- The previous 10 official RO Fan Kit monster illustrations (17,042 bytes) remain committed, with GungHo attribution, but available RO Survivors in-game monster images now take precedence for visual consistency.
- Total public image inventory **789 WebP** (about 1.01 MB). **No original client PNG, sprite atlases, full-size card art, game JavaScript bundles, credentials or private evidence** are committed or served.

The source is the author's publicly served item/card/sprite information at https://ro-survivors.com/ , matched by the same IDs that the wiki catalog uses. The versioned source manifest SHA is recorded in `public/fan-thumbs/manifest.json` together with each miniature's original relative asset path, original SHA-256, public miniature SHA-256, dimensions and byte count.

## Copyright, use and removal

Original RO game imagery and related marks belong to their respective copyright holders, including Gravity Co., Ltd. and Lee MyoungJin (studio DTDS) where applicable. RO Survivors' legal notice is https://ro-survivors.com/legal.html . The GungHo official RO Fan Kit terms are https://ragnarokonline.gungho.jp/support/play-manner/copyright.html .

The user expressly asked on 2026-11-17 to publish only tiny, recognizable reference thumbnails for a free/open-source noncommercial fan test wiki. That user decision **does not establish that every thumbnail has been licensed**, nor does transforming, cropping or reducing resolution automatically grant permission. This is a limited claimed fan-reference use, subject to applicable law and rights-holder review; no commercial reuse is claimed. A takedown notice, noncommercial disclaimer and attribution are not substitutes for permission.

For rights-holder concerns, the site links to a dedicated public GitHub Issue form:
https://github.com/lockgipo/ro-survivors-wiki/issues/new?template=content-removal.yml .
Do not include personal data or private proofs in public Issues. On notice, promptly review and remove or amend disputed imagery. Image files are separate by ID so they can be removed without affecting the catalog.

## Generation and deployment controls

- The **full original 720 PNG cache** is kept only in ignored `evidence/private-art`; `dist/game-assets` is a temporary private Tailscale preview copy. These files are not uploaded, and `VITE_PUBLIC_MODE=1` never requests them.
- After deliberate review, generate low-resolution thumbnails **only locally** with:
  `AUTHORIZE_FAN_THUMBS=1 python scripts/prepare-fan-wiki-thumbs.py`
  (PowerShell: `$env:AUTHORIZE_FAN_THUMBS='1'; python scripts/prepare-fan-wiki-thumbs.py`).
- This script requires the previously audited source manifest hash. If the RO Survivors source changes, regeneration stops until a new source audit and explicit approval; no automatic bulk import of new art.
- GitHub Actions uses Linux only, with `VITE_PUBLIC_MODE=1`. `node scripts/verify-public-dist.mjs` must pass before public Pages deployment. It enforces exact item/card/monster coverage, approved origin metadata, file-path allowlist, miniature dimensions, byte limits and SHA-256 hash for **every published image**; unknown PNG/SVG/JPEG/GIF images cause CI to fail.
- `docs/SOURCE_REPORT.md` records source data provenance; the public fan images are not evidence that all indexed drops/attributes are verified.
