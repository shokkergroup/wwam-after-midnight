#!/usr/bin/env python3
"""Build the metadata-only WWAM Archive Atlas from the local source cache.

No network access is used. The Atlas preserves the official Streams-feed
membership captured on 2026-07-23, exposes only video metadata, and joins that
metadata to the public Fresh 10, Popular 25, and commentary catalog solely to
describe the current indexing lane. It never promotes an undistilled title into
transcript knowledge.
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

SNAPSHOT_DATE = "2026-07-23"
EXPECTED_FEED_ENTRIES = 472
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
    return json.dumps(
        value,
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


def coverage_maps() -> tuple[
    set[str],
    dict[str, bool],
    dict[str, list[str]],
    dict[str, Any],
]:
    catalog = read_assignment(CATALOG_PATH, "WWAM_CATALOG")
    fresh = read_assignment(FRESH_PATH, "WWAM_LIVESTREAMS")
    popular = read_assignment(POPULAR_PATH, "WWAM_POPULAR_LIVE")

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

    provenance = {
        "catalogSources": len(catalog),
        "freshSources": len(fresh.get("streams") or []),
        "popularSources": len(popular.get("streams") or []),
        "popularFeedEntries": int(
            (popular.get("selection") or {}).get("officialFeedEntries") or 0
        ),
        "freshGenerated": fresh.get("generated"),
        "popularGenerated": popular.get("generated"),
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
            "source": "source-cache/metadata",
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
