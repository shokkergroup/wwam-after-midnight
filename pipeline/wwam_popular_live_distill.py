#!/usr/bin/env python3
"""Build WWAM's Popular 25 livestream canon from the official Streams archive.

Selection is mechanical and reproducible: inspect every upload exposed by the
official ``/@WeWatchedAMovie/streams`` feed, rank by the current YouTube view
count, exclude the rolling Fresh 10, and deeply distill the first 25 remaining
streams. Full captions and discovery metadata remain in gitignored
``source-cache``. The public artifact contains measurements, editorial
descriptions derived from those measurements, and short source-linked receipts.

This script deliberately does not identify speakers. Character references and
performance cues are reported only when the caption text itself provides the
evidence.
"""

from __future__ import annotations

import argparse
import concurrent.futures
import json
import math
import re
import statistics
import sys
import time
from collections import Counter, defaultdict
from datetime import date
from pathlib import Path
from typing import Any

from yt_dlp import YoutubeDL

from wwam_deep_distill import (
    CACHE,
    DISALLOWED_EXCERPT,
    PUBLIC,
    choose_caption_url,
    clean_text,
    fetch_json,
    js_assignment,
    parse_json3,
)


STREAMS_URL = "https://www.youtube.com/@WeWatchedAMovie/streams"
FRESH_PATH = PUBLIC / "livestream-distill.js"
CATALOG_PATH = PUBLIC / "catalog.js"
OUTPUT_PATH = PUBLIC / "popular-live-distill.js"

# A topic is a navigational lane, not a claim about the hosts' opinion.
# The broad editorial lanes near the bottom ensure generic movie-news streams
# still produce useful chapter maps without inventing subject matter.
TOPIC_RULES: dict[str, list[str]] = {
    "Halloween": [r"\bhalloween\b", r"\bmichael myers\b", r"\bloomis\b"],
    "Scream": [r"\bscream(?:\s+[1-7ivx]+)?\b", r"\bghostface\b", r"\bsidney prescott\b"],
    "Friday the 13th": [r"\bfriday the 13th\b", r"\bjason voorhees\b", r"\bcrystal lake\b"],
    "A Nightmare on Elm Street": [r"\belm street\b", r"\bfreddy krueger\b", r"\bdream warriors\b"],
    "Terrifier": [r"\bterrifier\b", r"\bart the clown\b"],
    "IT / Pennywise": [r"\bpennywise\b", r"\bwelcome to derry\b", r"\bit chapter\b"],
    "The Conjuring": [r"\bconjuring\b", r"\bannabelle\b", r"\bthe nun\b"],
    "Saw": [r"\bsaw (?:movie|franchise|sequel|eleven|xi|x)\b", r"\bjigsaw\b"],
    "Final Destination": [r"\bfinal destination\b", r"\bbloodlines\b"],
    "Evil Dead": [r"\bevil dead\b", r"\bash williams\b"],
    "Alien": [r"\balien(?:\s+romulus|\s+earth|\s+movie|\s+franchise)?\b", r"\bxenomorph\b"],
    "Predator": [r"\bpredator\b", r"\byautja\b", r"\bprey movie\b"],
    "Chucky": [r"\bchucky\b", r"\bchild'?s play\b"],
    "Texas Chainsaw": [r"\btexas chainsaw\b", r"\bleatherface\b"],
    "Hellraiser": [r"\bhellraiser\b", r"\bpinhead\b"],
    "The Exorcist": [r"\bexorcist\b", r"\bregan\b"],
    "The Shining": [r"\bthe shining\b", r"\boverlook hotel\b"],
    "Universal Monsters": [r"\buniversal monsters?\b", r"\bwolf man\b", r"\bdracula\b", r"\bfrankenstein\b"],
    "Stranger Things": [r"\bstranger things\b", r"\bvecna\b"],
    "The Walking Dead": [r"\bwalking dead\b", r"\brick grimes\b", r"\bnegan\b"],
    "Superman": [r"\bsuperman\b", r"\bclark kent\b", r"\bjames gunn\b"],
    "Batman": [r"\bbatman\b", r"\bbruce wayne\b", r"\bthe joker\b"],
    "Marvel": [r"\bmarvel\b", r"\bavengers\b", r"\bspider-?man\b", r"\bfantastic four\b"],
    "DC": [r"\bdc universe\b", r"\bdceu\b", r"\bdc movies?\b"],
    "Star Wars": [r"\bstar wars\b", r"\bdarth vader\b", r"\bmandalorian\b"],
    "Ghostbusters": [r"\bghostbusters\b"],
    "Jurassic": [r"\bjurassic\b", r"\bdinosaur\b"],
    "Godzilla / Kong": [r"\bgodzilla\b", r"\bking kong\b", r"\bmonsterverse\b"],
    "Mortal Kombat": [r"\bmortal kombat\b"],
    "Stephen King": [r"\bstephen king\b", r"\bking adaptation\b"],
    "Horror": [r"\bhorror (?:movie|movies|film|films|franchise|genre)\b", r"\bscary movie\b"],
    "Slashers": [r"\bslasher(?:s| movie| movies)?\b", r"\bmasked killer\b"],
    "Superheroes": [r"\bsuperhero(?:es| movie| movies)?\b", r"\bcomic book movie\b"],
    "Action Movies": [r"\baction movie(?:s)?\b", r"\baction franchise\b"],
    "Science Fiction": [r"\bsci-?fi\b", r"\bscience fiction\b"],
    "Television": [r"\btv show\b", r"\btelevision\b", r"\bseries finale\b", r"\bseason (?:one|two|three|four|five|\d+)\b"],
    "Movie News": [r"\bmovie news\b", r"\bfilm news\b", r"\bwas announced\b", r"\bhas been cast\b"],
    "Trailers": [r"\btrailer\b", r"\bteaser\b"],
    "Box Office": [r"\bbox office\b", r"\bopening weekend\b", r"\bdomestic gross\b", r"\bmade \$?\d+\s*million\b"],
    "Streaming": [r"\bstreaming\b", r"\bnetflix\b", r"\bhbo max\b", r"\bparamount plus\b", r"\bpeacock\b"],
    "Rankings & Lists": [r"\btier list\b", r"\brank(?:ed|ing)\b", r"\btop (?:five|ten|\d+)\b", r"\bbracket\b"],
    "Remakes & Reboots": [r"\bremake\b", r"\breboot\b", r"\breimagining\b"],
    "Sequels & Prequels": [r"\bsequel\b", r"\bprequel\b", r"\bpart (?:two|three|four|2|3|4)\b"],
    "Casting": [r"\bcast(?:ing|ed)?\b", r"\bactor\b", r"\bactress\b", r"\bplay(?:ing|s) the role\b"],
    "Directors & Writers": [r"\bdirector\b", r"\bdirected by\b", r"\bwriter\b", r"\bscreenwriter\b"],
    "Fan Theories": [r"\btheory\b", r"\bi predict\b", r"\bprediction\b", r"\bi bet (?:you|that)\b"],
    "Chat & Superchats": [r"\bsuper ?chat\b", r"\bthe chat\b", r"\bin chat\b", r"\bdonation\b", r"\bnew member\b"],
    "Video Games": [r"\bvideo game\b", r"\bgaming\b", r"\bplaystation\b", r"\bxbox\b", r"\bsteam\b"],
    "Physical Media": [r"\bblu-?ray\b", r"\b4k release\b", r"\bdvd\b", r"\bphysical media\b"],
    "Movie Theaters": [r"\bmovie theater\b", r"\btheatrical\b", r"\bopening night\b", r"\bimax\b"],
    "Nostalgia": [r"\bnostalgia\b", r"\bwhen i was a kid\b", r"\bgrew up\b", r"\bchildhood\b"],
    "Retro Rewind": [r"\bretro rewind\b", r"\bvideo store\b"],
}

FUNNY_RULES: dict[str, tuple[int, list[str]]] = {
    "FULL SEND": (
        8,
        [
            r"\bfuck(?:ing|ed|er|s)?\b", r"\bshit(?:ty)?\b", r"\bmotherfucker\b",
            r"\basshole\b", r"\bgoddamn\b",
        ],
    ),
    "THE ROOM BREAKS": (
        7,
        [
            r"\blaugh", r"\bhilarious\b", r"\bcracking up\b", r"\bi can'?t\b",
            r"\bcrying\b", r"\blosing my mind\b", r"\boh my god\b",
        ],
    ),
    "CHAT DID THIS": (
        6,
        [
            r"\bsuper ?chat\b", r"\bthe chat\b", r"\bin chat\b", r"\bdonation\b",
            r"\bnew member\b", r"\bthank you for the\b",
        ],
    ),
    "TAKE GETS NUCLEAR": (
        6,
        [
            r"\bworst\b", r"\bgarbage\b", r"\btrash\b", r"\bterrible\b",
            r"\bawful\b", r"\bhate\b", r"\bstupid\b", r"\bsucks?\b",
        ],
    ),
    "UP IN YA": (
        7,
        [
            r"\bdick\b", r"\bballs?\b", r"\bbutt\b", r"\bass\b", r"\bpenis\b",
            r"\bpoop\b", r"\bfart\b", r"\bhorny\b",
        ],
    ),
}

CHARACTER_RULES: dict[str, dict[str, Any]] = {
    "Dr. Loomis": {
        "aliases": [r"\bdr\.?\s+loomis\b", r"\bdoctor loomis\b", r"\bsam(?:uel)? loomis\b"],
        "unqualified": [r"\bloomis\b"],
    },
    "Dr. Challis": {
        # Auto-captions overwhelmingly render Challis as "Chalice."
        "aliases": [
            r"\bdr\.?\s+(?:challis|chalis|chalice)\b",
            r"\bdoctor (?:challis|chalis|chalice)\b",
            r"\bdan (?:challis|chalis|chalice)\b",
        ],
        "unqualified": [r"\b(?:challis|chalis|chalice)\b"],
    },
    "Slenderman": {
        "aliases": [r"\bslender ?man\b"],
        "unqualified": [],
    },
    "Corey Feldman": {
        "aliases": [r"\bcorey feldman\b"],
        "unqualified": [r"\bfeldman\b"],
    },
}

PUBLIC_REJECT = re.compile(
    r"\b(?:racist|nazi|transgender|conservative|liberal|politician|prison suck)\b",
    re.I,
)


def parse_assignment(path: Path, name: str) -> Any:
    raw = path.read_text(encoding="utf-8").strip()
    prefix = f"window.{name} = "
    if not raw.startswith(prefix):
        raise RuntimeError(f"{path.name} is not a {name} assignment")
    return json.loads(raw[len(prefix):].removesuffix(";"))


def fresh_ids() -> set[str]:
    payload = parse_assignment(FRESH_PATH, "WWAM_LIVESTREAMS")
    ids = {item["id"] for item in payload.get("streams") or []}
    if len(ids) != 10:
        raise RuntimeError(f"Expected exactly ten Fresh livestream IDs, found {len(ids)}")
    return ids


def catalog_ids() -> set[str]:
    payload = parse_assignment(CATALOG_PATH, "WWAM_CATALOG")
    ids = {item["id"] for item in payload}
    if len(ids) < 39:
        raise RuntimeError(f"Existing commentary catalog unexpectedly contains only {len(ids)} IDs")
    return ids


def discover_archive() -> list[dict[str, Any]]:
    options = {
        "quiet": True,
        "no_warnings": True,
        "extract_flat": True,
        "skip_download": True,
        "lazy_playlist": False,
    }
    with YoutubeDL(options) as ydl:
        info = ydl.extract_info(STREAMS_URL, download=False)
    entries = [
        {
            "id": entry["id"],
            "title": entry.get("title") or "WWAM Livestream",
            "url": f"https://www.youtube.com/watch?v={entry['id']}",
            "franchise": "Livestream",
            "film": entry.get("title") or "WWAM Livestream",
            "order": index + 1,
        }
        for index, entry in enumerate(info.get("entries") or [])
        if entry and entry.get("id")
    ]
    if len(entries) < 100:
        raise RuntimeError(f"Official Streams archive unexpectedly contains only {len(entries)} entries")
    return entries


def metadata_path(video_id: str) -> Path:
    return CACHE / "metadata" / f"{video_id}.json"


def fetch_metadata(seed: dict[str, Any], refresh: bool) -> dict[str, Any]:
    path = metadata_path(seed["id"])
    if not refresh and path.exists():
        return json.loads(path.read_text(encoding="utf-8"))
    last_error: Exception | None = None
    for attempt in range(3):
        try:
            with YoutubeDL(
                {
                    "quiet": True,
                    "no_warnings": True,
                    "skip_download": True,
                    "extract_flat": False,
                    # Metadata and captions remain available even when YouTube
                    # withholds a playable media format from an unsigned client.
                    "ignore_no_formats_error": True,
                    "socket_timeout": 45,
                    "retries": 2,
                    "extractor_args": {
                        "youtube": {
                            "player_client": ["web_safari"],
                        },
                    },
                }
            ) as ydl:
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
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(json.dumps(info, ensure_ascii=False), encoding="utf-8")
            return info
        except Exception as error:  # yt-dlp supplies actionable text on final failure.
            last_error = error
            time.sleep(1.5 * (attempt + 1))
    raise RuntimeError(f"{seed['id']} metadata failed after three attempts: {last_error}")


def extract_selected(
    seed: dict[str, Any],
    refresh: bool,
) -> tuple[dict[str, Any], list[dict[str, Any]]]:
    """Fetch one chosen stream without requiring a playable media format."""
    info = fetch_metadata(seed, refresh)
    captions_path = CACHE / "captions" / f"{seed['id']}.json"
    if not refresh and captions_path.exists():
        payload = json.loads(captions_path.read_text(encoding="utf-8"))
    elif info.get("caption_url"):
        payload = fetch_json(info["caption_url"])
        captions_path.parent.mkdir(parents=True, exist_ok=True)
        captions_path.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")
    else:
        payload = {}
    return info, parse_json3(payload)


def rank_archive(
    entries: list[dict[str, Any]],
    excluded: set[str],
    refresh: bool,
    workers: int,
) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    metadata: dict[str, dict[str, Any]] = {}
    failures: list[dict[str, Any]] = []
    completed = 0
    lockstep = max(1, workers)
    with concurrent.futures.ThreadPoolExecutor(max_workers=lockstep) as pool:
        futures = {
            pool.submit(fetch_metadata, seed, refresh): seed
            for seed in entries
        }
        for future in concurrent.futures.as_completed(futures):
            seed = futures[future]
            completed += 1
            try:
                metadata[seed["id"]] = future.result()
            except Exception as error:
                failures.append({"id": seed["id"], "error": str(error)})
            if completed % 25 == 0 or completed == len(entries):
                print(
                    f"  discovery {completed:>3}/{len(entries)} "
                    f"({len(failures)} unavailable)",
                    flush=True,
                )

    eligible = []
    for seed in entries:
        info = metadata.get(seed["id"])
        if seed["id"] in excluded or not info or info.get("view_count") is None:
            continue
        eligible.append({**seed, "_metadata": info})
    eligible.sort(
        key=lambda item: (
            -(item["_metadata"].get("view_count") or 0),
            item["_metadata"].get("upload_date") or "",
            item["id"],
        )
    )
    if len(eligible) < 25:
        raise RuntimeError(f"Only {len(eligible)} ranked streams remain after exclusions")
    return eligible[:25], failures


def clip_words(text: str, limit: int) -> str:
    words = clean_text(text).split()
    return " ".join(words[:limit]) + (" …" if len(words) > limit else "")


def clip_around(text: str, patterns: list[str], limit: int) -> str:
    """Return a short receipt centered on the named evidence, not window filler."""
    cleaned = clean_text(text)
    matches = [
        match
        for pattern in patterns
        if (match := re.search(pattern, cleaned, re.I))
    ]
    if not matches:
        return clip_words(cleaned, limit)
    match = min(matches, key=lambda item: item.start())
    before = cleaned[:match.start()].split()
    words = cleaned.split()
    start = max(0, len(before) - 3)
    excerpt = words[start:start + limit]
    prefix = "… " if start else ""
    suffix = " …" if start + limit < len(words) else ""
    return prefix + " ".join(excerpt) + suffix


def joined_window(lines: list[dict[str, Any]], index: int, word_target: int = 18) -> str:
    group = [lines[index]]
    for nxt in lines[index + 1:index + 4]:
        if nxt["start"] - group[-1]["start"] > 9:
            break
        group.append(nxt)
        if len(" ".join(item["text"] for item in group).split()) >= word_target:
            break
    return clean_text(" ".join(item["text"] for item in group))


def topic_hits(text: str) -> list[str]:
    return [
        topic
        for topic, patterns in TOPIC_RULES.items()
        if any(re.search(pattern, text, re.I) for pattern in patterns)
    ]


def funny_signal(text: str) -> tuple[str, float, dict[str, int]]:
    counts: dict[str, int] = {}
    weighted: dict[str, float] = {}
    for category, (weight, patterns) in FUNNY_RULES.items():
        count = sum(len(re.findall(pattern, text, re.I)) for pattern in patterns)
        counts[category] = count
        weighted[category] = count * weight
    category = max(weighted, key=weighted.get)
    raw = weighted[category] + sum(counts.values()) * 1.5
    if "!" in text:
        raw += min(4, text.count("!"))
    return category, raw, counts


def build_topics(lines: list[dict[str, Any]]) -> list[dict[str, Any]]:
    occurrences: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for index, line in enumerate(lines):
        found = topic_hits(line["text"])
        if not found:
            continue
        window = joined_window(lines, index)
        for topic in found:
            occurrences[topic].append({"t": round(line["start"]), "text": window})

    ranked = []
    for topic, entries in occurrences.items():
        peak = max(
            entries,
            key=lambda entry: sum(abs(entry["t"] - other["t"]) <= 240 for other in entries),
        )
        cluster = sum(abs(peak["t"] - other["t"]) <= 240 for other in entries)
        ranked.append(
            {
                "name": topic,
                "mentions": len(entries),
                "first": entries[0]["t"],
                "peak": peak["t"],
                "cluster": cluster,
                "receipt": clip_words(peak["text"], 7),
                "_score": cluster * 4 + math.log2(len(entries) + 1) * 6,
            }
        )
    ranked.sort(key=lambda item: (-item["_score"], -item["mentions"], item["first"], item["name"]))
    # A single exact hit may fill out the bottom of a sparse chapter map, but
    # every published chapter still has a caption receipt and timestamp.
    chosen = ranked[:10]
    for item in chosen:
        item.pop("_score", None)
    return chosen


def build_moments(lines: list[dict[str, Any]]) -> list[dict[str, Any]]:
    candidates = []
    for index, line in enumerate(lines):
        text = joined_window(lines, index)
        if (
            len(text.split()) < 5
            or DISALLOWED_EXCERPT.search(text)
            or PUBLIC_REJECT.search(text)
        ):
            continue
        category, raw, _ = funny_signal(text)
        if raw < 6:
            continue
        candidates.append(
            {
                "t": round(line["start"]),
                "quote": clip_words(text, 12),
                "category": category,
                "_raw": raw,
            }
        )
    candidates.sort(key=lambda item: (-item["_raw"], item["t"]))
    chosen: list[dict[str, Any]] = []
    category_counts: Counter[str] = Counter()
    for candidate in candidates:
        if any(abs(candidate["t"] - item["t"]) < 120 for item in chosen):
            continue
        if category_counts[candidate["category"]] >= 3:
            continue
        category_counts[candidate["category"]] += 1
        chosen.append(candidate)
        if len(chosen) >= 7:
            break
    if not chosen:
        return []
    raw_values = [item["_raw"] for item in chosen]
    low, high = min(raw_values), max(raw_values)
    for item in chosen:
        item["heat"] = round(72 + 27 * ((item.pop("_raw") - low) / max(1, high - low)))
    return chosen


def character_signal(
    lines: list[dict[str, Any]],
    character: str,
    rule: dict[str, Any],
) -> dict[str, Any] | None:
    hits = []
    cue_hits: list[dict[str, Any]] = []
    patterns = rule["aliases"] + rule["unqualified"]
    character_pattern = "(?:" + "|".join(patterns) + ")"

    def cue_kind(window: str) -> str | None:
        performance_discussion = [
            rf"\b(?:do|doing|did)\b.{{0,35}}\b(?:version|voice|impression|impersonation)\b.{{0,25}}{character_pattern}",
            rf"\b(?:version|voice|impression|impersonation)\b.{{0,25}}\bof\b.{{0,15}}{character_pattern}",
            rf"{character_pattern}.{{0,30}}\b(?:voice|impression|impersonation|skit|bit)\b",
            rf"\bour version of\b.{{0,15}}{character_pattern}",
            rf"\b(?:i|we|you)\b.{{0,40}}\b(?:do|doing)\b.{{0,18}}{character_pattern}",
            rf"\bto do\b.{{0,15}}{character_pattern}",
            rf"\bpretend(?:ing)? to be\b.{{0,15}}{character_pattern}",
            rf"\brecurring characters?\b.{{0,80}}{character_pattern}",
        ]
        persona_prompt = [
            rf"\bcan (?:i|we) get\b.{{0,90}}\b(?:from|as|of)\b.{{0,15}}{character_pattern}",
            rf"\bcan you\b.{{0,65}}{character_pattern}",
            rf"\b(?:let'?s hear|hear)\b.{{0,30}}{character_pattern}",
            rf"{character_pattern}.{{0,45}}\b(?:thoughts?|think|talk|say|sing|advice|motivation|shout ?out|words)\b",
            rf"\b(?:thoughts?|advice|words|shout ?out)\b.{{0,45}}\bfrom\b.{{0,15}}{character_pattern}",
            rf"\b(?:do|doing)\b.{{0,65}}\b(?:as|from)\b.{{0,15}}{character_pattern}",
            rf"\bdo\b.{{0,20}}{character_pattern}.{{0,20}}\b(?:voice|impression|impersonation|skit|bit)\b",
        ]
        if any(re.search(pattern, window, re.I) for pattern in performance_discussion):
            return "performance discussion"
        if any(re.search(pattern, window, re.I) for pattern in persona_prompt):
            return "persona prompt"
        return None

    for index, line in enumerate(lines):
        if not any(re.search(pattern, line["text"], re.I) for pattern in patterns):
            continue
        window = joined_window(lines, index, 24)
        record = {"t": round(line["start"]), "text": window}
        hits.append(record)
        kind = cue_kind(window)
        if kind:
            record["kind"] = kind
            cue_hits.append(record)
    if not hits:
        return None
    pool = cue_hits or hits
    peak = max(
        pool,
        key=lambda entry: sum(abs(entry["t"] - other["t"]) <= 180 for other in pool),
    )
    return {
        "character": character,
        "mentions": len(hits),
        "performanceCues": len(cue_hits),
        "status": peak.get("kind", "character reference"),
        "t": peak["t"],
        "receipt": clip_around(peak["text"], patterns, 8),
    }


def build_characters(lines: list[dict[str, Any]]) -> list[dict[str, Any]]:
    output = []
    for character, rule in CHARACTER_RULES.items():
        signal = character_signal(lines, character, rule)
        if signal:
            output.append(signal)
    output.sort(
        key=lambda item: (
            -int(item["performanceCues"] > 0),
            -item["performanceCues"],
            -item["mentions"],
            item["character"],
        )
    )
    return output


def build_heatmap(
    lines: list[dict[str, Any]],
    duration: int | float | None,
) -> list[dict[str, Any]]:
    if not lines:
        return []
    end = max(float(duration or 0), lines[-1]["start"] + lines[-1]["duration"], 1)
    bins = [
        {"raw": 0.0, "signals": Counter(), "topics": Counter()}
        for _ in range(30)
    ]
    for line in lines:
        slot = min(29, int((line["start"] / end) * 30))
        category, raw, counts = funny_signal(line["text"])
        bins[slot]["raw"] += raw
        bins[slot]["signals"][category] += sum(counts.values())
        bins[slot]["topics"].update(topic_hits(line["text"]))
    values = [bucket["raw"] for bucket in bins]
    floor = statistics.median(values) if values else 0
    ceiling = max(values) if values else 1
    output = []
    for index, bucket in enumerate(bins):
        signal = bucket["signals"].most_common(1)
        topic = bucket["topics"].most_common(1)
        normalized = (bucket["raw"] - floor) / max(1, ceiling - floor)
        output.append(
            {
                "from": round(index * end / 30),
                "to": round((index + 1) * end / 30),
                "heat": round(max(8, min(100, 34 + normalized * 66))),
                "signal": signal[0][0] if signal and signal[0][1] else "OPEN MIC",
                "topic": topic[0][0] if topic else None,
            }
        )
    return output


def format_time(seconds: int) -> str:
    hours, remainder = divmod(max(0, seconds), 3600)
    minutes, secs = divmod(remainder, 60)
    return f"{hours}:{minutes:02d}:{secs:02d}" if hours else f"{minutes}:{secs:02d}"


def show_shape(title: str) -> str:
    lower = title.lower()
    if "bracket" in lower or " vs " in lower:
        return "TOURNAMENT NIGHT"
    if "tier list" in lower or "ranked" in lower or "ranking" in lower:
        return "RANKING NIGHT"
    if "spoiler" in lower or "review" in lower:
        return "SPOILER COURT"
    if "trailer" in lower:
        return "TRAILER EMERGENCY"
    if "video store" in lower or "retro rewind" in lower:
        return "RETRO REWIND"
    return "OPEN-LINE MOVIE NEWS"


def raw_indices(
    lines: list[dict[str, Any]],
    topics: list[dict[str, Any]],
    characters: list[dict[str, Any]],
    moments: list[dict[str, Any]],
) -> dict[str, float]:
    words = max(1, sum(len(line["text"].split()) for line in lines))
    counts: Counter[str] = Counter()
    weighted = 0.0
    for line in lines:
        _, raw, signals = funny_signal(line["text"])
        weighted += raw
        counts.update(signals)
    rate = 10000 / words
    comedy = weighted * rate
    take = counts["TAKE GETS NUCLEAR"] * rate
    room = counts["THE ROOM BREAKS"] * rate
    lore = (
        sum(item["mentions"] + item["performanceCues"] * 3 for item in characters)
        + sum(item["mentions"] for item in topics if item["name"] in {
            "Halloween", "Scream", "Friday the 13th", "A Nightmare on Elm Street",
        }) * 0.08
    ) * rate
    range_score = len(topics) + math.log2(sum(item["mentions"] for item in topics) + 1)
    peak = statistics.mean(sorted((item["heat"] for item in moments), reverse=True)[:3]) if moments else 0
    return {
        "comedyVoltage": comedy,
        "takePressure": take,
        "roomBreakRisk": room,
        "loreDensity": lore,
        "topicRange": range_score,
        "chaosIndex": comedy * 0.42 + take * 2.0 + room * 1.35 + peak * 0.2,
    }


def editorial_fields(
    rank: int,
    info: dict[str, Any],
    topics: list[dict[str, Any]],
    moments: list[dict[str, Any]],
    characters: list[dict[str, Any]],
) -> dict[str, Any]:
    topic_names = [item["name"] for item in topics[:3]]
    if len(topic_names) > 1:
        subject = ", ".join(topic_names[:-1]) + f" and {topic_names[-1]}"
    elif topic_names:
        subject = topic_names[0]
    else:
        subject = "the surviving metadata"
    views = int(info.get("view_count") or 0)
    if moments:
        peak = max(moments, key=lambda item: item["heat"])
        entry = {
            "t": peak["t"],
            "label": f"{peak['category']} · {format_time(peak['t'])}",
            "why": "The strongest caption-derived comedy spike in this stream.",
        }
    elif topics:
        entry = {
            "t": topics[0]["peak"],
            "label": f"{topics[0]['name']} · {format_time(topics[0]['peak'])}",
            "why": "The densest surviving topic cluster in the caption track.",
        }
    else:
        entry = None
    character_note = ""
    cued = [item["character"] for item in characters if item["performanceCues"]]
    if cued:
        character_note = f" It also contains an explicit performance cue near {cued[0]}."
    why = (
        f"Ranked #{rank} among eligible archived livestreams at the view-count "
        f"snapshot ({views:,} views). Its caption map concentrates on {subject}."
        f"{character_note}"
    )
    return {
        "whyItMatters": why,
        "showShape": show_shape(info.get("title") or ""),
        "signature": (
            f"{topic_names[0] if topic_names else 'ARCHIVE STATIC'} × "
            f"{moments[0]['category'] if moments else 'NO CAPTION RECEIPT'}"
        ),
        "bestEntry": entry,
        "basis": [
            f"#{rank} by archived views",
            f"{views:,} views at snapshot",
            f"{len(topics)} timestamped topic lanes",
            f"{len(moments)} comedy receipts",
        ],
    }


def build_stream(
    seed: dict[str, Any],
    rank: int,
    info: dict[str, Any],
    lines: list[dict[str, Any]],
) -> dict[str, Any]:
    upload_date = info.get("upload_date")
    stream_date = (
        f"{upload_date[:4]}-{upload_date[4:6]}-{upload_date[6:]}"
        if upload_date
        else None
    )
    topics = build_topics(lines)
    moments = build_moments(lines)
    characters = build_characters(lines)
    heatmap = build_heatmap(lines, info.get("duration"))
    peak = max(heatmap, key=lambda item: item["heat"]) if heatmap else None
    captioned = bool(lines)
    editorial = editorial_fields(rank, info, topics, moments, characters)
    if not captioned:
        editorial["whyItMatters"] = (
            f"Ranked #{rank} among eligible archived livestreams at the view-count "
            f"snapshot ({int(info.get('view_count') or 0):,} views). YouTube exposes "
            "no usable English caption track, so the build preserves metadata without "
            "inventing chapters, jokes or character evidence."
        )
        editorial["basis"][-2:] = ["0 caption-backed topic lanes", "caption gap disclosed"]
    return {
        "rank": rank,
        "id": seed["id"],
        "title": info.get("title") or seed["title"],
        "date": stream_date,
        "duration": info.get("duration"),
        "views": info.get("view_count"),
        "thumbnail": f"https://i.ytimg.com/vi/{seed['id']}/maxresdefault.jpg",
        "url": seed["url"],
        "captioned": captioned,
        "wordsAudited": sum(len(line["text"].split()) for line in lines),
        "editorial": editorial,
        "topics": topics,
        "moments": moments,
        "characters": characters,
        "heatmap": heatmap,
        "peak": peak,
        "_rawIndices": raw_indices(lines, topics, characters, moments) if lines else {},
    }


def normalize_indices(streams: list[dict[str, Any]]) -> None:
    keys = [
        "comedyVoltage", "takePressure", "roomBreakRisk",
        "loreDensity", "topicRange", "chaosIndex",
    ]
    captioned = [stream for stream in streams if stream["captioned"]]
    for key in keys:
        values = [stream["_rawIndices"][key] for stream in captioned]
        ordered = sorted(values)
        for stream in captioned:
            value = stream["_rawIndices"][key]
            below = sum(item < value for item in ordered)
            equal = sum(item == value for item in ordered)
            percentile = (below + max(0, equal - 1) / 2) / max(1, len(ordered) - 1)
            stream.setdefault("indices", {})[key] = round(38 + percentile * 61)
    for stream in streams:
        if not stream["captioned"]:
            stream["indices"] = {key: None for key in keys}
        stream.pop("_rawIndices", None)


def aggregate_topics(streams: list[dict[str, Any]]) -> list[dict[str, Any]]:
    grouped: dict[str, dict[str, Any]] = {}
    for stream in streams:
        for topic in stream["topics"]:
            record = grouped.setdefault(
                topic["name"],
                {"name": topic["name"], "mentions": 0, "streams": []},
            )
            record["mentions"] += topic["mentions"]
            record["streams"].append(
                {
                    "id": stream["id"],
                    "rank": stream["rank"],
                    "peak": topic["peak"],
                    "mentions": topic["mentions"],
                }
            )
    output = list(grouped.values())
    output.sort(key=lambda item: (-len(item["streams"]), -item["mentions"], item["name"]))
    return output


def aggregate_characters(streams: list[dict[str, Any]]) -> list[dict[str, Any]]:
    grouped: dict[str, dict[str, Any]] = {}
    for stream in streams:
        for character in stream["characters"]:
            record = grouped.setdefault(
                character["character"],
                {
                    "character": character["character"],
                    "mentions": 0,
                    "performanceCues": 0,
                    "streams": [],
                },
            )
            record["mentions"] += character["mentions"]
            record["performanceCues"] += character["performanceCues"]
            record["streams"].append(
                {
                    "id": stream["id"],
                    "rank": stream["rank"],
                    "t": character["t"],
                    "status": character["status"],
                }
            )
    output = list(grouped.values())
    output.sort(
        key=lambda item: (
            -item["performanceCues"],
            -len(item["streams"]),
            -item["mentions"],
            item["character"],
        )
    )
    return output


def validate_payload(payload: dict[str, Any], excluded: set[str], archive_count: int) -> None:
    streams = payload["streams"]
    meta = payload["meta"]
    assert archive_count >= 100
    assert len(streams) == 25
    assert len({stream["id"] for stream in streams}) == 25
    assert not ({stream["id"] for stream in streams} & excluded)
    assert all(stream["rank"] == index + 1 for index, stream in enumerate(streams))
    assert all(
        (streams[index]["views"] or 0) >= (streams[index + 1]["views"] or 0)
        for index in range(len(streams) - 1)
    )
    for stream in streams:
        if stream["captioned"]:
            assert len(stream["heatmap"]) == 30
            assert 8 <= len(stream["topics"]) <= 12, (
                f"{stream['id']} has {len(stream['topics'])} topic lanes"
            )
        else:
            assert not stream["topics"] and not stream["moments"] and not stream["heatmap"]
        assert all(len(item["quote"].split()) <= 13 for item in stream["moments"])
        assert all(len(item["receipt"].split()) <= 8 for item in stream["topics"])
        assert all(len(item["receipt"].split()) <= 10 for item in stream["characters"])
    assert meta["streams"] == len(streams)
    assert meta["captioned"] == sum(stream["captioned"] for stream in streams)
    assert meta["uncaptioned"] == sum(not stream["captioned"] for stream in streams)
    assert meta["wordsAudited"] == sum(stream["wordsAudited"] for stream in streams)
    assert meta["viewsAtSnapshot"] == sum(stream["views"] or 0 for stream in streams)
    assert meta["topicLanes"] == sum(len(stream["topics"]) for stream in streams)
    assert meta["moments"] == sum(len(stream["moments"]) for stream in streams)


def load_public_payload() -> dict[str, Any]:
    prefix = "window.WWAM_POPULAR_LIVE = "
    source = OUTPUT_PATH.read_text(encoding="utf-8").strip()
    assert source.startswith(prefix), f"Unexpected assignment in {OUTPUT_PATH}"
    return json.loads(source[len(prefix):].removesuffix(";"))


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--refresh-ranking",
        action="store_true",
        help="Refresh metadata/view counts for every upload in the official Streams feed.",
    )
    parser.add_argument(
        "--refresh-captions",
        action="store_true",
        help="Refresh metadata and captions for the selected Popular 25.",
    )
    parser.add_argument(
        "--check",
        action="store_true",
        help="Validate the existing public artifact without network access or regeneration.",
    )
    parser.add_argument("--workers", type=int, default=8)
    args = parser.parse_args()

    fresh = fresh_ids()
    catalog = catalog_ids()
    excluded = fresh | catalog
    if args.check:
        payload = load_public_payload()
        archive_count = int(payload.get("selection", {}).get("officialFeedEntries") or 0)
        validate_payload(payload, excluded, archive_count)
        print(
            f"Validated {OUTPUT_PATH}: {payload['meta']['streams']} streams, "
            f"{payload['meta']['wordsAudited']:,} audited words, zero excluded-source collisions."
        )
        return 0

    archive = discover_archive()
    print(
        f"Official archive: {len(archive)} streams; excluding Fresh 10 plus "
        f"{len(catalog)} commentary sources and ranking by views.",
        flush=True,
    )
    selected, failures = rank_archive(
        archive,
        excluded,
        args.refresh_ranking,
        max(1, args.workers),
    )
    print("Popular 25 selection:", flush=True)
    for rank, seed in enumerate(selected, 1):
        info = seed["_metadata"]
        print(
            f"  {rank:>2}. {seed['id']}  {int(info.get('view_count') or 0):>8,}  "
            f"{info.get('upload_date')}  {info.get('title')}",
            flush=True,
        )

    extracted: dict[str, tuple[dict[str, Any], list[dict[str, Any]]]] = {}
    with concurrent.futures.ThreadPoolExecutor(max_workers=max(1, min(args.workers, 6))) as pool:
        futures = {
            pool.submit(extract_selected, seed, args.refresh_captions): seed
            for seed in selected
        }
        for future in concurrent.futures.as_completed(futures):
            seed = futures[future]
            try:
                extracted[seed["id"]] = future.result()
                info, lines = extracted[seed["id"]]
                print(
                    f"  captions {seed['id']}  {len(lines):>5} events  "
                    f"{sum(len(line['text'].split()) for line in lines):>7,} words",
                    flush=True,
                )
            except Exception as error:
                print(f"  {seed['id']} caption ERROR {error}", file=sys.stderr, flush=True)
                extracted[seed["id"]] = (seed["_metadata"], [])

    streams = [
        build_stream(seed, rank, *extracted[seed["id"]])
        for rank, seed in enumerate(selected, 1)
    ]
    normalize_indices(streams)
    topic_index = aggregate_topics(streams)
    character_index = aggregate_characters(streams)
    generated = date.today().isoformat()
    payload = {
        "generated": generated,
        "scope": (
            "The 25 most-viewed completed uploads in the official WWAM Streams "
            "archive after excluding the rolling Fresh 10 and every source already "
            "present in the commentary catalog."
        ),
        "method": (
            "Full official-feed view-count ranking followed by a complete available "
            "English-caption pass. Topic clustering, 30-chapter comedy heat and "
            "character references are source-linked; speaker identity is never inferred."
        ),
        "selection": {
            "ranking": "YouTube view_count descending",
            "snapshot": generated,
            "officialFeedEntries": len(archive),
            "excludedFresh10": sorted(fresh),
            "excludedCommentaryCatalog": sorted(catalog),
            "metadataUnavailable": failures,
        },
        "meta": {
            "streams": len(streams),
            "captioned": sum(stream["captioned"] for stream in streams),
            "uncaptioned": sum(not stream["captioned"] for stream in streams),
            "hours": round(sum(stream["duration"] or 0 for stream in streams) / 3600),
            "wordsAudited": sum(stream["wordsAudited"] for stream in streams),
            "viewsAtSnapshot": sum(stream["views"] or 0 for stream in streams),
            "topicLanes": sum(len(stream["topics"]) for stream in streams),
            "distinctTopics": len(topic_index),
            "moments": sum(len(stream["moments"]) for stream in streams),
            "characterSignals": sum(len(stream["characters"]) for stream in streams),
            "explicitPerformanceCues": sum(
                item["performanceCues"]
                for stream in streams
                for item in stream["characters"]
            ),
        },
        "streams": streams,
        "topicIndex": topic_index,
        "characterIndex": character_index,
    }
    validate_payload(payload, excluded, len(archive))
    OUTPUT_PATH.write_text(
        js_assignment("WWAM_POPULAR_LIVE", payload),
        encoding="utf-8",
    )
    print(json.dumps(payload["meta"], indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
