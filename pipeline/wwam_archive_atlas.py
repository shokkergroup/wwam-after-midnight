#!/usr/bin/env python3
"""Build the WWAM Archive Atlas from the local source cache and deep lanes.

No network access is used. The Atlas preserves the official Streams-feed
membership captured on 2026-07-23, exposes only video metadata, and joins that
metadata to the public Fresh 10, Popular 25, two independently fingerprinted
Archive Deep batches, and commentary catalog solely to describe the current
indexing lane. It never promotes an undistilled title into transcript knowledge.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / "source-cache" / "metadata"
PUBLIC = ROOT / "public" / "demo"
OUTPUT = PUBLIC / "archive-atlas-data.js"

CATALOG_PATH = PUBLIC / "catalog.js"
FRESH_PATH = PUBLIC / "livestream-distill.js"
POPULAR_PATH = PUBLIC / "popular-live-distill.js"
ARCHIVE_DEEP_PATH = PUBLIC / "archive-deep-distill.js"
ARCHIVE_DEEP_BATCH2_PATH = PUBLIC / "archive-deep-batch2.js"

SNAPSHOT_DATE = "2026-07-23"
EXPECTED_FEED_ENTRIES = 472
EXPECTED_ARCHIVE_DEEP_BATCH_ENTRIES = 10
EXPECTED_ARCHIVE_DEEP_ENTRIES = 20
EXPECTED_DEEPLY_INDEXED = 54
EXPECTED_METADATA_ONLY = 410
EXPECTED_CAPTION_LIMITED = 8
MAX_PUBLIC_BYTES = 250_000

# The official Streams snapshot and commentary catalog overlap once. The other
# commentary sources were cached before the feed sweep but are not feed
# members. Keeping this reconciliation explicit prevents directory contents
# from being mistaken for official-feed membership.
FEED_CATALOG_OVERLAP = frozenset({"3wK00_-K-Y0"})

ASSIGNMENT_RE = re.compile(r"^window\.([A-Z0-9_]+)\s*=\s*(.*);\s*$", re.S)


def read_assignment(path: Path, expected: str) -> Any:
    match = ASSIGNMENT_RE.match(path.read_text(encoding="utf-8"))
    if not match or match.group(1) != expected:
        raise RuntimeError(f"{path.name} is not a window.{expected} assignment")
    return json.loads(match.group(2))


def clean(value: Any) -> str:
    return re.sub(r"\s+", " ", str(value or "")).strip()


def iso_date(value: Any) -> str:
    raw = clean(value)
    if not re.fullmatch(r"\d{8}", raw):
        raise RuntimeError(f"Invalid cached upload date: {raw!r}")
    return f"{raw[:4]}-{raw[4:6]}-{raw[6:]}"


def stable_json(value: Any) -> str:
    def javascript_value(item: Any) -> Any:
        # Public artifacts are fingerprinted against JSON.stringify semantics,
        # where 43.0 and 43 serialize identically.
        if isinstance(item, float) and item.is_integer():
            return int(item)
        if isinstance(item, list):
            return [javascript_value(child) for child in item]
        if isinstance(item, tuple):
            return [javascript_value(child) for child in item]
        if isinstance(item, dict):
            return {
                key: javascript_value(child)
                for key, child in item.items()
            }
        return item

    return json.dumps(
        javascript_value(value),
        ensure_ascii=False,
        sort_keys=True,
        separators=(",", ":"),
    )


def sha256_label(value: Any) -> str:
    return "sha256:" + hashlib.sha256(stable_json(value).encode("utf-8")).hexdigest()


def fnv1a32(text: str) -> str:
    value = 0x811C9DC5
    for byte in text.encode("utf-8"):
        value ^= byte
        value = (value * 0x01000193) & 0xFFFFFFFF
    return f"fnv1a32:{value:08x}"


def load_metadata() -> dict[str, dict[str, Any]]:
    records: dict[str, dict[str, Any]] = {}
    for path in sorted(CACHE.glob("*.json")):
        payload = json.loads(path.read_text(encoding="utf-8"))
        video_id = clean(payload.get("id"))
        if not video_id or video_id != path.stem:
            raise RuntimeError(f"Metadata ID mismatch in {path.name}")
        if video_id in records:
            raise RuntimeError(f"Duplicate metadata ID: {video_id}")
        records[video_id] = payload
    return records


def validate_archive_deep_batch(
    payload: dict[str, Any],
    *,
    schema: str,
    selection_rank_key: str,
    stream_rank_key: str,
) -> list[dict[str, Any]]:
    """Validate an Archive Deep artifact without weakening either schema."""
    if payload.get("schema") != schema:
        raise RuntimeError(f"Archive Deep lane has unsupported schema {payload.get('schema')!r}")
    streams = payload.get("streams") or []
    selection = payload.get("selection") or {}
    selection_records = selection.get("records") or []
    if (
        len(streams) != EXPECTED_ARCHIVE_DEEP_BATCH_ENTRIES
        or len(selection_records) != EXPECTED_ARCHIVE_DEEP_BATCH_ENTRIES
        or len({item.get("id") for item in streams})
        != EXPECTED_ARCHIVE_DEEP_BATCH_ENTRIES
    ):
        raise RuntimeError("Each Archive Deep batch must contain ten unique sources")
    stream_ids = [item.get("id") for item in streams]
    if stream_ids != [item.get("id") for item in selection_records]:
        raise RuntimeError("Archive Deep stream order does not match frozen selection")
    if selection.get("priorityVersion") != "archive-distill-priority/v1":
        raise RuntimeError("Archive Deep priority provenance is unsupported")
    if selection.get("atlasSnapshotDate") != SNAPSHOT_DATE:
        raise RuntimeError("Archive Deep selection snapshot date changed")
    if not re.fullmatch(
        r"sha256:[a-f0-9]{64}",
        str(selection.get("sourceAtlasArchiveSha256") or ""),
    ):
        raise RuntimeError("Archive Deep selection lacks its source Atlas fingerprint")

    for expected_rank, (stream, selected) in enumerate(
        zip(streams, selection_records, strict=True),
        1,
    ):
        priority = stream.get("archivePriority") or {}
        if (
            selected.get(selection_rank_key) != expected_rank
            or priority.get(stream_rank_key) != expected_rank
            or selected.get("priorityScore") != priority.get("score")
            or selected.get("breakdown") != priority.get("breakdown")
            or selected.get("snapshotViews") != stream.get("views")
            or priority.get("version") != selection.get("priorityVersion")
        ):
            raise RuntimeError(
                f"Archive Deep frozen priority provenance failed at rank {expected_rank}"
            )
        if not stream.get("captioned"):
            raise RuntimeError(
                f"Archive Deep source {stream.get('id')} lacks a caption-backed distill"
            )

    fingerprints = payload.get("fingerprints") or {}
    if fingerprints.get("selectionSha256") != sha256_label(selection_records):
        raise RuntimeError("Archive Deep selection fingerprint mismatch")
    if fingerprints.get("publicFnv1a") != fnv1a32(stable_json(streams)):
        raise RuntimeError("Archive Deep public-stream fingerprint mismatch")
    if not re.fullmatch(
        r"sha256:[a-f0-9]{64}",
        str(fingerprints.get("captionSetSha256") or ""),
    ):
        raise RuntimeError("Archive Deep caption-set fingerprint is missing")
    return streams


def archive_deep_provenance(
    *,
    batch_id: str,
    atlas_lane: str,
    payload: dict[str, Any],
) -> dict[str, Any]:
    selection = payload["selection"]
    fingerprints = payload["fingerprints"]
    provenance = {
        "batchId": batch_id,
        "atlasLane": atlas_lane,
        "sources": len(payload["streams"]),
        "schema": payload["schema"],
        "generated": payload.get("generated"),
        "observedAt": payload.get("observedAt"),
        "priorityVersion": selection.get("priorityVersion"),
        "selectionSourceAtlasSha256": selection.get("sourceAtlasArchiveSha256"),
        "selectionSha256": fingerprints.get("selectionSha256"),
        "captionSetSha256": fingerprints.get("captionSetSha256"),
        "publicFnv1a": fingerprints.get("publicFnv1a"),
    }
    if payload.get("lane"):
        provenance["artifactLane"] = payload["lane"].get("id")
        provenance["integrationStatus"] = payload["lane"].get("integrationStatus")
        provenance["promotionAllowed"] = payload["lane"].get("promotionAllowed")
    return provenance


def archive_deep_totals(*payloads: dict[str, Any]) -> dict[str, Any]:
    metas = [payload.get("meta") or {} for payload in payloads]
    return {
        "batches": len(payloads),
        "sources": sum(int(meta.get("streams") or 0) for meta in metas),
        "hours": round(sum(float(meta.get("hours") or 0) for meta in metas), 1),
        "wordsAudited": sum(int(meta.get("wordsAudited") or 0) for meta in metas),
        "captionEvents": sum(int(meta.get("captionEvents") or 0) for meta in metas),
        "topicLanes": sum(int(meta.get("topicLanes") or 0) for meta in metas),
        "publicMomentCandidates": sum(
            int(meta.get("publicMomentCandidates") or 0) for meta in metas
        ),
        "characterSignals": sum(
            int(meta.get("characterSignals") or 0) for meta in metas
        ),
        "snapshotViews": sum(int(meta.get("snapshotViews") or 0) for meta in metas),
        "restricted": sum(int(meta.get("restricted") or 0) for meta in metas),
    }


def coverage_maps() -> tuple[
    set[str],
    dict[str, bool],
    dict[str, list[str]],
    dict[str, Any],
]:
    catalog = read_assignment(CATALOG_PATH, "WWAM_CATALOG")
    fresh = read_assignment(FRESH_PATH, "WWAM_LIVESTREAMS")
    popular = read_assignment(POPULAR_PATH, "WWAM_POPULAR_LIVE")
    archive_deep = read_assignment(ARCHIVE_DEEP_PATH, "WWAM_ARCHIVE_DEEP")
    archive_deep_batch2 = read_assignment(
        ARCHIVE_DEEP_BATCH2_PATH,
        "WWAM_ARCHIVE_DEEP_BATCH2",
    )
    archive_deep_streams = validate_archive_deep_batch(
        archive_deep,
        schema="wwam-archive-deep-distill/v1",
        selection_rank_key="originalRank",
        stream_rank_key="originalRank",
    )
    archive_deep_batch2_streams = validate_archive_deep_batch(
        archive_deep_batch2,
        schema="shokker-youtube-wiki/archive-deep-batch/v1",
        selection_rank_key="currentPriorityRank",
        stream_rank_key="currentRank",
    )
    if set(item["id"] for item in archive_deep_streams) & set(
        item["id"] for item in archive_deep_batch2_streams
    ):
        raise RuntimeError("Archive Deep batches overlap")
    if (
        (archive_deep_batch2.get("lane") or {}).get("id")
        != "archive-deep-batch-02"
        or (archive_deep_batch2.get("lane") or {}).get("integrationStatus")
        != "integrated-quarantine"
        or (archive_deep_batch2.get("lane") or {}).get("promotionAllowed") is not False
    ):
        raise RuntimeError("Archive Deep Batch 02 must remain integrated quarantine")

    catalog_ids = {item["id"] for item in catalog}
    captioned: dict[str, bool] = {}
    lanes: dict[str, list[str]] = {}

    for item in catalog:
        captioned[item["id"]] = bool(item.get("transcript"))
        lanes.setdefault(item["id"], []).append("commentary-catalog")
    for item in fresh.get("streams") or []:
        captioned[item["id"]] = bool(item.get("captioned"))
        lanes.setdefault(item["id"], []).append("fresh-10")
    for item in popular.get("streams") or []:
        captioned[item["id"]] = bool(item.get("captioned"))
        lanes.setdefault(item["id"], []).append("popular-25")
    for item in archive_deep_streams:
        captioned[item["id"]] = True
        lanes.setdefault(item["id"], []).append("archive-deep-10")
    for item in archive_deep_batch2_streams:
        captioned[item["id"]] = True
        lanes.setdefault(item["id"], []).append("archive-deep-batch-02")

    batch_provenance = [
        archive_deep_provenance(
            batch_id="archive-deep-batch-01",
            atlas_lane="archive-deep-10",
            payload=archive_deep,
        ),
        archive_deep_provenance(
            batch_id="archive-deep-batch-02",
            atlas_lane="archive-deep-batch-02",
            payload=archive_deep_batch2,
        ),
    ]
    deep_totals = archive_deep_totals(archive_deep, archive_deep_batch2)

    provenance = {
        "catalogSources": len(catalog),
        "freshSources": len(fresh.get("streams") or []),
        "popularSources": len(popular.get("streams") or []),
        "archiveDeepSources": deep_totals["sources"],
        "popularFeedEntries": int(
            (popular.get("selection") or {}).get("officialFeedEntries") or 0
        ),
        "freshGenerated": fresh.get("generated"),
        "popularGenerated": popular.get("generated"),
        "archiveDeepGenerated": archive_deep.get("generated"),
        "archiveDeepObservedAt": archive_deep.get("observedAt"),
        "archiveDeepSchema": archive_deep.get("schema"),
        "archiveDeepPriorityVersion": (
            archive_deep.get("selection") or {}
        ).get("priorityVersion"),
        "archiveDeepSelectionSha256": (
            archive_deep.get("fingerprints") or {}
        ).get("selectionSha256"),
        "archiveDeepPublicFnv1a": (
            archive_deep.get("fingerprints") or {}
        ).get("publicFnv1a"),
        "archiveDeepBatches": batch_provenance,
        "archiveDeepTotals": deep_totals,
    }
    return catalog_ids, captioned, lanes, provenance


def archive_members(
    metadata: dict[str, dict[str, Any]],
    catalog_ids: set[str],
) -> list[str]:
    ids = (set(metadata) - catalog_ids) | set(FEED_CATALOG_OVERLAP)
    if len(ids) != EXPECTED_FEED_ENTRIES:
        raise RuntimeError(
            "Official-feed reconciliation expected "
            f"{EXPECTED_FEED_ENTRIES} cached entries, found {len(ids)}"
        )
    missing = ids - set(metadata)
    if missing:
        raise RuntimeError(f"Feed metadata missing for: {sorted(missing)}")
    return sorted(ids)


def coverage_status(
    raw: dict[str, Any],
    video_id: str,
    captioned: dict[str, bool],
) -> str:
    if raw.get("_metadata_unavailable"):
        return "unavailable"
    if not raw.get("caption_url") or (
        video_id in captioned and not captioned[video_id]
    ):
        return "caption-limited"
    if captioned.get(video_id):
        return "deeply-indexed"
    return "metadata-only"


def canonical_record(record: dict[str, Any]) -> dict[str, Any]:
    """The exact record surface bound by both public fingerprints."""
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


def build_payload() -> dict[str, Any]:
    metadata = load_metadata()
    catalog_ids, captioned, lanes, source_provenance = coverage_maps()
    feed_ids = archive_members(metadata, catalog_ids)

    records = []
    for video_id in feed_ids:
        raw = metadata[video_id]
        title = clean(raw.get("title"))
        if not title:
            raise RuntimeError(f"Missing title for {video_id}")
        duration = int(raw.get("duration") or 0)
        views = int(raw.get("view_count") or 0)
        if duration < 0 or views < 0:
            raise RuntimeError(f"Negative metadata measurement for {video_id}")
        source_lanes = sorted(set(lanes.get(video_id) or ["archive-metadata"]))
        record = {
            "id": video_id,
            "title": title,
            "date": iso_date(raw.get("upload_date")),
            "duration": duration,
            "views": views,
            "thumbnail": f"https://i.ytimg.com/vi/{video_id}/maxresdefault.jpg",
            "url": f"https://www.youtube.com/watch?v={video_id}",
            # The legacy local cache did not preserve these two yt-dlp fields.
            # "not-captured" is deliberately different from "public" or
            # "was_live"; neither of those claims can be reconstructed.
            "availability": clean(raw.get("availability")) or "not-captured",
            "liveStatus": clean(raw.get("live_status")) or "not-captured",
            "coverage": coverage_status(raw, video_id, captioned),
            "lanes": source_lanes,
        }
        records.append(record)

    records.sort(key=lambda item: (item["date"], item["id"]), reverse=True)
    canonical = [canonical_record(record) for record in records]
    canonical_json = stable_json(canonical)

    coverage_counts = {
        status: sum(record["coverage"] == status for record in records)
        for status in (
            "deeply-indexed",
            "metadata-only",
            "caption-limited",
            "unavailable",
        )
    }
    lane_counts = {
        lane: sum(lane in record["lanes"] for record in records)
        for lane in (
            "fresh-10",
            "popular-25",
            "archive-deep-10",
            "archive-deep-batch-02",
            "commentary-catalog",
            "archive-metadata",
        )
    }
    years = [int(record["date"][:4]) for record in records]

    payload = {
        "schema": "wwam-archive-atlas/v1",
        "snapshotDate": SNAPSHOT_DATE,
        "cutoff": {
            "uploadedThrough": max(record["date"] for record in records),
            "newestKnownId": records[0]["id"],
            "officialFeedEntries": len(records),
            "membershipBasis": (
                "Local official /streams discovery snapshot reconciled against "
                "the commentary catalog; no live network refresh."
            ),
            "currentAvailabilityChecked": False,
        },
        "provenance": {
            "generator": "pipeline/wwam_archive_atlas.py",
            "networkUsed": False,
            "source": (
                "source-cache/metadata plus checked-in public source-lane artifacts"
            ),
            "snapshotPrecision": "day",
            "feedCatalogOverlap": sorted(FEED_CATALOG_OVERLAP),
            "fieldPolicy": (
                "Titles, dates, durations and views are cached YouTube metadata. "
                "Availability and live status say not-captured when absent from "
                "the legacy cache. Coverage never implies transcript knowledge "
                "for metadata-only records."
            ),
            "sourceLanes": source_provenance,
        },
        "fingerprints": {
            "feedSha256": sha256_label(feed_ids),
            "archiveSha256": sha256_label(canonical),
            "runtimeFnv1a": fnv1a32(canonical_json),
        },
        "stats": {
            "records": len(records),
            "coverage": coverage_counts,
            "deepCoveragePercent": round(
                100 * coverage_counts["deeply-indexed"] / len(records),
                1,
            ),
            "lanes": lane_counts,
            "yearStart": min(years),
            "yearEnd": max(years),
            "totalDurationSeconds": sum(record["duration"] for record in records),
            "viewsAtSnapshot": sum(record["views"] for record in records),
        },
        "records": records,
    }
    validate_payload(payload)
    return payload


def validate_payload(payload: dict[str, Any]) -> None:
    records = payload["records"]
    assert payload["schema"] == "wwam-archive-atlas/v1"
    assert len(records) == EXPECTED_FEED_ENTRIES
    assert len({record["id"] for record in records}) == len(records)
    assert all(re.fullmatch(r"\d{4}-\d{2}-\d{2}", record["date"]) for record in records)
    assert all(record["duration"] >= 0 and record["views"] >= 0 for record in records)
    assert all(record["title"] and record["thumbnail"] and record["url"] for record in records)
    assert all(
        record["coverage"]
        in {"deeply-indexed", "metadata-only", "caption-limited", "unavailable"}
        for record in records
    )
    assert all(
        record["availability"] and record["liveStatus"]
        for record in records
    )
    assert records == sorted(
        records,
        key=lambda item: (item["date"], item["id"]),
        reverse=True,
    )
    assert sum(payload["stats"]["coverage"].values()) == len(records)
    assert payload["cutoff"]["officialFeedEntries"] == len(records)
    archive_deep_batch1 = [
        record
        for record in records
        if "archive-deep-10" in record["lanes"]
    ]
    archive_deep_batch2 = [
        record
        for record in records
        if "archive-deep-batch-02" in record["lanes"]
    ]
    assert len(archive_deep_batch1) == EXPECTED_ARCHIVE_DEEP_BATCH_ENTRIES
    assert len(archive_deep_batch2) == EXPECTED_ARCHIVE_DEEP_BATCH_ENTRIES
    assert not {record["id"] for record in archive_deep_batch1} & {
        record["id"] for record in archive_deep_batch2
    }
    assert all(
        record["coverage"] == "deeply-indexed"
        and record["lanes"] == ["archive-deep-10"]
        for record in archive_deep_batch1
    )
    assert all(
        record["coverage"] == "deeply-indexed"
        and record["lanes"] == ["archive-deep-batch-02"]
        for record in archive_deep_batch2
    )
    assert payload["stats"]["lanes"]["archive-deep-10"] == len(
        archive_deep_batch1
    )
    assert payload["stats"]["lanes"]["archive-deep-batch-02"] == len(
        archive_deep_batch2
    )
    assert payload["stats"]["coverage"] == {
        "deeply-indexed": EXPECTED_DEEPLY_INDEXED,
        "metadata-only": EXPECTED_METADATA_ONLY,
        "caption-limited": EXPECTED_CAPTION_LIMITED,
        "unavailable": 0,
    }
    assert payload["stats"]["deepCoveragePercent"] == 11.4
    assert payload["provenance"]["sourceLanes"]["archiveDeepSources"] == len(
        archive_deep_batch1
    ) + len(
        archive_deep_batch2
    )
    assert payload["provenance"]["sourceLanes"]["archiveDeepSchema"] == (
        "wwam-archive-deep-distill/v1"
    )
    assert payload["provenance"]["sourceLanes"]["archiveDeepSelectionSha256"]
    assert payload["provenance"]["sourceLanes"]["archiveDeepPublicFnv1a"]
    source_lanes = payload["provenance"]["sourceLanes"]
    assert source_lanes["archiveDeepTotals"] == {
        "batches": 2,
        "sources": EXPECTED_ARCHIVE_DEEP_ENTRIES,
        "hours": 46.8,
        "wordsAudited": 579003,
        "captionEvents": 82551,
        "topicLanes": 200,
        "publicMomentCandidates": 91,
        "characterSignals": 23,
        "snapshotViews": 214278,
        "restricted": 7,
    }
    deep_batches = source_lanes["archiveDeepBatches"]
    assert [batch["batchId"] for batch in deep_batches] == [
        "archive-deep-batch-01",
        "archive-deep-batch-02",
    ]
    assert [batch["atlasLane"] for batch in deep_batches] == [
        "archive-deep-10",
        "archive-deep-batch-02",
    ]
    assert all(
        batch["sources"] == EXPECTED_ARCHIVE_DEEP_BATCH_ENTRIES
        and re.fullmatch(r"sha256:[a-f0-9]{64}", batch["selectionSha256"])
        and re.fullmatch(r"sha256:[a-f0-9]{64}", batch["captionSetSha256"])
        and re.fullmatch(r"fnv1a32:[a-f0-9]{8}", batch["publicFnv1a"])
        for batch in deep_batches
    )
    assert deep_batches[1]["schema"] == (
        "shokker-youtube-wiki/archive-deep-batch/v1"
    )
    assert deep_batches[1]["integrationStatus"] == "integrated-quarantine"
    assert deep_batches[1]["promotionAllowed"] is False

    canonical = [canonical_record(record) for record in records]
    feed_ids = sorted(record["id"] for record in records)
    assert payload["fingerprints"]["feedSha256"] == sha256_label(feed_ids)
    assert payload["fingerprints"]["archiveSha256"] == sha256_label(canonical)
    assert payload["fingerprints"]["runtimeFnv1a"] == fnv1a32(stable_json(canonical))


def render(payload: dict[str, Any]) -> str:
    return (
        "window.WWAM_ARCHIVE_ATLAS = "
        + json.dumps(payload, ensure_ascii=False, separators=(",", ":"))
        + ";\n"
    )


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--check",
        action="store_true",
        help="Validate that the checked-in Atlas exactly matches the local cache.",
    )
    args = parser.parse_args()

    payload = build_payload()
    source = render(payload)
    public_bytes = len(source.encode("utf-8"))
    if public_bytes >= MAX_PUBLIC_BYTES:
        raise RuntimeError(
            f"Public Atlas is {public_bytes:,} bytes; limit is {MAX_PUBLIC_BYTES:,}"
        )

    if args.check:
        if not OUTPUT.exists():
            raise RuntimeError(f"Missing generated artifact: {OUTPUT}")
        existing = OUTPUT.read_text(encoding="utf-8")
        if existing != source:
            raise RuntimeError(
                "Archive Atlas is stale; run pipeline/wwam_archive_atlas.py"
            )
        print(
            f"Validated {len(payload['records'])} Archive Atlas records "
            f"({public_bytes:,} bytes, {payload['fingerprints']['archiveSha256']})."
        )
        return 0

    OUTPUT.write_text(source, encoding="utf-8")
    print(
        f"Wrote {OUTPUT}: {len(payload['records'])} records, "
        f"{public_bytes:,} bytes."
    )
    print(json.dumps(payload["stats"], indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
