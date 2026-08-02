#!/usr/bin/env python3
"""Audit the public WWAM channel for title-explicit movie watchalongs.

The first WWAM prototype was built from a 509-source local snapshot. This
script deliberately audits the live public ``/videos`` feed, records the
observation boundary, and acquires metadata plus source-local JSON3 captions
for every explicit commentary/watch-along/full-movie candidate not already in
the canon. It does not claim that a title match is a human-verified
watchalong; candidates remain machine-surfaced until the tape is reviewed.
"""

from __future__ import annotations

import argparse
import concurrent.futures
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from yt_dlp import YoutubeDL

ROOT = Path(__file__).resolve().parents[1]
PUBLIC_CANON = ROOT / "public" / "demo" / "wwam-watchalong-canon.js"
MANIFEST = ROOT / "source-cache" / "wwam-watchalong-discovery.json"
sys.path.insert(0, str(ROOT / "pipeline"))
from wwam_deep_distill import extract_one  # noqa: E402

CHANNEL_URL = "https://www.youtube.com/@WeWatchedAMovie/videos"
TITLE_PATTERN = re.compile(
    r"(?i)\bcommentary\b|\bwatch\s*(?:along|party)\b|\bfull\s+movie\b"
)
# The strict pattern drives public-canon inclusion. This wider pattern is an
# audit lane only: it catches older naming conventions and lets us explain
# why a title-looking lead was *not* promoted (review/reaction, short clip,
# or members-only) instead of pretending the strict count is exhaustive.
BROAD_TITLE_PATTERN = re.compile(
    r"(?i)\bcommentary\b|\bwatch\s*(?:along|party|with)\b|\bfull\s+movie\b|"
    r"riff\.?tv|let(?:'|’)s\s+watch|first\s+time\s+watch|w[ /_-]*video|watching"
)


def broad_signal(title: str) -> str:
    text = str(title or "")
    if re.search(r"(?i)first\s+time\s+watch|reaction|review", text):
        return "reaction-or-review"
    if re.search(r"(?i)watching\b", text) and not re.search(r"(?i)commentary|full\s+movie|watch\s*(?:along|party)", text):
        return "short-form-watch-lead"
    if re.search(r"(?i)riff\.?tv|w[ /_-]*video|full\s+movie|commentary|watch\s*(?:along|party|with)|let(?:'|’)s\s+watch", text):
        return "watchalong-or-commentary"
    return "broad-watch-signal"


def observed_at() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")


def load_current_canon_ids() -> set[str]:
    if not PUBLIC_CANON.exists():
        return set()
    text = PUBLIC_CANON.read_text(encoding="utf-8")
    marker = "window.WWAM_WATCHALONG_CANON = "
    start = text.find(marker)
    if start < 0:
        return set()
    payload = text[start + len(marker) :].strip()
    if payload.endswith(";"):
        payload = payload[:-1]
    try:
        canon = json.loads(payload)
    except json.JSONDecodeError:
        return set()
    return {str(episode.get("id")) for episode in canon.get("episodes", []) if episode.get("id")}


def discover() -> tuple[int, list[dict[str, Any]], list[dict[str, Any]]]:
    options = {
        "extract_flat": "in_playlist",
        "skip_download": True,
        "quiet": True,
        "ignoreerrors": True,
        "nocheckcertificate": True,
    }
    with YoutubeDL(options) as ydl:
        info = ydl.extract_info(CHANNEL_URL, download=False)
    entries = [entry for entry in (info.get("entries") or []) if entry]
    candidates: list[dict[str, Any]] = []
    broad_candidates: list[dict[str, Any]] = []
    for entry in entries:
        title = str(entry.get("title") or "").strip()
        video_id = str(entry.get("id") or "").strip()
        if not video_id or not BROAD_TITLE_PATTERN.search(title):
            continue
        row = {
            "id": video_id,
            "title": title,
            "duration": entry.get("duration"),
            "url": f"https://www.youtube.com/watch?v={video_id}",
            "signal": broad_signal(title),
            "strictTitleMatch": bool(TITLE_PATTERN.search(title)),
        }
        broad_candidates.append(row)
        if row["strictTitleMatch"]:
            candidates.append(row)
    return len(entries), candidates, broad_candidates


def acquire(seed: dict[str, Any], refresh: bool, observed: str) -> dict[str, Any]:
    try:
        info, captions = extract_one(seed, refresh, observed_at=observed)
        return {
            "id": seed["id"],
            "title": info.get("title") or seed.get("title"),
            "status": "captioned" if captions else "metadata-only",
            "captionEvents": len(captions),
            "duration": info.get("duration") or seed.get("duration"),
            "availability": info.get("availability"),
            "ageLimit": info.get("age_limit"),
            "captionUrl": bool(info.get("caption_url")),
        }
    except Exception as error:  # noqa: BLE001 - preserve held-source audit rows
        return {
            "id": seed["id"],
            "title": seed.get("title"),
            "status": "held",
            "error": f"{type(error).__name__}: {error}",
        }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--refresh", action="store_true", help="re-fetch metadata and captions")
    parser.add_argument("--workers", type=int, default=4)
    args = parser.parse_args()

    observed = observed_at()
    channel_count, candidates, broad_candidates = discover()
    canon_ids = load_current_canon_ids()
    missing = [candidate for candidate in candidates if candidate["id"] not in canon_ids]
    results: list[dict[str, Any]] = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=max(1, args.workers)) as executor:
        futures = [executor.submit(acquire, seed, args.refresh, observed) for seed in missing]
        for future in concurrent.futures.as_completed(futures):
            result = future.result()
            results.append(result)
            line = (
                f"{result['status']:>13} {result['id']} "
                f"{result.get('captionEvents', 0):>5} events "
                f"{result.get('title', '')}"
            )
            # The Windows terminal may still be cp1252 even though the
            # channel title feed contains emoji. Preserve the audit, never
            # let a decorative glyph abort the remaining acquisitions.
            print(line.encode("ascii", "backslashreplace").decode("ascii"), flush=True)
    results.sort(key=lambda item: item["id"])
    manifest = {
        "schema": "shokker-wwam-watchalong-discovery/v1",
        "observedAt": observed,
        "channelUrl": CHANNEL_URL,
        "titlePattern": TITLE_PATTERN.pattern,
        "broadTitlePattern": BROAD_TITLE_PATTERN.pattern,
        "channelSnapshotSources": channel_count,
        "explicitCandidateCount": len(candidates),
        "broadCandidateCount": len(broad_candidates),
        "broadCandidates": broad_candidates,
        "priorCanonCount": len(canon_ids),
        "omittedCandidateCount": len(missing),
        "results": results,
    }
    MANIFEST.parent.mkdir(parents=True, exist_ok=True)
    MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    counts: dict[str, int] = {}
    for result in results:
        counts[result["status"]] = counts.get(result["status"], 0) + 1
    print(
        json.dumps(
            {
                "channelSnapshotSources": channel_count,
                "explicitCandidates": len(candidates),
                "priorCanon": len(canon_ids),
                "omitted": len(missing),
                "acquisition": counts,
                "manifest": str(MANIFEST),
            },
            ensure_ascii=False,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
