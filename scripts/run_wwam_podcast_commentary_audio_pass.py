#!/usr/bin/env python3
"""Listen/analyze the recovered official WWAM podcast film commentaries.

The six records in the official-feed recovery shelf have no trustworthy public
YouTube counterpart in the current live-channel snapshot. This pass downloads
the public podcast enclosure, transcribes it locally, decodes one-second
acoustic features, and publishes only bounded podcast-native receipts. Raw
audio and transcripts remain under source-cache (gitignored); no podcast time
is ever presented as a YouTube timestamp.
"""

from __future__ import annotations

import hashlib
import json
import os
import site
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEMO_DIR = ROOT / "public" / "demo"
CANON_FILE = DEMO_DIR / "wwam-watchalong-canon.js"
AUDIO_DIR = ROOT / "source-cache" / "audio-podcast"
CAPTIONS_DIR = ROOT / "source-cache" / "captions"
OUTPUT_FILE = DEMO_DIR / "wwam-podcast-commentary-audio.js"
MODEL_NAME = "large-v3-turbo"

AUDIO_DIR.mkdir(parents=True, exist_ok=True)
CAPTIONS_DIR.mkdir(parents=True, exist_ok=True)

# faster-whisper's Windows CUDA wheels keep DLLs outside PATH.
_dll_handles = []
if os.name == "nt":
    roots = [Path(site.getusersitepackages()), *(Path(item) for item in site.getsitepackages())]
    dll_dirs = []
    for root in roots:
        for relative in ("nvidia/cublas/bin", "nvidia/cudnn/bin"):
            folder = root / relative
            if folder.is_dir():
                dll_dirs.append(str(folder))
                _dll_handles.append(os.add_dll_directory(str(folder)))
    if dll_dirs:
        os.environ["PATH"] = os.pathsep.join(dll_dirs + [os.environ.get("PATH", "")])

from faster_whisper import WhisperModel  # noqa: E402

from run_wwam_audio_watch_pass import candidate_rows, category_counts, runtime_target, stream_features  # noqa: E402


def load_window(path: Path) -> dict:
    raw = path.read_text(encoding="utf-8")
    return json.JSONDecoder().raw_decode(raw.split("=", 1)[1].lstrip())[0]


def download(record: dict) -> Path:
    target = AUDIO_DIR / f"{record['key']}.mp3"
    if target.exists() and target.stat().st_size > 1024:
        print(f"[download] reuse {record['movieTitle']} -> {target.name}", flush=True)
        return target
    temp = target.with_suffix(".mp3.part")
    request = urllib.request.Request(record["sourceUrl"], headers={"User-Agent": "WWAM-after-midnight-audio-pass/1.0"})
    print(f"[download] {record['movieTitle']}", flush=True)
    with urllib.request.urlopen(request, timeout=90) as response, temp.open("wb") as handle:
        while True:
            block = response.read(1024 * 1024)
            if not block:
                break
            handle.write(block)
    if temp.stat().st_size <= 1024:
        raise RuntimeError(f"downloaded source is unexpectedly small: {temp}")
    temp.replace(target)
    return target


def transcript_path(record: dict) -> Path:
    return CAPTIONS_DIR / f"podcast-{record['key']}.asr.json"


def transcribe(model: WhisperModel, record: dict, audio: Path) -> list[dict]:
    target = transcript_path(record)
    if target.exists() and target.stat().st_size > 10_000:
        payload = json.loads(target.read_text(encoding="utf-8"))
        return list(payload.get("segments") or [])
    print(f"[asr] {record['movieTitle']}", flush=True)
    iterator, info = model.transcribe(
        str(audio),
        language="en",
        beam_size=3,
        best_of=3,
        vad_filter=True,
        vad_parameters={"min_silence_duration_ms": 550},
        condition_on_previous_text=True,
        initial_prompt=(
            "We Watched A Movie, WWAM, Mike and J, dark comedy film commentary. "
            "American Psycho, Wayne's World, Planes Trains and Automobiles, "
            "Once Upon a Time in Hollywood, Death Wish, Predator, horror movies, "
            "Michael Myers, Dr. Loomis, Dr. Challis, Corey Feldman."
        ),
    )
    segments = []
    for index, segment in enumerate(iterator, 1):
        text = " ".join(str(segment.text or "").split())
        if text:
            segments.append({"start": round(float(segment.start), 3), "end": round(float(segment.end), 3), "text": text})
        if index % 100 == 0:
            print(f"[asr] {record['movieTitle']} segments={index} through {int(float(segment.end))}s", flush=True)
    if len(segments) < 50:
        raise RuntimeError(f"local ASR produced only {len(segments)} segments for {record['key']}")
    payload = {
        "schema": "shokker-wwam-podcast-local-asr/v1",
        "sourceKey": record["key"],
        "sourceUrl": record["sourceUrl"],
        "model": MODEL_NAME,
        "language": info.language,
        "languageProbability": round(float(info.language_probability), 6),
        "speakerDiarized": False,
        "canonicalTimestampMapping": False,
        "segments": segments,
    }
    target.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")
    return segments


def events_from_segments(segments: list[dict]) -> list[dict]:
    return [
        {"t": max(0.0, float(item.get("start") or 0)), "end": max(0.05, float(item.get("end") or item.get("start") or 0)), "text": str(item.get("text") or "").strip(), "evidenceType": "local-whisper-transcript"}
        for item in segments
        if str(item.get("text") or "").strip()
    ]


def digest(candidates: list[dict]) -> dict:
    counts = category_counts(candidates)
    mix = [f"{name} ({count})" for name, count in sorted(counts.items(), key=lambda item: (-item[1], item[0]))[:5]]
    strongest = max(candidates, key=lambda item: float(item.get("score") or 0), default=None)
    return {
        "mode": "podcast-audio-feature",
        "headline": f"Podcast audio re-ranking favors {strongest.get('category', 'source leads')} at {int(strongest.get('t', 0)) // 60}:{int(strongest.get('t', 0)) % 60:02d}." if strongest else "The podcast audio pass retained bounded routes.",
        "signalMix": mix,
        "strongest": {"t": strongest.get("t"), "category": strongest.get("category"), "score": strongest.get("score")} if strongest else None,
        "evidence": "Local Whisper establishes navigation text; one-second acoustic features re-rank intensity. This does not prove a joke, speaker, intent, or visual reaction.",
    }


def record_pass(record: dict, model: WhisperModel) -> dict:
    audio_path = download(record)
    segments = transcribe(model, record, audio_path)
    events = events_from_segments(segments)
    audio = stream_features(audio_path)
    target = runtime_target(audio["durationSeconds"], len(events))
    candidates = candidate_rows(events, audio, max_candidates=target)
    for candidate in candidates:
        candidate["evidenceBasis"] = "official WWAM podcast audio + local faster-whisper transcript alignment"
        candidate["reviewStatus"] = "podcast-bound audio candidate; playback remains the authority"
        candidate["timestampAuthority"] = "official WWAM podcast audio only"
        candidate["canonicalTimestampMapping"] = False
    digest_value = digest(candidates)
    digest_value["evidence"] = "Official WWAM podcast audio was decoded and locally transcribed. All timestamps in this card are bound to the podcast player and must not be copied to a YouTube player."
    sha = hashlib.sha256(audio_path.read_bytes()).hexdigest()
    return {
        "key": record["key"],
        "movieTitle": record["movieTitle"],
        "sourceUrl": record["sourceUrl"],
        "status": "podcast-audio-feature",
        "media": {"sourceUrl": record["sourceUrl"], "localFile": f"source-cache/audio-podcast/{audio_path.name}", "container": "mp3", "durationSeconds": audio["durationSeconds"], "audioOnly": True, "canonicalTimestampMapping": False},
        "audit": {"transcriptSegments": len(segments), "audioRows": audio["durationSeconds"], "candidateCount": len(candidates), "candidateTarget": target, "candidateCategories": category_counts(candidates), "audioStats": audio["stats"], "sha256": sha},
        "candidates": candidates,
        "listeningDigest": digest_value,
        "evidence": {"type": "official-wwam-podcast-audio-local-whisper", "sourceTitle": record["title"], "sourceDate": record["date"], "timestampPolicy": "podcast player only", "speakerDiarized": False, "canonicalTimestampMapping": False},
    }


def main() -> None:
    canon = load_window(CANON_FILE)
    records = canon.get("podcastCommentaries") or []
    if not records:
        raise RuntimeError("No podcastCommentaries found in generated canon")
    print(f"[model] loading {MODEL_NAME} on CUDA for {len(records)} podcast commentaries", flush=True)
    model = WhisperModel(MODEL_NAME, device="cuda", compute_type="float16")
    output = {"schema": "shokker-wwam-podcast-commentary-audio/v1", "generated": __import__("datetime").datetime.now(__import__("datetime").timezone.utc).isoformat(), "scope": "six official podcast-only full-film commentaries", "records": {}}
    for index, record in enumerate(records, 1):
        print(f"[queue] {index}/{len(records)} {record['movieTitle']}", flush=True)
        output["records"][record["key"]] = record_pass(record, model)
    OUTPUT_FILE.write_text("window.WWAM_PODCAST_COMMENTARY_AUDIO = " + json.dumps(output, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf-8")
    print(f"[complete] wrote {OUTPUT_FILE.name} with {len(output['records'])} podcast audio passes", flush=True)


if __name__ == "__main__":
    main()
