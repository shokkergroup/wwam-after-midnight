#!/usr/bin/env python3
"""Deep-distill the first frozen Archive Atlas "Distill Next" batch.

The selected sources are the exact top ten from Archive Atlas priority V1 at
the 2026-07-23 snapshot. Full YouTube JSON3 automatic-caption payloads stay in
the gitignored ``source-cache/captions`` directory. The public artifact contains
only aggregate measurements, timestamped navigation, and short receipts.

Trailer, script-reading, and watch-party sources are deliberately restricted to
topic navigation. Their public comedy, character, and excerpt surfaces remain
empty because automatic captions cannot separate host speech from trailer,
screenplay, or film audio.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
import unicodedata
import urllib.request
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
    parse_json3,
)
from wwam_popular_live_distill import (
    PUBLIC_REJECT,
    aggregate_characters,
    aggregate_topics,
    build_stream,
    normalize_indices,
)


ATLAS_PATH = PUBLIC / "archive-atlas-data.js"
OUTPUT_PATH = PUBLIC / "archive-deep-distill.js"
SCHEMA = "wwam-archive-deep-distill/v1"
SELECTION_DATE = "2026-07-23"
GENERATED_DATE = "2026-07-24"
CAPTION_OBSERVED_AT = "2026-07-24T05:23:33Z"
PRIORITY_VERSION = "archive-distill-priority/v1"
SOURCE_ATLAS_SHA256 = (
    "sha256:c9587ae64012aa3d9480b01cf25a571ed7d6ae9d5df57e3af17f39520a7d62a4"
)
PUBLIC_ASSIGNMENT = "WWAM_ARCHIVE_DEEP"
EXCERPT_WORD_LIMIT = 16
MAX_PUBLIC_BYTES = 125_000

# These values are frozen editorial provenance, not a live popularity table.
# The pipeline validates them against the original Atlas snapshot whenever that
# exact snapshot is present.
SELECTION: tuple[dict[str, Any], ...] = (
    {
        "id": "fpNtQMexZiw",
        "rank": 1,
        "score": 96.4,
        "breakdown": {"popularity": 49.2, "recency": 27.2, "franchise": 20},
        "signals": ["Scream"],
        "contentMode": "trailer-reaction",
        "rightsMode": "source-audio-boundary-unverified",
        "restricted": True,
    },
    {
        "id": "WKs1uPGMQvw",
        "rank": 2,
        "score": 96.1,
        "breakdown": {"popularity": 47.6, "recency": 28.5, "franchise": 20},
        "signals": ["Scream"],
        "contentMode": "spoiler-review",
        "rightsMode": "standard-caption-candidates",
        "restricted": False,
    },
    {
        "id": "vq6mrfqOgZw",
        "rank": 3,
        "score": 93.1,
        "breakdown": {"popularity": 46.7, "recency": 26.4, "franchise": 20},
        "signals": ["Halloween"],
        "contentMode": "movie-news",
        "rightsMode": "standard-caption-candidates",
        "restricted": False,
    },
    {
        "id": "M3P4mMDpXUc",
        "rank": 4,
        "score": 92.9,
        "breakdown": {"popularity": 44.9, "recency": 28.0, "franchise": 20},
        "signals": ["Scream"],
        "contentMode": "trailer-breakdown",
        "rightsMode": "source-audio-boundary-unverified",
        "restricted": True,
    },
    {
        "id": "1j3F9vAWBo4",
        "rank": 5,
        "score": 92.2,
        "breakdown": {"popularity": 45.2, "recency": 27.0, "franchise": 20},
        "signals": ["Halloween"],
        "contentMode": "visual-ranking-guest",
        "rightsMode": "visual-context-unverified",
        "restricted": False,
    },
    {
        "id": "3iMZcaVcvTU",
        "rank": 6,
        "score": 90.7,
        "breakdown": {"popularity": 43.5, "recency": 27.2, "franchise": 20},
        "signals": ["Halloween"],
        "contentMode": "movie-news",
        "rightsMode": "standard-caption-candidates",
        "restricted": False,
    },
    {
        "id": "gR_64RyPhEM",
        "rank": 7,
        "score": 90.6,
        "breakdown": {"popularity": 44.3, "recency": 26.3, "franchise": 20},
        "signals": ["Halloween"],
        "contentMode": "visual-ranking",
        "rightsMode": "visual-context-unverified",
        "restricted": False,
    },
    {
        "id": "5T1wWUjCGWk",
        "rank": 8,
        "score": 90.5,
        "breakdown": {"popularity": 43.3, "recency": 27.2, "franchise": 20},
        "signals": ["Halloween"],
        "contentMode": "script-reading",
        "rightsMode": "script-origin-boundary-unverified",
        "restricted": True,
    },
    {
        "id": "KrBhfGxsJNM",
        "rank": 9,
        "score": 90.1,
        "breakdown": {"popularity": 46.8, "recency": 23.3, "franchise": 20},
        "signals": ["Halloween"],
        "contentMode": "watch-party",
        "rightsMode": "film-audio-boundary-unverified",
        "restricted": True,
    },
    {
        "id": "hagePawEnC4",
        "rank": 10,
        "score": 89.9,
        "breakdown": {"popularity": 42.5, "recency": 27.4, "franchise": 20},
        "signals": ["Friday the 13th"],
        "contentMode": "visual-ranking",
        "rightsMode": "visual-context-unverified",
        "restricted": False,
    },
)

CLIENT_FALLBACKS: tuple[str | None, ...] = (
    None,
    "android_vr",
    "tv",
    "web_embedded",
    "web_safari",
)

ASSIGNMENT_RE = re.compile(r"^window\.([A-Z0-9_]+)\s*=\s*(.*);\s*$", re.S)


def stable_json(value: Any) -> str:
    def js_value(item: Any) -> Any:
        if isinstance(item, float) and item.is_integer():
            return int(item)
        if isinstance(item, list):
            return [js_value(child) for child in item]
        if isinstance(item, tuple):
            return [js_value(child) for child in item]
        if isinstance(item, dict):
            return {key: js_value(child) for key, child in item.items()}
        return item

    return json.dumps(
        js_value(value),
        ensure_ascii=False,
        sort_keys=True,
        separators=(",", ":"),
    )


def sha256_label(value: Any) -> str:
    return "sha256:" + hashlib.sha256(stable_json(value).encode("utf-8")).hexdigest()


def fnv1a32(value: str) -> str:
    current = 0x811C9DC5
    for byte in value.encode("utf-8"):
        current ^= byte
        current = (current * 0x01000193) & 0xFFFFFFFF
    return f"fnv1a32:{current:08x}"


def read_assignment(path: Path, expected: str) -> Any:
    match = ASSIGNMENT_RE.match(path.read_text(encoding="utf-8"))
    if not match or match.group(1) != expected:
        raise RuntimeError(f"{path.name} is not a window.{expected} assignment")
    return json.loads(match.group(2))


def atlas_records() -> tuple[dict[str, Any], dict[str, dict[str, Any]]]:
    payload = read_assignment(ATLAS_PATH, "WWAM_ARCHIVE_ATLAS")
    records = {item["id"]: item for item in payload["records"]}
    return payload, records


def normalized(value: Any) -> str:
    text = unicodedata.normalize("NFKD", str(value or "").lower())
    text = "".join(character for character in text if not unicodedata.combining(character))
    return re.sub(r"[^a-z0-9]+", " ", text).strip()


def contains_phrase(haystack: str, phrase: str) -> bool:
    return f" {haystack} ".find(f" {phrase} ") >= 0


def expected_queue(payload: dict[str, Any]) -> list[dict[str, Any]]:
    """Reproduce priority V1 only for frozen-snapshot validation."""
    groups = (
        ("Scream", "core", ("scream", "ghostface", "sidney prescott", "woodsboro")),
        (
            "Halloween",
            "core",
            ("halloween", "michael myers", "myers", "dr loomis", "doctor loomis", "loomis"),
        ),
        (
            "Friday the 13th",
            "core",
            ("friday the 13th", "friday 13th", "jason voorhees", "voorhees", "crystal lake", "jason"),
        ),
        (
            "A Nightmare on Elm Street",
            "core",
            ("a nightmare on elm street", "nightmare on elm street", "elm street", "freddy krueger", "freddy"),
        ),
        (
            "Adjacent horror",
            "adjacent",
            (
                "chucky", "child s play", "childs play", "alien", "aliens", "xenomorph",
                "predator", "yautja", "the conjuring", "conjuring", "annabelle",
                "the nun", "terrifier", "art the clown", "evil dead", "ash williams",
                "hellraiser", "pinhead", "texas chainsaw", "leatherface", "the exorcist",
                "exorcist", "saw", "jigsaw",
            ),
        ),
        (
            "Horror / Slashers",
            "broad",
            ("horror", "slasher", "slashers", "scary movie", "monster"),
        ),
    )
    eligible = [item for item in payload["records"] if item["coverage"] == "metadata-only"]
    max_views = max([item["views"] for item in eligible] + [1])
    snapshot = date.fromisoformat(payload["snapshotDate"])
    oldest = min(date.fromisoformat(item["date"]) for item in eligible)
    max_age = max(1, (snapshot - oldest).days)
    output = []
    for record in eligible:
        title = normalized(record["title"])
        matches = [
            (label, tier)
            for label, tier, aliases in groups
            if any(contains_phrase(title, normalized(alias)) for alias in aliases)
        ]
        tiers = {item[1] for item in matches}
        franchise = 20 if "core" in tiers else 14 if "adjacent" in tiers else 6 if "broad" in tiers else 0
        popularity = round(50 * __import__("math").log1p(record["views"]) / __import__("math").log1p(max_views), 1)
        age = max(0, (snapshot - date.fromisoformat(record["date"])).days)
        recency = round(30 * max(0, 1 - age / max_age), 1)
        output.append(
            {
                "id": record["id"],
                "score": round(popularity + recency + franchise, 1),
                "breakdown": {
                    "popularity": popularity,
                    "recency": recency,
                    "franchise": franchise,
                },
            }
        )
    output.sort(
        key=lambda item: (
            -item["score"],
            -next(row["views"] for row in eligible if row["id"] == item["id"]),
            -date.fromisoformat(
                next(row["date"] for row in eligible if row["id"] == item["id"])
            ).toordinal(),
            item["id"],
        )
    )
    return output


def validate_selection(payload: dict[str, Any], records: dict[str, dict[str, Any]]) -> None:
    if payload["snapshotDate"] != SELECTION_DATE:
        raise RuntimeError("Archive Atlas selection date changed")
    missing = [item["id"] for item in SELECTION if item["id"] not in records]
    if missing:
        raise RuntimeError(f"Selected Atlas records are missing: {missing}")
    if payload["fingerprints"]["archiveSha256"] == SOURCE_ATLAS_SHA256:
        queue = expected_queue(payload)[: len(SELECTION)]
        for expected, actual in zip(SELECTION, queue, strict=True):
            if (
                expected["id"] != actual["id"]
                or expected["score"] != actual["score"]
                or expected["breakdown"] != actual["breakdown"]
            ):
                raise RuntimeError(
                    f"Frozen Atlas priority mismatch for #{expected['rank']}: "
                    f"{expected['id']} != {actual}"
                )


def caption_path(video_id: str) -> Path:
    return CACHE / "captions" / f"{video_id}.json"


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


def fetch_caption(video_id: str) -> dict[str, Any]:
    errors = []
    for player_client in CLIENT_FALLBACKS:
        options: dict[str, Any] = {
            "quiet": True,
            "no_warnings": True,
            "skip_download": True,
            "extract_flat": False,
            "ignore_no_formats_error": True,
            "socket_timeout": 45,
            "retries": 2,
        }
        if player_client:
            options["extractor_args"] = {
                "youtube": {"player_client": [player_client]}
            }
        try:
            with YoutubeDL(options) as ydl:
                info = ydl.extract_info(
                    f"https://www.youtube.com/watch?v={video_id}",
                    download=False,
                )
            caption_url = choose_caption_url(info)
            if not caption_url:
                raise RuntimeError("no English JSON3 caption track")
            payload = fetch_json(caption_url)
            if len(parse_json3(payload)) < 50:
                raise RuntimeError("caption track is unexpectedly sparse")
            path = caption_path(video_id)
            path.parent.mkdir(parents=True, exist_ok=True)
            temporary = path.with_suffix(".json.tmp")
            temporary.write_text(
                json.dumps(payload, ensure_ascii=False),
                encoding="utf-8",
            )
            temporary.replace(path)
            return {
                "client": player_client or "default",
                "availability": info.get("availability"),
                "liveStatus": info.get("live_status"),
                "ageLimit": info.get("age_limit"),
            }
        except Exception as error:
            errors.append(f"{player_client or 'default'}: {error}")
    raise RuntimeError(f"{video_id} caption retrieval failed: {' | '.join(errors)}")


def words(value: Any) -> int:
    return len(clean_text(str(value or "")).split())


def public_excerpt(value: Any, *, restricted: bool) -> str | None:
    text = clean_text(str(value or ""))
    if (
        restricted
        or not text
        or DISALLOWED_EXCERPT.search(text)
        or PUBLIC_REJECT.search(text)
    ):
        return None
    tokens = text.split()
    return " ".join(tokens[:EXCERPT_WORD_LIMIT])


def caption_fingerprint(payload: dict[str, Any]) -> str:
    return sha256_label(payload)


def evidence(
    *,
    excerpt_status: str,
) -> dict[str, Any]:
    return {
        "type": "youtube-automatic-caption",
        "timestampStatus": "caption-event",
        "excerptStatus": excerpt_status,
        "speakerStatus": "not-diarized",
        "originStatus": "not-inferred",
        "visualContextVerified": False,
        "reviewStatus": "machine-candidate",
    }


def restrict_stream(stream: dict[str, Any], selected: dict[str, Any]) -> None:
    restricted = bool(selected["restricted"])
    for topic in stream["topics"]:
        topic["receipt"] = public_excerpt(topic.get("receipt"), restricted=restricted)
        topic["evidence"] = evidence(
            excerpt_status=(
                "withheld-source-boundary"
                if restricted
                else "short-caption-fragment"
            ),
        )
    if restricted:
        stream["moments"] = []
        stream["characters"] = []
        stream["heatmap"] = []
        stream["peak"] = None
        stream["indices"] = {
            key: None
            for key in (
                "comedyVoltage",
                "takePressure",
                "roomBreakRisk",
                "loreDensity",
                "topicRange",
                "chaosIndex",
            )
        }
        stream["indicesUnavailableReason"] = (
            "Source-audio boundary cannot be established from automatic captions."
        )
        stream["editorial"]["whyItMatters"] = (
            f"Selected #{selected['rank']} by the frozen Archive Atlas metadata "
            "priority. Automatic captions support timestamped topic navigation, "
            "but public comedy, character and excerpt candidates are withheld "
            f"under {selected['rightsMode']}."
        )
        stream["editorial"]["bestEntry"] = None
        stream["editorial"]["signature"] = "TOPIC NAVIGATION × SOURCE BOUNDARY HELD"
        stream["editorial"]["basis"][-2:] = [
            f"{len(stream['topics'])} caption-backed topic lanes",
            "public joke/character candidates withheld",
        ]
        return

    moments = []
    for moment in stream["moments"]:
        excerpt = public_excerpt(moment.get("quote"), restricted=False)
        if not excerpt:
            continue
        moments.append(
            {
                "t": moment["t"],
                "excerpt": excerpt,
                "category": moment["category"],
                "heat": moment["heat"],
                "evidence": evidence(
                    excerpt_status="short-caption-fragment",
                ),
            }
        )
    stream["moments"] = moments
    for character in stream["characters"]:
        character["receipt"] = public_excerpt(
            character.get("receipt"),
            restricted=False,
        )
        character["evidence"] = evidence(
            excerpt_status=(
                "short-caption-fragment"
                if character["receipt"]
                else "withheld-public-safety-filter"
            ),
        )


def build_payload() -> dict[str, Any]:
    atlas, records = atlas_records()
    validate_selection(atlas, records)
    streams = []
    caption_hashes: dict[str, str] = {}

    for selected in SELECTION:
        video_id = selected["id"]
        path = caption_path(video_id)
        if not path.exists():
            raise RuntimeError(
                f"Missing private caption cache for {video_id}; "
                "rerun with --refresh-captions"
            )
        caption_payload = json.loads(path.read_text(encoding="utf-8"))
        lines = parse_json3(caption_payload)
        if len(lines) < 50:
            raise RuntimeError(f"{video_id} has only {len(lines)} usable caption events")
        record = records[video_id]
        info = {
            "title": record["title"],
            "upload_date": record["date"].replace("-", ""),
            "duration": record["duration"],
            "view_count": record["views"],
            "age_limit": 0,
            "availability": "public",
            "live_status": "was_live",
            "observed_at": CAPTION_OBSERVED_AT,
        }
        seed = {
            "id": video_id,
            "title": record["title"],
            "url": record["url"],
        }
        stream = build_stream(seed, selected["rank"], info, lines)
        caption_hashes[video_id] = caption_fingerprint(caption_payload)
        last = max(
            (line["start"] + line["duration"] for line in lines),
            default=0,
        )
        stream["archivePriority"] = {
            "version": PRIORITY_VERSION,
            "originalRank": selected["rank"],
            "score": selected["score"],
            "breakdown": selected["breakdown"],
            "signals": selected["signals"],
            "basis": "cached title/date/views only",
        }
        stream["contentMode"] = selected["contentMode"]
        stream["rightsPolicy"] = {
            "mode": selected["rightsMode"],
            "restrictedToTopicNavigation": selected["restricted"],
            "publicExcerptWordLimit": EXCERPT_WORD_LIMIT,
            "speakerClaimsAllowed": False,
            "originClaimsAllowed": False,
            "visualClaimsAllowed": False,
        }
        stream["captionEvidence"] = {
            "track": "English YouTube automatic captions (JSON3)",
            "observedAt": CAPTION_OBSERVED_AT,
            "eventsAudited": len(lines),
            "spanSeconds": round(last, 1),
            "durationCoveragePercent": round(
                min(100, 100 * last / max(1, record["duration"])),
                2,
            ),
            "payloadSha256": caption_hashes[video_id],
            "fullPayloadPublic": False,
            "speakerDiarized": False,
            "originAttribution": False,
        }
        streams.append(stream)

    # The popular-live normalizer is reused before restricted sources have
    # unsafe comparative indices blanked out.
    normalize_indices(streams)
    for stream, selected in zip(streams, SELECTION, strict=True):
        restrict_stream(stream, selected)
        stream["summary"] = stream["editorial"]["whyItMatters"]

    topic_index = aggregate_topics(streams)
    character_index = aggregate_characters(streams)
    selection_records = [
        {
            "id": selected["id"],
            "originalRank": selected["rank"],
            "priorityScore": selected["score"],
            "breakdown": selected["breakdown"],
            "snapshotViews": records[selected["id"]]["views"],
        }
        for selected in SELECTION
    ]
    payload: dict[str, Any] = {
        "schema": SCHEMA,
        "generated": GENERATED_DATE,
        "observedAt": CAPTION_OBSERVED_AT,
        "scope": (
            "The exact first ten metadata-only sources from Archive Atlas "
            "Distill Priority V1 at the 2026-07-23 snapshot."
        ),
        "method": (
            "Complete available English automatic-caption pass using the proven "
            "livestream topic, signal and character-cue analyzers. Full captions "
            "stay private; no speaker, performer, quote origin or visual identity "
            "is inferred."
        ),
        "selection": {
            "priorityVersion": PRIORITY_VERSION,
            "atlasSnapshotDate": SELECTION_DATE,
            "sourceAtlasArchiveSha256": SOURCE_ATLAS_SHA256,
            "frozen": True,
            "records": selection_records,
        },
        "evidencePolicy": {
            "privateInput": "full YouTube JSON3 automatic captions",
            "publicInput": "aggregate measurements and short timestamped receipts",
            "publicExcerptWordLimit": EXCERPT_WORD_LIMIT,
            "speakerDiarized": False,
            "originAttribution": False,
            "visualContextVerified": False,
            "restrictedModes": [
                "trailer-reaction",
                "trailer-breakdown",
                "script-reading",
                "watch-party",
            ],
            "restrictedSurface": (
                "Topic names, counts and timestamps only; excerpt, comedy, "
                "character and heat surfaces withheld."
            ),
        },
        "meta": {
            "streams": len(streams),
            "captioned": sum(stream["captioned"] for stream in streams),
            "restricted": sum(
                stream["rightsPolicy"]["restrictedToTopicNavigation"]
                for stream in streams
            ),
            "hours": round(
                sum(stream["duration"] or 0 for stream in streams) / 3600,
                1,
            ),
            "wordsAudited": sum(stream["wordsAudited"] for stream in streams),
            "captionEvents": sum(
                stream["captionEvidence"]["eventsAudited"] for stream in streams
            ),
            "topicLanes": sum(len(stream["topics"]) for stream in streams),
            "distinctTopics": len(topic_index),
            "publicMomentCandidates": sum(len(stream["moments"]) for stream in streams),
            "characterSignals": sum(len(stream["characters"]) for stream in streams),
            "snapshotViews": sum(stream["views"] or 0 for stream in streams),
        },
        "streams": streams,
        "topicIndex": topic_index,
        "characterIndex": character_index,
        "fingerprints": {
            "selectionSha256": sha256_label(selection_records),
            "captionSetSha256": sha256_label(caption_hashes),
        },
    }
    payload["fingerprints"]["publicFnv1a"] = fnv1a32(stable_json(payload["streams"]))
    validate_payload(payload)
    return payload


def iter_public_excerpts(payload: dict[str, Any]):
    for stream in payload["streams"]:
        for topic in stream["topics"]:
            if topic.get("receipt"):
                yield topic["receipt"]
        for moment in stream["moments"]:
            if moment.get("excerpt"):
                yield moment["excerpt"]
        for character in stream["characters"]:
            if character.get("receipt"):
                yield character["receipt"]


def validate_payload(payload: dict[str, Any]) -> None:
    streams = payload["streams"]
    assert payload["schema"] == SCHEMA
    assert len(streams) == len(SELECTION) == 10
    assert [stream["id"] for stream in streams] == [item["id"] for item in SELECTION]
    assert len({stream["id"] for stream in streams}) == len(streams)
    assert all(stream["captioned"] for stream in streams)
    assert all(
        stream["captionEvidence"]["durationCoveragePercent"] >= 99.8
        for stream in streams
    )
    assert all(
        stream["captionEvidence"]["speakerDiarized"] is False
        and stream["captionEvidence"]["originAttribution"] is False
        for stream in streams
    )
    assert all(words(excerpt) <= EXCERPT_WORD_LIMIT for excerpt in iter_public_excerpts(payload))
    assert all(
        not DISALLOWED_EXCERPT.search(excerpt)
        and not PUBLIC_REJECT.search(excerpt)
        for excerpt in iter_public_excerpts(payload)
    )
    for stream in streams:
        restricted = stream["rightsPolicy"]["restrictedToTopicNavigation"]
        if restricted:
            assert not stream["moments"]
            assert not stream["characters"]
            assert not stream["heatmap"]
            assert all(topic["receipt"] is None for topic in stream["topics"])
        else:
            assert len(stream["heatmap"]) == 30
            assert stream["moments"]
        assert len(stream["topics"]) == 10
        assert stream["rightsPolicy"]["speakerClaimsAllowed"] is False
        assert stream["rightsPolicy"]["originClaimsAllowed"] is False
    meta = payload["meta"]
    assert meta["streams"] == len(streams)
    assert meta["captioned"] == len(streams)
    assert meta["restricted"] == 4
    assert meta["wordsAudited"] == sum(stream["wordsAudited"] for stream in streams)
    assert meta["captionEvents"] == sum(
        stream["captionEvidence"]["eventsAudited"] for stream in streams
    )
    assert payload["fingerprints"]["publicFnv1a"] == fnv1a32(stable_json(streams))


def render(payload: dict[str, Any]) -> str:
    return (
        f"window.{PUBLIC_ASSIGNMENT} = "
        + json.dumps(payload, ensure_ascii=False, separators=(",", ":"))
        + ";\n"
    )


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--refresh-captions",
        action="store_true",
        help=(
            "Refresh the ten private JSON3 caption caches. The normal extractor "
            "is tried first, followed by explicit YouTube client fallbacks."
        ),
    )
    parser.add_argument(
        "--check",
        action="store_true",
        help="Rebuild offline and require a byte-identical checked-in artifact.",
    )
    args = parser.parse_args()

    if args.refresh_captions:
        for index, selected in enumerate(SELECTION, 1):
            result = fetch_caption(selected["id"])
            print(
                f"  {index:>2}/10 {selected['id']} "
                f"captions via {result['client']}",
                flush=True,
            )

    payload = build_payload()
    source = render(payload)
    public_bytes = len(source.encode("utf-8"))
    if public_bytes >= MAX_PUBLIC_BYTES:
        raise RuntimeError(
            f"Public archive distill is {public_bytes:,} bytes; "
            f"limit is {MAX_PUBLIC_BYTES:,}"
        )

    if args.check:
        if not OUTPUT_PATH.exists():
            raise RuntimeError(f"Missing generated artifact: {OUTPUT_PATH}")
        existing = OUTPUT_PATH.read_text(encoding="utf-8")
        if existing != source:
            raise RuntimeError(
                "Archive deep distill is stale; run "
                "pipeline/wwam_archive_deep_distill.py"
            )
        print(
            f"Validated {OUTPUT_PATH.name}: {payload['meta']['streams']} streams, "
            f"{payload['meta']['wordsAudited']:,} words, "
            f"{public_bytes:,} public bytes."
        )
        return 0

    OUTPUT_PATH.write_text(source, encoding="utf-8")
    print(
        f"Wrote {OUTPUT_PATH}: {payload['meta']['streams']} streams, "
        f"{public_bytes:,} bytes."
    )
    print(json.dumps(payload["meta"], indent=2))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as error:
        print(f"ERROR: {error}", file=sys.stderr)
        raise
