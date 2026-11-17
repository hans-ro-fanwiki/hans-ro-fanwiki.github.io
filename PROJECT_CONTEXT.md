# RO Survivors Drop Wiki Project Context

- Scope: P0 source audit + P1 mobile-first reverse lookup wiki, requirements v1.1 (2026-11-17).
- Independent repo: lockgipo/ro-survivors-wiki. Local root: C:\\AI-Workspace\\ro-survivors-wiki.
- Status: Developer preview only, private GitHub repo. Local managed Vite Preview bound to Tailscale 100.116.225.68:4177 (OpenChatX process bash-80924), requires PC online and iPhone Tailscale. No Vercel/GitHub Pages production deployment. Never release production without user iPhone acceptance.
- Primary source: ro-survivors.com current bundle main-2n_YvaNQ.js and soul_linker-BNTKE1pN.js, documented exact SHA-256 in docs/SOURCE_AUDIT.json.
- Candidate source: third-party RO 倖存者小百科; candidate names and unverified card/class/open status must remain labeled.
- Content: deliberately limited derived subset for accessories, mage items, and cooldown cards, not full source databases.
- Images: game image ID/path metadata stays in checked-in JSON. Official source hotlink returns 403. For the owner’s PRIVATE Tailscale preview ONLY, gitignored evidence/private-art and dist/game-assets temporarily cache 129 selected PNGs via explicit PRIVATE_DEV_ASSETS=1. Never commit images or deploy that private dist publicly. No public image permission has been established; production uses neutral fallback until permitted.
- Stage pool and Boss references parsed from author's public bundle; item drop pairs verified against literal source IDs. Equipment rule and card effect meanings still pending P0 deeper checks.
- UI stack: React 19 + TypeScript + Vite. All static, no auth, no production data.
