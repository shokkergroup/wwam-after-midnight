"""Acquire local audio receipts for the 2026 WWAM livestream second pass.

The files stay in the ignored source-cache for analysis. Public pages continue
to link to the official YouTube upload and publish only bounded timestamp
receipts. A failed acquisition is recorded instead of blocking the batch.
"""

from __future__ import annotations

import concurrent.futures
import json
import subprocess
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DEMO = ROOT / "public" / "demo"
AUDIO_DIR = ROOT / "source-cache" / "audio"
MANIFEST = AUDIO_DIR / "wwam-2026-livestream-acquisition.json"
YT_DLP = [
    "python", "-m", "yt_dlp",
    "--js-runtimes", r"node:C:\Program Files\nodejs\node.exe",
    "--remote-components", "ejs:github",
    "--no-playlist", "--retries", "10", "--fragment-retries", "10",
    "--continue", "-f", "139/140/251",
]


def load_window(path: Path) -> dict:
    raw = path.read_text(encoding="utf-8")
    return json.JSONDecoder().raw_decode(raw.split("=", 1)[1].lstrip())[0]


def audio_file(video_id: str) -> Path | None:
    for suffix in (".m4a", ".webm", ".mp3"):
        candidate = AUDIO_DIR / f"{video_id}{suffix}"
        if candidate.exists() and candidate.stat().st_size > 1024:
            return candidate
    return None


def acquire(episode: dict) -> dict:
    video_id = episode["id"]
    url = episode.get("url") or f"https://www.youtube.com/watch?v={video_id}"
    command = YT_DLP + ["-o", str(AUDIO_DIR / f"{video_id}.%(ext)s"), url]
    started = datetime.now(timezone.utc).isoformat()
    try:
        result = subprocess.run(command, cwd=ROOT, text=True, capture_output=True, timeout=480, check=False)
        acquired = audio_file(video_id)
        return {
            "id": video_id,
            "url": url,
            "title": episode.get("title"),
            "date": episode.get("date"),
            "status": "acquired" if result.returncode == 0 and acquired else "unavailable",
            "file": acquired.name if acquired else None,
            "bytes": acquired.stat().st_size if acquired else 0,
            "returnCode": result.returncode,
            "startedAt": started,
            "observedAt": datetime.now(timezone.utc).isoformat(),
            "stderrTail": result.stderr[-600:] if result.stderr else "",
        }
    except Exception as exc:  # keep a single bad tape from stopping the pass
        return {
            "id": video_id, "url": url, "title": episode.get("title"), "date": episode.get("date"),
            "status": "error", "file": None, "bytes": 0, "error": str(exc),
            "startedAt": started, "observedAt": datetime.now(timezone.utc).isoformat(),
        }


def main() -> None:
    AUDIO_DIR.mkdir(parents=True, exist_ok=True)
    canon = load_window(DEMO / "wwam-livestream-canon.js")
    episodes = [episode for episode in canon.get("episodes", []) if str(episode.get("date", "")).startswith("2026")]
    prior = json.loads(MANIFEST.read_text(encoding="utf-8")) if MANIFEST.exists() else {}
    records = dict(prior.get("records") or {})
    targets = [episode for episode in episodes if not audio_file(episode["id"])]
    print(f"TARGETS missing_audio={len(targets)} year=2026 episodes={len(episodes)}", flush=True)
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
        futures = {executor.submit(acquire, episode): episode for episode in targets}
        for index, future in enumerate(concurrent.futures.as_completed(futures), 1):
            result = future.result()
            records[result["id"]] = result
            print(f"{index}/{len(targets)} {result['id']}: {result['status']} {result.get('file') or ''}", flush=True)
    payload = {
        "schema": "wwam/2026-livestream-audio-acquisition/v1",
        "observedAt": datetime.now(timezone.utc).isoformat(),
        "year": 2026,
        "canonEpisodes": len(episodes),
        "records": records,
    }
    MANIFEST.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("RESULT", json.dumps({"canonEpisodes": len(episodes), "records": len(records), "acquired": sum(r.get("status") == "acquired" for r in records.values())}), flush=True)


if __name__ == "__main__":
    main()
