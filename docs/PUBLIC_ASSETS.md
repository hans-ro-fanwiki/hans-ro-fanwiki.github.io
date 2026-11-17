# Public gallery asset policy (2026-11-17)

The owner authorized a public, noncommercial GitHub Pages wiki for sharing in a small gaming community.

## Scoped official source

Only **ten hand-selected monster illustrations** are derived as 96 × 96 WebP thumbnails (total typically < 20 KiB), from the **official Ragnarok Online RO Fan Kit**:
https://ragnarokonline-cf.gungho.jp/special/fankit/

Japan publisher's fan-use conditions (checked 2026-11-17):
https://ragnarokonline.gungho.jp/support/play-manner/copyright.html

The guideline covers noncommercial personal fan activities (including strategy/data websites) and official-site illustrations when its conditions and credit are met. It does **not** grant blanket authorization for files scraped from the RO Survivors fan game, RO game client, or third-party database. The RO Survivors site's own legal notice attributes graphical rights to Gravity: https://ro-survivors.com/legal.html

## Exact proof of source

Whitelisted title/file pairs and original SHA-256 values are in `public/approved-thumbs/manifest.json` and are generated only with `python scripts/prepare-public-fankit-thumbs.py`. These are **illustrations of the same named monster**, not claimed as identical to the RO Survivors in-game sprite. No other image assets are downloadable from the public repo. The website itself shows the rights attribution and fan-made disclaimer.

Items/cards without explicitly supported public images use non-image generic category placeholders. Their PNG art/RO Survivors sprites remain **private only** in the ignored `evidence/private-art` and `dist/game-assets` directories.

Do not reuse this scoped GungHo Fan Kit permission for original RO Survivors art. Review the source and license conditions each time images are added; never automatically mirror a whole catalog. Honor rights-holder removal requests promptly.

## Public deployment safeguard

Public builds set `VITE_PUBLIC_MODE=1`. This disables both private item/card art loading and private monster sprite-sheet loading at runtime. CI builds from a clean checkout and runs `node scripts/verify-public-dist.mjs` to reject private directories or any non-whitelisted image type / count before uploading a Pages artifact. Local private builds omit the flag, then restore owner-only PNG cache using `PRIVATE_DEV_ASSETS=1` via the existing preparation script.
