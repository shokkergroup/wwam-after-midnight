#!/usr/bin/env python3
"""Distill the ten newest WWAM livestreams into topics and comedy heat.

Full auto-caption payloads stay in the gitignored source-cache. The public
artifact contains only derived measurements and short, timestamped fragments
that always return to the original YouTube upload.
"""

from __future__ import annotations

import argparse
import concurrent.futures
import json
import math
import re
import statistics
import sys
from collections import Counter, defaultdict
from typing import Any

from yt_dlp import YoutubeDL

from wwam_deep_distill import (
    DISALLOWED_EXCERPT,
    PUBLIC,
    clean_text,
    extract_one,
    js_assignment,
)


STREAMS_URL = "https://www.youtube.com/@WeWatchedAMovie/streams"

TOPIC_RULES = {
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
    "Predator": [r"\bpredator\b", r"\bprey\b", r"\byautja\b"],
    "Chucky": [r"\bchucky\b", r"\bchild'?s play\b"],
    "Texas Chainsaw": [r"\btexas chainsaw\b", r"\bleatherface\b"],
    "Hellraiser": [r"\bhellraiser\b", r"\bpinhead\b"],
    "The Exorcist": [r"\bexorcist\b", r"\bregan\b"],
    "The Shining": [r"\bthe shining\b", r"\boverlook hotel\b"],
    "Universal Monsters": [r"\buniversal monsters?\b", r"\bwolf man\b", r"\bdracula\b", r"\bfrankenstein\b"],
    "Stranger Things": [r"\bstranger things\b", r"\bvecna\b"],
    "The Walking Dead": [r"\bwalking dead\b", r"\brick grimes\b", r"\bnegan\b"],
    "Superman": [r"\bsuperman\b", r"\bclark kent\b", r"\bjames gunn\b"],
    "Batman": [r"\bbatman\b", r"\bbruce wayne\b", r"\bjoker\b"],
    "Marvel": [r"\bmarvel\b", r"\bavengers\b", r"\bspider-?man\b", r"\bfantastic four\b"],
    "DC": [r"\bdc universe\b", r"\bdceu\b", r"\bdc movies?\b"],
    "Star Wars": [r"\bstar wars\b", r"\bdarth vader\b", r"\bmandalorian\b"],
    "Ghostbusters": [r"\bghostbusters\b"],
    "Jurassic": [r"\bjurassic\b", r"\bdinosaur\b"],
    "Godzilla / Kong": [r"\bgodzilla\b", r"\bking kong\b", r"\bmonsterverse\b"],
    "Mortal Kombat": [r"\bmortal kombat\b"],
    "Box Office": [r"\bbox office\b", r"\bopening weekend\b", r"\bdomestic gross\b"],
    "Trailers": [r"\btrailer\b", r"\bteaser\b"],
    "Streaming": [r"\bnetflix\b", r"\bhbo max\b", r"\bparamount plus\b", r"\bpeacock\b"],
    "Horror Rankings": [r"\btier list\b", r"\brank(?:ed|ing)\b", r"\bbracket\b"],
    "Retro Rewind": [r"\bretro rewind\b", r"\bvideo store\b"],
}

FUNNY_RULES = {
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

PUBLIC_REJECT = re.compile(
    r"\b(?:racist|nazi|transgender|conservative|liberal|politician|prison suck)\b",
    re.I,
)


def discover_streams() -> list[dict[str, Any]]:
    options = {
        "quiet": True,
        "no_warnings": True,
        "extract_flat": True,
        "playlistend": 10,
        "skip_download": True,
    }
    with YoutubeDL(options) as ydl:
        info = ydl.extract_info(STREAMS_URL, download=False)
    entries = list(info.get("entries") or [])[:10]
    if len(entries) != 10:
        raise RuntimeError(f"Expected 10 recent livestreams, found {len(entries)}")
    return [
        {
            "id": entry["id"],
            "url": f"https://www.youtube.com/watch?v={entry['id']}",
            "franchise": "Livestream",
            "film": entry.get("title") or "WWAM Livestream",
            "order": index + 1,
        }
        for index, entry in enumerate(entries)
    ]


def clip_words(text: str, limit: int) -> str:
    words = clean_text(text).split()
    if len(words) <= limit:
        return " ".join(words)
    return " ".join(words[:limit]) + " …"


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


def joined_window(lines: list[dict[str, Any]], index: int) -> str:
    group = [lines[index]]
    for nxt in lines[index + 1 : index + 4]:
        if nxt["start"] - group[-1]["start"] > 9:
            break
        group.append(nxt)
        if len(" ".join(item["text"] for item in group).split()) >= 18:
            break
    return clean_text(" ".join(item["text"] for item in group))


def funny_moments(lines: list[dict[str, Any]]) -> list[dict[str, Any]]:
    candidates = []
    for index, line in enumerate(lines):
        text = joined_window(lines, index)
        if len(text.split()) < 5 or DISALLOWED_EXCERPT.search(text) or PUBLIC_REJECT.search(text):
            continue
        category, raw, _ = funny_signal(text)
        if raw < 6:
            continue
        candidates.append(
            {
                "t": round(line["start"]),
                "quote": clip_words(text, 16),
                "category": category,
                "raw": raw,
            }
        )
    candidates.sort(key=lambda item: (-item["raw"], item["t"]))
    chosen = []
    category_counts: Counter[str] = Counter()
    for candidate in candidates:
        if any(abs(candidate["t"] - item["t"]) < 150 for item in chosen):
            continue
        if category_counts[candidate["category"]] >= 3:
            continue
        category_counts[candidate["category"]] += 1
        chosen.append(candidate)
        if len(chosen) >= 7:
            break
    if not chosen:
        return []
    raw_values = sorted(item["raw"] for item in chosen)
    low, high = raw_values[0], raw_values[-1]
    for item in chosen:
        item["heat"] = round(72 + 27 * ((item.pop("raw") - low) / max(1, high - low)))
    return chosen


def build_topics(lines: list[dict[str, Any]]) -> list[dict[str, Any]]:
    occurrences: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for index, line in enumerate(lines):
        found = topic_hits(line["text"])
        if not found:
            continue
        window = joined_window(lines, index)
        for topic in found:
            occurrences[topic].append({"t": round(line["start"]), "text": window})

    topics = []
    for topic, entries in occurrences.items():
        if len(entries) < 2:
            continue
        peak = max(
            entries,
            key=lambda entry: sum(abs(entry["t"] - other["t"]) <= 240 for other in entries),
        )
        cluster = sum(abs(peak["t"] - other["t"]) <= 240 for other in entries)
        topics.append(
            {
                "name": topic,
                "mentions": len(entries),
                "first": entries[0]["t"],
                "peak": peak["t"],
                "cluster": cluster,
                "receipt": clip_words(peak["text"], 11),
            }
        )
    topics.sort(key=lambda item: (-item["cluster"], -item["mentions"], item["first"]))
    return topics[:8]


def build_heatmap(
    lines: list[dict[str, Any]],
    duration: int | float | None,
    topics: list[dict[str, Any]],
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


def stream_summary(
    info: dict[str, Any],
    topics: list[dict[str, Any]],
    moments: list[dict[str, Any]],
) -> str:
    topic_names = [item["name"] for item in topics[:3]]
    if topic_names:
        subject = ", ".join(topic_names[:-1]) + (
            " and " + topic_names[-1] if len(topic_names) > 1 else topic_names[0]
        )
    else:
        subject = "movie news, chat detours and live-show damage"
    if moments:
        peak = max(moments, key=lambda item: item["heat"])
        closer = f"The comedy alarm peaks at {format_time(peak['t'])} with a {peak['category'].lower()} signal."
    else:
        closer = "The caption track is searchable by topic and exact second."
    return f"A live-room map led by {subject}. {closer}"


def format_time(seconds: int) -> str:
    hours, remainder = divmod(max(0, seconds), 3600)
    minutes, secs = divmod(remainder, 60)
    return f"{hours}:{minutes:02d}:{secs:02d}" if hours else f"{minutes}:{secs:02d}"


def build_stream(
    seed: dict[str, Any],
    info: dict[str, Any],
    lines: list[dict[str, Any]],
) -> dict[str, Any]:
    upload_date = info.get("upload_date")
    date = (
        f"{upload_date[:4]}-{upload_date[4:6]}-{upload_date[6:]}"
        if upload_date
        else None
    )
    topics = build_topics(lines)
    moments = funny_moments(lines)
    heatmap = build_heatmap(lines, info.get("duration"), topics)
    peak_bin = max(heatmap, key=lambda item: item["heat"]) if heatmap else None
    return {
        "id": seed["id"],
        "title": info.get("title") or seed["film"],
        "date": date,
        "duration": info.get("duration"),
        "views": info.get("view_count"),
        "thumbnail": f"https://i.ytimg.com/vi/{seed['id']}/maxresdefault.jpg",
        "url": seed["url"],
        "captioned": bool(lines),
        "wordsAudited": sum(len(line["text"].split()) for line in lines),
        "summary": stream_summary(info, topics, moments),
        "topics": topics,
        "moments": moments,
        "heatmap": heatmap,
        "peak": peak_bin,
    }


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
                    "date": stream["date"],
                    "peak": topic["peak"],
                    "mentions": topic["mentions"],
                }
            )
    output = list(grouped.values())
    output.sort(key=lambda item: (-len(item["streams"]), -item["mentions"], item["name"]))
    return output


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--refresh", action="store_true")
    parser.add_argument("--workers", type=int, default=4)
    args = parser.parse_args()

    seeds = discover_streams()
    print("Newest livestream canon:", flush=True)
    for seed in seeds:
        print(f"  {seed['id']}  {seed['film']}", flush=True)

    extracted: dict[str, tuple[dict[str, Any], list[dict[str, Any]]]] = {}
    with concurrent.futures.ThreadPoolExecutor(max_workers=max(1, args.workers)) as pool:
        futures = {
            pool.submit(extract_one, seed, args.refresh): seed
            for seed in seeds
        }
        for future in concurrent.futures.as_completed(futures):
            seed = futures[future]
            try:
                extracted[seed["id"]] = future.result()
                info, lines = extracted[seed["id"]]
                print(
                    f"  {seed['id']}  {len(lines):5d} events  {info.get('upload_date')}  {info.get('title')}",
                    flush=True,
                )
            except Exception as error:
                print(f"  {seed['id']} ERROR {error}", file=sys.stderr, flush=True)
                extracted[seed["id"]] = ({}, [])

    streams = [
        build_stream(seed, *extracted[seed["id"]])
        for seed in seeds
    ]
    topic_index = aggregate_topics(streams)
    payload = {
        "generated": "2026-07-23",
        "scope": "The ten newest completed uploads on the official WWAM YouTube Streams feed.",
        "method": "Full available auto-caption pass with topic clustering and comedy-signal heat scoring. Short excerpts remain source-linked.",
        "meta": {
            "streams": len(streams),
            "captioned": sum(stream["captioned"] for stream in streams),
            "hours": round(sum(stream["duration"] or 0 for stream in streams) / 3600),
            "wordsAudited": sum(stream["wordsAudited"] for stream in streams),
            "topics": len(topic_index),
            "moments": sum(len(stream["moments"]) for stream in streams),
        },
        "streams": streams,
        "topicIndex": topic_index,
    }
    (PUBLIC / "livestream-distill.js").write_text(
        js_assignment("WWAM_LIVESTREAMS", payload),
        encoding="utf-8",
    )
    print(json.dumps(payload["meta"], indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
