#!/usr/bin/env python3
"""Explicit, curated RO Fan Kit illustrations -> tiny fansite thumbnails.

These exact official Fan Kit files were matched by displayed Japanese name to
RO Survivors monster entries.  Run manually only, never from CI; do not scrape
or copy the RO Survivors game assets or distribute the original illustrations.
The output is 96x96 WEBP imagery and a provenance manifest.
"""
import hashlib
import io
import json
import pathlib
import urllib.request

from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "approved-thumbs" / "monsters"
BASE = "https://ragnarokonline-cf.gungho.jp/special/fankit/"
INDEX = [
    ("poring", "ポリン", "boss-general-monster/2poring.png"),
    ("lunatic", "ルナティック", "boss-general-monster/55lunatic.png"),
    ("drops", "ドロップス", "boss-general-monster/104drops.png"),
    ("picky", "ピッキ", "boss-general-monster/44picky.png"),
    ("rocker", "ロッカー", "boss-general-monster/46rocker.png"),
    ("chonchon", "チョンチョン", "boss-general-monster/11chonchon.png"),
    ("ghostring", "ゴーストリング", "boss-general-monster/111ghostring.png"),
    ("baphomet", "バフォメット", "mvp-monster/mob_baphomet.png"),
    ("osiris", "オシリス", "mvp-monster/mob_osiris.png"),
    ("eddga", "エドガ", "mvp-monster/mob_eddga.png"),
]
CREDIT = "© Gravity Co., Ltd. & Lee MyoungJin(studio DTDS). All Rights Reserved. Published by GungHo Online Entertainment, Inc."
OUT.mkdir(parents=True, exist_ok=True)
records = {}
for monster_id, official_title, source_file in INDEX:
    url = BASE + "assets/img/monster/" + source_file
    request = urllib.request.Request(url, headers={"User-Agent": "ROSurvivorsFansiteThumbnails/1.0"})
    with urllib.request.urlopen(request, timeout=20) as response:
        raw = response.read(5_000_000)
        if response.read(1):
            raise ValueError(f"Unexpectedly large image: {monster_id}")
    with Image.open(io.BytesIO(raw)) as source:
        source.load()
        if source.width > 5000 or source.height > 5000:
            raise ValueError(f"Unexpected image dimensions: {monster_id}")
        art = source.convert("RGBA")
        art.thumbnail((96, 96), Image.Resampling.LANCZOS)
        canvas = Image.new("RGBA", (96, 96), (0, 0, 0, 0))
        canvas.paste(art, ((96 - art.width) // 2, (96 - art.height) // 2), art)
        dest = OUT / (monster_id + ".webp")
        canvas.save(dest, format="WEBP", quality=78, method=6)
    records[monster_id] = {
        "title": official_title.strip(),
        "source": url,
        "file": "monsters/" + monster_id + ".webp",
        "sourceSha256": hashlib.sha256(raw).hexdigest(),
        "size": dest.stat().st_size,
        "credit": CREDIT
    }
    print(f"{monster_id}: {dest.stat().st_size} bytes")
manifest = {"source": BASE, "guidelines": "https://ragnarokonline.gungho.jp/support/play-manner/copyright.html", "usage": "Noncommercial fan guide; only individual curated images; no RO Survivors or client sprite assets", "monsters": records}
(OUT.parent / "manifest.json").write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
print("10 curated thumbnails completed.")
