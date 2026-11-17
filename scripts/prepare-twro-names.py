#!/usr/bin/env python3
"""Build a minimal ID→twRO name mapping from a locally reviewed fan/client table.

OpenKore twRO items.txt is evidence only (gitignored); don't publish the whole table.
The committed JSON contains only names for game items we actually index.
The same item ID is the binding key, never a fuzzy English-name guess.
"""
import hashlib
import json
from pathlib import Path
import re

ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/"evidence/twro-translation/items.txt"
CATALOG=json.loads((ROOT/"public/data/catalog.json").read_text(encoding="utf-8"))
raw=SOURCE.read_bytes()
EXPECTED_SHA='d20f625e3c7cb42b58686bd6f0e20ba6efca93adac046479c98b8ebcfb794247'
if hashlib.sha256(raw).hexdigest()!=EXPECTED_SHA:
    raise SystemExit('twRO source changed; review translations and commit hash first')
lookup={}
for line in raw.decode("utf-8-sig").splitlines():
    match=re.fullmatch(r"(\d+)#([^#]+)#",line.strip())
    if match:
        lookup[int(match.group(1))]=match.group(2).strip()

result={
    "source":"OpenKore twRO item display name table (Taiwan RO client naming)",
    "sourceUrl":"https://github.com/OpenKore/openkore/blob/35a5292c778019c98b9dc45df8d3bd3f96d48c40/tables/twRO/items.txt",
    "sourceCommit":"35a5292c778019c98b9dc45df8d3bd3f96d48c40",
    "sourceSha256":hashlib.sha256(raw).hexdigest(),
    "rule":"Exact numeric ID match only; original game's stats and effects are not imported.",
    "items":{},
    "cards":{},
    "manualFallbackItems":{"2666":"希望燈籠","2708":"中式手工藝品","28560":"陰陽護符"},
    "manualFallbackMonsters":{"chung_e":"嫦娥","dancing_dragon":"舞龍","rice_cake_boy":"年糕童子","ink_snake":"墨蛇","ink_serpent":"墨色大蛇"}
}
for group in ("items","cards"):
    for record in CATALOG[group]:
        if record["id"] in lookup:
            result[group][str(record["id"])]=lookup[record["id"]]

assert len(result["items"])==281, len(result["items"])
assert len(result["cards"])==98, len(result["cards"])
assert result["cards"]["4077"]=="劍魚卡片"
assert result["cards"]["4089"]=="異變魚卡片"
assert result["cards"]["4100"]=="鬼女卡片"
out=ROOT/"docs/TWRO_NAMES.json"
out.write_text(json.dumps(result,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print(f"twRO mapped {len(result['items'])} equipment / {len(result['cards'])} cards; 6 custom/unmatched equipment retained")
