#!/usr/bin/env python3
"""Recover every source that was held when the completion manifest was frozen.

The private cache keeps full YouTube JSON3 captions. The public artifact keeps
only aggregate measurements and short, source-local, bounded receipts. It
never assigns a speaker or promotes a machine-selected moment.
"""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable

import wwam_archive_deep_batch2 as archive_policy
import wwam_archive_deep_distill as deep
import wwam_archive_recovery_batch1 as recovery1
import wwam_archive_recovery_batch2 as recovery2
from wwam_deep_distill import DISALLOWED_EXCERPT, PUBLIC, parse_json3
from wwam_popular_live_distill import (
    PUBLIC_REJECT,
    TOPIC_RULES,
    aggregate_characters,
    aggregate_topics,
    build_stream,
    clip_around,
    joined_window,
    normalize_indices,
)


ROOT = Path(__file__).resolve().parents[1]
MANIFEST_PATH = Path(__file__).with_name(
    "wwam_archive_completion_manifest.json"
)
OUTPUT_PATH = PUBLIC / "archive-completion.js"
RETRY_PATH = ROOT / "work" / "archive-completion-retry.json"
PUBLIC_ASSIGNMENT = "WWAM_ARCHIVE_COMPLETION"
SCHEMA = "shokker-youtube-wiki/archive-completion/v1"
MANIFEST_SCHEMA = "shokker-youtube-wiki/archive-completion-manifest/v1"
LANE_ID = "archive-completion"
GENERATED_DATE = "2026-07-29"
MIN_EVENTS = 50
MIN_SPAN_PERCENT = 80.0
EXCERPT_WORD_LIMIT = 16
MAX_PUBLIC_BYTES = 6_500_000

EXACT_SOURCE_HOLDS: dict[str, dict[str, Any]] = {
    "AzrcgoyE7C4": {
        "exactSourceTranscriptState": "held-age-gated",
        "exactSourceHoldReason": (
            "The official YouTube upload exposes no public caption track and "
            "requires age-authenticated media access. No authenticated browser "
            "session or cookies were used."
        ),
        "alternateOfficialSource": {
            "kind": "official-podcast-edition",
            "title": "Rob Zombies H2 Commentary",
            "description": "Rob Zombies H2 Live Commentary",
            "episodeUrl": (
                "https://podcasters.spotify.com/pod/show/wewatchedamovie/"
                "episodes/Rob-Zombies-H2-Commentary-ehti0c"
            ),
            "enclosureUrl": "https://traffic.megaphone.fm/APO8004693726.mp3",
            "published": "2018-10-08T23:49:00Z",
            "duration": 7352.61,
            "canonicalYouTubeDuration": 7247,
            "durationDelta": 105.61,
            "timestampIsomorphic": False,
            "publicPlaybackAllowed": True,
            "evidenceBoundary": (
                "Official WWAM podcast edition; not substituted for YouTube "
                "timestamps."
            ),
        },
    },
}

SOURCE_AUDIO = re.compile(
    r"\b(?:commentary|watchalong|watch\s+along|watch\s+party|"
    r"trailer(?:\s+reaction|\s+breakdown)?|spot\s+breakdown|"
    r"let(?:'|’)?s\s+watch|scary\s+videos|script\s+reading)\b",
    re.I,
)
VISUAL_RESULT = re.compile(
    r"\b(?:rank(?:ed|ing|s)?|tier\s+list|top\s+\d+|you\s+decide|"
    r"versus|vs\.?|fight|royal\s+rumble|bracket|box\s+office)\b",
    re.I,
)


def utc_now() -> str:
    return (
        datetime.now(timezone.utc)
        .replace(microsecond=0)
        .isoformat()
        .replace("+00:00", "Z")
    )


def classify(title: str) -> tuple[str, str, bool]:
    normalized = title.lower()
    if SOURCE_AUDIO.search(title):
        if "commentary" in normalized or "watchalong" in normalized:
            mode = "movie-commentary"
        elif "scary video" in normalized or "let's watch" in normalized:
            mode = "source-video-watch-party"
        else:
            mode = "trailer-reaction"
        return mode, "source-audio-boundary-unverified", True
    if VISUAL_RESULT.search(title):
        return "ranking-show", "visual-result-unverified", False
    if "spoiler" in normalized:
        return "spoiler-review", "standard-caption-candidates", False
    if "review" in normalized:
        return "review-show", "standard-caption-candidates", False
    if re.search(r"\bq\s*&\s*a\b|\bquestions?\b", normalized):
        return "q-and-a", "standard-caption-candidates", False
    if "news" in normalized or "update" in normalized:
        return "movie-news", "standard-caption-candidates", False
    return "livestream", "standard-caption-candidates", False


def transcript_provenance(payload: dict[str, Any]) -> dict[str, Any]:
    local = payload.get("_shokkerProvenance")
    if isinstance(local, dict) and local.get("kind") == "local-speech-to-text":
        audio_source_kind = str(
            local.get("audioSourceKind") or "canonical-youtube-media"
        )
        if audio_source_kind == "duration-isomorphic-official-source":
            track = (
                "English local speech-to-text transcript from the "
                "duration-isomorphic official WWAM podcast edition"
            )
        else:
            track = (
                "English local speech-to-text transcript from exact public "
                "YouTube audio"
            )
        return {
            "kind": "local-speech-to-text",
            "track": track,
            "eventType": "local-asr-segment",
            "engine": str(local.get("engine") or "faster-whisper"),
            "model": str(local.get("model") or ""),
            "audioSourceKind": audio_source_kind,
            "canonicalTimestampMapping": bool(
                local.get("canonicalTimestampMapping", False)
            ),
        }
    return {
        "kind": "youtube-automatic-caption",
        "track": "English YouTube automatic captions (JSON3)",
        "eventType": "caption-event",
        "engine": "youtube",
        "model": "",
    }


def apply_transcript_provenance(
    stream: dict[str, Any],
    provenance: dict[str, Any],
) -> None:
    for collection in ("topics", "moments", "characters"):
        for item in stream.get(collection) or []:
            evidence = item.get("evidence")
            if not isinstance(evidence, dict):
                continue
            evidence["type"] = provenance["kind"]
            evidence["timestampStatus"] = provenance["eventType"]
    if (
        provenance["kind"] == "local-speech-to-text"
        and stream.get("rightsPolicy", {}).get("restrictedToTopicNavigation")
    ):
        stream["indicesUnavailableReason"] = (
            "Source-audio boundary cannot be established from the mixed "
            "local transcript."
        )


def frozen_manifest_payload() -> dict[str, Any]:
    result = subprocess.run(
        [
            "node",
            "scripts/audit-episode-recaps.mjs",
            "--inventory",
            "--without-archive-completion",
        ],
        cwd=ROOT,
        check=True,
        capture_output=True,
        text=True,
        encoding="utf-8",
    )
    inventory = json.loads(result.stdout)
    held = [item for item in inventory if item["state"] == "held"]
    commentary_ids = {
        str(item.get("id") or "")
        for item in deep.read_assignment(PUBLIC / "catalog.js", "WWAM_CATALOG")
    }
    atlas, atlas_records = deep.atlas_records()
    priority = {
        item["id"]: (rank, item)
        for rank, item in enumerate(deep.expected_queue(atlas), 1)
    }
    records: list[dict[str, Any]] = []
    for rank, item in enumerate(
        sorted(
            held,
            key=lambda value: (
                str(value.get("date") or ""),
                str(value.get("id") or ""),
            ),
            reverse=True,
        ),
        1,
    ):
        video_id = item["id"]
        atlas_record = atlas_records.get(video_id, {})
        atlas_priority_rank, priority_item = priority.get(
            video_id,
            (0, {"score": 0, "breakdown": {
                "popularity": 0,
                "recency": 0,
                "franchise": 0,
            }}),
        )
        title = str(item.get("title") or atlas_record.get("title") or "")
        mode, rights_mode, restricted = classify(title)
        if video_id in commentary_ids:
            mode = "movie-commentary"
            rights_mode = "film-audio-boundary-unverified"
            restricted = True
        record = {
            "rank": rank,
            "atlasPriorityRank": atlas_priority_rank,
            "atlasPriorityScore": priority_item["score"],
            "atlasPriorityBreakdown": priority_item["breakdown"],
            "id": video_id,
            "title": title,
            "date": str(item.get("date") or atlas_record.get("date") or ""),
            "duration": int(
                item.get("duration") or atlas_record.get("duration") or 0
            ),
            "snapshotViews": int(
                item.get("views") or atlas_record.get("views") or 0
            ),
            "url": str(
                item.get("url")
                or atlas_record.get("url")
                or f"https://www.youtube.com/watch?v={video_id}"
            ),
            "contentMode": mode,
            "rightsMode": rights_mode,
            "restrictedToTopicNavigation": restricted,
            "promotionAllowed": False,
        }
        record.update(EXACT_SOURCE_HOLDS.get(video_id, {}))
        records.append(record)
    core = {
        "schema": MANIFEST_SCHEMA,
        "frozenAt": utc_now(),
        "selectionBasis": (
            "Every canonical source whose episode recap was held at the "
            "completion freeze. No ranking, same-night, or popularity "
            "exclusion is allowed."
        ),
        "sourceAtlasSnapshotDate": atlas["snapshotDate"],
        "sourceAtlasArchiveSha256": atlas["fingerprints"]["archiveSha256"],
        "sourceCount": len(records),
        "records": records,
    }
    core["recordsSha256"] = recovery1.sha256_label(records)
    return core


def freeze_manifest(force: bool) -> dict[str, Any]:
    if MANIFEST_PATH.exists() and not force:
        raise RuntimeError(
            f"{MANIFEST_PATH.name} already exists; use --force-freeze only "
            "before integration if the canonical held set intentionally changed"
        )
    payload = frozen_manifest_payload()
    MANIFEST_PATH.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(
        f"Froze {MANIFEST_PATH.name}: {payload['sourceCount']} canonical "
        f"held sources, {payload['recordsSha256']}."
    )
    return payload


def load_manifest() -> dict[str, Any]:
    if not MANIFEST_PATH.exists():
        raise RuntimeError(
            f"Missing {MANIFEST_PATH.name}; run --freeze-manifest first"
        )
    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    if manifest.get("schema") != MANIFEST_SCHEMA:
        raise RuntimeError("Archive completion manifest schema changed")
    records = manifest.get("records") or []
    if manifest.get("sourceCount") != len(records):
        raise RuntimeError("Archive completion manifest count changed")
    if len({item.get("id") for item in records}) != len(records):
        raise RuntimeError("Archive completion manifest contains duplicates")
    if manifest.get("recordsSha256") != recovery1.sha256_label(records):
        raise RuntimeError("Archive completion manifest fingerprint changed")
    expected_ranks = list(range(1, len(records) + 1))
    actual_ranks = [
        item.get("rank") if isinstance(item, dict) else None
        for item in records
    ]
    if actual_ranks != expected_ranks:
        raise RuntimeError(
            "Archive completion manifest ranks must be contiguous and ordered"
        )
    hold_ids: set[str] = set()
    for index, item in enumerate(records):
        label = f"Archive completion manifest record #{index + 1}"
        if not isinstance(item, dict):
            raise RuntimeError(f"{label} must be an object")
        video_id = item.get("id")
        if not isinstance(video_id, str) or not re.fullmatch(
            r"[A-Za-z0-9_-]{11}", video_id
        ):
            raise RuntimeError(f"{label} has an invalid source ID")
        if not isinstance(item.get("title"), str) or not item["title"].strip():
            raise RuntimeError(f"{label} has an invalid title")
        if not isinstance(item.get("date"), str) or not re.fullmatch(
            r"\d{4}-\d{2}-\d{2}", item["date"]
        ):
            raise RuntimeError(f"{label} has an invalid source date")
        try:
            datetime.strptime(item["date"], "%Y-%m-%d")
        except ValueError as error:
            raise RuntimeError(f"{label} has an invalid source date") from error
        if type(item.get("duration")) is not int or item["duration"] <= 0:
            raise RuntimeError(f"{label} has a nonpositive duration")
        if (
            type(item.get("snapshotViews")) is not int
            or item["snapshotViews"] < 0
        ):
            raise RuntimeError(f"{label} has invalid snapshot views")
        expected_url = f"https://www.youtube.com/watch?v={video_id}"
        if item.get("url") != expected_url:
            raise RuntimeError(f"{label} lost its exact official YouTube URL")
        if type(item.get("atlasPriorityRank")) is not int:
            raise RuntimeError(f"{label} has an invalid Atlas priority rank")
        score = item.get("atlasPriorityScore")
        if (
            not isinstance(score, (int, float))
            or isinstance(score, bool)
            or not isinstance(item.get("atlasPriorityBreakdown"), dict)
        ):
            raise RuntimeError(f"{label} has invalid Atlas priority metadata")
        if not isinstance(item.get("contentMode"), str) or not item[
            "contentMode"
        ]:
            raise RuntimeError(f"{label} has an invalid content mode")
        if not isinstance(item.get("rightsMode"), str) or not item[
            "rightsMode"
        ]:
            raise RuntimeError(f"{label} has an invalid rights mode")
        if type(item.get("restrictedToTopicNavigation")) is not bool:
            raise RuntimeError(f"{label} has an invalid topic restriction")
        if item.get("promotionAllowed") is not False:
            raise RuntimeError(f"{label} became promotable")

        hold_state = item.get("exactSourceTranscriptState")
        alternate = item.get("alternateOfficialSource")
        if hold_state:
            hold_ids.add(video_id)
            if (
                not isinstance(hold_state, str)
                or not isinstance(item.get("exactSourceHoldReason"), str)
                or not item["exactSourceHoldReason"].strip()
                or not isinstance(alternate, dict)
            ):
                raise RuntimeError(f"{label} has an incomplete exact-source hold")
            for field in (
                "kind",
                "title",
                "description",
                "published",
                "evidenceBoundary",
            ):
                if not isinstance(alternate.get(field), str) or not alternate[
                    field
                ].strip():
                    raise RuntimeError(
                        f"{label} has invalid alternate field {field}"
                    )
            for field in ("episodeUrl", "enclosureUrl"):
                if not isinstance(alternate.get(field), str) or not re.fullmatch(
                    r"https://[^\s]+", alternate[field]
                ):
                    raise RuntimeError(
                        f"{label} has an unsafe alternate URL in {field}"
                    )
            alternate_duration = alternate.get("duration")
            canonical_duration = alternate.get("canonicalYouTubeDuration")
            duration_delta = alternate.get("durationDelta")
            if any(
                not isinstance(value, (int, float)) or isinstance(value, bool)
                for value in (
                    alternate_duration,
                    canonical_duration,
                    duration_delta,
                )
            ):
                raise RuntimeError(f"{label} has invalid alternate timing")
            if alternate_duration <= 0 or canonical_duration <= 0:
                raise RuntimeError(f"{label} has nonpositive alternate timing")
            if canonical_duration != item["duration"]:
                raise RuntimeError(
                    f"{label} alternate lost its canonical-duration binding"
                )
            if round(alternate_duration - canonical_duration, 2) != round(
                duration_delta, 2
            ):
                raise RuntimeError(
                    f"{label} alternate duration delta is inconsistent"
                )
            if alternate.get("timestampIsomorphic") is not False:
                raise RuntimeError(
                    f"{label} alternate crossed the timestamp firewall"
                )
            if alternate.get("publicPlaybackAllowed") is not True:
                raise RuntimeError(
                    f"{label} alternate lost its public-playback permission"
                )
        elif alternate is not None or item.get("exactSourceHoldReason") is not None:
            raise RuntimeError(f"{label} has orphaned alternate-source metadata")
    if hold_ids != set(EXACT_SOURCE_HOLDS):
        raise RuntimeError(
            "Archive completion manifest exact-source hold set changed"
        )
    return manifest


def write_retry_queue(failures: list[dict[str, str]]) -> None:
    RETRY_PATH.parent.mkdir(parents=True, exist_ok=True)
    RETRY_PATH.write_text(
        json.dumps(
            {
                "schema": "shokker-youtube-wiki/archive-completion-retry/v1",
                "manifestSha256": load_manifest()["recordsSha256"],
                "failures": failures,
            },
            ensure_ascii=False,
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )


def refresh_captions(
    manifest: dict[str, Any],
    *,
    pace_seconds: float,
    attempts: int,
) -> list[dict[str, str]]:
    failures: list[dict[str, str]] = []
    pending = [
        item
        for item in manifest["records"]
        if (
            not deep.caption_path(item["id"]).exists()
            and not item.get("exactSourceTranscriptState")
        )
    ]
    total = len(pending)
    for index, selected in enumerate(pending, 1):
        video_id = selected["id"]
        last_error = ""
        for attempt in range(1, attempts + 1):
            started = time.monotonic()
            try:
                result = deep.fetch_caption(video_id)
                elapsed = time.monotonic() - started
                print(
                    f"{index:>3}/{total} {video_id} captions via "
                    f"{result['client']} ({elapsed:.1f}s)",
                    flush=True,
                )
                last_error = ""
                break
            except Exception as error:  # pragma: no cover - network path
                last_error = str(error)
                if attempt < attempts:
                    delay = min(30.0, 4.0 * attempt)
                    print(
                        f"{video_id} attempt {attempt} held; retrying in "
                        f"{delay:.0f}s",
                        flush=True,
                    )
                    time.sleep(delay)
        if last_error:
            failures.append({"id": video_id, "error": last_error})
            print(f"{video_id} remains held: {last_error}", flush=True)
        if index < total and pace_seconds > 0:
            time.sleep(min(10.0, pace_seconds))
    write_retry_queue(failures)
    return failures


def iter_candidates(payload: dict[str, Any]) -> Iterable[dict[str, Any]]:
    for stream in payload["streams"]:
        yield from stream["topics"]
        yield from stream["moments"]
        yield from stream["characters"]


def public_excerpts(stream: dict[str, Any]) -> Iterable[str]:
    for topic in stream["topics"]:
        if topic.get("receipt"):
            yield topic["receipt"]
    for moment in stream["moments"]:
        if moment.get("excerpt"):
            yield moment["excerpt"]
    for character in stream["characters"]:
        if character.get("receipt"):
            yield character["receipt"]


def canonical_timeline_lines(
    lines: list[dict[str, Any]],
    duration: float,
) -> tuple[list[dict[str, Any]], dict[str, int]]:
    """Keep generated public navigation inside the canonical upload runtime.

    YouTube caption tracks and local decoders can carry a final event a few
    seconds beyond the player duration because of container padding or decoder
    tail text. The private payload remains untouched. This derived list drops
    events that begin after the canonical runtime and clips only the duration
    of a crossing event so no public receipt can point outside the player.
    """
    canonical_duration = max(0.0, float(duration))
    bounded: list[dict[str, Any]] = []
    dropped = 0
    clipped = 0
    for line in lines:
        start = max(0.0, float(line.get("start") or 0))
        line_duration = max(0.0, float(line.get("duration") or 0))
        if start >= canonical_duration:
            dropped += 1
            continue
        safe_duration = min(line_duration, canonical_duration - start)
        if safe_duration <= 0:
            dropped += 1
            continue
        if safe_duration + 0.001 < line_duration:
            clipped += 1
        safe_line = dict(line)
        safe_line["start"] = round(start, 2)
        safe_line["duration"] = round(safe_duration, 2)
        if safe_line["duration"] <= 0:
            dropped += 1
            continue
        bounded.append(safe_line)
    return bounded, {
        "eventsObserved": len(lines),
        "eventsWithinCanonicalRuntime": len(bounded),
        "eventsDiscardedBeyondCanonicalRuntime": dropped,
        "eventsClippedAtCanonicalRuntime": clipped,
    }


def strengthen_topic_receipts(
    stream: dict[str, Any],
    lines: list[dict[str, Any]],
) -> None:
    """Center every completion topic excerpt on its named source evidence.

    The legacy topic builder correctly chooses a dense matching event, but its
    seven-word prefix can end before the actual topic term. That produces weak
    recap prose such as a Batman chapter whose displayed fragment stops just
    before the word "Batman." Completion pages keep the same topic, timestamp,
    and cluster measurement while exposing a slightly wider excerpt centered
    on the exact matching term.
    """
    published: list[dict[str, Any]] = []
    for topic in stream.get("topics") or []:
        patterns = TOPIC_RULES.get(str(topic.get("name") or ""), [])
        if not patterns:
            continue
        peak = float(topic.get("peak") or topic.get("first") or 0)
        candidates: list[tuple[float, int, dict[str, Any]]] = []
        for index, line in enumerate(lines):
            distance = abs(float(line["start"]) - peak)
            if distance > 8:
                continue
            if any(re.search(pattern, line["text"], re.I) for pattern in patterns):
                candidates.append((distance, index, line))
        for _, index, line in sorted(
            candidates,
            key=lambda item: (item[0], item[1]),
        ):
            receipt = clip_around(
                joined_window(lines, index, word_target=24),
                patterns,
                min(EXCERPT_WORD_LIMIT, 12),
            )
            if (
                not receipt
                or DISALLOWED_EXCERPT.search(receipt)
                or PUBLIC_REJECT.search(receipt)
                or not any(
                    re.search(pattern, receipt, re.I)
                    for pattern in patterns
                )
            ):
                continue
            topic["receipt"] = receipt
            topic["receiptBasis"] = "topic-term-centered-caption-event"
            topic["receiptAt"] = round(float(line["start"]), 2)
            published.append(topic)
            break
    stream["topics"] = published


def rewrite_editorial(
    stream: dict[str, Any],
    selected: dict[str, Any],
) -> None:
    topics = [topic["name"] for topic in stream["topics"][:4]]
    route = ", ".join(topics) if topics else "the available caption route"
    restricted = selected["restrictedToTopicNavigation"]
    stream["summary"] = (
        f"This completion pass maps {route} across the exact "
        f"{round(stream['duration'] / 60)}-minute upload. "
        + (
            "Because source audio may share the caption track, this page opens "
            "topic doors but withholds joke, quote, character, and heat claims."
            if restricted
            else
            "Every public moment remains a short, speaker-unidentified, "
            "source-local candidate with exact playback."
        )
    )
    stream["editorial"]["whyItMatters"] = (
        "This was one of the final canonical shows without an episode recap. "
        f"The recovered caption map now supplies {len(stream['topics'])} topic "
        f"doors and {len(stream['moments'])} bounded moment candidates. "
        "Playback remains the authority on speaker, delivery, intent, and "
        "audio origin."
    )
    stream["editorial"]["signature"] = (
        "SOURCE-AUDIO FIREWALL // TOPIC DOORS OPEN"
        if restricted
        else "FELDMAN FILE RECOVERED // THE TAPE TALKS"
    )
    stream["editorial"]["basis"] = [
        f"completion manifest rank #{selected['rank']}",
        f"{stream['captionEvidence']['eventsAudited']:,} transcript events audited",
        f"{stream['captionEvidence']['durationCoveragePercent']}% source span",
        f"{len(stream['topics'])} source-local topic receipts",
        (
            "public moment/excerpt lanes withheld"
            if restricted
            else f"{len(stream['moments'])} bounded machine moment candidates"
        ),
        "speaker unset // promotion forbidden",
    ]
    stream["editorial"]["bestEntry"] = (
        {
            "t": stream["moments"][0]["at"],
            "end": stream["moments"][0]["end"],
            "label": stream["moments"][0]["category"],
            "why": "Highest retained source-local signal; machine surfaced.",
        }
        if stream["moments"]
        else None
    )


def source_info(
    selected: dict[str, Any],
    manifest: dict[str, Any],
) -> dict[str, Any]:
    exact_source_held = bool(selected.get("exactSourceTranscriptState"))
    return {
        "title": selected["title"],
        "upload_date": selected["date"].replace("-", ""),
        "duration": selected["duration"],
        "view_count": selected["snapshotViews"],
        "age_limit": 18 if exact_source_held else 0,
        "availability": (
            "age-restricted" if exact_source_held else "not-captured"
        ),
        "live_status": "not-captured",
        "observed_at": manifest["frozenAt"],
    }


def decorate_completion_stream(
    stream: dict[str, Any],
    selected: dict[str, Any],
    manifest: dict[str, Any],
) -> None:
    stream["archivePriority"] = {
        "version": "archive-completion/v1",
        "currentRank": selected["rank"],
        "rankStatus": "frozen-completion-manifest",
        "atlasPriorityRank": selected["atlasPriorityRank"],
        "score": selected["atlasPriorityScore"],
        "breakdown": selected["atlasPriorityBreakdown"],
        "basis": "every previously held canonical source; no popularity exclusion",
        "pool": f"{manifest['sourceCount']} held sources at completion freeze",
        "signals": [],
    }
    stream["completionBatch"] = {
        "id": LANE_ID,
        "rank": selected["rank"],
        "manifestSha256": manifest["recordsSha256"],
        "candidateState": "quarantined",
        "promotionAllowed": False,
    }
    stream["contentMode"] = selected["contentMode"]
    stream["rightsPolicy"] = {
        "mode": selected["rightsMode"],
        "restrictedToTopicNavigation": selected[
            "restrictedToTopicNavigation"
        ],
        "publicExcerptWordLimit": EXCERPT_WORD_LIMIT,
        "speakerClaimsAllowed": False,
        "performerClaimsAllowed": False,
        "originClaimsAllowed": False,
        "visualClaimsAllowed": False,
        "visualResultClaimsAllowed": False,
        "promotionAllowed": False,
    }


def exact_source_hold_stream(
    selected: dict[str, Any],
    manifest: dict[str, Any],
) -> dict[str, Any]:
    stream = build_stream(
        {
            "id": selected["id"],
            "title": selected["title"],
            "url": selected["url"],
        },
        selected["rank"],
        source_info(selected, manifest),
        [],
    )
    decorate_completion_stream(stream, selected, manifest)
    stream["captionEvidence"] = {
        "type": "exact-source-unavailable",
        "track": "No public exact-source caption or timestamp-isomorphic transcript",
        "eventType": "unavailable",
        "engine": "",
        "model": "",
        "observedAt": manifest["frozenAt"],
        "eventsAudited": 0,
        "eventsObserved": 0,
        "eventsWithinCanonicalRuntime": 0,
        "eventsDiscardedBeyondCanonicalRuntime": 0,
        "eventsClippedAtCanonicalRuntime": 0,
        "firstEventSeconds": 0,
        "lastEventSeconds": 0,
        "leadingGapSeconds": 0,
        "trailingGapSeconds": selected["duration"],
        "spanSeconds": 0,
        "durationCoveragePercent": 0,
        "coverageMeasurement": (
            "first-to-last event timeline span over canonical duration; "
            "not dialogue coverage"
        ),
        "spanStatus": "held-exact-source-unavailable",
        "payloadSha256": None,
        "fullPayloadPublic": False,
        "speakerDiarized": False,
        "originAttribution": False,
    }
    stream["exactSourceTranscriptState"] = selected[
        "exactSourceTranscriptState"
    ]
    stream["exactSourceHoldReason"] = selected["exactSourceHoldReason"]
    stream["alternateOfficialSource"] = selected["alternateOfficialSource"]
    duration_delta = abs(
        float(selected["alternateOfficialSource"]["durationDelta"])
    )
    stream["summary"] = (
        "This canonical YouTube cut remains a transparent Source Brief. Its "
        "public metadata and official playback route are preserved, but no "
        "recap, topic, quote, character, heat, or timestamp claim is generated "
        "without evidence from the exact edit."
    )
    stream["editorial"]["whyItMatters"] = (
        "The episode belongs in the complete WWAM canon even though its "
        "age-gated YouTube cut exposes neither public captions nor public "
        "unauthenticated media. An official podcast edition exists, but its "
        f"edit runs {duration_delta:.2f} seconds longer and is not substituted "
        "for this tape."
    )
    stream["editorial"]["signature"] = (
        "CANON PRESERVED // EXACT CUT HELD // NOTHING INVENTED"
    )
    stream["editorial"]["bestEntry"] = None
    stream["editorial"]["basis"] = [
        f"completion manifest rank #{selected['rank']}",
        "official YouTube source retained as canonical",
        "0 exact-source transcript events available",
        "official alternate edit quarantined from YouTube timestamps",
        "speaker unset // promotion forbidden",
    ]
    stream["indicesUnavailableReason"] = (
        "No public exact-source transcript exists for this age-gated YouTube "
        "edit; the differently timed official podcast edition was not used."
    )
    return stream


def build_payload() -> dict[str, Any]:
    manifest = load_manifest()
    streams: list[dict[str, Any]] = []
    caption_hashes: dict[str, str] = {}
    failures: list[dict[str, Any]] = []

    for selected in manifest["records"]:
        video_id = selected["id"]
        path = deep.caption_path(video_id)
        if not path.exists():
            if selected.get("exactSourceTranscriptState"):
                stream = exact_source_hold_stream(selected, manifest)
                streams.append(stream)
                caption_hashes[video_id] = deep.sha256_label(
                    {
                        "state": selected["exactSourceTranscriptState"],
                        "alternateTimestampIsomorphic": selected[
                            "alternateOfficialSource"
                        ]["timestampIsomorphic"],
                    }
                )
                continue
            failures.append({"id": video_id, "reason": "caption-cache-missing"})
            continue
        caption_payload = json.loads(path.read_text(encoding="utf-8"))
        provenance = transcript_provenance(caption_payload)
        if (
            provenance["kind"] == "local-speech-to-text"
            and provenance["canonicalTimestampMapping"] is not True
        ):
            failures.append(
                {
                    "id": video_id,
                    "reason": "local-asr-canonical-timestamp-mapping-unproven",
                }
            )
            continue
        raw_lines = parse_json3(caption_payload)
        lines, timeline_bounds = canonical_timeline_lines(
            raw_lines,
            selected["duration"],
        )
        if len(lines) < MIN_EVENTS:
            failures.append(
                {
                    "id": video_id,
                    "reason": "caption-events-sparse",
                    "events": len(lines),
                }
            )
            continue
        first = min(
            (line["start"] for line in lines),
            default=0,
        )
        last = max(
            (line["start"] + line["duration"] for line in lines),
            default=0,
        )
        span = max(0, last - first)
        coverage_percent = round(
            min(100, 100 * span / max(1, selected["duration"])),
            2,
        )
        if coverage_percent < MIN_SPAN_PERCENT:
            failures.append(
                {
                    "id": video_id,
                    "reason": "caption-span-short",
                    "spanPercent": coverage_percent,
                }
            )
            continue
        info = source_info(selected, manifest)
        stream = build_stream(
            {
                "id": video_id,
                "title": selected["title"],
                "url": selected["url"],
            },
            selected["rank"],
            info,
            lines,
        )
        strengthen_topic_receipts(stream, lines)
        caption_hash = deep.caption_fingerprint(caption_payload)
        caption_hashes[video_id] = caption_hash
        decorate_completion_stream(stream, selected, manifest)
        stream["captionEvidence"] = {
            "type": provenance["kind"],
            "track": provenance["track"],
            "eventType": provenance["eventType"],
            "engine": provenance["engine"],
            "model": provenance["model"],
            "observedAt": manifest["frozenAt"],
            "eventsAudited": len(lines),
            **timeline_bounds,
            "firstEventSeconds": round(first, 1),
            "lastEventSeconds": round(last, 1),
            "leadingGapSeconds": round(max(0, first), 1),
            "trailingGapSeconds": round(
                max(0, selected["duration"] - last), 1
            ),
            "spanSeconds": round(span, 1),
            "durationCoveragePercent": coverage_percent,
            "coverageMeasurement": (
                "first-to-last event timeline span over canonical duration; "
                "not dialogue coverage"
            ),
            "spanStatus": (
                "complete-available"
                if coverage_percent >= 99.0
                else "substantially-complete-available"
            ),
            "payloadSha256": caption_hash,
            "fullPayloadPublic": False,
            "speakerDiarized": False,
            "originAttribution": False,
        }
        if provenance.get("audioSourceKind"):
            stream["captionEvidence"]["audioSourceKind"] = provenance[
                "audioSourceKind"
            ]
            stream["captionEvidence"]["canonicalTimestampMapping"] = provenance[
                "canonicalTimestampMapping"
            ]
        streams.append(stream)

    if failures:
        raise RuntimeError(
            "Archive completion cannot publish while canonical sources remain "
            "held: " + json.dumps(failures, ensure_ascii=False)
        )

    normalize_indices(streams)
    selected_by_id = {
        selected["id"]: selected for selected in manifest["records"]
    }
    for stream in streams:
        selected = selected_by_id[stream["id"]]
        if stream["captionEvidence"]["type"] == "exact-source-unavailable":
            continue
        archive_policy.restrict_stream(
            stream,
            {
                "rank": selected["rank"],
                "rightsMode": selected["rightsMode"],
                "restricted": selected["restrictedToTopicNavigation"],
            },
        )
        if selected["restrictedToTopicNavigation"]:
            for topic in stream["topics"]:
                topic.pop("receiptBasis", None)
                topic.pop("receiptAt", None)
        apply_transcript_provenance(
            stream,
            transcript_provenance(
                json.loads(
                    deep.caption_path(stream["id"]).read_text(encoding="utf-8")
                )
            ),
        )
        stream["moments"] = stream["moments"][:8]
        recovery2.bounded_receipts(stream)
        rewrite_editorial(stream, selected)

    topic_index = aggregate_topics(streams)
    character_index = aggregate_characters(streams)
    payload: dict[str, Any] = {
        "schema": SCHEMA,
        "generated": GENERATED_DATE,
        "observedAt": manifest["frozenAt"],
        "channel": {
            "id": "we-watched-a-movie",
            "label": "We Watched A Movie",
            "platform": "youtube",
            "canonicalUrl": "https://www.youtube.com/@WeWatchedAMovie",
        },
        "lane": {
            "id": LANE_ID,
            "kind": "caption-audited-canonical-completion",
            "integrationStatus": "integrated-quarantine",
            "promotionAllowed": False,
            "requiresAuthenticatedReview": True,
        },
        "scope": (
            "Every canonical source whose episode recap was held at the "
            "completion freeze."
        ),
        "method": (
            "Available English JSON3 caption acquisition with local "
            "speech-to-text fallback for captionless uploads, private full "
            "transcript retention, short public timestamped receipts, and "
            "explicit source-audio firewalls. Timeline-span percentages measure "
            "the first-to-last transcript event against canonical runtime; "
            "they are not a claim that every spoken second is covered. One "
            "age-gated exact cut remains a transparent metadata-only Source "
            "Brief; its differently timed official podcast edition is "
            "disclosed but never substituted."
        ),
        "recapContract": {
            "label": "WWAM FELDMAN APPROVED RECAP",
            "actualApproval": False,
            "everySourceMapped": True,
            "exactSourcePlaybackRequired": True,
            "speakerInferenceAllowed": False,
            "inventedEpisodeEventsAllowed": False,
        },
        "selection": {
            "manifestSchema": MANIFEST_SCHEMA,
            "manifestSha256": manifest["recordsSha256"],
            "sourceAtlasSnapshotDate": manifest["sourceAtlasSnapshotDate"],
            "sourceAtlasArchiveSha256": manifest[
                "sourceAtlasArchiveSha256"
            ],
            "frozen": True,
            "records": manifest["records"],
        },
        "evidencePolicy": {
            "privateInput": (
                "full YouTube JSON3 automatic-caption payloads or full local "
                "speech-to-text fallback payloads; no alternate-edition "
                "transcript is accepted for a non-isomorphic canonical cut"
            ),
            "publicInput": (
                "aggregate measurements and short source-local bounded receipts"
            ),
            "publicExcerptWordLimit": EXCERPT_WORD_LIMIT,
            "speakerDiarized": False,
            "performerAttribution": False,
            "originAttribution": False,
            "visualClaimsAllowed": False,
            "promotionAllowed": False,
        },
        "meta": {
            "streams": len(streams),
            "captioned": sum(stream["captioned"] for stream in streams),
            "youtubeCaptionSources": sum(
                stream["captionEvidence"]["type"]
                == "youtube-automatic-caption"
                for stream in streams
            ),
            "localSpeechToTextSources": sum(
                stream["captionEvidence"]["type"]
                == "local-speech-to-text"
                for stream in streams
            ),
            "exactSourceHolds": sum(
                stream["captionEvidence"]["type"]
                == "exact-source-unavailable"
                for stream in streams
            ),
            "completeCaptionSpans": sum(
                stream["captionEvidence"]["durationCoveragePercent"] >= 99.0
                for stream in streams
            ),
            "substantialCaptionSpans": sum(
                stream["captionEvidence"]["durationCoveragePercent"]
                >= MIN_SPAN_PERCENT
                for stream in streams
            ),
            "restricted": sum(
                stream["rightsPolicy"]["restrictedToTopicNavigation"]
                for stream in streams
            ),
            "visualResultFirewalls": sum(
                stream["rightsPolicy"]["mode"] == "visual-result-unverified"
                for stream in streams
            ),
            "hours": round(
                sum(stream["duration"] for stream in streams) / 3600,
                1,
            ),
            "wordsAudited": sum(stream["wordsAudited"] for stream in streams),
            "captionEvents": sum(
                stream["captionEvidence"]["eventsAudited"]
                for stream in streams
            ),
            "topicLanes": sum(len(stream["topics"]) for stream in streams),
            "distinctTopics": len(topic_index),
            "publicMomentCandidates": sum(
                len(stream["moments"]) for stream in streams
            ),
            "characterSignals": sum(
                len(stream["characters"]) for stream in streams
            ),
            "snapshotViews": sum(stream["views"] for stream in streams),
            "retryQueue": 0,
        },
        "streams": streams,
        "topicIndex": topic_index,
        "characterIndex": character_index,
        "retryQueue": [],
        "fingerprints": {
            "manifestSha256": manifest["recordsSha256"],
            "captionSetSha256": deep.sha256_label(caption_hashes),
            "publicFnv1a": deep.fnv1a32(deep.stable_json(streams)),
        },
    }
    validate_payload(payload)
    return payload


def validate_payload(payload: dict[str, Any]) -> None:
    manifest = load_manifest()
    streams = payload["streams"]
    expected_ids = [item["id"] for item in manifest["records"]]
    if payload["schema"] != SCHEMA:
        raise RuntimeError("Archive completion schema changed")
    if [stream["id"] for stream in streams] != expected_ids:
        raise RuntimeError("Archive completion source order changed")
    if len(streams) != manifest["sourceCount"]:
        raise RuntimeError("Archive completion cardinality changed")
    stream_by_id = {stream["id"]: stream for stream in streams}
    expected_hold_count = sum(
        bool(item.get("exactSourceTranscriptState"))
        for item in manifest["records"]
    )
    for stream in streams:
        evidence = stream["captionEvidence"]
        policy = stream["rightsPolicy"]
        if evidence.get("type") not in {
            "youtube-automatic-caption",
            "local-speech-to-text",
            "exact-source-unavailable",
        }:
            raise RuntimeError(f"{stream['id']} lost transcript provenance")
        exact_source_held = evidence["type"] == "exact-source-unavailable"
        if exact_source_held:
            if stream["captioned"] is not False:
                raise RuntimeError(f"{stream['id']} invented caption coverage")
            if (
                evidence["eventsAudited"] != 0
                or evidence["firstEventSeconds"] != 0
                or evidence["lastEventSeconds"] != 0
                or evidence["spanSeconds"] != 0
                or evidence["durationCoveragePercent"] != 0
                or evidence["payloadSha256"] is not None
            ):
                raise RuntimeError(f"{stream['id']} invented held-source evidence")
            if any(
                (
                    stream["topics"],
                    stream["moments"],
                    stream["characters"],
                    stream["heatmap"],
                    stream["peak"] is not None,
                )
            ):
                raise RuntimeError(f"{stream['id']} invented held-source semantics")
            alternate = stream.get("alternateOfficialSource") or {}
            if alternate.get("timestampIsomorphic") is not False:
                raise RuntimeError(
                    f"{stream['id']} lost the alternate-edition firewall"
                )
        else:
            if evidence["eventsAudited"] < MIN_EVENTS:
                raise RuntimeError(f"{stream['id']} lost caption depth")
            if (
                evidence.get("eventsObserved", 0)
                != (
                    evidence["eventsWithinCanonicalRuntime"]
                    + evidence["eventsDiscardedBeyondCanonicalRuntime"]
                )
                or evidence["eventsWithinCanonicalRuntime"]
                != evidence["eventsAudited"]
                or evidence["eventsClippedAtCanonicalRuntime"] < 0
            ):
                raise RuntimeError(
                    f"{stream['id']} lost canonical timeline accounting"
                )
            if evidence["durationCoveragePercent"] < MIN_SPAN_PERCENT:
                raise RuntimeError(f"{stream['id']} lost caption span")
            if (
                evidence["firstEventSeconds"] < 0
                or evidence["lastEventSeconds"]
                <= evidence["firstEventSeconds"]
                or abs(
                    evidence["spanSeconds"]
                    - round(
                    evidence["lastEventSeconds"]
                    - evidence["firstEventSeconds"],
                    1,
                    )
                ) > 0.2
            ):
                raise RuntimeError(f"{stream['id']} has invalid timeline span")
            if (
                evidence["type"] == "local-speech-to-text"
                and evidence.get("canonicalTimestampMapping") is not True
            ):
                raise RuntimeError(
                    f"{stream['id']} lost canonical timestamp mapping"
                )
        if evidence["fullPayloadPublic"] is not False:
            raise RuntimeError(f"{stream['id']} exposed a full caption payload")
        if evidence["speakerDiarized"] is not False:
            raise RuntimeError(f"{stream['id']} invented speaker diarization")
        if any(
            policy[field] is not False
            for field in (
                "speakerClaimsAllowed",
                "performerClaimsAllowed",
                "originClaimsAllowed",
                "visualClaimsAllowed",
                "visualResultClaimsAllowed",
                "promotionAllowed",
            )
        ):
            raise RuntimeError(f"{stream['id']} lost an evidence firewall")
        if policy["restrictedToTopicNavigation"] and (
            stream["moments"] or stream["characters"] or stream["heatmap"]
        ):
            raise RuntimeError(
                f"{stream['id']} leaked source-audio-boundary candidates"
            )
        for excerpt in public_excerpts(stream):
            if len(excerpt.split()) > EXCERPT_WORD_LIMIT:
                raise RuntimeError(f"{stream['id']} exceeded excerpt limit")
            if DISALLOWED_EXCERPT.search(excerpt) or PUBLIC_REJECT.search(excerpt):
                raise RuntimeError(f"{stream['id']} exposed a rejected excerpt")
        for topic in stream["topics"]:
            if policy["restrictedToTopicNavigation"]:
                if (
                    topic.get("receipt") is not None
                    or "receiptBasis" in topic
                    or "receiptAt" in topic
                ):
                    raise RuntimeError(
                        f"{stream['id']} exposed a restricted topic receipt"
                    )
                continue
            patterns = TOPIC_RULES.get(str(topic.get("name") or ""), [])
            if (
                topic.get("receiptBasis")
                != "topic-term-centered-caption-event"
                or not patterns
                or not any(
                    re.search(pattern, str(topic.get("receipt") or ""), re.I)
                    for pattern in patterns
                )
                or abs(
                    float(topic.get("receiptAt") or 0)
                    - float(topic.get("at") or 0)
                ) > 2
            ):
                raise RuntimeError(
                    f"{stream['id']} lost its topic-centered receipt binding"
                )
    for candidate in iter_candidates(payload):
        source_id = candidate["sourceId"]
        source = stream_by_id.get(source_id)
        if source is None:
            raise RuntimeError("Completion receipt lost source binding")
        if not (
            0 <= float(candidate["at"]) < float(candidate["end"])
            <= float(source["duration"])
        ):
            raise RuntimeError("Completion receipt lost playback bounds")
        if candidate["speaker"] is not None:
            raise RuntimeError("Completion receipt invented a speaker")
        if candidate["promotionAllowed"] is not False:
            raise RuntimeError("Completion receipt became promotable")
    if payload["meta"]["retryQueue"] != 0:
        raise RuntimeError("Archive completion retry queue is not empty")
    if payload["meta"]["exactSourceHolds"] != expected_hold_count:
        raise RuntimeError("Archive completion exact-source hold count changed")
    if payload["meta"]["captioned"] + payload["meta"]["exactSourceHolds"] != len(
        streams
    ):
        raise RuntimeError("Archive completion evidence state count changed")


def render(payload: dict[str, Any]) -> str:
    return (
        f"window.{PUBLIC_ASSIGNMENT} = "
        + json.dumps(payload, ensure_ascii=False, separators=(",", ":"))
        + ";\n"
    )


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--freeze-manifest", action="store_true")
    parser.add_argument("--force-freeze", action="store_true")
    parser.add_argument("--refresh-captions", action="store_true")
    parser.add_argument("--pace-seconds", type=float, default=0.0)
    parser.add_argument("--attempts", type=int, default=1)
    parser.add_argument("--check", action="store_true")
    parser.add_argument("--audit-json", action="store_true")
    args = parser.parse_args()

    if args.freeze_manifest:
        freeze_manifest(args.force_freeze)
    manifest = load_manifest()
    failures: list[dict[str, str]] = []
    if args.refresh_captions:
        failures = refresh_captions(
            manifest,
            pace_seconds=max(0.0, args.pace_seconds),
            attempts=max(1, args.attempts),
        )
        if failures:
            raise RuntimeError(
                f"{len(failures)} canonical sources remain in the retry queue"
            )

    payload = build_payload()
    source = render(payload)
    source_bytes = source.encode("utf-8")
    if len(source_bytes) >= MAX_PUBLIC_BYTES:
        raise RuntimeError(
            f"Archive completion artifact is {len(source_bytes):,} bytes; "
            f"limit is {MAX_PUBLIC_BYTES:,}"
        )
    if args.check:
        if not OUTPUT_PATH.exists():
            raise RuntimeError(f"Missing generated artifact: {OUTPUT_PATH}")
        if OUTPUT_PATH.read_bytes() != source_bytes:
            raise RuntimeError(
                f"{OUTPUT_PATH.name} is stale; rerun this pipeline"
            )
    else:
        OUTPUT_PATH.write_bytes(source_bytes)
    action = "Validated" if args.check else "Wrote"
    print(
        f"{action} {OUTPUT_PATH.name}: {payload['meta']['streams']} streams, "
        f"{payload['meta']['hours']} hours, "
        f"{payload['meta']['wordsAudited']:,} words, "
        f"{payload['meta']['captionEvents']:,} caption events, "
        f"{payload['meta']['publicMomentCandidates']} bounded moments, "
        f"{len(source_bytes):,} public bytes."
    )
    if args.audit_json:
        print(
            json.dumps(
                {
                    "schema": payload["schema"],
                    "lane": payload["lane"],
                    "recapContract": payload["recapContract"],
                    "meta": payload["meta"],
                    "fingerprints": payload["fingerprints"],
                    "retryQueue": payload["retryQueue"],
                },
                ensure_ascii=False,
                indent=2,
            )
        )
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as error:
        print(f"Archive completion failed: {error}", file=sys.stderr)
        raise
