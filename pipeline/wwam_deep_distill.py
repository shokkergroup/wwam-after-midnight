#!/usr/bin/env python3
"""Build the bounded WWAM watchalong catalog and a citation-first deep distill.

The local cache may contain full YouTube auto-captions. It is deliberately
gitignored. Public output contains only short, timestamped excerpts and derived
scores so the prototype can prove its work without republishing transcripts.
"""

from __future__ import annotations

import argparse
import concurrent.futures
import html
import json
import math
import re
import statistics
import sys
import urllib.request
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any

from yt_dlp import YoutubeDL


ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / "source-cache"
PUBLIC = ROOT / "public" / "demo"
EXISTING_CATALOG = PUBLIC / "catalog.js"

NEW_CANON = [
    ("2G8lpFaeIdw", "Scream", "Scream (1996)", 1),
    ("wwJIsIRuR8w", "Scream", "Scream 2", 2),
    ("jLIfEdg8Oc0", "Scream", "Scream 3", 3),
    ("5et_A1tYnio", "Scream", "Scream 4", 4),
    ("hQu1Y1GZozI", "Scream", "Scream (2022)", 5),
    ("ISDlaQ9DWSM", "Scream", "Scream VI", 6),
    ("7qgebnDYVi4", "A Nightmare on Elm Street", "A Nightmare on Elm Street (1984)", 1),
    ("HNN0SEy2qtY", "A Nightmare on Elm Street", "Freddy's Revenge", 2),
    ("c15otfZ8HkU", "A Nightmare on Elm Street", "Dream Warriors", 3),
    ("rLXnU3Rsj-4", "A Nightmare on Elm Street", "The Dream Master", 4),
    ("l8HKF-nXdyc", "A Nightmare on Elm Street", "The Dream Child", 5),
    ("e7aq2cqVf-k", "A Nightmare on Elm Street", "Freddy's Dead", 6),
    ("vFdRkvErLmQ", "A Nightmare on Elm Street", "Wes Craven's New Nightmare", 7),
    ("qTQdWKcwn4A", "A Nightmare on Elm Street", "A Nightmare on Elm Street (2010)", 8),
]

FRANCHISE_META = {
    "Halloween": {
        "slug": "halloween",
        "killer": "MICHAEL",
        "lab": "LOOMIS LOGIC",
        "prompt": "Where does Loomis logic become a public-safety emergency?",
    },
    "Friday the 13th": {
        "slug": "friday",
        "killer": "JASON",
        "lab": "JASON'S TRAVEL AGENT",
        "prompt": "When does Crystal Lake's zoning board finally give up?",
    },
    "Scream": {
        "slug": "scream",
        "killer": "GHOSTFACE",
        "lab": "THE SUSPECT BOARD",
        "prompt": "Which confidence level ages worst after the killer reveal?",
    },
    "A Nightmare on Elm Street": {
        "slug": "elm-street",
        "killer": "FREDDY",
        "lab": "DREAM LOGIC COURT",
        "prompt": "At what exact second does dream logic lose its attorney?",
    },
}

CATEGORY_RULES = {
    "OUT OF POCKET": {
        "weight": 8,
        "terms": [
            r"\bfuck(?:ing|ed)?\b", r"\bshit(?:ty)?\b", r"\bbitch(?:es)?\b",
            r"\basshole\b", r"\bdick\b", r"\bbastard\b", r"\bmotherfucker\b",
            r"\bwhat the hell\b", r"\bgoddamn\b",
        ],
    },
    "FRANCHISE FELONY": {
        "weight": 7,
        "terms": [
            r"\bworst\b", r"\bterrible\b", r"\bawful\b", r"\bstupid\b",
            r"\bdumb\b", r"\bgarbage\b", r"\btrash\b", r"\bhate\b",
            r"\bsucks?\b", r"\bruin(?:ed|s)?\b", r"\bpiece of shit\b",
        ],
    },
    "LOVE LETTER": {
        "weight": 5,
        "terms": [
            r"\blove\b", r"\bbest\b", r"\bfavorite\b", r"\bamazing\b",
            r"\bperfect\b", r"\bawesome\b", r"\bgreatest\b", r"\bbeautiful\b",
        ],
    },
    "THEORY BOARD": {
        "weight": 6,
        "terms": [
            r"\bi bet\b", r"\bmy theory\b", r"\bprediction\b",
            r"\bhas to be\b", r"\bkiller is\b", r"\bwatch this\b",
            r"\bhere's what(?:'s| is) going to happen\b", r"\bcalling it now\b",
            r"\bi guarantee\b", r"\bmark my words\b",
        ],
    },
    "KILL ROOM": {
        "weight": 5,
        "terms": [
            r"\bkill(?:ed|er|ing|s)?\b", r"\bmurder\b", r"\bblood\b",
            r"\bdecapitat", r"\bstab(?:bed|bing|s)?\b", r"\bdead\b",
            r"\bhead\b", r"\bknife\b", r"\bbody\b", r"\bguts\b",
        ],
    },
    "BIT ENERGY": {
        "weight": 5,
        "terms": [
            r"\bremember when\b", r"\bevery time\b", r"\bagain\b",
            r"\bcallback\b", r"\brunning joke\b", r"\bwe always\b",
            r"\byou always\b", r"\bthere it is\b",
        ],
    },
    "BREAKDOWN": {
        "weight": 6,
        "terms": [
            r"\blaugh", r"\bhilarious\b", r"\bfunny\b", r"\bcrying\b",
            r"\bi can't\b", r"\boh my god\b", r"\bjesus christ\b",
            r"\blosing my mind\b", r"\bcome on\b",
        ],
    },
    "HORROR BRAIN": {
        "weight": 4,
        "terms": [
            r"\bcreepy\b", r"\bscary\b", r"\bnightmare\b", r"\bmonster\b",
            r"\bghost\b", r"\bdemon\b", r"\bmask\b", r"\bscream\b",
            r"\bslasher\b", r"\bboogeyman\b", r"\bfreddy\b", r"\bjason\b",
            r"\bmichael\b", r"\bghostface\b",
        ],
    },
}

STRONG_WORDS = re.compile(
    r"\b(fuck|shit|bitch|asshole|dick|goddamn|worst|hate|love|best|"
    r"amazing|stupid|terrible|killer|dead|murder|blood|jesus christ)\b",
    re.I,
)
DISALLOWED_EXCERPT = re.compile(
    r"\b(?:n[\W_]*[i1][\W_]*g[\W_]*g|f[\W_]*a[\W_]*g[\W_]*g|r[\W_]*e[\W_]*t[\W_]*a[\W_]*r[\W_]*d)\w*",
    re.I,
)
FILLER = re.compile(r"^(?:\[.*?\]\s*)+$|^(?:music|applause|foreign)$", re.I)


def parse_existing_catalog() -> list[dict[str, Any]]:
    raw = EXISTING_CATALOG.read_text(encoding="utf-8")
    payload = raw.split("=", 1)[1].strip().rstrip(";")
    return json.loads(payload)


def canon() -> list[dict[str, Any]]:
    items = parse_existing_catalog()
    by_id = {item["id"]: item for item in items}
    for video_id, franchise, film, order in NEW_CANON:
        by_id.setdefault(
            video_id,
            {
                "id": video_id,
                "franchise": franchise,
                "film": film,
                "order": order,
                "url": f"https://www.youtube.com/watch?v={video_id}",
            },
        )
    return sorted(
        by_id.values(),
        key=lambda item: (
            list(FRANCHISE_META).index(item["franchise"]),
            item["order"],
        ),
    )


def choose_caption_url(info: dict[str, Any]) -> str | None:
    automatic = info.get("automatic_captions") or {}
    manual = info.get("subtitles") or {}
    for bank in (manual, automatic):
        for lang in ("en-orig", "en", "en-US", "en-GB"):
            tracks = bank.get(lang) or []
            for fmt in tracks:
                if fmt.get("ext") == "json3" and fmt.get("url"):
                    return fmt["url"]
    return None


def fetch_json(url: str) -> Any:
    request = urllib.request.Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0",
            "Accept-Language": "en-US,en;q=0.9",
        },
    )
    with urllib.request.urlopen(request, timeout=45) as response:
        return json.load(response)


def extract_one(seed: dict[str, Any], refresh: bool) -> tuple[dict[str, Any], list[dict[str, Any]]]:
    video_id = seed["id"]
    info_path = CACHE / "metadata" / f"{video_id}.json"
    captions_path = CACHE / "captions" / f"{video_id}.json"
    if not refresh and info_path.exists():
        info = json.loads(info_path.read_text(encoding="utf-8"))
    else:
        options = {
            "quiet": True,
            "no_warnings": True,
            "skip_download": True,
            "extract_flat": False,
            "socket_timeout": 45,
        }
        with YoutubeDL(options) as ydl:
            raw = ydl.extract_info(seed["url"], download=False)
        info = {
            "id": raw.get("id"),
            "title": raw.get("title"),
            "upload_date": raw.get("upload_date"),
            "duration": raw.get("duration"),
            "view_count": raw.get("view_count"),
            "channel": raw.get("channel"),
            "channel_id": raw.get("channel_id"),
            "thumbnail": raw.get("thumbnail"),
            "caption_url": choose_caption_url(raw),
        }
        info_path.parent.mkdir(parents=True, exist_ok=True)
        info_path.write_text(json.dumps(info, ensure_ascii=False), encoding="utf-8")

    if not refresh and captions_path.exists():
        payload = json.loads(captions_path.read_text(encoding="utf-8"))
    elif info.get("caption_url"):
        payload = fetch_json(info["caption_url"])
        captions_path.parent.mkdir(parents=True, exist_ok=True)
        captions_path.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")
    else:
        payload = {}
    return info, parse_json3(payload)


def clean_text(value: str) -> str:
    value = html.unescape(value).replace("\n", " ")
    value = re.sub(r"<[^>]+>", "", value)
    value = re.sub(r"\[\s*__\s*\]", "[BLEEP]", value)
    value = re.sub(r"\s+", " ", value).strip()
    return value


def parse_json3(payload: dict[str, Any]) -> list[dict[str, Any]]:
    lines: list[dict[str, Any]] = []
    for event in payload.get("events") or []:
        text = clean_text("".join(segment.get("utf8", "") for segment in event.get("segs") or []))
        if not text or FILLER.match(text):
            continue
        start = float(event.get("tStartMs", 0)) / 1000
        duration = float(event.get("dDurationMs", 0)) / 1000
        if lines and text == lines[-1]["text"]:
            continue
        lines.append({"start": round(start, 2), "duration": round(duration, 2), "text": text})
    return lines


def excerpt_words(text: str, limit: int = 22) -> str:
    words = text.split()
    if len(words) <= limit:
        return text
    anchor = next((i for i, word in enumerate(words) if STRONG_WORDS.search(word)), len(words) // 2)
    left = max(0, min(anchor - 6, len(words) - limit))
    clipped = " ".join(words[left : left + limit])
    return ("… " if left else "") + clipped + (" …" if left + limit < len(words) else "")


def classify(text: str) -> tuple[str, float, dict[str, int]]:
    lower = text.lower()
    hits: dict[str, int] = {}
    weighted: dict[str, float] = {}
    for category, rule in CATEGORY_RULES.items():
        count = sum(len(re.findall(pattern, lower, re.I)) for pattern in rule["terms"])
        hits[category] = count
        weighted[category] = count * rule["weight"]
    category = max(weighted, key=weighted.get)
    raw = weighted[category] + sum(hits.values()) * 1.6
    punctuation = min(text.count("!") * 1.7 + text.count("?") * 0.8, 7)
    return category, raw + punctuation, hits


def moment_candidates(lines: list[dict[str, Any]]) -> list[dict[str, Any]]:
    candidates: list[dict[str, Any]] = []
    for index, line in enumerate(lines):
        group = [line]
        for nxt in lines[index + 1 : index + 4]:
            if nxt["start"] - group[-1]["start"] > 8:
                break
            group.append(nxt)
            if len(" ".join(item["text"] for item in group).split()) >= 18:
                break
        text = clean_text(" ".join(item["text"] for item in group))
        if len(text.split()) < 5 or DISALLOWED_EXCERPT.search(text):
            continue
        category, raw_score, hits = classify(text)
        if raw_score < 5:
            continue
        candidates.append(
            {
                "t": round(line["start"]),
                "quote": excerpt_words(text),
                "category": category,
                "raw": raw_score,
                "hits": hits,
            }
        )

    candidates.sort(key=lambda item: (-item["raw"], item["t"]))
    chosen: list[dict[str, Any]] = []
    fingerprints: set[str] = set()
    category_counts: Counter[str] = Counter()
    for candidate in candidates:
        fingerprint = " ".join(re.findall(r"[a-z']+", candidate["quote"].lower()))[:80]
        if any(abs(candidate["t"] - item["t"]) < 40 for item in chosen):
            continue
        if fingerprint in fingerprints:
            continue
        if category_counts[candidate["category"]] >= 3:
            continue
        fingerprints.add(fingerprint)
        category_counts[candidate["category"]] += 1
        chosen.append(candidate)
        if len(chosen) >= 8:
            break
    return chosen


def tone_arc(lines: list[dict[str, Any]], duration: int | float | None) -> list[dict[str, Any]]:
    if not lines:
        return []
    end = max(float(duration or 0), lines[-1]["start"] + lines[-1]["duration"], 1)
    bins = [{"heat": 0.0, "categories": Counter()} for _ in range(8)]
    for line in lines:
        category, raw, hits = classify(line["text"])
        slot = min(7, int((line["start"] / end) * 8))
        if raw:
            bins[slot]["heat"] += raw
            bins[slot]["categories"][category] += sum(hits.values())
    heats = [bucket["heat"] for bucket in bins]
    peak = max(heats) or 1
    output = []
    for index, bucket in enumerate(bins):
        dominant = bucket["categories"].most_common(1)
        output.append(
            {
                "chapter": index + 1,
                "heat": round(18 + 82 * (bucket["heat"] / peak)),
                "dominant": dominant[0][0] if dominant and dominant[0][1] else "DEAD AIR",
            }
        )
    return output


def verdict(metrics: dict[str, int], moments: list[dict[str, Any]]) -> str:
    hottest = moments[0]["category"] if moments else "ARCHIVE STATIC"
    roast = metrics.get("FRANCHISE FELONY", 0)
    love = metrics.get("LOVE LETTER", 0)
    profane = metrics.get("OUT OF POCKET", 0)
    if roast > love * 1.35:
        posture = "a hostile intervention disguised as a watchalong"
    elif love > roast * 1.35:
        posture = "a love letter that keeps a weapon under the table"
    else:
        posture = "an argument between affection and aggravated franchise assault"
    if profane > 80:
        voltage = "The profanity fuse does not survive the runtime."
    elif profane > 35:
        voltage = "The language earns the red-band wrapper."
    else:
        voltage = "The knives are mostly rhetorical, but they are sharpened."
    return f"This tape plays like {posture}. Its strongest evidence cluster is {hottest.lower()}. {voltage}"


def build_tape(seed: dict[str, Any], info: dict[str, Any], lines: list[dict[str, Any]]) -> tuple[dict[str, Any], dict[str, Any]]:
    upload_date = info.get("upload_date")
    date = f"{upload_date[:4]}-{upload_date[4:6]}-{upload_date[6:]}" if upload_date else seed.get("date")
    duration = info.get("duration") or seed.get("duration")
    metrics: Counter[str] = Counter()
    word_count = 0
    for line in lines:
        word_count += len(line["text"].split())
        _, _, hits = classify(line["text"])
        metrics.update(hits)
    moments = moment_candidates(lines)
    for moment in moments:
        moment["score"] = min(99, round(41 + moment.pop("raw") * 2.35))
        moment.pop("hits", None)
        moment["id"] = f"{seed['id']}-{moment['t']}"
    metric_total = sum(metrics.values()) or 1
    unhinged = min(
        99,
        round(
            24
            + metrics["OUT OF POCKET"] * 0.34
            + metrics["FRANCHISE FELONY"] * 0.31
            + metrics["BREAKDOWN"] * 0.24
            + math.log(metric_total + 1, 2) * 3.2
        ),
    )
    distill = {
        "id": seed["id"],
        "wordsAudited": word_count,
        "captionMinutes": round((lines[-1]["start"] / 60) if lines else 0),
        "unhinged": unhinged,
        "verdict": verdict(dict(metrics), moments),
        "metrics": dict(metrics),
        "arc": tone_arc(lines, duration),
        "moments": moments,
    }
    catalog_item = {
        "id": seed["id"],
        "franchise": seed["franchise"],
        "film": seed["film"],
        "order": seed["order"],
        "title": info.get("title") or seed.get("title") or seed["film"],
        "date": date,
        "duration": duration,
        "views": info.get("view_count") or seed.get("views"),
        "thumbnail": (
            f"https://i.ytimg.com/vi/{seed['id']}/maxresdefault.jpg"
            if info.get("title")
            else seed.get("thumbnail")
        ),
        "transcript": bool(lines),
        "url": seed["url"],
    }
    return catalog_item, distill


def normalize_hot100(tapes: list[dict[str, Any]]) -> list[dict[str, Any]]:
    pool = []
    for tape in tapes:
        for moment in tape["moments"]:
            pool.append({**moment, "tapeId": tape["id"]})
    pool.sort(key=lambda item: (-item["score"], item["tapeId"], item["t"]))
    per_tape: Counter[str] = Counter()
    category_counts: Counter[str] = Counter()
    hot = []
    for item in pool:
        if per_tape[item["tapeId"]] >= 4:
            continue
        if category_counts[item["category"]] >= 24:
            continue
        per_tape[item["tapeId"]] += 1
        category_counts[item["category"]] += 1
        hot.append(item)
        if len(hot) >= 100:
            break
    for rank, item in enumerate(hot, 1):
        item["rank"] = rank
    return hot


def js_assignment(name: str, payload: Any) -> str:
    return f"window.{name} = {json.dumps(payload, ensure_ascii=False, separators=(',', ':'))};\n"


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--refresh", action="store_true", help="Ignore local metadata/caption cache.")
    parser.add_argument("--workers", type=int, default=4)
    args = parser.parse_args()

    seeds = canon()
    print(f"Auditing {len(seeds)} bounded-canon watchalongs…", flush=True)
    extracted: dict[str, tuple[dict[str, Any], list[dict[str, Any]]]] = {}
    with concurrent.futures.ThreadPoolExecutor(max_workers=max(1, args.workers)) as pool:
        futures = {pool.submit(extract_one, seed, args.refresh): seed for seed in seeds}
        for future in concurrent.futures.as_completed(futures):
            seed = futures[future]
            try:
                extracted[seed["id"]] = future.result()
                info, lines = extracted[seed["id"]]
                print(f"  {seed['id']}  {len(lines):5d} caption events  {info.get('title')}", flush=True)
            except Exception as error:
                print(f"  {seed['id']}  ERROR {error}", file=sys.stderr, flush=True)
                extracted[seed["id"]] = ({}, [])

    catalog = []
    tapes = []
    for seed in seeds:
        info, lines = extracted[seed["id"]]
        catalog_item, tape = build_tape(seed, info, lines)
        catalog.append(catalog_item)
        tapes.append(tape)

    hot100 = normalize_hot100(tapes)
    total_words = sum(tape["wordsAudited"] for tape in tapes)
    total_caption_minutes = sum(tape["captionMinutes"] for tape in tapes)
    franchise_counts = Counter(item["franchise"] for item in catalog)
    scores = [tape["unhinged"] for tape in tapes if tape["wordsAudited"]]
    deep = {
        "generated": "2026-07-23",
        "method": "Full available YouTube auto-caption pass; short excerpts scored by profanity, hostility, affection, prediction, kill-language, callbacks, and breakdown signals.",
        "scope": "Four bounded watchalong paths only. Reviews, news streams, and non-commentary uploads are excluded.",
        "meta": {
            "tapes": len(catalog),
            "captioned": sum(1 for item in catalog if item["transcript"]),
            "wordsAudited": total_words,
            "captionHours": round(total_caption_minutes / 60),
            "franchises": len(franchise_counts),
            "hotMoments": len(hot100),
            "medianUnhinged": round(statistics.median(scores)) if scores else 0,
        },
        "franchises": [
            {
                "name": name,
                **FRANCHISE_META[name],
                "tapes": franchise_counts[name],
                "wordsAudited": sum(
                    tape["wordsAudited"]
                    for tape in tapes
                    if next(item for item in catalog if item["id"] == tape["id"])["franchise"] == name
                ),
                "avgUnhinged": round(
                    statistics.mean(
                        tape["unhinged"]
                        for tape in tapes
                        if next(item for item in catalog if item["id"] == tape["id"])["franchise"] == name
                    )
                ),
            }
            for name in FRANCHISE_META
        ],
        "tapes": tapes,
        "hot100": hot100,
    }

    PUBLIC.mkdir(parents=True, exist_ok=True)
    (PUBLIC / "catalog.js").write_text(js_assignment("WWAM_CATALOG", catalog), encoding="utf-8")
    (PUBLIC / "deep-distill.js").write_text(js_assignment("WWAM_DEEP_DISTILL", deep), encoding="utf-8")
    report = {
        "catalog": len(catalog),
        "captioned": deep["meta"]["captioned"],
        "words": total_words,
        "hours": deep["meta"]["captionHours"],
        "hot100": len(hot100),
    }
    print(json.dumps(report, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
