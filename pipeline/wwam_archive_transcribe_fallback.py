#!/usr/bin/env python3
"""Locally transcribe canonical WWAM uploads that expose no caption track.

The archive-completion pipeline normally caches YouTube JSON3 captions. A
small number of older uploads do not publish a usable English track, so this
fallback downloads audio only, runs faster-whisper locally, and writes the
same private JSON3-shaped cache contract. Full audio and transcript payloads
remain gitignored; public builds still expose only short timestamped receipts.
"""

from __future__ import annotations

import argparse
import json
import os
import site
import subprocess
import sys
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / "source-cache"
AUDIO = CACHE / "audio"
CAPTIONS = CACHE / "captions"
RETRY = ROOT / "work" / "archive-completion-retry.json"
ASR_RETRY = ROOT / "work" / "archive-completion-asr-retry.json"
DEFAULT_MODEL = "large-v3-turbo"

AUDIO.mkdir(parents=True, exist_ok=True)
CAPTIONS.mkdir(parents=True, exist_ok=True)

# pip's CUDA wheels keep their DLLs outside PATH on Windows. Register them
# before CTranslate2 initializes.
_dll_handles: list[Any] = []
if os.name == "nt":
    roots = [
        Path(site.getusersitepackages()),
        *(Path(item) for item in site.getsitepackages()),
    ]
    dll_dirs: list[str] = []
    for root in roots:
        for relative in ("nvidia/cublas/bin", "nvidia/cudnn/bin"):
            folder = root / relative
            if folder.is_dir():
                dll_dirs.append(str(folder))
                _dll_handles.append(os.add_dll_directory(str(folder)))
    if dll_dirs:
        os.environ["PATH"] = os.pathsep.join(
            dll_dirs + [os.environ.get("PATH", "")]
        )

from faster_whisper import WhisperModel


def ffmpeg_binary() -> str | None:
    try:
        import imageio_ffmpeg

        return imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        return None


def retry_ids() -> list[str]:
    if not RETRY.exists():
        raise RuntimeError(
            f"Missing {RETRY}; run the normal caption-recovery pass first"
        )
    payload = json.loads(RETRY.read_text(encoding="utf-8"))
    return [
        str(item.get("id") or "")
        for item in payload.get("failures") or []
        if item.get("id")
    ]


def cached_audio(video_id: str) -> Path | None:
    candidates = [
        path
        for path in AUDIO.glob(f"{video_id}.*")
        if path.suffix.lower()
        not in {".json", ".part", ".temp", ".tmp", ".ytdl"}
    ]
    return sorted(candidates)[0] if candidates else None


def audio_alignment(video_id: str) -> dict[str, Any]:
    sidecar = AUDIO / f"{video_id}.provenance.json"
    if not sidecar.exists():
        return {
            "audioSourceKind": "canonical-youtube-media",
            "canonicalTimestampMapping": True,
        }
    payload = json.loads(sidecar.read_text(encoding="utf-8"))
    alignment = payload.get("alignment") or {}
    status = str(alignment.get("status") or "canonical-youtube-media")
    return {
        "audioSourceKind": status,
        "canonicalTimestampMapping": bool(
            alignment.get(
                "exactTimestampMappingEstablished",
                status
                in {
                    "canonical-youtube-media",
                    "duration-isomorphic-official-source",
                },
            )
        ),
    }


def stamp_existing_provenance(video_id: str) -> None:
    target = CAPTIONS / f"{video_id}.json"
    if not target.exists():
        raise RuntimeError("local transcript cache is missing")
    payload = json.loads(target.read_text(encoding="utf-8"))
    provenance = payload.get("_shokkerProvenance")
    if not isinstance(provenance, dict) or (
        provenance.get("kind") != "local-speech-to-text"
    ):
        raise RuntimeError("caption cache is not a local ASR payload")
    alignment = audio_alignment(video_id)
    provenance["audioSourceKind"] = alignment["audioSourceKind"]
    provenance["canonicalTimestampMapping"] = alignment[
        "canonicalTimestampMapping"
    ]
    temporary = target.with_suffix(".json.tmp")
    temporary.write_text(
        json.dumps(payload, ensure_ascii=False),
        encoding="utf-8",
    )
    temporary.replace(target)
    print(
        f"[stamp] {video_id} {provenance['audioSourceKind']} "
        f"canonicalTimestampMapping="
        f"{str(provenance['canonicalTimestampMapping']).lower()}",
        flush=True,
    )


def download_audio(video_id: str) -> Path:
    existing = cached_audio(video_id)
    if existing:
        return existing
    args = [
        sys.executable,
        "-m",
        "yt_dlp",
        "--no-warnings",
        "--no-playlist",
        "--retries",
        "3",
        "--fragment-retries",
        "3",
        "-f",
        "bestaudio[abr<=96]/bestaudio",
        "-o",
        str(AUDIO / "%(id)s.%(ext)s"),
    ]
    ffmpeg = ffmpeg_binary()
    if ffmpeg:
        args.extend(["--ffmpeg-location", ffmpeg])
    args.append(f"https://www.youtube.com/watch?v={video_id}")
    result = subprocess.run(
        args,
        cwd=ROOT,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
    )
    audio = cached_audio(video_id)
    if audio is None:
        detail = (result.stderr or result.stdout or "").strip()[-1200:]
        raise RuntimeError(f"audio download failed: {detail}")
    return audio


def json3_payload(
    *,
    video_id: str,
    model_name: str,
    segments: list[dict[str, Any]],
    language: str,
    probability: float,
    alignment: dict[str, Any],
) -> dict[str, Any]:
    events = []
    for segment in segments:
        start_ms = max(0, round(float(segment["start"]) * 1000))
        duration_ms = max(
            1,
            round((float(segment["end"]) - float(segment["start"])) * 1000),
        )
        events.append(
            {
                "tStartMs": start_ms,
                "dDurationMs": duration_ms,
                "segs": [{"utf8": str(segment["text"])}],
            }
        )
    return {
        "wireMagic": "shokker-local-asr-v1",
        "events": events,
        "_shokkerProvenance": {
            "kind": "local-speech-to-text",
            "engine": "faster-whisper",
            "model": model_name,
            "videoId": video_id,
            "language": language,
            "languageProbability": round(float(probability), 6),
            "audioSourceKind": alignment["audioSourceKind"],
            "canonicalTimestampMapping": alignment[
                "canonicalTimestampMapping"
            ],
            "speakerDiarized": False,
            "fullPayloadPublic": False,
        },
    }


def transcribe_one(
    model: WhisperModel,
    model_name: str,
    video_id: str,
    *,
    force: bool,
) -> None:
    target = CAPTIONS / f"{video_id}.json"
    if target.exists() and target.stat().st_size > 10_000 and not force:
        print(f"[skip] {video_id} already has a substantial caption cache", flush=True)
        return
    print(f"[audio] {video_id}", flush=True)
    audio = download_audio(video_id)
    print(f"[asr]   {video_id} <- {audio.name}", flush=True)
    iterator, info = model.transcribe(
        str(audio),
        language="en",
        beam_size=3,
        best_of=3,
        vad_filter=True,
        vad_parameters={"min_silence_duration_ms": 550},
        condition_on_previous_text=True,
        initial_prompt=(
            "We Watched A Movie, WWAM, horror movie livestream with Mike and J. "
            "Halloween, Michael Myers, Dr. Loomis, Dr. Challis, Corey Feldman, "
            "Scream, Ghostface, Friday the 13th, Jason Voorhees, A Nightmare on "
            "Elm Street, Freddy Krueger, Predator, RoboCop, Terminator, Alien, "
            "John Carpenter, Wes Craven, movie news, rankings and dark comedy."
        ),
    )
    segments: list[dict[str, Any]] = []
    final_time = 0.0
    for index, segment in enumerate(iterator, 1):
        text = " ".join(str(segment.text or "").split())
        if text:
            segments.append(
                {
                    "start": round(float(segment.start), 3),
                    "end": round(float(segment.end), 3),
                    "text": text,
                }
            )
        final_time = float(segment.end)
        if index % 100 == 0:
            print(
                f"[asr]   {video_id} {index} segments through "
                f"{int(final_time) // 3600}:"
                f"{int(final_time) % 3600 // 60:02d}:"
                f"{int(final_time) % 60:02d}",
                flush=True,
            )
    if len(segments) < 50:
        raise RuntimeError(f"local ASR produced only {len(segments)} segments")
    payload = json3_payload(
        video_id=video_id,
        model_name=model_name,
        segments=segments,
        language=info.language,
        probability=info.language_probability,
        alignment=audio_alignment(video_id),
    )
    temporary = target.with_suffix(".json.tmp")
    temporary.write_text(
        json.dumps(payload, ensure_ascii=False),
        encoding="utf-8",
    )
    temporary.replace(target)
    print(
        f"[done]  {video_id} {len(segments)} segments through "
        f"{final_time / 3600:.2f} hours -> {target.name}",
        flush=True,
    )


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", default=DEFAULT_MODEL)
    parser.add_argument("--ids", nargs="*")
    parser.add_argument("--force", action="store_true")
    parser.add_argument("--stamp-provenance", action="store_true")
    args = parser.parse_args()
    ids = list(dict.fromkeys(args.ids or retry_ids()))
    if not ids:
        print("No captionless sources remain.")
        return 0
    if args.stamp_provenance:
        failures: list[dict[str, str]] = []
        for video_id in ids:
            try:
                stamp_existing_provenance(video_id)
            except Exception as error:
                failures.append({"id": video_id, "error": str(error)})
                print(f"[error] {video_id} {error}", flush=True)
        if failures:
            raise RuntimeError(
                f"{len(failures)} local transcript provenance stamps failed"
            )
        print("[complete] local transcript provenance stamped", flush=True)
        return 0
    print(
        f"[model] loading {args.model} on CUDA for {len(ids)} captionless sources",
        flush=True,
    )
    model = WhisperModel(args.model, device="cuda", compute_type="float16")
    failures: list[dict[str, str]] = []
    for index, video_id in enumerate(ids, 1):
        print(f"[queue] {index}/{len(ids)} {video_id}", flush=True)
        try:
            transcribe_one(model, args.model, video_id, force=args.force)
        except Exception as error:
            failures.append({"id": video_id, "error": str(error)})
            print(f"[error] {video_id} {error}", flush=True)
    ASR_RETRY.parent.mkdir(parents=True, exist_ok=True)
    ASR_RETRY.write_text(
        json.dumps(
            {
                "schema": "shokker-youtube-wiki/archive-completion-asr-retry/v1",
                "model": args.model,
                "failures": failures,
            },
            ensure_ascii=False,
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )
    if failures:
        raise RuntimeError(
            f"{len(failures)} captionless sources remain after local ASR"
        )
    print("[complete] local transcription queue finished", flush=True)
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as error:
        print(f"Local ASR fallback failed: {error}", file=sys.stderr)
        raise
