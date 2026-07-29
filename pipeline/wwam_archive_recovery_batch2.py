#!/usr/bin/env python3
"""Build Recovery Batch 02 without mutating Recovery Batch 01.

The frozen manifest reproduces the next 25 highest-priority held sources after
the first recovery batch and explicit source-audio/same-night exclusions. Full
caption payloads remain private. The public artifact contains only aggregate
measurements and short source-local machine candidates with no speaker or
promotion authority.
"""

from __future__ import annotations

import argparse
import json
import random
import re
import sys
import time
from pathlib import Path
from typing import Any, Iterable

import wwam_archive_deep_batch2 as archive_policy
import wwam_archive_deep_distill as deep
import wwam_archive_recovery_batch1 as recovery1
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
    "wwam_archive_recovery_batch2_manifest.json"
)
PREDECESSOR_MANIFEST_PATH = Path(__file__).with_name(
    "wwam_archive_recovery_batch1_manifest.json"
)
OUTPUT_PATH = PUBLIC / "archive-recovery-batch2.js"
RETRY_PATH = ROOT / "work" / "archive-recovery-batch2-retry.json"
PUBLIC_ASSIGNMENT = "WWAM_ARCHIVE_RECOVERY_BATCH2"
SCHEMA = "shokker-youtube-wiki/archive-recovery-batch/v1"
MANIFEST_SCHEMA = "shokker-youtube-wiki/archive-recovery-manifest/v1"
LANE_ID = "archive-recovery-batch-02"
GENERATED_DATE = "2026-07-29"
MIN_EVENTS = 50
MIN_SPAN_PERCENT = 99.8
EXCERPT_WORD_LIMIT = 16
TOPIC_WINDOW_SECONDS = 20
MOMENT_WINDOW_SECONDS = 16
CHARACTER_WINDOW_SECONDS = 16
MAX_PUBLIC_BYTES = 450_000
EXPECTED_MANIFEST_SHA256 = (
    "sha256:def7d7a22c354ca18dfc85c4f659ca61"
    "0a8b43e46019a0af7a33f6e682b78fb2"
)
EXPECTED_PREDECESSOR_MANIFEST_SHA256 = recovery1.EXPECTED_MANIFEST_SHA256

EXPECTED_SELECTION_SHA256 = (
    "sha256:a336a9384f0a02013a343b678e5b3975"
    "203e52a20586e0f25f58165bcb78f809"
)
EXPECTED_CAPTION_SET_SHA256 = (
    "sha256:e6987b853359ba3c3d6a6737c6ff0809"
    "9141fc1efc54b7ae552cee240725f1e9"
)
EXPECTED_PUBLIC_FNV1A = "fnv1a32:d24bd304"


def load_manifest() -> dict[str, Any]:
    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    if manifest.get("schema") != MANIFEST_SCHEMA:
        raise RuntimeError("Recovery Batch 02 manifest schema is invalid")
    if recovery1.sha256_label(manifest) != EXPECTED_MANIFEST_SHA256:
        raise RuntimeError("The frozen Recovery Batch 02 manifest changed")
    if manifest.get("batchId") != LANE_ID:
        raise RuntimeError("Recovery Batch 02 manifest lane changed")
    records = manifest.get("records") or []
    if len(records) != 25:
        raise RuntimeError("Recovery Batch 02 requires exactly 25 records")
    if [record.get("rank") for record in records] != list(range(1, 26)):
        raise RuntimeError("Recovery Batch 02 ranks must be the exact range 1-25")
    if len({record.get("id") for record in records}) != 25:
        raise RuntimeError("Recovery Batch 02 contains duplicate source IDs")
    return manifest


def predecessor_ids(manifest: dict[str, Any]) -> set[str]:
    predecessor = json.loads(
        PREDECESSOR_MANIFEST_PATH.read_text(encoding="utf-8")
    )
    predecessor_hash = recovery1.sha256_label(predecessor)
    declared = manifest.get("predecessor") or {}
    if predecessor_hash != EXPECTED_PREDECESSOR_MANIFEST_SHA256:
        raise RuntimeError("Recovery Batch 01 manifest changed")
    if declared != {
        "batchId": "archive-recovery-batch-01",
        "manifestSha256": EXPECTED_PREDECESSOR_MANIFEST_SHA256,
        "sources": 25,
    }:
        raise RuntimeError("Recovery Batch 02 predecessor binding changed")
    ids = {record["id"] for record in predecessor["records"]}
    if len(ids) != 25:
        raise RuntimeError("Recovery Batch 01 predecessor cardinality changed")
    return ids


def expected_selection(
    manifest: dict[str, Any],
    atlas: dict[str, Any],
    atlas_records: dict[str, dict[str, Any]],
) -> list[tuple[int, dict[str, Any], dict[str, Any]]]:
    policy = manifest["selectionPolicy"]
    if policy["atlasPriorityVersion"] != "archive-distill-priority/v1":
        raise RuntimeError("Recovery Batch 02 priority version changed")
    if policy["eligibleCoverage"] != "metadata-only":
        raise RuntimeError("Recovery Batch 02 eligibility changed")
    if policy["promotionAllowed"] is not False:
        raise RuntimeError("Recovery Batch 02 cannot allow promotion")

    previous = predecessor_ids(manifest)
    source_audio = re.compile(policy["sourceAudioTitlePattern"], re.I)
    manual = {
        item["id"] for item in policy.get("manualSourceAudioExclusions") or []
    }
    selected: list[tuple[int, dict[str, Any], dict[str, Any]]] = []
    seen_dates: set[str] = set()
    queue_audio_exclusions: list[dict[str, Any]] = []
    cutoff = 0

    for queue_rank, priority in enumerate(deep.expected_queue(atlas), 1):
        record = atlas_records[priority["id"]]
        if priority["id"] in previous:
            continue
        audio_reason = None
        if priority["id"] in manual:
            audio_reason = "explicit-source-audio-boundary"
        elif source_audio.search(record["title"]):
            audio_reason = "source-audio-title-boundary"
        if audio_reason:
            queue_audio_exclusions.append(
                {
                    "atlasPriorityRank": queue_rank,
                    "id": priority["id"],
                    "reason": audio_reason,
                }
            )
            continue
        if record["date"] in seen_dates:
            continue
        seen_dates.add(record["date"])
        selected.append((queue_rank, priority, record))
        cutoff = queue_rank
        if len(selected) == 25:
            break

    if len(selected) != 25:
        raise RuntimeError("Recovery Batch 02 priority reconstruction is incomplete")
    declared_exclusions = manifest.get("queueExclusionsBeforeCutoff") or []
    actual_exclusions = [
        item
        for item in queue_audio_exclusions
        if item["atlasPriorityRank"] <= cutoff
    ]
    if actual_exclusions != declared_exclusions:
        raise RuntimeError(
            "Recovery Batch 02 source-audio exclusion ledger changed"
        )
    return selected


def validate_manifest_binding(
    manifest: dict[str, Any],
    atlas: dict[str, Any],
    atlas_records: dict[str, dict[str, Any]],
) -> None:
    if manifest["sourceAtlasSnapshotDate"] != atlas["snapshotDate"]:
        raise RuntimeError("Recovery Batch 02 Atlas snapshot date changed")
    if (
        manifest["sourceAtlasArchiveSha256"]
        != atlas["fingerprints"]["archiveSha256"]
    ):
        raise RuntimeError("Recovery Batch 02 Atlas fingerprint changed")

    reconstructed = expected_selection(manifest, atlas, atlas_records)
    declared = manifest["records"]
    if [item["id"] for item in declared] != [
        priority["id"] for _, priority, _ in reconstructed
    ]:
        raise RuntimeError("Recovery Batch 02 is no longer the exact next queue")

    existing_ids = set()
    for assignment_path, assignment in (
        (PUBLIC / "archive-deep-distill.js", "WWAM_ARCHIVE_DEEP"),
        (PUBLIC / "archive-deep-batch2.js", "WWAM_ARCHIVE_DEEP_BATCH2"),
        (PUBLIC / "archive-deep-batch3.js", "WWAM_ARCHIVE_DEEP_BATCH3"),
        (PUBLIC / "archive-deep-batch4.js", "WWAM_ARCHIVE_DEEP_BATCH4"),
        (
            PUBLIC / "archive-recovery-batch1.js",
            "WWAM_ARCHIVE_RECOVERY_BATCH1",
        ),
    ):
        payload = deep.read_assignment(assignment_path, assignment)
        existing_ids.update(stream["id"] for stream in payload["streams"])

    for selected, (queue_rank, priority, record) in zip(
        declared,
        reconstructed,
        strict=True,
    ):
        video_id = selected["id"]
        expected_metadata = {
            "title": selected["title"],
            "date": selected["date"],
            "duration": selected["duration"],
            "views": selected["snapshotViews"],
        }
        actual_metadata = {
            "title": record["title"],
            "date": record["date"],
            "duration": record["duration"],
            "views": record["views"],
        }
        if actual_metadata != expected_metadata:
            raise RuntimeError(
                f"Recovery Batch 02 metadata changed for {video_id}"
            )
        if record["coverage"] != "metadata-only":
            raise RuntimeError(
                f"Recovery Batch 02 source {video_id} left its frozen held state"
            )
        if video_id in existing_ids:
            raise RuntimeError(
                f"Recovery Batch 02 source {video_id} overlaps an earlier lane"
            )
        if (
            selected["atlasPriorityRank"] != queue_rank
            or selected["atlasPriorityScore"] != priority["score"]
            or selected["atlasPriorityBreakdown"] != priority["breakdown"]
        ):
            raise RuntimeError(
                f"Recovery Batch 02 priority binding changed for {video_id}"
            )
        if selected["probe"] != {
            "observedAt": manifest["frozenAt"],
            "availability": "public",
            "liveStatus": "was_live",
            "ageLimit": 0,
            "englishJson3": True,
        }:
            raise RuntimeError(
                f"Recovery Batch 02 probe binding changed for {video_id}"
            )
        if (
            selected["promotionAllowed"] is not False
            or selected["visualClaimsAllowed"] is not False
        ):
            raise RuntimeError(
                f"Recovery Batch 02 evidence firewall changed for {video_id}"
            )


def bind_candidate(
    candidate: dict[str, Any],
    *,
    source_id: str,
    at: float,
    duration: float,
    width: float,
) -> None:
    start, end = recovery1.caption_window(at, duration, width)
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
        " Visible tier, bracket, vote, or list order remains unverified; this "
        "caption map does not claim the on-screen result."
        if visual
        else ""
    )
    stream["summary"] = (
        f"Recovery Batch 02 rank #{selected['rank']} (frozen Atlas priority "
        f"#{selected['atlasPriorityRank']}) maps {topic_text} through a "
        "full-span English automatic-caption pass. Short moments remain "
        "machine-surfaced, speaker-unidentified, and non-promotable."
        + boundary
    )
    stream["editorial"]["whyItMatters"] = (
        f"Recovered from the source-safe-held ledger at frozen Atlas priority "
        f"#{selected['atlasPriorityRank']} with score "
        f"{selected['atlasPriorityScore']}. Cached views remain a July 23 "
        f"measurement: {selected['snapshotViews']:,}. The caption map is "
        "source-local and does not establish a speaker, performer, intent, "
        "quote origin, or visual result."
        + boundary
    )
    stream["editorial"]["signature"] = (
        "VISUAL RESULT HELD // TAPE RECEIPTS OPEN"
        if visual
        else "HELD TAPE RECOVERED // RECEIPTS QUARANTINED"
    )
    stream["editorial"]["basis"] = [
        f"Recovery Batch 02 rank #{selected['rank']}",
        f"frozen Atlas priority #{selected['atlasPriorityRank']} "
        f"// score {selected['atlasPriorityScore']}",
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


def selection_records(manifest: dict[str, Any]) -> list[dict[str, Any]]:
    return [
        {
            "rank": selected["rank"],
            "atlasPriorityRank": selected["atlasPriorityRank"],
            "atlasPriorityScore": selected["atlasPriorityScore"],
            "atlasPriorityBreakdown": selected["atlasPriorityBreakdown"],
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


def build_payload() -> dict[str, Any]:
    manifest = load_manifest()
    atlas, atlas_records = deep.atlas_records()
    validate_manifest_binding(manifest, atlas, atlas_records)
    streams: list[dict[str, Any]] = []
    caption_hashes: dict[str, str] = {}

    for selected in manifest["records"]:
        video_id = selected["id"]
        path = deep.caption_path(video_id)
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
        caption_hash = deep.caption_fingerprint(caption_payload)
        caption_hashes[video_id] = caption_hash
        stream["archivePriority"] = {
            "version": "held-recovery-priority/v1",
            "currentRank": selected["rank"],
            "rankStatus": "frozen-recovery-manifest",
            "atlasPriorityRank": selected["atlasPriorityRank"],
            "score": selected["atlasPriorityScore"],
            "breakdown": selected["atlasPriorityBreakdown"],
            "basis": (
                "frozen Archive Atlas priority after Recovery Batch 01, "
                "source-audio-boundary, and same-night continuation exclusions"
            ),
            "pool": (
                "276 source-safe-held shows after Recovery Batch 01; selected "
                "from the frozen 292-source metadata-only Atlas queue"
            ),
            "signals": [],
        }
        stream["recoveryBatch"] = {
            "id": LANE_ID,
            "rank": selected["rank"],
            "atlasPriorityRank": selected["atlasPriorityRank"],
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
            "track": "English YouTube automatic captions (JSON3)",
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
        archive_policy.restrict_stream(
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
    selected_records = selection_records(manifest)
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
            "sequence": 2,
            "integrationStatus": "integrated-quarantine",
            "promotionAllowed": False,
            "requiresAuthenticatedReview": True,
        },
        "scope": (
            "The next twenty-five frozen high-value sources after Recovery "
            "Batch 01 and explicit source-boundary exclusions."
        ),
        "method": (
            "Frozen Archive Atlas priority reconstruction, fresh full-span "
            "anonymous English JSON3 caption acquisition, source-local bounded "
            "receipt construction, private caption retention, and public "
            "non-promotion firewalls."
        ),
        "selection": {
            "manifestSchema": MANIFEST_SCHEMA,
            "manifestSha256": EXPECTED_MANIFEST_SHA256,
            "sourceAtlasSnapshotDate": manifest["sourceAtlasSnapshotDate"],
            "sourceAtlasArchiveSha256": manifest[
                "sourceAtlasArchiveSha256"
            ],
            "predecessor": manifest["predecessor"],
            "queueExclusionsBeforeCutoff": manifest[
                "queueExclusionsBeforeCutoff"
            ],
            "frozen": True,
            "records": selected_records,
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
            "selectionSha256": recovery1.sha256_label(selected_records),
            "captionSetSha256": deep.sha256_label(caption_hashes),
        },
    }
    payload["fingerprints"]["publicFnv1a"] = deep.fnv1a32(
        deep.stable_json(streams)
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
        raise RuntimeError("Recovery Batch 02 payload schema changed")
    if payload["lane"] != {
        "id": LANE_ID,
        "kind": "caption-audited-recovery-quarantine",
        "sequence": 2,
        "integrationStatus": "integrated-quarantine",
        "promotionAllowed": False,
        "requiresAuthenticatedReview": True,
    }:
        raise RuntimeError("Recovery Batch 02 lane contract changed")
    if [stream["id"] for stream in streams] != expected_ids:
        raise RuntimeError("Recovery Batch 02 stream order changed")
    if len(streams) != 25 or len(set(expected_ids)) != 25:
        raise RuntimeError("Recovery Batch 02 source cardinality changed")
    if len({stream["date"] for stream in streams}) != 25:
        raise RuntimeError("Recovery Batch 02 admitted a same-date continuation")

    predecessor = predecessor_ids(manifest)
    if predecessor & set(expected_ids):
        raise RuntimeError("Recovery Batch 02 overlaps Recovery Batch 01")

    stream_by_id = {stream["id"]: stream for stream in streams}
    for stream in streams:
        policy = stream["rightsPolicy"]
        evidence = stream["captionEvidence"]
        if evidence["eventsAudited"] < MIN_EVENTS:
            raise RuntimeError(f"{stream['id']} lost its minimum caption events")
        if evidence["durationCoveragePercent"] < MIN_SPAN_PERCENT:
            raise RuntimeError(f"{stream['id']} lost its adequate caption span")
        if (
            evidence["fullPayloadPublic"] is not False
            or evidence["speakerDiarized"] is not False
            or evidence["originAttribution"] is not False
        ):
            raise RuntimeError(f"{stream['id']} lost its caption firewall")
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

    for candidate in iter_candidates(payload):
        source_id = candidate["sourceId"]
        if source_id not in stream_by_id:
            raise RuntimeError("Recovery Batch 02 candidate lost source binding")
        source = stream_by_id[source_id]
        if not (
            0 <= float(candidate["at"]) < float(candidate["end"])
            <= float(source["duration"])
        ):
            raise RuntimeError(
                "Recovery Batch 02 candidate lost its playback bounds"
            )
        if candidate["speaker"] is not None:
            raise RuntimeError("Recovery Batch 02 invented a speaker")
        if candidate["promotionAllowed"] is not False:
            raise RuntimeError("Recovery Batch 02 candidate became promotable")
        evidence = candidate.get("evidence") or {}
        if (
            evidence.get("speakerStatus") != "not-diarized"
            or evidence.get("originStatus") != "not-inferred"
            or evidence.get("visualContextVerified") is not False
            or evidence.get("promotionStatus") != "quarantined"
        ):
            raise RuntimeError(
                "Recovery Batch 02 candidate evidence state changed"
            )

    excerpts = list(iter_public_excerpts(payload))
    if any(
        archive_policy.words(excerpt) > EXCERPT_WORD_LIMIT
        for excerpt in excerpts
    ):
        raise RuntimeError("Recovery Batch 02 exceeded its excerpt word limit")
    if any(
        DISALLOWED_EXCERPT.search(excerpt) or PUBLIC_REJECT.search(excerpt)
        for excerpt in excerpts
    ):
        raise RuntimeError("Recovery Batch 02 exposed a disallowed excerpt")

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
            f"Recovery Batch 02 metrics do not reconcile: "
            f"{meta!r} != {expected_meta!r}"
        )
    if payload["fingerprints"]["publicFnv1a"] != deep.fnv1a32(
        deep.stable_json(streams)
    ):
        raise RuntimeError("Recovery Batch 02 public fingerprint drifted")

    expected_fingerprints = {
        "manifestSha256": EXPECTED_MANIFEST_SHA256,
        "selectionSha256": EXPECTED_SELECTION_SHA256,
        "captionSetSha256": EXPECTED_CAPTION_SET_SHA256,
        "publicFnv1a": EXPECTED_PUBLIC_FNV1A,
    }
    if all(expected_fingerprints.values()):
        if payload["fingerprints"] != expected_fingerprints:
            raise RuntimeError(
                "Recovery Batch 02 pinned fingerprints changed"
            )

    serialized = deep.stable_json(payload)
    for forbidden in ('"events":[', '"segs":[', '"transcript":', '"performer":'):
        if forbidden in serialized:
            raise RuntimeError(
                f"Recovery Batch 02 exposed forbidden field {forbidden}"
            )


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
                result = deep.fetch_caption(video_id)
                if result != {
                    "client": result["client"],
                    "availability": "public",
                    "liveStatus": "was_live",
                    "ageLimit": 0,
                }:
                    raise RuntimeError(
                        "fresh source state failed public/was-live/age-zero gate"
                    )
                print(
                    f"{index:>2}/{total} {video_id} captions via "
                    f"{result['client']}",
                    flush=True,
                )
                last_error = ""
                break
            except Exception as error:  # pragma: no cover - network path
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
    parser.add_argument("--refresh-captions", action="store_true")
    parser.add_argument("--pace-seconds", type=float, default=3.0)
    parser.add_argument("--attempts", type=int, default=3)
    parser.add_argument("--check", action="store_true")
    parser.add_argument("--audit-json", action="store_true")
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
        if not deep.caption_path(record["id"]).exists()
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
            "Recovery Batch 02 is incomplete; retry queue contains: "
            + ", ".join(missing)
        )

    payload = build_payload()
    source = render(payload)
    source_bytes = source.encode("utf-8")
    if len(source_bytes) >= MAX_PUBLIC_BYTES:
        raise RuntimeError(
            f"Recovery Batch 02 artifact is {len(source_bytes):,} bytes; "
            f"limit is {MAX_PUBLIC_BYTES:,}"
        )

    if args.check:
        if not OUTPUT_PATH.exists():
            raise RuntimeError(f"Missing generated artifact: {OUTPUT_PATH}")
        if OUTPUT_PATH.read_bytes() != source_bytes:
            raise RuntimeError(
                "Recovery Batch 02 is stale; run "
                "pipeline/wwam_archive_recovery_batch2.py"
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
        print(f"Recovery Batch 02 failed: {error}", file=sys.stderr)
        raise
