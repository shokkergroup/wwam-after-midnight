"""Run the bounded audio viewing pass across every WWAM watchalong dossier.

This is an evidence pass, not a claim that a model visually watched a video.
For each publicly acquirable canonical audio track it decodes one-second audio
features, aligns caption events, and surfaces a runtime-scaled set of ranked
candidate receipts. The official upload remains the authority at every link.
"""

from __future__ import annotations

import json
import re
from pathlib import Path

from run_wwam_audio_watch_pass import AUDIO_DIR, DEMO_DIR, candidate_rows, caption_events, provenance, stream_features


ROOT = Path(__file__).resolve().parents[1]
WATCHALONG_FILE = DEMO_DIR / "wwam-watchalong-canon.js"
KNOWN_FORMATS = {"vN0kpXks-Lk": "140"}
KNOWN_ALTERNATES = {
    "AzrcgoyE7C4": {
        "url": "https://podcasters.spotify.com/pod/show/wewatchedamovie/episodes/Rob-Zombies-H2-Commentary-ehti0c",
        "label": "OFFICIAL WWAM PODCAST VARIANT // NON-ISOMORPHIC TIMELINE",
        "provenanceFile": "source-cache/audio-alternates/AzrcgoyE7C4/provenance.json",
        "note": "The canonical YouTube upload is age-restricted for unauthenticated acquisition. An official WWAM podcast variant exists, but its 105.61-second duration drift has not been timeline-aligned; no YouTube timestamp receipts are manufactured.",
    }
}


def load_json_from_window(path: Path) -> dict:
    raw = path.read_text(encoding="utf-8")
    return json.JSONDecoder().raw_decode(raw.split("=", 1)[1].lstrip())[0]


def audio_file_for(video_id: str) -> Path | None:
    for suffix in (".m4a", ".mp3", ".webm"):
        candidate = AUDIO_DIR / f"{video_id}{suffix}"
        if candidate.exists() and candidate.stat().st_size > 1024:
            return candidate
    return None


def runtime_target(duration_seconds: int) -> int:
    """Give longer tapes a larger browse set without flattening every show to 15."""
    return max(15, min(32, round(duration_seconds / 480)))


def title_for(episode: dict) -> str:
    return str(episode.get("movieTitle") or episode.get("title") or episode.get("id") or "WWAM watchalong")


def label_for(episode: dict) -> str:
    return "HALLOWEEN WATCH PASS // AUDIO PILOT" if episode.get("franchiseKey") == "halloween" else "WATCHALONG WATCH PASS // AUDIO PILOT"


def held_record(episode: dict) -> dict:
    video_id = episode["id"]
    alternate = KNOWN_ALTERNATES.get(video_id)
    record = {
        "id": video_id,
        "date": episode.get("date") or "unknown",
        "title": title_for(episode),
        "status": "held-age-restricted" if alternate else "held-source-unavailable",
        "label": "HALLOWEEN WATCH PASS // HELD SOURCE" if episode.get("franchiseKey") == "halloween" else "WATCHALONG WATCH PASS // HELD SOURCE",
        "media": {"sourceUrl": episode.get("url") or f"https://www.youtube.com/watch?v={video_id}", "audioOnly": True, "canonicalAudioAvailable": False},
        "audit": {"captionEvents": 0, "audioRows": 0, "candidateCount": 0, "candidateTarget": 0},
        "candidates": [],
        "note": alternate["note"] if alternate else "The canonical source has no locally acquired audio receipt. No timestamp candidates are manufactured; open the official source directly.",
        "provenanceFile": alternate["provenanceFile"] if alternate else None,
    }
    if alternate:
        record["alternateSource"] = {"url": alternate["url"], "label": alternate["label"]}
    return record


def main() -> None:
    existing = load_json_from_window(DEMO_DIR / "wwam-watch-pass-pilot.js")
    output = dict(existing)
    output["version"] = "2026-audio-pilot-03"
    output["scope"] = "latest-three-2026 + all-watchalongs"
    output["scopes"] = ["latest-three-2026", "all-watchalongs"]
    output["selectionPolicy"] = "Runtime-scaled ranked browse set; longer tapes receive more surfaced receipts. This is not a claim that unlisted caption candidates do not exist."
    output.setdefault("episodes", {})
    canon = load_json_from_window(WATCHALONG_FILE)
    episodes = canon.get("episodes", [])
    analyzed = 0
    held = 0
    total_audio_seconds = 0
    total_caption_events = 0
    total_candidates = 0

    for episode in episodes:
        video_id = episode["id"]
        audio_file = audio_file_for(video_id)
        if not audio_file:
            output["episodes"][video_id] = held_record(episode)
            held += 1
            print(f"{video_id}: held (no canonical audio receipt)")
            continue

        caption_path = ROOT / "source-cache" / "captions" / f"{video_id}.json"
        if not caption_path.exists():
            output["episodes"][video_id] = held_record(episode)
            output["episodes"][video_id]["status"] = "held-caption-unavailable"
            output["episodes"][video_id]["note"] = "Canonical audio was acquired, but no source-local caption map was available for safe timestamp alignment. No timestamp candidates are manufactured."
            held += 1
            print(f"{video_id}: held (caption map unavailable)")
            continue

        events = caption_events(video_id)
        audio = stream_features(audio_file)
        target = runtime_target(audio["durationSeconds"])
        candidates = candidate_rows(events, audio, max_candidates=target)
        container = audio_file.suffix.lstrip(".")
        marker_count = sum(bool(re.search(r"\[(?:laughter|snorts?|crosstalk|applause)\]", event["text"], re.I)) for event in events)
        output["episodes"][video_id] = {
            "id": video_id,
            "date": episode.get("date") or "unknown",
            "title": title_for(episode),
            "status": "audio-feature-pilot",
            "label": label_for(episode),
            "media": {"sourceUrl": episode.get("url") or f"https://www.youtube.com/watch?v={video_id}", "localFile": f"source-cache/audio/{audio_file.name}", "container": container, "durationSeconds": audio["durationSeconds"], "audioOnly": True, "canonicalAudioAvailable": True},
            "audit": {"captionEvents": len(events), "audioRows": audio["durationSeconds"], "laughterOrOverlapMarkers": marker_count, "candidateCount": len(candidates), "candidateTarget": target, "audioStats": audio["stats"]},
            "candidates": candidates,
            "note": "This pass decoded the canonical audio track at one-second feature resolution and aligned ranked windows to the source-local caption map. It does not assign a speaker, claim a visual reaction, or prove that a candidate is objectively funny; open the official source at each bounded timestamp.",
            "provenanceFile": f"source-cache/audio/{video_id}.provenance.json",
        }
        format_id = KNOWN_FORMATS.get(video_id, "139")
        upload_date = str(episode.get("date") or "unknown").replace("-", "")
        (AUDIO_DIR / f"{video_id}.provenance.json").write_text(json.dumps(provenance(video_id, upload_date, audio_file, audio["durationSeconds"], format_id=format_id), indent=2) + "\n", encoding="utf-8")
        analyzed += 1
        total_audio_seconds += audio["durationSeconds"]
        total_caption_events += len(events)
        total_candidates += len(candidates)
        print(f"{video_id}: {len(events)} caption events, {audio['durationSeconds']} audio rows, {len(candidates)} candidates")

    output["coverage"] = {"watchalongEpisodes": len(episodes), "audioAnalyzed": analyzed, "held": held, "audioSeconds": total_audio_seconds, "captionEvents": total_caption_events, "rankedCandidates": total_candidates}
    js = "window.WWAM_WATCH_PASS_PILOT = " + json.dumps(output, ensure_ascii=False, separators=(",", ":")) + ";\n"
    (DEMO_DIR / "wwam-watch-pass-pilot.js").write_text(js, encoding="utf-8")
    print(f"RESULT watchalongs={len(episodes)} analyzed={analyzed} held={held} candidates={total_candidates}")


if __name__ == "__main__":
    main()
