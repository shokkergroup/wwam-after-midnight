"""Acquire missing public watchalong audio receipts for the evidence pass.

This is intentionally additive and conservative: it only walks the current
public watchalong canon, never touches member-only sources, and records the
acquisition result locally. The public site still links to YouTube rather than
shipping raw media.
"""

from __future__ import annotations

import json
import subprocess
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DEMO = ROOT / "public" / "demo"
AUDIO_DIR = ROOT / "source-cache" / "audio"
MANIFEST = AUDIO_DIR / "wwam-watchalong-acquisition.json"
YT_DLP = [
    "python",
    "-m",
    "yt_dlp",
    "--js-runtimes",
    r"node:C:\Program Files\nodejs\node.exe",
    "--remote-components",
    "ejs:github",
    "--no-playlist",
    "--retries",
    "10",
    "--fragment-retries",
    "10",
    "--continue",
    "-f",
    "139/140/251",
]


def load_window(path: Path) -> dict:
    raw = path.read_text(encoding="utf-8")
    return json.JSONDecoder().raw_decode(raw.split("=", 1)[1].lstrip())[0]


def audio_file(video_id: str) -> Path | None:
    for suffix in (".m4a", ".webm", ".mp3"):
        path = AUDIO_DIR / f"{video_id}{suffix}"
        if path.exists() and path.stat().st_size > 1024:
            return path
    return None


def main() -> None:
    AUDIO_DIR.mkdir(parents=True, exist_ok=True)
    canon = load_window(DEMO / "wwam-watchalong-canon.js")
    prior = {}
    if MANIFEST.exists():
        prior = json.loads(MANIFEST.read_text(encoding="utf-8"))
    records = dict(prior.get("records") or {})
    episodes = canon.get("episodes") or []
    targets = [episode for episode in episodes if not str((episode.get("watchPass") or {}).get("status") or "").startswith("held-") and not audio_file(episode["id"])]
    print(f"TARGETS missing_audio={len(targets)} canon={len(episodes)}")
    for index, episode in enumerate(targets, 1):
        video_id = episode["id"]
        url = episode.get("url") or f"https://www.youtube.com/watch?v={video_id}"
        command = YT_DLP + ["-o", str(AUDIO_DIR / f"{video_id}.%(ext)s"), url]
        started = datetime.now(timezone.utc).isoformat()
        try:
            result = subprocess.run(command, cwd=ROOT, text=True, capture_output=True, timeout=240, check=False)
            acquired = audio_file(video_id)
            status = "acquired" if result.returncode == 0 and acquired else "unavailable"
            records[video_id] = {
                "id": video_id,
                "url": url,
                "title": episode.get("movieTitle") or episode.get("title"),
                "date": episode.get("date"),
                "status": status,
                "file": acquired.name if acquired else None,
                "bytes": acquired.stat().st_size if acquired else 0,
                "returnCode": result.returncode,
                "startedAt": started,
                "observedAt": datetime.now(timezone.utc).isoformat(),
                "stderrTail": result.stderr[-600:] if result.stderr else "",
            }
            print(f"{index}/{len(targets)} {video_id}: {status} {acquired.name if acquired else ''}")
        except Exception as exc:  # keep the overnight batch moving
            records[video_id] = {"id": video_id, "url": url, "title": episode.get("movieTitle") or episode.get("title"), "status": "error", "error": str(exc), "startedAt": started, "observedAt": datetime.now(timezone.utc).isoformat()}
            print(f"{index}/{len(targets)} {video_id}: error {exc}")
    payload = {"schema": "wwam/watchalong-audio-acquisition/v1", "observedAt": datetime.now(timezone.utc).isoformat(), "canonEpisodes": len(episodes), "records": records}
    MANIFEST.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("RESULT", json.dumps({"canonEpisodes": len(episodes), "records": len(records), "acquired": sum(r.get("status") == "acquired" for r in records.values())}))


if __name__ == "__main__":
    main()
