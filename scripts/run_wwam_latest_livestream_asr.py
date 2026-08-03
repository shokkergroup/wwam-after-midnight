"""Build bounded local Whisper ledgers for the latest WWAM livestreams.

This is a source-bound listening aid. Full transcripts stay under source-cache
(gitignored); later integration may publish only short, timestamped excerpts.
No speaker, visual, intent, or joke claim is made by this pass.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import site
import time
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
AUDIO_DIR = ROOT / "source-cache" / "audio"
CAPTION_DIR = ROOT / "source-cache" / "captions"
DEFAULT_IDS = ("LV2rmwEA0w4", "iz0WFhe6LYM", "ag3axSC9BpU")
MODEL_NAME = "large-v3-turbo"


def install_cuda_dll_search_path() -> None:
    """faster-whisper's Windows wheels keep CUDA DLLs outside PATH."""
    if os.name != "nt":
        return
    handles = []
    roots = [Path(site.getusersitepackages()), *(Path(item) for item in site.getsitepackages())]
    for root in roots:
        for relative in ("nvidia/cublas/bin", "nvidia/cudnn/bin"):
            folder = root / relative
            if not folder.is_dir():
                continue
            handles.append(os.add_dll_directory(str(folder)))
            os.environ["PATH"] = os.pathsep.join([str(folder), os.environ.get("PATH", "")])
    # Keep the handles alive for the lifetime of the process.
    globals()["_CUDA_DLL_HANDLES"] = handles


def audio_path(video_id: str) -> Path:
    for suffix in (".m4a", ".webm", ".mp3"):
        candidate = AUDIO_DIR / f"{video_id}{suffix}"
        if candidate.exists() and candidate.stat().st_size > 1024:
            return candidate
    raise FileNotFoundError(f"No local audio survived acquisition for {video_id}")


def clean(text: object) -> str:
    return " ".join(str(text or "").split()).strip()


def transcribe_one(model, video_id: str, clip_timestamps="0") -> dict:
    audio = audio_path(video_id)
    target = CAPTION_DIR / f"{video_id}.asr.json"
    started = time.time()
    windowed = clip_timestamps != "0"
    window_count = len(clip_timestamps) // 2 if isinstance(clip_timestamps, list) else 0
    print(
        f"[asr] {video_id} // {audio.name}" +
        (f" // {window_count} bounded windows" if windowed else " // full source"),
        flush=True,
    )
    segments, info = model.transcribe(
        str(audio),
        language="en",
        beam_size=1,
        best_of=1,
        temperature=0,
        condition_on_previous_text=False,
        vad_filter=not windowed,
        clip_timestamps=clip_timestamps,
        word_timestamps=False,
    )
    rows = []
    for segmentIndex, segment in enumerate(segments, 1):
        text = clean(segment.text)
        if text:
            rows.append({
                "start": round(max(0.0, float(segment.start)), 3),
                "end": round(max(float(segment.start), float(segment.end)), 3),
                "text": text,
                "evidenceType": "local-whisper-transcript",
            })
        if segmentIndex == 1 or segmentIndex % 250 == 0:
            print(
                f"[asr] {video_id} // heartbeat // {segmentIndex} segments // "
                f"tape {float(segment.end):.1f}s // elapsed {time.time() - started:.1f}s",
                flush=True,
            )
    payload = {
        "schema": "wwam-local-whisper-ledger/v1",
        "sourceId": video_id,
        "audioFile": f"source-cache/audio/{audio.name}",
        "audioSha256": hashlib.sha256(audio.read_bytes()).hexdigest(),
        "model": MODEL_NAME,
        "language": "en",
        "speakerDiarized": False,
        "visualContextVerified": False,
        "publicExcerptWordLimit": 16,
        "durationSeconds": round(float(info.duration or 0), 3),
        "segments": rows,
        "generatedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "elapsedSeconds": round(time.time() - started, 3),
    }
    temp = target.with_suffix(target.suffix + ".part")
    temp.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    temp.replace(target)
    print(f"[asr] {video_id} // {len(rows)} segments // {payload['elapsedSeconds']}s", flush=True)
    return payload


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--ids", nargs="+", default=list(DEFAULT_IDS))
    parser.add_argument("--force", action="store_true")
    args = parser.parse_args()
    install_cuda_dll_search_path()
    from faster_whisper import WhisperModel

    print(f"[asr] loading {MODEL_NAME} on CUDA", flush=True)
    model = WhisperModel(MODEL_NAME, device="cuda", compute_type="float16")
    for video_id in args.ids:
        target = CAPTION_DIR / f"{video_id}.asr.json"
        if target.exists() and not args.force:
            print(f"[asr] {video_id} // reuse {target.name}", flush=True)
            continue
        transcribe_one(model, video_id)


if __name__ == "__main__":
    main()
