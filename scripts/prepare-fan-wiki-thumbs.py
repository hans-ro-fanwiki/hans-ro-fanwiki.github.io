#!/usr/bin/env python3
"""Curate tiny RO Survivors reference thumbnails from the owner's local art cache.

Only run locally after checking current catalog sources. NEVER commit original art.
The generated images are distinct, low-resolution fan-reference thumbnails; they
are still copyrighted material and are subject to takedown requests.

Re-run only with the owner's explicit approval and AUTHORIZE_FAN_THUMBS=1.
GitHub CI never fetches or regenerates copyrighted source files.
"""
from __future__ import annotations
from hashlib import sha256
from io import BytesIO
import json
import os
from pathlib import Path
import re

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "evidence/private-art"
OUTPUT = ROOT / "public/fan-thumbs"
CATALOG = json.loads((ROOT / "public/data/catalog.json").read_text(encoding="utf-8"))
if os.getenv("AUTHORIZE_FAN_THUMBS") != "1":
    raise SystemExit("Requires explicit local opt-in: AUTHORIZE_FAN_THUMBS=1")
if not SOURCE.is_dir():
    raise SystemExit("Owner-only PNG cache unavailable")
if CATALOG["official"]["manifest"]["sha256"] != "bdbde78da2fd3d8c9084291935a279f2af53f4b456f1141aba6b1fce2db6f526":
    raise SystemExit("Game asset manifest changed; audit source before creating public thumbnails")

def load_png(source: str) -> tuple[Image.Image, bytes]:
    if not re.fullmatch(r"(?:items|cards|sprites)/[\w-]+(?:_art)?\.png",source):
        raise ValueError(f"Unapproved path: {source}")
    raw = (SOURCE / source).read_bytes()
    if not raw.startswith(b"\x89PNG\r\n\x1a\n"):
        raise ValueError(f"Not a PNG: {source}")
    with Image.open(BytesIO(raw)) as image:
        image.verify()
    image = Image.open(BytesIO(raw)).convert("RGBA")
    return image, raw

def output_one(group: str, entity: str, suffix: str, image: Image.Image, source: str, raw: bytes, size: tuple[int,int], pixel_art: bool=False) -> dict:
    result = image.copy()
    result.thumbnail(size, Image.Resampling.NEAREST if pixel_art else Image.Resampling.LANCZOS)
    target = OUTPUT / group / f"{entity}{suffix}.webp"
    target.parent.mkdir(parents=True,exist_ok=True)
    result.save(target, "WEBP", quality=82, method=6)
    payload = target.read_bytes()
    if len(payload) > 18000:
        raise ValueError(f"Unusually large thumbnail {target.name}: {len(payload)}")
    return {"file":f"{group}/{entity}{suffix}.webp",
            "sourcePath":source,
            "sourceSha256":sha256(raw).hexdigest(),
            "sha256":sha256(payload).hexdigest(),
            "width":result.width,
            "height":result.height,
            "bytes":len(payload)}

manifest = {"source":"RO Survivors author's publicly displayed game artwork, private source cache",
            "sourceManifestSha256":CATALOG["official"]["manifest"]["sha256"],
            "purpose":"noncommercial fan reference and item identification",
            "publicRights":"fair-use claim not adjudicated; respect rights-holder removal requests",
            "items":{},"cards":{},"monsters":{}}
for item in CATALOG["items"]:
    id = str(item["id"])
    source = item.get("image") or item.get("icon")
    if not source:
        continue
    image, raw = load_png(source["officialPath"])
    entry = {"art":output_one("items",id,"",image,source["officialPath"],raw,(96,96),image.width<=32)}
    if item.get("icon"):
        image, raw = load_png(item["icon"]["officialPath"])
        entry["icon"] = output_one("items",id,"_icon",image,item["icon"]["officialPath"],raw,(48,48),True)
    manifest["items"][id] = entry
for card in CATALOG["cards"]:
    id = str(card["id"])
    if not card.get("image"):
        continue
    source = card["image"]["officialPath"]
    image, raw = load_png(source)
    manifest["cards"][id] = output_one("cards",id,"",image,source,raw,(96,128))
for monster in CATALOG["monsters"]:
    id = monster["id"]
    frame = monster.get("spriteFrame")
    if not frame:
        continue
    source = frame["url"]
    sheet, raw = load_png(source)
    x,y,w,h = (frame[k] for k in ("x","y","width","height"))
    if not all(isinstance(v,int) for v in (x,y,w,h)) or min(x,y)<0 or min(w,h)<1 or x+w>sheet.width or y+h>sheet.height:
        raise ValueError(f"Sprite frame out of bounds: {id}")
    cropped = sheet.crop((x,y,x+w,y+h))
    manifest["monsters"][id] = output_one("monsters",id,"",cropped,source,raw,(96,96),True)

out = OUTPUT / "manifest.json"
out.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print(json.dumps({"items":len(manifest["items"]),"cards":len(manifest["cards"]),"monsters":len(manifest["monsters"]),"totalBytes":sum(p.stat().st_size for p in OUTPUT.rglob("*.webp"))},ensure_ascii=False))
