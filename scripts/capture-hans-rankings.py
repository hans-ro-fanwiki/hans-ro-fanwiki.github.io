"""Capture the public HANS power leaderboard and top-five builds once."""
import json
from math import isfinite
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
            ["curl", "-q", "-sS", "--max-time", "12", "-w", "\n%{http_code}", url],
            capture_output=True, encoding="utf-8", errors="replace",
        )
        body, _, status = result.stdout.rpartition("\n")
        if result.returncode == 0 and status == "200":
            try:
                payload = json.loads(body)
            except ValueError as error:
                raise RuntimeError(f"HANS {endpoint} returned invalid JSON") from error
            if isinstance(payload, dict):
                return payload
            raise RuntimeError(f"HANS {endpoint} returned an unexpected response")
        if status == "404":
            return None
        if status in ("401", "403"):
            break
        if attempt < 2:
            time.sleep(60 if status == "429" else 3 * (attempt + 1))
    raise RuntimeError(f"HANS {endpoint} unavailable (HTTP {status or 'unknown'})")


def numbers(record, *keys):
    return {
        key: record[key] for key in keys
        if type(record.get(key)) in (int, float) and isfinite(record[key])
    }


def affix_of(affix):
    selected = numbers(affix, "value")
    if not selected or not isinstance(affix.get("stat"), str):
        raise RuntimeError("Invalid HANS equipment modifier")
    selected["stat"] = affix["stat"]
    if isinstance(affix.get("skill"), str):
        selected["skill"] = affix["skill"]
    return selected


def profile_of(name):
    result = get("inspect", name=name)
    if not result or result.get("name") != name or not isinstance(result.get("p"), dict):
        raise RuntimeError("A ranked HANS profile was unavailable")
    data = result["p"]
    profile = numbers(data, "level", "jobLevel", "gs", "reb")
    if not {"level", "jobLevel", "gs"}.issubset(profile) or not isinstance(data.get("gear"), list):
        raise RuntimeError("A ranked HANS profile was incomplete")
    if not isinstance(data.get("stats"), dict) or not isinstance(data.get("talents"), dict):
        raise RuntimeError("A ranked HANS profile was missing stats or talents")
    profile["stats"] = numbers(data["stats"], "str", "agi", "vit", "int", "dex", "luk")
    profile["talents"] = {
        node: points for node, points in data["talents"].items()
        if type(points) is int and points > 0
    }
    profile["record"] = numbers(data.get("record") or {}, "bestLevel", "wins", "runs", "totalKills", "mvps")
    profile["gear"] = []
    for item in data["gear"]:
        gear = numbers(item, "itemId", "tier", "ilvl", "quality", "refine", "star")
        if type(gear.get("itemId")) is not int or not isinstance(item.get("slot"), str):
            raise RuntimeError("Invalid HANS equipment entry")
        gear["slot"] = item["slot"]
        gear["cards"] = [card for card in item.get("cards") or [] if type(card) is int]
        gear["affixes"] = [affix_of(affix) for affix in item.get("affixes") or []]
        if isinstance(item.get("ex"), dict):
            gear["ex"] = affix_of(item["ex"])
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
        if [row["rank"] for row in rows] != [1, 2, 3, 4, 5]:
            raise RuntimeError("Incomplete HANS leaderboard: " + family["id"])
        metadata = numbers(rank, "at", "total")
        if len(metadata) != 2 or not 0 < metadata["at"] <= 8_640_000_000_000_000 or metadata["total"] < 5:
            raise RuntimeError("Invalid HANS leaderboard metadata: " + family["id"])
        entries = []
        for row in rows:
            fields = numbers(row, "rank", "v")
            if len(fields) != 2 or not all(isinstance(row.get(key), str) and row[key] for key in ("name", "job")):
                raise RuntimeError("Invalid HANS leaderboard entry: " + family["id"])
            entry = {"rank": fields["rank"], "score": fields["v"], "name": row["name"], "job": row["job"]}
            if isinstance(row.get("promotion"), str):
                entry["promotion"] = row["promotion"]
            entries.append(entry)
        boards.append({
            "id": family["id"], "name": family["name"], "rankedAt": metadata["at"],
            "total": metadata["total"], "rows": entries,
        })
    profiles = {}
    for board in boards:
        for row in board["rows"]:
            name = row["name"]
            if name not in profiles:
                profiles[name] = profile_of(name)
                time.sleep(0.9)
            row["profile"] = profiles[name]
        print(f'{board["id"]}: {len(board["rows"])} profiles verified', flush=True)
    snapshot = {"server": "hans", "capturedAt": datetime.now(timezone.utc).isoformat(), "boards": boards}
    target = ROOT / "public/520520520/snapshot.json"
    temporary = target.with_suffix(".tmp")
    temporary.write_text(json.dumps(snapshot, ensure_ascii=False, allow_nan=False, separators=(",", ":")) + "\n", encoding="utf-8")
    temporary.replace(target)


if __name__ == "__main__":
    main()
