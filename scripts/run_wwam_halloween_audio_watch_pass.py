"""Run the audio watch-pass across the complete Halloween watchalong shelf.

The canonical YouTube audio is used when publicly acquirable. The one known
age-restricted upload is retained as a held record because its official podcast
variant has a timeline drift and cannot safely produce YouTube timestamp receipts.
"""

from __future__ import annotations

import json
from pathlib import Path

from run_wwam_audio_watch_pass import AUDIO_DIR, DEMO_DIR, candidate_rows, caption_events, provenance, stream_features
from run_wwam_all_watchalong_audio_watch_pass import runtime_target


ROOT = Path(__file__).resolve().parents[1]
WATCHALONG_FILE = DEMO_DIR / "wwam-watchalong-canon.js"
def load_json_from_window(path: Path) -> dict:
    raw = path.read_text(encoding="utf-8")
    return json.JSONDecoder().raw_decode(raw.split("=", 1)[1].lstrip())[0]


def main() -> None:
    existing = load_json_from_window(DEMO_DIR / "wwam-watch-pass-pilot.js")
    output = dict(existing)
    output["version"] = "2026-audio-pilot-02"
    output["scope"] = "latest-three-2026 + halloween-watchalongs"
    output["scopes"] = ["latest-three-2026", "halloween-watchalongs"]
    output.setdefault("episodes", {})
    canon = load_json_from_window(WATCHALONG_FILE)
    halloween_episodes = [episode for episode in canon.get("episodes", []) if episode.get("franchiseKey") == "halloween"]
    # Drive this lane from the canonical taxonomy instead of a hand-maintained
    # ID list. That keeps repeat cuts and newly discovered Halloween uploads
    # from silently falling out of the verification pass.
    by_id = {episode["id"]: episode for episode in halloween_episodes}

    for video_id in by_id:
        episode = by_id.get(video_id, {})
        audio_file = AUDIO_DIR / f"{video_id}.m4a"
        title = episode.get("movieTitle") or episode.get("title") or video_id
        date = episode.get("date") or "unknown"
        if not audio_file.exists():
            output["episodes"][video_id] = {
                "id": video_id,
                "date": date,
                "title": title,
                "status": "held-age-restricted",
                "label": "HALLOWEEN WATCH PASS // HELD SOURCE",
                "media": {"sourceUrl": f"https://www.youtube.com/watch?v={video_id}", "audioOnly": True, "canonicalAudioAvailable": False},
                "audit": {"captionEvents": 0, "audioRows": 0, "candidateCount": 0},
                "candidates": [],
                "note": "The canonical YouTube upload is age-restricted for unauthenticated acquisition. An official WWAM podcast variant exists, but its 105.61-second duration drift has not been timeline-aligned; no YouTube timestamp receipts are manufactured.",
                "alternateSource": {"url": "https://podcasters.spotify.com/pod/show/wewatchedamovie/episodes/Rob-Zombies-H2-Commentary-ehti0c", "label": "OFFICIAL WWAM PODCAST VARIANT // NON-ISOMORPHIC TIMELINE"},
                "provenanceFile": "source-cache/audio-alternates/AzrcgoyE7C4/provenance.json",
            }
            print(f"{video_id}: held (canonical YouTube audio age-restricted)")
            continue
        events = caption_events(video_id)
        audio = stream_features(audio_file)
        target = runtime_target(audio["durationSeconds"], len(events))
        candidates = candidate_rows(events, audio, max_candidates=target)
        output["episodes"][video_id] = {
            "id": video_id,
            "date": date,
            "title": title,
            "status": "audio-feature-pilot",
            "label": "HALLOWEEN WATCH PASS // AUDIO PILOT",
            "media": {"sourceUrl": f"https://www.youtube.com/watch?v={video_id}", "localFile": f"source-cache/audio/{video_id}.m4a", "container": "m4a", "durationSeconds": audio["durationSeconds"], "audioOnly": True, "canonicalAudioAvailable": True},
            "audit": {"captionEvents": len(events), "audioRows": audio["durationSeconds"], "laughterOrOverlapMarkers": sum("[laughter]" in event["text"].lower() or "[snort" in event["text"].lower() or "[crosstalk]" in event["text"].lower() for event in events), "candidateCount": len(candidates), "candidateTarget": target, "audioStats": audio["stats"]},
            "candidates": candidates,
            "note": "This Halloween file listened to the canonical audio track end-to-end at a feature level and aligned its candidate windows to the source-local captions. It does not assign a speaker or claim a visual reaction; open the official source at each bounded timestamp.",
            "provenanceFile": f"source-cache/audio/{video_id}.provenance.json",
        }
        (AUDIO_DIR / f"{video_id}.provenance.json").write_text(json.dumps(provenance(video_id, date.replace("-", ""), audio_file, audio["durationSeconds"]), indent=2) + "\n", encoding="utf-8")
        print(f"{video_id}: {len(events)} caption events, {audio['durationSeconds']} audio rows, {len(candidates)} candidates")

    js = "window.WWAM_WATCH_PASS_PILOT = " + json.dumps(output, ensure_ascii=False, separators=(",", ":")) + ";\n"
    (DEMO_DIR / "wwam-watch-pass-pilot.js").write_text(js, encoding="utf-8")


if __name__ == "__main__":
    main()
