"""Consume the prioritized local-audio ASR queue in bounded overnight batches."""

from __future__ import annotations

import argparse
import hashlib
import json
import subprocess
import sys
from pathlib import Path

from run_wwam_latest_livestream_asr import audio_path, install_cuda_dll_search_path, transcribe_one


ROOT = Path(__file__).resolve().parents[1]
QUEUE = ROOT / "source-cache" / "wwam-asr-queue.json"
CAPTIONS = ROOT / "source-cache" / "captions"
SELECTOR = ROOT / "scripts" / "select_wwam_asr_queue.mjs"
EXCERPT_GENERATOR = ROOT / "scripts" / "generate_wwam_livestream_asr_excerpts.py"
WATCHALONG_CANON_GENERATOR = ROOT / "scripts" / "generate-wwam-watchalong-canon.mjs"
LIVESTREAM_CANON_GENERATOR = ROOT / "scripts" / "generate-wwam-livestream-canon.mjs"
TRANSCRIPT_PUBLICATION_AUDIT = ROOT / "scripts" / "audit-wwam-transcript-publication.mjs"
DEMO = ROOT / "public" / "demo"


def load_js_json(path: Path) -> dict:
    raw = path.read_text(encoding="utf-8")
    return json.loads(raw[raw.index("=") + 1 :].strip().rstrip(";"))


def episode_map(path: Path) -> dict:
    payload = load_js_json(path)
    episodes = payload.get("episodes") or {}
    return episodes if isinstance(episodes, dict) else {
        str(row.get("id")): row for row in episodes if row.get("id")
    }


LIVESTREAM_AUDIO_PASS = episode_map(DEMO / "wwam-livestream-audio-pass.js")
WATCHALONG_CANON = episode_map(DEMO / "wwam-watchalong-canon.js")


def bounded_clip_timestamps(row: dict) -> list[float] | str:
    """Return merged ranked-audio windows with context padding for Whisper.

    The audio pass already ranks exact source windows. Whisper only needs to
    inspect those windows to produce bounded transcript doors; decoding the
    silent/low-signal hours between them adds cost without improving this
    public evidence layer. An empty result deliberately falls back to the
    existing full-source transcription path.
    """
    source_id = str(row.get("id") or "")
    episode = (LIVESTREAM_AUDIO_PASS if row.get("kind") == "livestream" else WATCHALONG_CANON).get(source_id) or {}
    candidates = episode.get("candidates")
    if candidates is None:
        candidates = episode.get("watchPass")
    if isinstance(candidates, dict):
        candidates = candidates.get("candidates")
    if not isinstance(candidates, list):
        return "0"
    duration = float(row.get("duration") or episode.get("duration") or 0)
    windows = []
    for candidate in candidates:
        try:
            at = float(candidate.get("t"))
        except (TypeError, ValueError):
            continue
        if at < 0 or (duration and at > duration):
            continue
        try:
            end = float(candidate.get("end"))
        except (TypeError, ValueError):
            end = at + 18
        if end <= at:
            end = at + 18
        start = max(0.0, at - 12)
        stop = min(duration, end + 12) if duration else end + 12
        if stop > start:
            windows.append((start, stop))
    if not windows:
        return "0"
    windows.sort()
    merged = []
    for start, stop in windows:
        if merged and start <= merged[-1][1] + 4:
            merged[-1] = (merged[-1][0], max(merged[-1][1], stop))
        else:
            merged.append((start, stop))
    flattened = []
    for start, stop in merged:
        flattened.extend([round(start, 3), round(stop, 3)])
    return flattened or "0"


def validate_ledger(source_id: str, payload: dict) -> None:
    """Fail closed before a newly written transcript can reach the public layer."""
    if str(payload.get("sourceId")) != source_id:
        raise ValueError(f"ASR ledger source mismatch for {source_id}")
    duration = float(payload.get("durationSeconds") or 0)
    segments = payload.get("segments") or []
    if duration <= 0 or not segments:
        raise ValueError(f"ASR ledger has no usable coverage for {source_id}")
    for segment in segments:
        start = float(segment.get("start"))
        end = float(segment.get("end"))
        if start < 0 or end < start or end > duration + 5 or not str(segment.get("text") or "").strip():
            raise ValueError(f"ASR ledger has malformed segment for {source_id}")
    audio_sha = hashlib.sha256(audio_path(source_id).read_bytes()).hexdigest()
    if audio_sha != payload.get("audioSha256"):
        raise ValueError(f"ASR ledger audio hash mismatch for {source_id}")
    print(f"[verify] {source_id} // {len(segments)} valid segments // audio SHA match", flush=True)


def normalize_tail_overrun(source_id: str, payload: dict) -> bool:
    """Clamp a Whisper tail that runs past the verified media duration.

    Windowed decoding can let the final segment inherit a few seconds from a
    padded window. If the segment begins inside the real tape, preserving its
    text while clamping only the end to ``durationSeconds`` is safer than
    losing the whole source. Segments that start outside the tape still fail
    closed in ``validate_ledger``.
    """
    duration = float(payload.get("durationSeconds") or 0)
    changed = False
    for segment in payload.get("segments") or []:
        start = float(segment.get("start") or 0)
        end = float(segment.get("end") or 0)
        if duration > 0 and start <= duration and end > duration:
            segment["end"] = round(duration, 3)
            changed = True
    if changed:
        ledger_path = CAPTIONS / f"{source_id}.asr.json"
        ledger_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(f"[normalize] {source_id} // clamped tail segment(s) to {duration:.3f}s", flush=True)
    return changed


def refresh_queue() -> dict:
    subprocess.run(["node", str(SELECTOR)], cwd=ROOT, check=True)
    return json.loads(QUEUE.read_text(encoding="utf-8"))


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--batches", type=int, default=3)
    parser.add_argument("--batch-size", type=int, default=3)
    args = parser.parse_args()
    install_cuda_dll_search_path()
    from faster_whisper import WhisperModel

    print("[queue] loading large-v3-turbo on CUDA", flush=True)
    model = WhisperModel("large-v3-turbo", device="cuda", compute_type="float16")
    for batch in range(max(0, args.batches)):
        queue = refresh_queue()
        rows = list(queue.get("next") or [])[: max(1, args.batch_size)]
        if not rows:
            print("[queue] no local-audio sources remain", flush=True)
            return
        ids = [str(row["id"]) for row in rows]
        print(f"[queue] batch {batch + 1} // {', '.join(ids)}", flush=True)
        for row in rows:
            source_id = str(row["id"])
            clip_timestamps = bounded_clip_timestamps(row)
            if clip_timestamps == "0":
                print(f"[queue] {source_id} // no ranked windows // full-source fallback", flush=True)
            else:
                print(
                    f"[queue] {source_id} // {len(clip_timestamps) // 2} merged Whisper windows",
                    flush=True,
                )
            payload = transcribe_one(model, source_id, clip_timestamps=clip_timestamps)
            normalize_tail_overrun(source_id, payload)
            validate_ledger(source_id, payload)
            # Publish the bounded navigation layer as soon as this source is
            # complete. A neighboring three-hour source should not hold back
            # a finished ledger from reaching the public Wiki.
            subprocess.run([sys.executable, str(EXCERPT_GENERATOR)], cwd=ROOT, check=True)
            # Watchalongs use a separate canon and route adapter from
            # livestreams. Do not leave a finished commentary transcript in
            # source-cache with no public Watchalong refresh behind it.
            if str(row.get("kind") or "").lower() == "watchalong":
                subprocess.run(["node", str(WATCHALONG_CANON_GENERATOR)], cwd=ROOT, check=True)
            elif str(row.get("kind") or "").lower() == "livestream":
                # The visible livestream canon must consume the verified local
                # ledger, not only the separate listening overlay. This keeps
                # summaries, topic doors, and moment cards source-aligned.
                subprocess.run(["node", str(LIVESTREAM_CANON_GENERATOR)], cwd=ROOT, check=True)
            # Do not let a successful audio decode masquerade as a finished
            # public episode. The audit compares every local ledger against
            # the visible canon and fails the tranche if this source is still
            # stale, empty, or attached to the wrong evidence lane.
            subprocess.run(["node", str(TRANSCRIPT_PUBLICATION_AUDIT), "--strict"], cwd=ROOT, check=True)
    print("[queue] bounded batch run complete; generated excerpts are ready for audit/commit", flush=True)


if __name__ == "__main__":
    main()
