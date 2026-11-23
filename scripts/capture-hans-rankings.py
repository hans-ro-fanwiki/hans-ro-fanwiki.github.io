"""Capture the public HANS power leaderboard and top-five builds once."""
import json
import subprocess
import time
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlencode

ROOT = Path(__file__).resolve().parents[1]
GAME_API = "https://ro.hans-webgametw.com/api/"
catalog = json.loads((ROOT / "public/data/catalog.json").read_text(encoding="utf-8"))
families = [job for job in catalog["lapRules"]["jobs"] if job["rank"] == 1]


def get(endpoint, **params):
    url = GAME_API + endpoint + "?" + urlencode(params)
    for attempt in range(3):
        result = subprocess.run(
            ["curl", "-sS", "--max-time", "12", "-w", "\n%{http_code}", url],
            capture_output=True, encoding="utf-8", errors="replace",
        )
        body, _, status = result.stdout.rpartition("\n")
        if result.returncode == 0 and status == "200":
            return json.loads(body)
        if status == "404":
            return None
        if attempt < 2:
            time.sleep(60 if status == "429" else 3 * (attempt + 1))
    return None


def select(record, *keys):
    return {key: record[key] for key in keys if key in record}


def profile_of(name):
    result = get("inspect", name=name)
    if not result or result.get("name") != name or not isinstance(result.get("p"), dict):
        return None
    profile = select(result["p"], "level", "jobLevel", "jobLvOf", "gs", "reb", "spec", "specs")
    profile["stats"] = select(result["p"].get("stats") or {}, "str", "agi", "vit", "int", "dex", "luk")
    profile["talents"] = {
        node: points for node, points in (result["p"].get("talents") or {}).items()
        if isinstance(points, int) and points > 0
    }
    profile["record"] = select(result["p"].get("record") or {}, "stage", "bestLevel", "wins", "runs", "totalKills", "mvps")
    profile["gear"] = []
    for item in result["p"].get("gear") or []:
        gear = select(item, "slot", "itemId", "tier", "ilvl", "quality", "refine", "star", "cards")
        gear["affixes"] = [select(affix, "stat", "skill", "value") for affix in item.get("affixes") or []]
        if isinstance(item.get("ex"), dict):
            gear["ex"] = select(item["ex"], "stat", "skill", "value")
        profile["gear"].append(gear)
    profile["capturedAt"] = datetime.now(timezone.utc).isoformat()
    return profile


def main():
    boards = []
    for family in families:
        rank = get("rank", cat="power", job=family["id"])
        if not rank or rank.get("cat") != "power" or rank.get("job") != family["id"]:
            raise RuntimeError("HANS leaderboard unavailable: " + family["id"])
        rows = sorted(rank["rows"], key=lambda row: row["rank"])[:5]
        boards.append({
            "id": family["id"], "name": family["name"], "rankedAt": rank["at"], "total": rank["total"],
            "rows": [{**select(row, "rank", "name", "job", "promotion"), "score": row["v"]} for row in rows],
        })
    profiles = {}
    for board in boards:
        for row in board["rows"]:
            name = row["name"]
            if name not in profiles:
                profiles[name] = profile_of(name)
                time.sleep(0.9)
            row["profile"] = profiles[name]
        print(board["id"], len(board["rows"]), sum(row["profile"] is not None for row in board["rows"]), flush=True)
    snapshot = {"server": "hans", "capturedAt": datetime.now(timezone.utc).isoformat(), "boards": boards}
    target = ROOT / "public/520520520/snapshot.json"
    temporary = target.with_suffix(".tmp")
    temporary.write_text(json.dumps(snapshot, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    temporary.replace(target)


if __name__ == "__main__":
    main()
