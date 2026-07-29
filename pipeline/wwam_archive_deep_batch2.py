#!/usr/bin/env python3
"""Build WWAM Archive Deep Batch 02 as an isolated, frozen evidence lane.

The batch is the exact next ten records returned by Archive Atlas Distill
Priority V1 after Batch 01 has left the metadata-only pool. Complete YouTube
JSON3 automatic-caption payloads remain in the gitignored source cache. The
public artifact contains aggregate measurements, timestamped navigation, and
short receipts only.

Watch parties, script reads, and trailer/new-footage reactions are restricted
to topic navigation because automatic captions cannot establish which words
come from the hosts, a film, a screenplay, or a trailer. Visual-ranking sources
may expose caption-derived candidates, but every visual claim remains
explicitly unverified. No source makes a speaker, performer, or quote-origin
claim.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from typing import Any, Iterable

import wwam_archive_deep_distill as batch1
from wwam_deep_distill import DISALLOWED_EXCERPT, clean_text, parse_json3
from wwam_popular_live_distill import (
    PUBLIC_REJECT,
    aggregate_characters,
    aggregate_topics,
    build_stream,
    normalize_indices,
)


OUTPUT_PATH = batch1.PUBLIC / "archive-deep-batch2.js"
PUBLIC_ASSIGNMENT = "WWAM_ARCHIVE_DEEP_BATCH2"
SCHEMA = "shokker-youtube-wiki/archive-deep-batch/v1"
CHANNEL_ID = "we-watched-a-movie"
LANE_ID = "archive-deep-batch-02"
SELECTION_DATE = "2026-07-23"
GENERATED_DATE = "2026-07-24"
CAPTION_OBSERVED_AT = "2026-07-24T09:15:37Z"
PRIORITY_VERSION = "archive-distill-priority/v1"
SOURCE_ATLAS_SHA256 = (
    "sha256:f11c4db03460f8854465718828ae8350e00462b93b4ecd13343d4a8f088d0855"
)
EXCERPT_WORD_LIMIT = 16
MAX_PUBLIC_BYTES = 125_000
ARCHIVE_DEEP_BATCH_LANE = re.compile(r"^archive-deep-batch-(\d+)$")

BATCH1_IDS: tuple[str, ...] = (
    "fpNtQMexZiw",
    "WKs1uPGMQvw",
    "vq6mrfqOgZw",
    "M3P4mMDpXUc",
    "1j3F9vAWBo4",
    "3iMZcaVcvTU",
    "gR_64RyPhEM",
    "5T1wWUjCGWk",
    "KrBhfGxsJNM",
    "hagePawEnC4",
)

# Frozen from Archive Atlas getDistillQueue({limit: 10}) on 2026-07-23 after
# Batch 01 exclusion. These are editorial provenance, not a live leaderboard.
SELECTION: tuple[dict[str, Any], ...] = (
    {
        "id": "CFUHyfcJDTg",
        "rank": 1,
        "score": 89.8,
        "breakdown": {"popularity": 46.6, "recency": 23.2, "franchise": 20},
        "signals": ["Halloween", "Friday the 13th"],
        "contentMode": "visual-ranking",
        "rightsMode": "visual-context-unverified",
        "restricted": False,
    },
    {
        "id": "o4EMYqQ5DDU",
        "rank": 2,
        "score": 89.7,
        "breakdown": {"popularity": 43.1, "recency": 26.6, "franchise": 20},
        "signals": ["Scream"],
        "contentMode": "movie-news",
        "rightsMode": "standard-caption-candidates",
        "restricted": False,
    },
    {
        "id": "Z7ArdfA054w",
        "rank": 3,
        "score": 89.5,
        "breakdown": {"popularity": 43.0, "recency": 26.5, "franchise": 20},
        "signals": ["Halloween", "Alien / Predator", "Saw"],
        "contentMode": "movie-news",
        "rightsMode": "standard-caption-candidates",
        "restricted": False,
    },
    {
        "id": "k698GIJe8EA",
        "rank": 4,
        "score": 89.4,
        "breakdown": {"popularity": 43.7, "recency": 25.7, "franchise": 20},
        "signals": ["Friday the 13th"],
        "contentMode": "visual-ranking",
        "rightsMode": "visual-context-unverified",
        "restricted": False,
    },
    {
        "id": "4X8EFw7MCmw",
        "rank": 5,
        "score": 89.4,
        "breakdown": {"popularity": 42.6, "recency": 26.8, "franchise": 20},
        "signals": ["Halloween"],
        "contentMode": "trailer-reaction",
        "rightsMode": "source-audio-boundary-unverified",
        "restricted": True,
    },
    {
        "id": "KIGg_I72x_M",
        "rank": 6,
        "score": 88.1,
        "breakdown": {"popularity": 43.5, "recency": 24.6, "franchise": 20},
        "signals": ["Halloween"],
        "contentMode": "script-reading",
        "rightsMode": "script-origin-boundary-unverified",
        "restricted": True,
    },
    {
        "id": "o2O9T4nwVw4",
        "rank": 7,
        "score": 87.4,
        "breakdown": {"popularity": 46.5, "recency": 20.9, "franchise": 20},
        "signals": ["Scream"],
        "contentMode": "movie-news",
        "rightsMode": "standard-caption-candidates",
        "restricted": False,
    },
    {
        "id": "qONN2sNoK2k",
        "rank": 8,
        "score": 87.4,
        "breakdown": {"popularity": 43.1, "recency": 24.3, "franchise": 20},
        "signals": ["Scream"],
        "contentMode": "movie-news",
        "rightsMode": "standard-caption-candidates",
        "restricted": False,
    },
    {
        "id": "QxJyVaAgZ_Y",
        "rank": 9,
        "score": 87.0,
        "breakdown": {"popularity": 43.2, "recency": 23.8, "franchise": 20},
        "signals": ["Friday the 13th"],
        "contentMode": "watch-party",
        "rightsMode": "film-audio-boundary-unverified",
        "restricted": True,
    },
    {
        "id": "0svLtx3nZJM",
        "rank": 10,
        "score": 86.9,
        "breakdown": {"popularity": 47.3, "recency": 19.6, "franchise": 20},
        "signals": ["Friday the 13th"],
        "contentMode": "visual-ranking",
        "rightsMode": "visual-context-unverified",
        "restricted": False,
    },
)


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
    return " ".join(text.split()[:EXCERPT_WORD_LIMIT])


def evidence(*, excerpt_status: str) -> dict[str, Any]:
    return {
        "type": "youtube-automatic-caption",
        "timestampStatus": "caption-event",
        "excerptStatus": excerpt_status,
        "speakerStatus": "not-diarized",
        "originStatus": "not-inferred",
        "visualContextVerified": False,
        "reviewStatus": "machine-candidate",
        "promotionStatus": "quarantined",
    }


def canonical_atlas_record(record: dict[str, Any]) -> dict[str, Any]:
    """Match the Archive Atlas fingerprint surface exactly."""
    return {
        "id": record["id"],
        "title": record["title"],
        "date": record["date"],
        "duration": record["duration"],
        "views": record["views"],
        "availability": record["availability"],
        "liveStatus": record["liveStatus"],
        "coverage": record["coverage"],
        "lanes": record["lanes"],
    }


def integrated_at_or_after_batch2(record: dict[str, Any]) -> bool:
    """Return whether an Atlas record was promoted in Batch 02 or later."""
    for lane in record.get("lanes", []):
        # The year canon was integrated after all four frozen Archive Deep
        # selections. Its newly distilled records were metadata-only at every
        # Archive Deep selection snapshot and must be rolled back with later
        # Archive Deep lanes when reproducing those historical queues.
        if lane == "year-canon-2025-2026":
            return True
        match = ARCHIVE_DEEP_BATCH_LANE.fullmatch(str(lane))
        if match and int(match.group(1)) >= 2:
            return True
    return False


def validate_selection(
    atlas: dict[str, Any],
    records: dict[str, dict[str, Any]],
) -> None:
    if atlas["snapshotDate"] != SELECTION_DATE:
        raise RuntimeError("Archive Atlas snapshot date changed")
    missing = [selected["id"] for selected in SELECTION if selected["id"] not in records]
    if missing:
        raise RuntimeError(f"Selected Atlas records are missing: {missing}")
    overlap = sorted(set(BATCH1_IDS) & {selected["id"] for selected in SELECTION})
    if overlap:
        raise RuntimeError(f"Batch 02 overlaps Batch 01: {overlap}")

    # Once Batch 02 and any later batches are integrated, all of their records
    # correctly leave the metadata-only queue. Reconstruct the exact Atlas as
    # it stood immediately before Batch 02 by rolling every Batch 02+ lane back
    # to its former metadata-only state. Batch 01 remains deeply indexed because
    # it was already excluded at this selection snapshot. This keeps the frozen
    # selection independently auditable as additional batches are integrated.
    selection_ids = {selected["id"] for selected in SELECTION}
    source_records = []
    for record in atlas["records"]:
        restored = dict(record)
        if (
            record["id"] in selection_ids
            or integrated_at_or_after_batch2(record)
        ):
            restored["coverage"] = "metadata-only"
            restored["lanes"] = ["archive-metadata"]
        # Availability/live state was refreshed after all four Archive Deep
        # selections. Neither field existed as a checked claim anywhere in the
        # frozen selection source.
        restored["availability"] = "not-captured"
        restored["liveStatus"] = "not-captured"
        source_records.append(restored)
    reconstructed_sha256 = batch1.sha256_label(
        [canonical_atlas_record(record) for record in source_records]
    )
    if reconstructed_sha256 != SOURCE_ATLAS_SHA256:
        raise RuntimeError(
            "Archive Atlas cannot reproduce the frozen Batch 02 selection source"
        )
    source_atlas = {
        "snapshotDate": atlas["snapshotDate"],
        "records": source_records,
    }
    queue = batch1.expected_queue(source_atlas)[: len(SELECTION)]
    for selected, actual in zip(SELECTION, queue, strict=True):
        if (
            selected["id"] != actual["id"]
            or selected["score"] != actual["score"]
            or selected["breakdown"] != actual["breakdown"]
        ):
            raise RuntimeError(
                f"Frozen Atlas priority mismatch for #{selected['rank']}: "
                f"{selected['id']} != {actual}"
            )


def rewrite_editorial(stream: dict[str, Any], selected: dict[str, Any]) -> None:
    """Replace upstream view-rank/persona prose with evidence-bounded language."""
    breakdown = selected["breakdown"]
    topic_names = [topic["name"] for topic in stream["topics"][:3]]
    topic_summary = ", ".join(topic_names) if topic_names else "captioned topics"
    views = int(stream.get("views") or 0)
    priority_sentence = (
        f"Frozen Atlas priority #{selected['rank']} (score {selected['score']}) "
        "combines cached-view gravity "
        f"{breakdown['popularity']}/50, upload recency {breakdown['recency']}/30, "
        f"and franchise-title signal {breakdown['franchise']}/20. "
        f"Cached views are a separate snapshot measurement: {views:,}. "
        f"The automatic-caption map concentrates on {topic_summary}."
    )
    if stream["rightsPolicy"]["restrictedToTopicNavigation"]:
        priority_sentence += (
            " Public comedy, character, excerpt, and heat candidates remain "
            f"withheld under {selected['rightsMode']}."
        )
    elif stream["characters"]:
        priority_sentence += (
            " Character-name matches remain context candidates; automatic "
            "captions do not establish a performance."
        )

    stream["editorial"]["whyItMatters"] = priority_sentence
    stream["editorial"]["basis"] = [
        (
            f"frozen Atlas priority #{selected['rank']} · "
            "view gravity + recency + franchise-title signal"
        ),
        (
            f"priority components {breakdown['popularity']}/50 + "
            f"{breakdown['recency']}/30 + {breakdown['franchise']}/20"
        ),
        f"{views:,} cached views · separate snapshot measurement",
        f"{len(stream['topics'])} timestamped topic lanes",
        (
            "public candidate surfaces withheld"
            if stream["rightsPolicy"]["restrictedToTopicNavigation"]
            else f"{len(stream['moments'])} quarantined moment candidates"
        ),
    ]
    stream["summary"] = priority_sentence


def restrict_stream(stream: dict[str, Any], selected: dict[str, Any]) -> None:
    restricted = bool(selected["restricted"])
    for topic in stream["topics"]:
        topic["receipt"] = public_excerpt(topic.get("receipt"), restricted=restricted)
        topic["evidence"] = evidence(
            excerpt_status=(
                "withheld-source-boundary"
                if restricted
                else "short-caption-fragment"
            )
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
            "but public comedy, character, excerpt, and heat candidates are "
            f"withheld under {selected['rightsMode']}."
        )
        stream["editorial"]["bestEntry"] = None
        stream["editorial"]["signature"] = "TOPIC NAVIGATION × SOURCE BOUNDARY HELD"
        stream["editorial"]["basis"][-2:] = [
            f"{len(stream['topics'])} caption-backed topic lanes",
            "public joke/character/heat candidates withheld",
        ]
        return

    moments = []
    for moment in stream["moments"]:
        excerpt = public_excerpt(moment.get("quote"), restricted=False)
        if excerpt:
            moments.append(
                {
                    "t": moment["t"],
                    "excerpt": excerpt,
                    "category": moment["category"],
                    "heat": moment["heat"],
                    "evidence": evidence(excerpt_status="short-caption-fragment"),
                }
            )
    stream["moments"] = moments
    for character in stream["characters"]:
        character["receipt"] = public_excerpt(
            character.get("receipt"),
            restricted=False,
        )
        character["performanceCues"] = 0
        if character.get("status") in {"persona prompt", "performance discussion"}:
            character["status"] = "character-name context candidate"
        character["performanceStatus"] = (
            "not-established-from-automatic-captions"
        )
        character["evidence"] = evidence(
            excerpt_status=(
                "short-caption-fragment"
                if character["receipt"]
                else "withheld-public-safety-filter"
            )
        )


def build_payload() -> dict[str, Any]:
    atlas, records = batch1.atlas_records()
    validate_selection(atlas, records)
    streams: list[dict[str, Any]] = []
    caption_hashes: dict[str, str] = {}

    for selected in SELECTION:
        video_id = selected["id"]
        path = batch1.caption_path(video_id)
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
        last = max(
            (line["start"] + line["duration"] for line in lines),
            default=0,
        )
        stream["archivePriority"] = {
            "version": PRIORITY_VERSION,
            "currentRank": selected["rank"],
            "rankStatus": "frozen-atlas-priority",
            "score": selected["score"],
            "breakdown": selected["breakdown"],
            "signals": selected["signals"],
            "basis": (
                "frozen view-gravity + recency + franchise-title metadata score; "
                "not ranked by views alone"
            ),
            "pool": "metadata-only after Archive Deep Batch 01 exclusion",
        }
        stream["contentMode"] = selected["contentMode"]
        stream["rightsPolicy"] = {
            "mode": selected["rightsMode"],
            "restrictedToTopicNavigation": selected["restricted"],
            "publicExcerptWordLimit": EXCERPT_WORD_LIMIT,
            "speakerClaimsAllowed": False,
            "performerClaimsAllowed": False,
            "originClaimsAllowed": False,
            "visualClaimsAllowed": False,
            "promotionAllowed": False,
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
            "payloadSha256": caption_hash,
            "fullPayloadPublic": False,
            "speakerDiarized": False,
            "originAttribution": False,
        }
        streams.append(stream)

    normalize_indices(streams)
    for stream, selected in zip(streams, SELECTION, strict=True):
        restrict_stream(stream, selected)
        rewrite_editorial(stream, selected)

    topic_index = aggregate_topics(streams)
    character_index = aggregate_characters(streams)
    selection_records = [
        {
            "id": selected["id"],
            "currentPriorityRank": selected["rank"],
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
        "channel": {
            "id": CHANNEL_ID,
            "label": "We Watched A Movie",
            "platform": "youtube",
            "canonicalUrl": "https://www.youtube.com/@WeWatchedAMovie",
        },
        "lane": {
            "id": LANE_ID,
            "kind": "caption-audited-quarantine",
            "sequence": 2,
            "integrationStatus": "integrated-quarantine",
            "promotionAllowed": False,
            "requiresAuthenticatedReview": True,
        },
        "scope": (
            "The exact next ten frozen Atlas-priority sources after Batch 01 "
            "exclusion at the 2026-07-23 selection snapshot. Priority combines "
            "cached-view gravity, upload recency, and franchise-title signal; "
            "cached views remain a separate measurement."
        ),
        "method": (
            "Complete available English automatic-caption pass using the proven "
            "livestream topic, signal, and character-name context analyzers. Full "
            "captions stay private; no speaker, performer, performance, quote "
            "origin, or visual identity is inferred."
        ),
        "selection": {
            "priorityVersion": PRIORITY_VERSION,
            "atlasSnapshotDate": SELECTION_DATE,
            "sourceAtlasArchiveSha256": SOURCE_ATLAS_SHA256,
            "excludedLaneIds": ["archive-deep-batch-01"],
            "excludedSourceIdsSha256": batch1.sha256_label(list(BATCH1_IDS)),
            "frozen": True,
            "records": selection_records,
        },
        "evidencePolicy": {
            "privateInput": "full YouTube JSON3 automatic captions",
            "publicInput": "aggregate measurements and short timestamped receipts",
            "publicExcerptWordLimit": EXCERPT_WORD_LIMIT,
            "speakerDiarized": False,
            "performerAttribution": False,
            "performanceEstablished": False,
            "originAttribution": False,
            "visualContextVerified": False,
            "candidateState": "quarantined",
            "restrictedModes": [
                "trailer-reaction",
                "script-reading",
                "watch-party",
            ],
            "restrictedSurface": (
                "Topic names, counts, and timestamps only; excerpt, comedy, "
                "character, and heat surfaces withheld."
            ),
            "visualRankingSurface": (
                "Caption-derived navigation and short candidates only; visual "
                "ranking context remains unverified."
            ),
        },
        "meta": {
            "streams": len(streams),
            "captioned": sum(stream["captioned"] for stream in streams),
            "restricted": sum(
                stream["rightsPolicy"]["restrictedToTopicNavigation"]
                for stream in streams
            ),
            "visualContextUnverified": sum(
                stream["rightsPolicy"]["mode"] == "visual-context-unverified"
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
            "selectionSha256": batch1.sha256_label(selection_records),
            "captionSetSha256": batch1.sha256_label(caption_hashes),
        },
    }
    payload["fingerprints"]["publicFnv1a"] = batch1.fnv1a32(
        batch1.stable_json(streams)
    )
    validate_payload(payload)
    return payload


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
    streams = payload["streams"]
    assert payload["schema"] == SCHEMA
    assert payload["channel"]["id"] == CHANNEL_ID
    assert payload["lane"]["id"] == LANE_ID
    assert payload["lane"]["integrationStatus"] == "integrated-quarantine"
    assert payload["lane"]["promotionAllowed"] is False
    assert len(streams) == len(SELECTION) == 10
    assert [stream["id"] for stream in streams] == [
        selected["id"] for selected in SELECTION
    ]
    assert len({stream["id"] for stream in streams}) == len(streams)
    assert not set(BATCH1_IDS) & {stream["id"] for stream in streams}
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
    excerpts = list(iter_public_excerpts(payload))
    assert all(words(excerpt) <= EXCERPT_WORD_LIMIT for excerpt in excerpts)
    assert all(
        not DISALLOWED_EXCERPT.search(excerpt)
        and not PUBLIC_REJECT.search(excerpt)
        for excerpt in excerpts
    )
    for stream in streams:
        policy = stream["rightsPolicy"]
        assert stream["archivePriority"]["rankStatus"] == "frozen-atlas-priority"
        assert "not ranked by views alone" in stream["archivePriority"]["basis"]
        assert "Frozen Atlas priority" in stream["editorial"]["whyItMatters"]
        assert "Cached views are a separate snapshot measurement" in (
            stream["editorial"]["whyItMatters"]
        )
        assert policy["speakerClaimsAllowed"] is False
        assert policy["performerClaimsAllowed"] is False
        assert policy["originClaimsAllowed"] is False
        assert policy["visualClaimsAllowed"] is False
        assert policy["promotionAllowed"] is False
        if policy["restrictedToTopicNavigation"]:
            assert not stream["moments"]
            assert not stream["characters"]
            assert not stream["heatmap"]
            assert stream["peak"] is None
            assert all(topic["receipt"] is None for topic in stream["topics"])
        else:
            assert len(stream["heatmap"]) == 30
            assert stream["moments"]
        assert all(
            character["performanceCues"] == 0
            and character["performanceStatus"]
            == "not-established-from-automatic-captions"
            for character in stream["characters"]
        )
        assert len(stream["topics"]) == 10
    meta = payload["meta"]
    assert meta["streams"] == len(streams)
    assert meta["captioned"] == len(streams)
    assert meta["restricted"] == 3
    assert meta["visualContextUnverified"] == 3
    assert meta["wordsAudited"] == sum(stream["wordsAudited"] for stream in streams)
    assert meta["captionEvents"] == sum(
        stream["captionEvidence"]["eventsAudited"] for stream in streams
    )
    assert payload["fingerprints"]["publicFnv1a"] == batch1.fnv1a32(
        batch1.stable_json(streams)
    )
    serialized = batch1.stable_json(payload)
    lowered = serialized.lower()
    assert "by archived views" not in lowered
    assert "view-count snapshot" not in lowered
    assert "explicit performance cue" not in lowered
    assert "persona prompt" not in lowered
    assert "performance discussion" not in lowered
    assert '"events":[' not in serialized
    assert '"segs":[' not in serialized


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
            "Refresh all ten private JSON3 caption caches using the existing "
            "yt-dlp client fallback chain."
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
            result = batch1.fetch_caption(selected["id"])
            print(
                f"{index:>2}/10 {selected['id']} captions via {result['client']}",
                flush=True,
            )

    payload = build_payload()
    source = render(payload)
    source_bytes = source.encode("utf-8")
    public_bytes = len(source_bytes)
    if public_bytes >= MAX_PUBLIC_BYTES:
        raise RuntimeError(
            f"Public Archive Deep Batch 02 is {public_bytes:,} bytes; "
            f"limit is {MAX_PUBLIC_BYTES:,}"
        )

    if args.check:
        if not OUTPUT_PATH.exists():
            raise RuntimeError(f"Missing generated artifact: {OUTPUT_PATH}")
        if OUTPUT_PATH.read_bytes() != source_bytes:
            raise RuntimeError(
                "Archive Deep Batch 02 is stale; run "
                "pipeline/wwam_archive_deep_batch2.py"
            )
        print(
            f"Validated {OUTPUT_PATH.name}: {payload['meta']['streams']} streams, "
            f"{payload['meta']['wordsAudited']:,} words, "
            f"{public_bytes:,} public bytes."
        )
        return 0

    OUTPUT_PATH.write_bytes(source_bytes)
    print(
        f"Wrote {OUTPUT_PATH}: {payload['meta']['streams']} streams, "
        f"{public_bytes:,} public bytes."
    )
    print(json.dumps(payload["meta"], indent=2))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as error:
        print(f"ERROR: {error}", file=sys.stderr)
        raise
