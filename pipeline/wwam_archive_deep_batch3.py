#!/usr/bin/env python3
"""Build WWAM Archive Deep Batch 03 as a frozen quarantine evidence lane.

The selection is the exact next ten Archive Atlas priority records after
Archive Deep Batches 01 and 02 leave the metadata-only pool. Complete YouTube
JSON3 automatic-caption payloads remain in the gitignored source cache. The
public artifact contains aggregate measurements, bounded topic navigation, and
short timestamped machine candidates only.

The SAW X trailer stream and Freddy death-scene ranking remain
topic-navigation-only because automatic captions cannot establish whether
dialogue came from a host, trailer, or film clip. Poster, tier-list, and
character-ranking sources may expose caption-derived candidates, but visual
context remains explicitly unverified. No source makes a speaker, performer,
performance, quote-origin, visual-outcome, canon, or promotion claim.
"""

from __future__ import annotations

import argparse
import json
from typing import Any, Iterable

import wwam_archive_deep_batch2 as batch2
import wwam_archive_deep_distill as batch1
from wwam_deep_distill import DISALLOWED_EXCERPT, parse_json3
from wwam_popular_live_distill import (
    PUBLIC_REJECT,
    aggregate_characters,
    aggregate_topics,
    build_stream,
    normalize_indices,
)


OUTPUT_PATH = batch1.PUBLIC / "archive-deep-batch3.js"
PUBLIC_ASSIGNMENT = "WWAM_ARCHIVE_DEEP_BATCH3"
SCHEMA = "shokker-youtube-wiki/archive-deep-batch/v1"
CHANNEL_ID = "we-watched-a-movie"
LANE_ID = "archive-deep-batch-03"
SELECTION_DATE = "2026-07-23"
GENERATED_DATE = "2026-07-24"
CAPTION_OBSERVED_AT = "2026-07-24T09:59:08Z"
PRIORITY_VERSION = "archive-distill-priority/v1"
SOURCE_ATLAS_SHA256 = (
    "sha256:8799e6de57d891952902bfaf26fe36839b75581cf7c3707f333473b3dcb75da5"
)
EXCLUDED_SOURCE_IDS_SHA256 = (
    "sha256:3ad06017c627aae67ab99e4207fca92b583b77e2a57f912dbbb76d3bfddb0cf8"
)
EXPECTED_SELECTION_SHA256 = (
    "sha256:a06f9b2858be38a47fc83d003809f59e994756da68f01c88b46105754f1b6aa8"
)
EXPECTED_CAPTION_SET_SHA256 = (
    "sha256:9251fdad02633189fd19071a641271b1ff9926ae1e392806f1e1ea9d8c49b1cb"
)
EXCERPT_WORD_LIMIT = 16
MAX_PUBLIC_BYTES = 125_000

EXCLUDED_IDS: tuple[str, ...] = (
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
    "CFUHyfcJDTg",
    "o4EMYqQ5DDU",
    "Z7ArdfA054w",
    "k698GIJe8EA",
    "4X8EFw7MCmw",
    "KIGg_I72x_M",
    "o2O9T4nwVw4",
    "qONN2sNoK2k",
    "QxJyVaAgZ_Y",
    "0svLtx3nZJM",
)

# Frozen from Archive Atlas getDistillQueue({limit: 10}) after Batch 02
# exclusion. This is an editorial work queue, not raw view rank.
SELECTION: tuple[dict[str, Any], ...] = (
    {
        "id": "M9_5cX8xowI",
        "rank": 1,
        "score": 86.8,
        "breakdown": {"popularity": 45.9, "recency": 20.9, "franchise": 20},
        "signals": ["Halloween"],
        "contentMode": "franchise-discussion",
        "rightsMode": "standard-caption-candidates",
        "restricted": False,
    },
    {
        "id": "tUJviU09fWM",
        "rank": 2,
        "score": 86.8,
        "breakdown": {"popularity": 44.1, "recency": 28.7, "franchise": 14},
        "signals": ["Texas Chainsaw"],
        "contentMode": "visual-ranking",
        "rightsMode": "visual-context-unverified",
        "restricted": False,
    },
    {
        "id": "J5uGidPT9Jc",
        "rank": 3,
        "score": 85.8,
        "breakdown": {"popularity": 43.8, "recency": 28.0, "franchise": 14},
        "signals": ["Saw"],
        "contentMode": "visual-ranking",
        "rightsMode": "visual-context-unverified",
        "restricted": False,
    },
    {
        "id": "nv99WEtXGvE",
        "rank": 4,
        "score": 85.7,
        "breakdown": {"popularity": 46.2, "recency": 19.5, "franchise": 20},
        "signals": ["A Nightmare on Elm Street"],
        "contentMode": "death-scene-ranking",
        "rightsMode": "film-clip-audio-boundary-unverified",
        "restricted": True,
    },
    {
        "id": "wjJy46oVmow",
        "rank": 5,
        "score": 85.6,
        "breakdown": {"popularity": 46.3, "recency": 19.3, "franchise": 20},
        "signals": ["Halloween", "Friday the 13th"],
        "contentMode": "franchise-discussion",
        "rightsMode": "standard-caption-candidates",
        "restricted": False,
    },
    {
        "id": "yMAvXBYAxko",
        "rank": 6,
        "score": 85.5,
        "breakdown": {"popularity": 47.0, "recency": 18.5, "franchise": 20},
        "signals": ["Halloween", "The Exorcist", "Saw"],
        "contentMode": "trailer-reaction",
        "rightsMode": "trailer-audio-boundary-unverified",
        "restricted": True,
    },
    {
        "id": "fUCQoxTwKqo",
        "rank": 7,
        "score": 84.8,
        "breakdown": {"popularity": 45.7, "recency": 19.1, "franchise": 20},
        "signals": ["Halloween"],
        "contentMode": "q-and-a",
        "rightsMode": "standard-caption-candidates",
        "restricted": False,
    },
    {
        "id": "3UCnMrLMXbI",
        "rank": 8,
        "score": 84.7,
        "breakdown": {"popularity": 43.0, "recency": 27.7, "franchise": 14},
        "signals": ["Alien / Predator"],
        "contentMode": "visual-ranking",
        "rightsMode": "visual-context-unverified",
        "restricted": False,
    },
    {
        "id": "lH0EXRN4xdw",
        "rank": 9,
        "score": 84.6,
        "breakdown": {"popularity": 47.6, "recency": 17.0, "franchise": 20},
        "signals": ["Scream"],
        "contentMode": "spoiler-review",
        "rightsMode": "standard-caption-candidates",
        "restricted": False,
    },
    {
        "id": "xBOTTKQ9pxU",
        "rank": 10,
        "score": 84.1,
        "breakdown": {"popularity": 47.0, "recency": 17.1, "franchise": 20},
        "signals": ["Scream"],
        "contentMode": "visual-ranking",
        "rightsMode": "visual-context-unverified",
        "restricted": False,
    },
)


def selection_records(
    records: dict[str, dict[str, Any]],
) -> list[dict[str, Any]]:
    return [
        {
            "id": selected["id"],
            "currentPriorityRank": selected["rank"],
            "priorityScore": selected["score"],
            "breakdown": selected["breakdown"],
            "snapshotViews": records[selected["id"]]["views"],
        }
        for selected in SELECTION
    ]


def integrated_at_or_after_batch3(record: dict[str, Any]) -> bool:
    """Return whether an Atlas record was promoted in Batch 03 or later."""
    for lane in record.get("lanes", []):
        if lane == "year-canon-2025-2026":
            return True
        match = batch2.ARCHIVE_DEEP_BATCH_LANE.fullmatch(str(lane))
        if match and int(match.group(1)) >= 3:
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
    overlap = sorted(set(EXCLUDED_IDS) & {selected["id"] for selected in SELECTION})
    if overlap:
        raise RuntimeError(f"Batch 03 overlaps an earlier Archive Deep batch: {overlap}")
    if batch1.sha256_label(list(EXCLUDED_IDS)) != EXCLUDED_SOURCE_IDS_SHA256:
        raise RuntimeError("The frozen Batch 01 + Batch 02 exclusion set changed")

    # This remains reproducible after downstream Atlas integration. Restore the
    # selected records and every later Archive Deep lane to their pre-Batch-03
    # metadata-only state, then require the exact source Atlas fingerprint and
    # priority queue.
    selected_ids = {selected["id"] for selected in SELECTION}
    source_records = []
    for record in atlas["records"]:
        restored = dict(record)
        if (
            record["id"] in selected_ids
            or integrated_at_or_after_batch3(record)
        ):
            restored["coverage"] = "metadata-only"
            restored["lanes"] = ["archive-metadata"]
        restored["availability"] = "not-captured"
        restored["liveStatus"] = "not-captured"
        source_records.append(restored)
    reconstructed_sha256 = batch1.sha256_label(
        [batch2.canonical_atlas_record(record) for record in source_records]
    )
    if reconstructed_sha256 != SOURCE_ATLAS_SHA256:
        raise RuntimeError(
            "Archive Atlas cannot reproduce the frozen Batch 03 selection source"
        )
    queue = batch1.expected_queue(
        {"snapshotDate": atlas["snapshotDate"], "records": source_records}
    )[: len(SELECTION)]
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
    if batch1.sha256_label(selection_records(records)) != EXPECTED_SELECTION_SHA256:
        raise RuntimeError("The frozen Batch 03 selection manifest changed")


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
            "pool": (
                "metadata-only after Archive Deep Batch 01 and Batch 02 exclusion"
            ),
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
        batch2.restrict_stream(stream, selected)
        # Five per source keeps the artifact bounded while preserving the
        # strongest deterministic caption candidates from every safe source.
        stream["moments"] = stream["moments"][:5]
        batch2.rewrite_editorial(stream, selected)
        topic_names = ", ".join(topic["name"] for topic in stream["topics"][:3])
        stream["summary"] = (
            f"Frozen Atlas priority #{selected['rank']}; caption map: "
            f"{topic_names or 'indexed topics'}. "
            + (
                "Public candidate surfaces are withheld under the source-audio "
                "firewall."
                if selected["restricted"]
                else "All short candidates remain machine-surfaced and quarantined."
            )
        )

    topic_index = aggregate_topics(streams)
    character_index = aggregate_characters(streams)
    frozen_records = selection_records(records)
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
            "sequence": 3,
            "integrationStatus": "integrated-quarantine",
            "promotionAllowed": False,
            "requiresAuthenticatedReview": True,
        },
        "scope": (
            "The exact next ten frozen Atlas-priority sources after Archive Deep "
            "Batch 01 and Batch 02 exclusion at the 2026-07-23 selection snapshot. "
            "Priority combines cached-view gravity, upload recency, and "
            "franchise-title signal; cached views remain a separate measurement."
        ),
        "method": (
            "Complete available English automatic-caption pass using the proven "
            "livestream topic, signal, and character-name context analyzers. Full "
            "captions stay private; no speaker, performer, performance, quote "
            "origin, visual identity, or visual outcome is inferred."
        ),
        "selection": {
            "priorityVersion": PRIORITY_VERSION,
            "atlasSnapshotDate": SELECTION_DATE,
            "sourceAtlasArchiveSha256": SOURCE_ATLAS_SHA256,
            "excludedLaneIds": [
                "archive-deep-batch-01",
                "archive-deep-batch-02",
            ],
            "excludedSourceIdsSha256": EXCLUDED_SOURCE_IDS_SHA256,
            "frozen": True,
            "records": frozen_records,
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
                "death-scene-ranking",
            ],
            "restrictedSurface": (
                "Topic names, counts, and timestamps only; excerpt, comedy, "
                "character, heat, and visual-outcome surfaces withheld."
            ),
            "visualRankingSurface": (
                "Caption-derived navigation and short candidates only; visual "
                "ranking context and outcomes remain unverified."
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
            "selectionSha256": batch1.sha256_label(frozen_records),
            "captionSetSha256": batch1.sha256_label(caption_hashes),
        },
    }
    payload["fingerprints"]["publicFnv1a"] = batch1.fnv1a32(
        batch1.stable_json(streams)
    )
    validate_payload(payload)
    return payload


def iter_public_excerpts(payload: dict[str, Any]) -> Iterable[str]:
    yield from batch2.iter_public_excerpts(payload)


def validate_payload(payload: dict[str, Any]) -> None:
    streams = payload["streams"]
    expected_ids = [selected["id"] for selected in SELECTION]
    restricted_ids = {"nv99WEtXGvE", "yMAvXBYAxko"}
    visual_ids = {
        "tUJviU09fWM",
        "J5uGidPT9Jc",
        "3UCnMrLMXbI",
        "xBOTTKQ9pxU",
    }

    assert payload["schema"] == SCHEMA
    assert payload["channel"]["id"] == CHANNEL_ID
    assert payload["lane"] == {
        "id": LANE_ID,
        "kind": "caption-audited-quarantine",
        "sequence": 3,
        "integrationStatus": "integrated-quarantine",
        "promotionAllowed": False,
        "requiresAuthenticatedReview": True,
    }
    assert [stream["id"] for stream in streams] == expected_ids
    assert len(streams) == len(set(expected_ids)) == 10
    assert not set(EXCLUDED_IDS) & set(expected_ids)
    assert payload["selection"]["excludedLaneIds"] == [
        "archive-deep-batch-01",
        "archive-deep-batch-02",
    ]
    assert (
        payload["selection"]["excludedSourceIdsSha256"]
        == EXCLUDED_SOURCE_IDS_SHA256
    )
    assert (
        payload["fingerprints"]["selectionSha256"]
        == EXPECTED_SELECTION_SHA256
    )
    assert (
        payload["fingerprints"]["captionSetSha256"]
        == EXPECTED_CAPTION_SET_SHA256
    )
    assert all(stream["captioned"] for stream in streams)
    assert all(
        stream["captionEvidence"]["durationCoveragePercent"] >= 99.8
        and stream["captionEvidence"]["speakerDiarized"] is False
        and stream["captionEvidence"]["originAttribution"] is False
        for stream in streams
    )

    excerpts = list(iter_public_excerpts(payload))
    assert all(batch2.words(excerpt) <= EXCERPT_WORD_LIMIT for excerpt in excerpts)
    assert all(
        not DISALLOWED_EXCERPT.search(excerpt)
        and not PUBLIC_REJECT.search(excerpt)
        for excerpt in excerpts
    )
    for stream in streams:
        policy = stream["rightsPolicy"]
        assert stream["archivePriority"]["rankStatus"] == "frozen-atlas-priority"
        assert "not ranked by views alone" in stream["archivePriority"]["basis"]
        assert "Batch 01 and Batch 02 exclusion" in stream["archivePriority"]["pool"]
        assert "Frozen Atlas priority" in stream["editorial"]["whyItMatters"]
        assert "Cached views are a separate snapshot measurement" in (
            stream["editorial"]["whyItMatters"]
        )
        assert policy["speakerClaimsAllowed"] is False
        assert policy["performerClaimsAllowed"] is False
        assert policy["originClaimsAllowed"] is False
        assert policy["visualClaimsAllowed"] is False
        assert policy["promotionAllowed"] is False
        assert len(stream["topics"]) == 10
        if stream["id"] in restricted_ids:
            assert policy["restrictedToTopicNavigation"] is True
            assert not stream["moments"]
            assert not stream["characters"]
            assert not stream["heatmap"]
            assert stream["peak"] is None
            assert all(topic["receipt"] is None for topic in stream["topics"])
            assert all(value is None for value in stream["indices"].values())
        else:
            assert policy["restrictedToTopicNavigation"] is False
            assert len(stream["heatmap"]) == 30
            assert 1 <= len(stream["moments"]) <= 5
        if stream["id"] in visual_ids:
            assert policy["mode"] == "visual-context-unverified"
        assert all(
            character["performanceCues"] == 0
            and character["performanceStatus"]
            == "not-established-from-automatic-captions"
            for character in stream["characters"]
        )

    meta = payload["meta"]
    assert meta["streams"] == 10
    assert meta["captioned"] == 10
    assert meta["restricted"] == 2
    assert meta["visualContextUnverified"] == 4
    assert meta["hours"] == 30.4
    assert meta["wordsAudited"] == 378_427
    assert meta["captionEvents"] == 53_988
    assert meta["topicLanes"] == 100
    assert meta["snapshotViews"] == 121_211
    assert meta["publicMomentCandidates"] == sum(
        len(stream["moments"]) for stream in streams
    )
    assert meta["characterSignals"] == sum(
        len(stream["characters"]) for stream in streams
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
    assert '"transcript":' not in serialized
    assert '"speaker":' not in serialized
    assert '"performer":' not in serialized


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
            "Refresh all ten private JSON3 caption caches using the established "
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
            f"Public Archive Deep Batch 03 is {public_bytes:,} bytes; "
            f"limit is {MAX_PUBLIC_BYTES:,}"
        )

    if args.check:
        if not OUTPUT_PATH.exists():
            raise RuntimeError(f"Missing generated artifact: {OUTPUT_PATH}")
        if OUTPUT_PATH.read_bytes() != source_bytes:
            raise RuntimeError(
                "Archive Deep Batch 03 is stale; run "
                "pipeline/wwam_archive_deep_batch3.py"
            )
        print(
            f"Validated {OUTPUT_PATH.name}: {payload['meta']['streams']} streams, "
            f"{payload['meta']['wordsAudited']:,} words, "
            f"{payload['meta']['publicMomentCandidates']} moment candidates, "
            f"{payload['meta']['characterSignals']} character signals, "
            f"{public_bytes:,} public bytes."
        )
        return 0

    OUTPUT_PATH.write_bytes(source_bytes)
    print(
        f"Wrote {OUTPUT_PATH}: {payload['meta']['streams']} streams, "
        f"{payload['meta']['wordsAudited']:,} words, "
        f"{payload['meta']['publicMomentCandidates']} moment candidates, "
        f"{payload['meta']['characterSignals']} character signals, "
        f"{public_bytes:,} public bytes."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
