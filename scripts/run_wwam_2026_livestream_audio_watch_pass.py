"""Decode and rank bounded audio routes for every public 2026 livestream.

This is an audio evidence pass, not a claim of visual watching or speaker
diarization. Captions provide the searchable language; one-second acoustic
features re-rank candidate windows and keep the official upload as the final
authority.
"""

from __future__ import annotations

import json
import re
from pathlib import Path

from run_wwam_audio_watch_pass import AUDIO_DIR, DEMO_DIR, candidate_rows, caption_events, category_counts, provenance, runtime_target, stream_features


ROOT = Path(__file__).resolve().parents[1]
CANON = DEMO_DIR / "wwam-livestream-canon.js"
OUTPUT = DEMO_DIR / "wwam-livestream-audio-pass.js"


def load_window(path: Path) -> dict:
    raw = path.read_text(encoding="utf-8")
    return json.JSONDecoder().raw_decode(raw.split("=", 1)[1].lstrip())[0]


def audio_file(video_id: str) -> Path | None:
    for suffix in (".m4a", ".webm", ".mp3"):
        candidate = AUDIO_DIR / f"{video_id}{suffix}"
        if candidate.exists() and candidate.stat().st_size > 1024:
            return candidate
    return None


def held_record(episode: dict) -> dict:
    return {
        "id": episode["id"],
        "date": episode.get("date") or "unknown",
        "title": episode.get("title") or episode["id"],
        "status": "held-source-unavailable",
        "label": "2026 LIVESTREAM WATCH PASS // HELD SOURCE",
        "media": {"sourceUrl": episode.get("url") or f"https://www.youtube.com/watch?v={episode['id']}", "audioOnly": True, "canonicalAudioAvailable": False},
        "audit": {"captionEvents": 0, "audioRows": 0, "candidateCount": 0, "candidateTarget": 0, "candidateCategories": {}, "audioStats": {}},
        "candidates": [],
        "listeningDigest": {"mode": "held", "headline": "No local audio receipt survived acquisition; no timestamp candidates are manufactured.", "signalMix": [], "strongest": None, "evidence": "The official source remains the authority; this pass has no locally validated audio."},
        "note": "The public source is retained in the canon, but local audio was unavailable in this acquisition run. No timestamp candidates are manufactured.",
        "provenanceFile": None,
    }


def main() -> None:
    canon = load_window(CANON)
    episodes = [episode for episode in canon.get("episodes", []) if str(episode.get("date", "")).startswith("2026")]
    output: dict = {
        "schema": "wwam/livestream-audio-pass/v1",
        "version": "2026-livestream-audio-01",
        "status": "audio-feature-pass",
        "scope": "all-public-2026-livestreams",
        "selectionPolicy": "Runtime- and caption-density-scaled routes with recurring WWAM lanes preserved before score fill; not an exhaustive transcript or human final cut.",
        "episodes": {},
    }
    analyzed = 0
    held = 0
    total_audio_seconds = 0
    total_caption_events = 0
    total_candidates = 0
    for episode in episodes:
        video_id = episode["id"]
        audio = audio_file(video_id)
        events = caption_events(video_id)
        if not audio:
            output["episodes"][video_id] = held_record(episode)
            held += 1
            print(f"{video_id}: held (no canonical audio)", flush=True)
            continue
        if not events:
            # Audio without a source-local language map is still useful for
            # validation, but not safe for timestamped public navigation.
            record = held_record(episode)
            record["status"] = "held-caption-unavailable"
            record["note"] = "Canonical audio was acquired, but no source-local caption map was available for safe timestamp alignment. No timestamp candidates are manufactured."
            output["episodes"][video_id] = record
            held += 1
            print(f"{video_id}: held (caption map unavailable)", flush=True)
            continue
        features = stream_features(audio)
        target = runtime_target(features["durationSeconds"], len(events))
        candidates = candidate_rows(events, features, max_candidates=target)
        marker_count = sum(bool(re.search(r"\[(?:laughter|snorts?|crosstalk|applause)\]", event["text"], re.I)) for event in events)
        output["episodes"][video_id] = {
            "id": video_id,
            "date": episode.get("date") or "unknown",
            "title": episode.get("title") or video_id,
            "status": "audio-feature-pass",
            "label": "2026 LIVESTREAM WATCH PASS // AUDIO",
            "media": {"sourceUrl": episode.get("url") or f"https://www.youtube.com/watch?v={video_id}", "localFile": f"source-cache/audio/{audio.name}", "container": audio.suffix.lstrip("."), "durationSeconds": features["durationSeconds"], "audioOnly": True, "canonicalAudioAvailable": True},
            "audit": {"captionEvents": len(events), "audioRows": features["durationSeconds"], "laughterOrOverlapMarkers": marker_count, "candidateCount": len(candidates), "candidateTarget": target, "candidateCategories": category_counts(candidates), "audioStats": features["stats"]},
            "candidates": candidates,
            "listeningDigest": {
                "mode": "audio-feature",
                "headline": f"Audio re-ranking retained {len(candidates)} bounded routes across {', '.join(f'{key} ({value})' for key, value in sorted(category_counts(candidates).items(), key=lambda item: (-item[1], item[0]))[:4]) or 'the caption map'}.",
                "signalMix": [f"{key} ({value})" for key, value in sorted(category_counts(candidates).items(), key=lambda item: (-item[1], item[0]))[:4]],
                "strongest": (lambda strongest: {"t": strongest.get("t"), "category": strongest.get("category"), "score": strongest.get("score")} if strongest else None)(max(candidates, key=lambda item: float(item.get("score") or 0), default=None)),
                "evidence": "Acoustic energy re-ranks caption signals; it does not prove a joke, speaker, or visual reaction.",
            },
            "note": "This pass decoded the canonical audio track at one-second feature resolution and aligned ranked windows to the source-local caption map. It does not assign a speaker, claim a visual reaction, or prove that a candidate is objectively funny; open the official source at each bounded timestamp.",
            "provenanceFile": f"source-cache/audio/{video_id}.provenance.json",
        }
        (AUDIO_DIR / f"{video_id}.provenance.json").write_text(json.dumps(provenance(video_id, str(episode.get("date") or "unknown").replace("-", ""), audio, features["durationSeconds"]), indent=2) + "\n", encoding="utf-8")
        analyzed += 1
        total_audio_seconds += features["durationSeconds"]
        total_caption_events += len(events)
        total_candidates += len(candidates)
        print(f"{video_id}: {len(events)} caption events, {features['durationSeconds']} audio rows, {len(candidates)} candidates", flush=True)
    output["coverage"] = {"year": 2026, "livestreamEpisodes": len(episodes), "audioAnalyzed": analyzed, "held": held, "audioSeconds": total_audio_seconds, "captionEvents": total_caption_events, "rankedCandidates": total_candidates}
    OUTPUT.write_text("window.WWAM_LIVESTREAM_AUDIO_PASS = " + json.dumps(output, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf-8")
    print("RESULT", json.dumps(output["coverage"]), flush=True)


if __name__ == "__main__":
    main()
