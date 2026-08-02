#!/usr/bin/env python3
"""Build podcast-local listening receipts for exact-title livestream mirrors.

The official WWAM RSS feed occasionally preserves audio for a YouTube upload
that yt-dlp cannot currently acquire.  These records stay an alternate source
lane: their clocks are podcast-local and are never used as YouTube timestamps.
"""

from __future__ import annotations

import html
import json
import re
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path

from run_wwam_audio_watch_pass import DEMO_DIR, candidate_rows, caption_events, category_counts, listening_digest, runtime_target, stream_features

ROOT = Path(__file__).resolve().parents[1]
RSS_URL = "https://anchor.fm/s/10a245f8/podcast/rss"
RSS_AUDIO_DIR = ROOT / "source-cache" / "audio" / "rss-livestream"
OUTPUT = DEMO_DIR / "wwam-livestream-rss-audio-pass.js"
CANON = DEMO_DIR / "wwam-livestream-canon.js"
TARGETS = {
    "LVVGdGxTBfI": "DIMENSION FILMS TIER LIST LIVE!",
    "2E4JlP3Mx8w": "FRIDAY NIGHT FIGHTS! 90'S TEEN HORROR",
}
ITUNES = "{http://www.itunes.com/dtds/podcast-1.0.dtd}"


def clean(value: object) -> str:
    return re.sub(r"\s+", " ", html.unescape(str(value or ""))).strip()


def norm(value: object) -> str:
    return re.sub(r"[^a-z0-9]+", "", clean(value).lower())


def load_window(path: Path) -> dict:
    raw = path.read_text(encoding="utf-8")
    return json.JSONDecoder().raw_decode(raw.split("=", 1)[1].lstrip())[0]


def rss_matches() -> dict[str, dict]:
    root = ET.fromstring(urllib.request.urlopen(urllib.request.Request(RSS_URL, headers={"User-Agent": "WWAM-after-midnight-rss-pass/1.0"}), timeout=30).read())
    found: dict[str, dict] = {}
    for item in root.findall("./channel/item"):
        title = clean(item.findtext("title"))
        enclosure = item.find("enclosure")
        url = enclosure.attrib.get("url") if enclosure is not None else ""
        for video_id, target in TARGETS.items():
            if norm(title) != norm(target) or not url:
                continue
            found[video_id] = {
                "title": title,
                "date": clean(item.findtext("pubDate")),
                "guid": clean(item.findtext("guid")),
                "sourceUrl": url,
                "bytes": int(enclosure.attrib.get("length", 0) or 0) if enclosure is not None else 0,
                "duration": clean(item.findtext(f"{ITUNES}duration")),
            }
    return found


def main() -> None:
    canon = load_window(CANON)
    episodes = {episode["id"]: episode for episode in canon.get("episodes", [])}
    matches = rss_matches()
    RSS_AUDIO_DIR.mkdir(parents=True, exist_ok=True)
    output = {"schema": "wwam/livestream-rss-audio-pass/v1", "generated": datetime.now(timezone.utc).isoformat(), "scope": "exact-title official RSS mirrors for held YouTube livestreams", "records": {}}
    for video_id, rss in matches.items():
        audio = RSS_AUDIO_DIR / f"{video_id}.mp3"
        if not audio.exists() or audio.stat().st_size <= 1024:
            print(f"[skip] missing {video_id}", flush=True)
            continue
        episode = episodes[video_id]
        features = stream_features(audio)
        youtube_events = caption_events(video_id)
        youtube_duration = float(episode.get("duration") or 0)
        ratio = features["durationSeconds"] / youtube_duration if youtube_duration else 1.0
        events = [{**event, "t": float(event["t"]) * ratio, "end": float(event["end"]) * ratio, "evidenceType": "source-local-youtube-caption-crosschecked-to-exact-title-rss-mirror"} for event in youtube_events]
        target = runtime_target(features["durationSeconds"], len(events))
        candidates = candidate_rows(events, features, max_candidates=target)
        for candidate in candidates:
            candidate["evidenceBasis"] = "official WWAM RSS mirror audio + scaled source-local YouTube caption cross-check"
            candidate["reviewStatus"] = "podcast-local candidate; playback remains the authority"
            candidate["timestampPolicy"] = "podcast player only; never a YouTube timestamp"
        output["records"][video_id] = {
            "id": video_id,
            "title": episode["title"],
            "status": "rss-audio-feature-pass",
            "label": "OFFICIAL RSS MIRROR // PODCAST-LOCAL AUDIO",
            "media": {"sourceUrl": rss["sourceUrl"], "localFile": f"source-cache/audio/rss-livestream/{audio.name}", "container": "mp3", "durationSeconds": features["durationSeconds"], "audioOnly": True, "canonicalTimestampMapping": False, "timestampPolicy": "podcast player only; never a YouTube timestamp"},
            "source": {"kind": "official-wwam-rss", "rssTitle": rss["title"], "rssDate": rss["date"], "guid": rss["guid"], "enclosureBytes": rss["bytes"], "durationLabel": rss["duration"], "youtubeSourceId": video_id, "youtubeDurationSeconds": episode.get("duration"), "captionCrossCheck": "exact title + date; source-local caption clock scaled to RSS duration", "transcriptEngine": "source-local YouTube caption map; no new speaker diarization"},
            "audit": {"transcriptEvents": len(events), "audioRows": features["durationSeconds"], "candidateCount": len(candidates), "candidateTarget": target, "candidateCategories": category_counts(candidates), "audioStats": features["stats"]},
            "candidates": candidates,
            "listeningDigest": listening_digest(candidates),
            "note": "This is an exact-title official RSS mirror for a held YouTube source. Candidates and playback controls use the podcast-local clock; no RSS timestamp is mapped back onto YouTube.",
        }
        (ROOT / "source-cache" / "captions" / f"rss-livestream-{video_id}.json").write_text(json.dumps({"events": events}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(f"[done] {video_id}: {len(events)} transcript events, {features['durationSeconds']} audio rows, {len(candidates)} candidates", flush=True)
    OUTPUT.write_text("window.WWAM_LIVESTREAM_RSS_AUDIO_PASS = " + json.dumps(output, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf-8")
    print(f"[complete] {len(output['records'])} exact-title RSS mirror passes", flush=True)


if __name__ == "__main__":
    main()
