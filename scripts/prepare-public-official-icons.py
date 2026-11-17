#!/usr/bin/env python3
"""Curate explicit official-site item/card icon matches into compact WebP thumbnails.

Runs only after scripts/audit-official-item-images.py. The local ignored audit
report contains the exact filename/name matches; no client game art involved.
Source files are from GungHo's publicly displayed item/card guide (2013).
"""
import concurrent.futures
import hashlib
import io
import json
from pathlib import Path
import urllib.request

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
AUDIT = ROOT / "evidence/official-item-image-audit.json"
DEST = ROOT / "public/approved-thumbs"
if not AUDIT.exists():
    raise SystemExit("Run python scripts/audit-official-item-images.py first")
audit = json.loads(AUDIT.read_text(encoding="utf-8"))
if audit["errors"]:
    raise SystemExit("Official site pages had errors; refuse to proceed")
if len(audit["matches"]) < 120:
    raise SystemExit("Too few verified candidates; inspect audit first")
allow_host = "https://ragnarokonline.gungho.jp/navi/gamedata/images/"
whitelist = {("cards", "card"), ("items", "weapon"), ("items", "helmet")}
unique = sorted({record["sourceUrl"] for record in audit["matches"]})
for record in audit["matches"]:
    if not record["sourceUrl"].startswith(allow_host):
        raise SystemExit("Unexpected host: " + record["sourceUrl"])
    image_type = record["sourceUrl"][len(allow_host):].split("/")[0]
    if (record["kind"], image_type) not in whitelist:
        raise SystemExit("Unexpected type: " + record["sourceUrl"])

def download(url):
    request = urllib.request.Request(url, headers={"User-Agent": "Noncommercial-RO-Wiki/1.0"})
    with urllib.request.urlopen(request, timeout=20) as resp:
        raw = resp.read(1_000_000)
        if resp.read(1):
            raise ValueError("Unexpectedly large asset " + url)
    with Image.open(io.BytesIO(raw)) as original:
        original.load()
        if original.width > 1024 or original.height > 1024:
            raise ValueError("Unexpected image dimensions " + url)
        image = original.convert('RGBA')
        image.thumbnail((96, 96), Image.Resampling.LANCZOS)
        canvas = Image.new('RGBA', (96,96), (0,0,0,0))
        canvas.alpha_composite(image, ((96-image.width)//2,(96-image.height)//2))
        buffer = io.BytesIO()
        canvas.save(buffer, format="WEBP", quality=84, method=6)
    return url, buffer.getvalue(), hashlib.sha256(raw).hexdigest()

with concurrent.futures.ThreadPoolExecutor(max_workers=6) as executor:
    artifacts = {url:(data,source_hash) for url,data,source_hash in executor.map(download,unique)}

result={"source":"GungHo Ragnarok Online game-data guide, dated 2013-12-17",
 "guidelines":"https://ragnarokonline.gungho.jp/support/play-manner/copyright.html",
 "disclaimer":"Third-party noncommercial fan wiki. These original RO site item illustrations may differ from the RO Survivors in-game assets.",
 "items":{},"cards":{}}
for record in audit["matches"]:
    group=record["kind"]
    id=str(record["id"])
    output=f"{group}/{id}.webp"
    data,source_hash=artifacts[record["sourceUrl"]]
    folder=(DEST/group)
    folder.mkdir(parents=True,exist_ok=True)
    (DEST/output).write_bytes(data)
    result[group][id]={
        "file":output,"sourceUrl":record["sourceUrl"],"sourcePage":record["sourcePage"],
        "officialLabel":record["officialLabel"],"englishName":record["englishName"],
        "sha256":hashlib.sha256(data).hexdigest(),"sourceSha256":source_hash,
        "credit":"© Gravity Co., Ltd. & Lee MyoungJin(studio DTDS). All Rights Reserved. Published by GungHo Online Entertainment, Inc."
    }
(DEST/"item-card-manifest.json").write_text(json.dumps(result,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print(json.dumps({"matches":{"items":len(result["items"]),"cards":len(result["cards"])},
 "uniqueSourceImages":len(unique),"totalWebPBytes":sum(p.stat().st_size for p in (DEST/'items').glob('*.webp'))+sum(p.stat().st_size for p in (DEST/'cards').glob('*.webp'))},ensure_ascii=False))
