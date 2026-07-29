#!/usr/bin/env python3
"""Build the first evidence-recovery batch from the WWAM held-source ledger.

The frozen manifest is an editorial recovery order, not a popularity ranking.
Every selected source was metadata-only at the Archive Atlas snapshot and
exposed an anonymous English JSON3 caption track during the 2026-07-29 probe.

Full caption payloads stay in the gitignored ``source-cache/captions`` folder.
The public artifact contains only aggregate measurements and short, explicitly
bounded, source-local machine candidates. Speakers, performers, quote origin,
visual results, and promotion authority remain unset.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import random
import sys
import time
from pathlib import Path
from typing import Any, Iterable

import wwam_archive_deep_batch2 as batch2
import wwam_archive_deep_distill as batch1
from wwam_deep_distill import DISALLOWED_EXCERPT, PUBLIC, parse_json3
from wwam_popular_live_distill import (
    PUBLIC_REJECT,
    aggregate_characters,
    aggregate_topics,
    build_stream,
    normalize_indices,
)


ROOT = Path(__file__).resolve().parents[1]
MANIFEST_PATH = Path(__file__).with_name(
    "wwam_archive_recovery_batch1_manifest.json"
)
OUTPUT_PATH = PUBLIC / "archive-recovery-batch1.js"
RETRY_PATH = ROOT / "work" / "archive-recovery-batch1-retry.json"
PUBLIC_ASSIGNMENT = "WWAM_ARCHIVE_RECOVERY_BATCH1"
SCHEMA = "shokker-youtube-wiki/archive-recovery-batch/v1"
MANIFEST_SCHEMA = "shokker-youtube-wiki/archive-recovery-manifest/v1"
LANE_ID = "archive-recovery-batch-01"
GENERATED_DATE = "2026-07-29"
MIN_EVENTS = 50
MIN_SPAN_PERCENT = 99.8
EXCERPT_WORD_LIMIT = 16
TOPIC_WINDOW_SECONDS = 20
MOMENT_WINDOW_SECONDS = 16
CHARACTER_WINDOW_SECONDS = 16
MAX_PUBLIC_BYTES = 450_000
EXPECTED_MANIFEST_SHA256 = (
    "sha256:14aec252b0e2e265206dd3d419f57aab"
    "4791ec160c4816dc39619e016ef23f32"
)
EXPECTED_SELECTION_SHA256 = (
    "sha256:dcf11d1cfd4c6137926c335cad767ff2"
    "cc559e3a613c54d11b12da6aa65d49b7"
)
EXPECTED_CAPTION_SET_SHA256 = (
    "sha256:fadb6eea6ec08db63affd796322d6890"
    "48673582d618fa1655ef96b948b0a1cf"
)
EXPECTED_PUBLIC_FNV1A = "fnv1a32:61fd8761"


def canonical_json(value: Any) -> str:
    return json.dumps(
        value,
        ensure_ascii=False,
        sort_keys=True,
        separators=(",", ":"),
    )


def sha256_label(value: Any) -> str:
    source = value if isinstance(value, str) else canonical_json(value)
    return "sha256:" + hashlib.sha256(source.encode("utf-8")).hexdigest()


def load_manifest() -> dict[str, Any]:
    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    if manifest.get("schema") != MANIFEST_SCHEMA:
        raise RuntimeError("Recovery manifest schema is invalid")
    if sha256_label(manifest) != EXPECTED_MANIFEST_SHA256:
        raise RuntimeError("The frozen recovery manifest changed")
    records = manifest.get("records") or []
    if len(records) != 25:
        raise RuntimeError("Recovery Batch 01 requires exactly 25 manifest records")
    ids = [record.get("id") for record in records]
    if len(set(ids)) != len(ids):
        raise RuntimeError("Recovery manifest contains duplicate source IDs")
    if [record.get("rank") for record in records] != list(range(1, 26)):
        raise RuntimeError("Recovery manifest ranks must be the exact range 1-25")
    return manifest


def validate_manifest_binding(
    manifest: dict[str, Any],
    atlas: dict[str, Any],
    atlas_records: dict[str, dict[str, Any]],
) -> None:
    if manifest["sourceAtlasSnapshotDate"] != atlas["snapshotDate"]:
        raise RuntimeError("Recovery manifest Atlas snapshot date changed")
    if manifest["sourceAtlasArchiveSha256"] != atlas["fingerprints"]["archiveSha256"]:
        raise RuntimeError("Recovery manifest Atlas fingerprint changed")

    existing_archive_ids = set()
    for assignment_path, assignment in (
        (PUBLIC / "archive-deep-distill.js", "WWAM_ARCHIVE_DEEP"),
        (PUBLIC / "archive-deep-batch2.js", "WWAM_ARCHIVE_DEEP_BATCH2"),
        (PUBLIC / "archive-deep-batch3.js", "WWAM_ARCHIVE_DEEP_BATCH3"),
        (PUBLIC / "archive-deep-batch4.js", "WWAM_ARCHIVE_DEEP_BATCH4"),
    ):
        payload = batch1.read_assignment(assignment_path, assignment)
        existing_archive_ids.update(stream["id"] for stream in payload["streams"])

    for selected in manifest["records"]:
        video_id = selected["id"]
        record = atlas_records.get(video_id)
        if not record:
            raise RuntimeError(f"Recovery source is missing from Atlas: {video_id}")
        expected = {
            "title": selected["title"],
            "date": selected["date"],
            "duration": selected["duration"],
            "views": selected["snapshotViews"],
        }
        actual = {
            "title": record["title"],
            "date": record["date"],
            "duration": record["duration"],
            "views": record["views"],
        }
        if actual != expected:
            raise RuntimeError(
                f"Recovery manifest metadata binding changed for {video_id}: "
                f"{actual!r} != {expected!r}"
            )
        if record["coverage"] != "metadata-only":
            raise RuntimeError(
                f"Recovery source {video_id} is no longer metadata-only in the "
                "frozen selection ledger"
            )
        if video_id in existing_archive_ids:
            raise RuntimeError(
                f"Recovery source {video_id} overlaps an existing Archive Deep batch"
            )
        probe = selected["probe"]
        if probe != {
            "observedAt": manifest["frozenAt"],
            "availability": "public",
            "liveStatus": "was_live",
            "ageLimit": 0,
            "englishJson3": True,
        }:
            raise RuntimeError(f"Recovery probe binding is invalid for {video_id}")
        if selected["promotionAllowed"] is not False:
            raise RuntimeError(f"Recovery source {video_id} cannot allow promotion")
        if selected["visualClaimsAllowed"] is not False:
            raise RuntimeError(f"Recovery source {video_id} cannot allow visual claims")


def caption_window(at: float, duration: float, width: float) -> tuple[float, float]:
    start = max(0.0, min(float(at), float(duration)))
    end = min(float(duration), start + width)
    if end <= start:
        start = max(0.0, min(start, float(duration) - 0.01))
        end = min(float(duration), start + 0.01)
    return round(start, 2), round(end, 2)


def bind_candidate(
    candidate: dict[str, Any],
    *,
    source_id: str,
    at: float,
    duration: float,
    width: float,
) -> None:
    start, end = caption_window(at, duration, width)
    candidate["sourceId"] = source_id
    candidate["at"] = start
    candidate["end"] = end
    candidate["speaker"] = None
    candidate["promotionAllowed"] = False
    candidate["reviewState"] = "machine-surfaced-quarantine"
    candidate["boundsBasis"] = "source-local-caption-event-window"


def bounded_receipts(stream: dict[str, Any]) -> None:
    duration = float(stream["duration"])
    source_id = stream["id"]
    for topic in stream["topics"]:
        at = topic.get("peak")
        if at is None:
            at = topic.get("first", 0)
        bind_candidate(
            topic,
            source_id=source_id,
            at=float(at or 0),
            duration=duration,
            width=TOPIC_WINDOW_SECONDS,
        )
    for moment in stream["moments"]:
        bind_candidate(
            moment,
            source_id=source_id,
            at=float(moment.get("t") or 0),
            duration=duration,
            width=MOMENT_WINDOW_SECONDS,
        )
    for character in stream["characters"]:
        bind_candidate(
            character,
            source_id=source_id,
            at=float(character.get("t") or 0),
            duration=duration,
            width=CHARACTER_WINDOW_SECONDS,
        )


def rewrite_editorial(
    stream: dict[str, Any],
    selected: dict[str, Any],
) -> None:
    topics = [topic["name"] for topic in stream["topics"][:3]]
    topic_text = ", ".join(topics) if topics else "source-local topics"
    visual = selected["rightsMode"] == "visual-result-unverified"
    boundary = (
        " Visible tier, bracket, or list order remains unverified; this map does "
        "not claim the on-screen result."
        if visual
        else ""
    )
    summary = (
        f"Held-source recovery rank #{selected['rank']}; a full-span English "
        f"automatic-caption pass maps {topic_text}. Short moments remain "
        "machine-surfaced, speaker-unidentified, and non-promotable."
        + boundary
    )
    stream["summary"] = summary
    stream["editorial"]["whyItMatters"] = (
        f"Recovered from the source-safe-held ledger at frozen recovery rank "
        f"#{selected['rank']}. Cached views remain a July 23 snapshot: "
        f"{selected['snapshotViews']:,}. The caption map is source-local and "
        "does not establish a speaker, performer, intent, or quote origin."
        + boundary
    )
    stream["editorial"]["signature"] = (
        "VISUAL RESULT HELD // TAPE RECEIPTS OPEN"
        if visual
        else "HELD TAPE RECOVERED // RECEIPTS QUARANTINED"
    )
    stream["editorial"]["basis"] = [
        f"frozen held-source recovery rank #{selected['rank']}",
        f"{selected['snapshotViews']:,} cached views // separate observation",
        f"{len(stream['topics'])} source-local topic receipts",
        f"{len(stream['moments'])} bounded machine moment candidates",
        "speaker unset // promotion forbidden",
    ]
    stream["editorial"]["bestEntry"] = (
        {
            "t": stream["moments"][0]["at"],
            "end": stream["moments"][0]["end"],
            "label": stream["moments"][0]["category"],
            "why": "Highest retained caption-derived signal; machine-surfaced.",
        }
        if stream["moments"]
        else None
    )


def build_payload() -> dict[str, Any]:
    manifest = load_manifest()
    atlas, atlas_records = batch1.atlas_records()
    validate_manifest_binding(manifest, atlas, atlas_records)
    streams: list[dict[str, Any]] = []
    caption_hashes: dict[str, str] = {}

    for selected in manifest["records"]:
        video_id = selected["id"]
        path = batch1.caption_path(video_id)
        if not path.exists():
            raise RuntimeError(
                f"Missing private caption cache for {video_id}; "
                "run with --refresh-captions"
            )
        caption_payload = json.loads(path.read_text(encoding="utf-8"))
        lines = parse_json3(caption_payload)
        if len(lines) < MIN_EVENTS:
            raise RuntimeError(
                f"{video_id} has only {len(lines)} usable caption events"
            )
        record = atlas_records[video_id]
        last = max(
            (line["start"] + line["duration"] for line in lines),
            default=0,
        )
        coverage_percent = round(
            min(100, 100 * last / max(1, record["duration"])),
            2,
        )
        if coverage_percent < MIN_SPAN_PERCENT:
            raise RuntimeError(
                f"{video_id} caption span is only {coverage_percent}%"
            )

        info = {
            "title": record["title"],
            "upload_date": record["date"].replace("-", ""),
            "duration": record["duration"],
            "view_count": record["views"],
            "age_limit": selected["probe"]["ageLimit"],
            "availability": selected["probe"]["availability"],
            "live_status": selected["probe"]["liveStatus"],
            "observed_at": manifest["frozenAt"],
        }
        stream = build_stream(
            {
                "id": video_id,
                "title": record["title"],
                "url": record["url"],
            },
            selected["rank"],
            info,
            lines,
        )
        caption_hash = batch1.caption_fingerprint(caption_payload)
        caption_hashes[video_id] = caption_hash
        stream["archivePriority"] = {
            "version": "held-recovery-priority/v1",
            "currentRank": selected["rank"],
            "rankStatus": "frozen-recovery-manifest",
            "basis": (
                "held-source audit value, format variety, WWAM franchise relevance, "
                "and freshly verified anonymous English-caption availability"
            ),
            "pool": "301 source-safe-held shows at the 2026-07-29 audit",
            "score": None,
            "breakdown": None,
            "signals": [],
        }
        stream["recoveryBatch"] = {
            "id": LANE_ID,
            "rank": selected["rank"],
            "manifestSha256": EXPECTED_MANIFEST_SHA256,
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
        stream["captionEvidence"] = {
            "track": "English YouTube captions (JSON3)",
            "observedAt": manifest["frozenAt"],
            "eventsAudited": len(lines),
            "spanSeconds": round(last, 1),
            "durationCoveragePercent": coverage_percent,
            "spanStatus": "complete-available",
            "payloadSha256": caption_hash,
            "fullPayloadPublic": False,
            "speakerDiarized": False,
            "originAttribution": False,
        }
        streams.append(stream)

    normalize_indices(streams)
    for stream, selected in zip(streams, manifest["records"], strict=True):
        batch2.restrict_stream(
            stream,
            {
                "rank": selected["rank"],
                "rightsMode": selected["rightsMode"],
                "restricted": selected["restrictedToTopicNavigation"],
            },
        )
        stream["moments"] = stream["moments"][:6]
        bounded_receipts(stream)
        rewrite_editorial(stream, selected)

    topic_index = aggregate_topics(streams)
    character_index = aggregate_characters(streams)
    selection_records = [
        {
            "rank": selected["rank"],
            "id": selected["id"],
            "title": selected["title"],
            "date": selected["date"],
            "duration": selected["duration"],
            "snapshotViews": selected["snapshotViews"],
            "contentMode": selected["contentMode"],
            "rightsMode": selected["rightsMode"],
        }
        for selected in manifest["records"]
    ]
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
            "kind": "caption-audited-recovery-quarantine",
            "sequence": 1,
            "integrationStatus": "integrated-quarantine",
            "promotionAllowed": False,
            "requiresAuthenticatedReview": True,
        },
        "scope": (
            "Twenty-five frozen high-value sources recovered from the 301-show "
            "source-safe-held ledger. This is an editorial recovery order, not a "
            "popularity ranking."
        ),
        "method": (
            "Full-span anonymous English JSON3 caption acquisition with exact "
            "Atlas binding, source-local bounded receipt construction, private "
            "caption retention, and public non-promotion firewalls."
        ),
        "selection": {
            "manifestSchema": MANIFEST_SCHEMA,
            "manifestSha256": EXPECTED_MANIFEST_SHA256,
            "sourceAtlasSnapshotDate": manifest["sourceAtlasSnapshotDate"],
            "sourceAtlasArchiveSha256": manifest["sourceAtlasArchiveSha256"],
            "frozen": True,
            "records": selection_records,
        },
        "evidencePolicy": {
            "privateInput": "full YouTube JSON3 caption payloads",
            "publicInput": (
                "aggregate measurements and short source-local bounded receipts"
            ),
            "publicExcerptWordLimit": EXCERPT_WORD_LIMIT,
            "speakerDiarized": False,
            "speakerField": "explicitly null on every public receipt",
            "performerAttribution": False,
            "originAttribution": False,
            "visualContextVerified": False,
            "visualResultClaimsAllowed": False,
            "candidateState": "quarantined",
            "promotionAllowed": False,
            "topicWindowSeconds": TOPIC_WINDOW_SECONDS,
            "momentWindowSeconds": MOMENT_WINDOW_SECONDS,
            "characterWindowSeconds": CHARACTER_WINDOW_SECONDS,
        },
        "meta": {
            "streams": len(streams),
            "captioned": len(streams),
            "completeCaptionSpans": sum(
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
                stream["captionEvidence"]["eventsAudited"] for stream in streams
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
            "manifestSha256": EXPECTED_MANIFEST_SHA256,
            "selectionSha256": sha256_label(selection_records),
            "captionSetSha256": batch1.sha256_label(caption_hashes),
        },
    }
    payload["fingerprints"]["publicFnv1a"] = batch1.fnv1a32(
        batch1.stable_json(streams)
    )
    validate_payload(payload)
    return payload


def iter_candidates(payload: dict[str, Any]) -> Iterable[dict[str, Any]]:
    for stream in payload["streams"]:
        yield from stream["topics"]
        yield from stream["moments"]
        yield from stream["characters"]


def iter_public_excerpts(payload: dict[str, Any]) -> Iterable[str]:
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
    manifest = load_manifest()
    streams = payload["streams"]
    expected_ids = [record["id"] for record in manifest["records"]]
    if payload["schema"] != SCHEMA:
        raise RuntimeError("Recovery payload schema changed")
    if payload["lane"]["id"] != LANE_ID:
        raise RuntimeError("Recovery lane ID changed")
    if payload["lane"]["promotionAllowed"] is not False:
        raise RuntimeError("Recovery lane cannot allow promotion")
    if [stream["id"] for stream in streams] != expected_ids:
        raise RuntimeError("Recovery stream order changed")
    if len(streams) != 25 or len(set(expected_ids)) != 25:
        raise RuntimeError("Recovery payload source cardinality changed")

    for stream in streams:
        policy = stream["rightsPolicy"]
        evidence = stream["captionEvidence"]
        if evidence["eventsAudited"] < MIN_EVENTS:
            raise RuntimeError(f"{stream['id']} lost its minimum caption events")
        if evidence["durationCoveragePercent"] < MIN_SPAN_PERCENT:
            raise RuntimeError(f"{stream['id']} lost its adequate caption span")
        if evidence["fullPayloadPublic"] is not False:
            raise RuntimeError(f"{stream['id']} exposed a full caption payload")
        if evidence["speakerDiarized"] is not False:
            raise RuntimeError(f"{stream['id']} invented speaker diarization")
        if evidence["originAttribution"] is not False:
            raise RuntimeError(f"{stream['id']} invented quote origin")
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
            raise RuntimeError(f"{stream['id']} lost its evidence firewall")
        if policy["restrictedToTopicNavigation"]:
            if stream["moments"] or stream["characters"]:
                raise RuntimeError(
                    f"{stream['id']} exposed candidates through an audio firewall"
                )

    for candidate in iter_candidates(payload):
        if candidate["sourceId"] not in expected_ids:
            raise RuntimeError("Recovery candidate lost source-local binding")
        if not (
            0 <= float(candidate["at"]) < float(candidate["end"])
        ):
            raise RuntimeError("Recovery candidate lost a positive playback bound")
        source = next(
            stream for stream in streams if stream["id"] == candidate["sourceId"]
        )
        if float(candidate["end"]) > float(source["duration"]):
            raise RuntimeError("Recovery candidate bound exceeds source duration")
        if candidate["speaker"] is not None:
            raise RuntimeError("Recovery candidate invented a speaker")
        if candidate["promotionAllowed"] is not False:
            raise RuntimeError("Recovery candidate became promotable")
        evidence = candidate.get("evidence") or {}
        if (
            evidence.get("speakerStatus") != "not-diarized"
            or evidence.get("originStatus") != "not-inferred"
            or evidence.get("visualContextVerified") is not False
            or evidence.get("promotionStatus") != "quarantined"
        ):
            raise RuntimeError("Recovery candidate evidence state changed")

    excerpts = list(iter_public_excerpts(payload))
    if any(batch2.words(excerpt) > EXCERPT_WORD_LIMIT for excerpt in excerpts):
        raise RuntimeError("Recovery payload exceeded its excerpt word limit")
    if any(
        DISALLOWED_EXCERPT.search(excerpt) or PUBLIC_REJECT.search(excerpt)
        for excerpt in excerpts
    ):
        raise RuntimeError("Recovery payload exposed a disallowed excerpt")

    meta = payload["meta"]
    expected_meta = {
        "streams": len(streams),
        "captioned": len(streams),
        "completeCaptionSpans": len(streams),
        "restricted": sum(
            stream["rightsPolicy"]["restrictedToTopicNavigation"]
            for stream in streams
        ),
        "visualResultFirewalls": sum(
            stream["rightsPolicy"]["mode"] == "visual-result-unverified"
            for stream in streams
        ),
        "hours": round(sum(stream["duration"] for stream in streams) / 3600, 1),
        "wordsAudited": sum(stream["wordsAudited"] for stream in streams),
        "captionEvents": sum(
            stream["captionEvidence"]["eventsAudited"] for stream in streams
        ),
        "topicLanes": sum(len(stream["topics"]) for stream in streams),
        "distinctTopics": len(payload["topicIndex"]),
        "publicMomentCandidates": sum(
            len(stream["moments"]) for stream in streams
        ),
        "characterSignals": sum(
            len(stream["characters"]) for stream in streams
        ),
        "snapshotViews": sum(stream["views"] for stream in streams),
        "retryQueue": len(payload["retryQueue"]),
    }
    if meta != expected_meta:
        raise RuntimeError(
            f"Recovery metrics do not reconcile: {meta!r} != {expected_meta!r}"
        )
    if payload["fingerprints"]["publicFnv1a"] != batch1.fnv1a32(
        batch1.stable_json(streams)
    ):
        raise RuntimeError("Recovery public fingerprint does not reconcile")
    expected_fingerprints = {
        "manifestSha256": EXPECTED_MANIFEST_SHA256,
        "selectionSha256": EXPECTED_SELECTION_SHA256,
        "captionSetSha256": EXPECTED_CAPTION_SET_SHA256,
        "publicFnv1a": EXPECTED_PUBLIC_FNV1A,
    }
    if payload["fingerprints"] != expected_fingerprints:
        raise RuntimeError(
            "Recovery fingerprints changed: "
            f"{payload['fingerprints']!r} != {expected_fingerprints!r}"
        )

    serialized = batch1.stable_json(payload)
    for forbidden in ('"events":[', '"segs":[', '"transcript":', '"performer":'):
        if forbidden in serialized:
            raise RuntimeError(f"Recovery payload exposed forbidden field {forbidden}")


def render(payload: dict[str, Any]) -> str:
    return (
        f"window.{PUBLIC_ASSIGNMENT} = "
        + json.dumps(payload, ensure_ascii=False, separators=(",", ":"))
        + ";\n"
    )


def write_retry_queue(failures: list[dict[str, str]]) -> None:
    RETRY_PATH.parent.mkdir(parents=True, exist_ok=True)
    RETRY_PATH.write_text(
        json.dumps(
            {
                "schema": "shokker-youtube-wiki/archive-recovery-retry/v1",
                "batchId": LANE_ID,
                "manifestSha256": EXPECTED_MANIFEST_SHA256,
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
    total = len(manifest["records"])
    for index, selected in enumerate(manifest["records"], 1):
        video_id = selected["id"]
        last_error = ""
        for attempt in range(1, attempts + 1):
            try:
                result = batch1.fetch_caption(video_id)
                print(
                    f"{index:>2}/{total} {video_id} captions via "
                    f"{result['client']}",
                    flush=True,
                )
                last_error = ""
                break
            except Exception as error:  # pragma: no cover - network failure path
                last_error = str(error)
                if attempt < attempts:
                    delay = min(60.0, 10.0 * (3 ** (attempt - 1)))
                    print(
                        f"{video_id} attempt {attempt} held; retrying in "
                        f"{delay:.0f}s",
                        flush=True,
                    )
                    time.sleep(delay)
        if last_error:
            failures.append({"id": video_id, "error": last_error})
            print(f"{video_id} remains in the retry queue", flush=True)
        if index < total:
            jitter = random.uniform(0, max(0.0, pace_seconds / 3))
            time.sleep(min(60.0, max(0.0, pace_seconds) + jitter))
    write_retry_queue(failures)
    return failures


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--refresh-captions",
        action="store_true",
        help=(
            "Sequentially refresh all private JSON3 caption caches through the "
            "existing YouTube client fallback chain."
        ),
    )
    parser.add_argument(
        "--pace-seconds",
        type=float,
        default=3.0,
        help="Base delay between caption requests; default 3 seconds.",
    )
    parser.add_argument(
        "--attempts",
        type=int,
        default=3,
        help="Maximum sequential acquisition attempts per source.",
    )
    parser.add_argument(
        "--check",
        action="store_true",
        help="Rebuild offline and require the checked-in artifact to match.",
    )
    parser.add_argument(
        "--audit-json",
        action="store_true",
        help="Print the deterministic payload metrics and fingerprints as JSON.",
    )
    args = parser.parse_args()
    manifest = load_manifest()

    failures: list[dict[str, str]] = []
    if args.refresh_captions:
        failures = refresh_captions(
            manifest,
            pace_seconds=max(0.0, args.pace_seconds),
            attempts=max(1, args.attempts),
        )

    missing = [
        record["id"]
        for record in manifest["records"]
        if not batch1.caption_path(record["id"]).exists()
    ]
    if missing:
        write_retry_queue(
            failures
            + [
                {"id": video_id, "error": "private caption cache missing"}
                for video_id in missing
                if video_id not in {failure["id"] for failure in failures}
            ]
        )
        raise RuntimeError(
            "Recovery batch is incomplete; retry queue contains: "
            + ", ".join(missing)
        )

    payload = build_payload()
    source = render(payload)
    source_bytes = source.encode("utf-8")
    if len(source_bytes) >= MAX_PUBLIC_BYTES:
        raise RuntimeError(
            f"Recovery artifact is {len(source_bytes):,} bytes; "
            f"limit is {MAX_PUBLIC_BYTES:,}"
        )

    if args.check:
        if not OUTPUT_PATH.exists():
            raise RuntimeError(f"Missing generated artifact: {OUTPUT_PATH}")
        if OUTPUT_PATH.read_bytes() != source_bytes:
            raise RuntimeError(
                "Recovery Batch 01 is stale; run "
                "pipeline/wwam_archive_recovery_batch1.py"
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
        print(f"Recovery Batch 01 failed: {error}", file=sys.stderr)
        raise
