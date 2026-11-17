#!/usr/bin/env python3
"""Audit image matches against GungHo's published RO game-data illustrations.

Only source pages on the official site are read. Exact filename stem matching is
a conservative *candidate* match; review the evidence report before publication.
Does not contact ro-survivors.com or its client asset bundle.
"""
import concurrent.futures
import html
from html.parser import HTMLParser
import json
import pathlib
import re
import urllib.parse
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[1]
BASE = "https://ragnarokonline.gungho.jp"
PAGES = [
    *[f"/navi/gamedata/card/{s}.html" for s in ("accessory", "armour", "helmet", "shield", "shoes", "shoulder", "weapon")],
    *[f"/navi/gamedata/weapon/{s}.html" for s in ("axe", "blunt", "book", "bow-throwing", "dagger", "gatar", "gun", "instrument", "knuckle", "ninja-sword", "spear", "sword", "throwing-knife", "two-hand-axe", "two-hand-spear", "two-hand-sword", "two-hand-wand", "wand", "whip")],
    "/navi/gamedata/protector/helmet.html",
    "/navi/gamedata/protector/others.html",
]

class Images(HTMLParser):
    def __init__(self):
        super().__init__()
        self.images = []
    def handle_starttag(self, tag, attrs):
        if tag != 'img':
            return
        attrs = dict(attrs)
        source = attrs.get('src', '')
        if re.search(r'/images/(card|weapon|protector|helmet)/', source):
            self.images.append({"src": source, "alt": html.unescape(attrs.get("alt", ""))})

def fetch_page(page):
    url = BASE + page
    try:
        with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "NoncommercialROFansite/1.0"}), timeout=15) as response:
            raw = response.read(2500000)
        parser = Images()
        parser.feed(raw.decode("utf-8", "replace"))
        return page, [{"sourcePage": url, "sourceUrl": urllib.parse.urljoin(url, x['src']), "officialLabel": x['alt']} for x in parser.images], None
    except Exception as exc:
        return page, [], f"{type(exc).__name__}: {exc}"

def stem(url):
    part = urllib.parse.urlparse(url).path.split('/')[-1]
    return re.sub(r'[^a-z0-9]', '', re.sub(r'\.[^.]+$', '', part.lower()))

def namekey(label):
    label = re.sub(r'\s+Card$', '', label, flags=re.I)
    return re.sub(r'[^a-z0-9]', '', label.lower())

def audit():
    data = json.loads((ROOT / "public/data/catalog.json").read_text(encoding="utf-8"))
    pages = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as workers:
        for entry in workers.map(fetch_page, PAGES):
            pages.append(entry)
    catalog = {"cards": data['cards'], "items": data['items']}
    originals = [e for group in catalog.values() for e in group]
    matches = []
    unknown = []
    for group, objs in catalog.items():
        imgs = []
        for page, entries, error in pages:
            if error:
                continue
            if ("/card/" in page) == (group == "cards"):
                imgs.extend(entries)
        indexed = {}
        for image in imgs:
            indexed.setdefault(stem(image['sourceUrl']), []).append(image)
        for obj in objs:
            key = namekey(obj["originalName"])
            candidates = indexed.get(key, [])
            urls = sorted(set(entry['sourceUrl'] for entry in candidates))
            if len(urls) == 1:
                sample = next(entry for entry in candidates if entry['sourceUrl'] == urls[0])
                matches.append({"kind": group, "id": obj["id"], "name": obj["name"], "englishName": obj["originalName"], **sample})
            elif len(urls) > 1:
                unknown.append({"kind": group, "id": obj["id"], "name": obj["name"], "reason": "multiple", "candidates": urls})
            else:
                unknown.append({"kind": group, "id": obj["id"], "name": obj["name"], "reason": "no-exact-match"})
    result = {
        "officialPages": len(pages),
        "sourcesParsed": sum(len(p[1]) for p in pages),
        "errors": [{"page": p, "error": e} for p, _v, e in pages if e],
        "matches": matches,
        "unmatched": unknown,
    }
    return result

if __name__ == '__main__':
    result = audit()
    out = ROOT / "evidence/official-item-image-audit.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(result, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
    for kind in ['cards', 'items']:
        found = [m for m in result['matches'] if m['kind'] == kind]
        unfound = [m for m in result['unmatched'] if m['kind'] == kind]
        print(f"{kind}: matched={len(found)}, unmatched={len(unfound)}; first 16:")
        for m in found[:16]:
            print(" ", m['id'], m['englishName'], m['sourceUrl'].split('/')[-1], m['officialLabel'])
    print("sources", result['sourcesParsed'], "pages", result['officialPages'], "errors", result['errors'])
    print("report", out)
