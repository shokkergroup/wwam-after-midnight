"""Build an audio-first watch-pass for the latest three WWAM livestreams.

This is intentionally conservative: it never assigns a speaker, intent, or visual
reaction. It uses the canonical YouTube audio locally, aligns acoustic features to
the public caption map, and emits bounded source receipts for the demo.
"""

from __future__ import annotations

import hashlib
import json
import math
import os
import re
import subprocess
from pathlib import Path

import numpy as np


ROOT = Path(__file__).resolve().parents[1]
AUDIO_DIR = ROOT / "source-cache" / "audio"
CAPTION_DIR = ROOT / "source-cache" / "captions"
DEMO_DIR = ROOT / "public" / "demo"
FFMPEG = Path(r"C:\Users\Ricky's PC\AppData\Roaming\Python\Python313\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v7.1.exe")
EPISODES = [
    ("LV2rmwEA0w4", "2026-07-23"),
    ("iz0WFhe6LYM", "2026-07-16"),
    ("ag3axSC9BpU", "2026-07-09"),
]


def runtime_target(duration_seconds: int, caption_events: int = 0) -> int:
    """Scale listening routes to runtime and evidence density without a fixed card cap."""
    runtime_component = max(15, round(duration_seconds / 300))
    density_bonus = max(0, round(caption_events / 180))
    return max(15, runtime_component + density_bonus)


def clock(seconds: int | float) -> str:
    value = max(0, int(round(float(seconds or 0))))
    hours, remainder = divmod(value, 3600)
    minutes, secs = divmod(remainder, 60)
    return f"{hours}:{minutes:02d}:{secs:02d}" if hours else f"{minutes}:{secs:02d}"


def listening_digest(candidates: list[dict], *, audio_available: bool = True) -> dict:
    counts: dict[str, int] = {}
    for candidate in candidates:
        category = str(candidate.get("category") or "OPEN MIC")
        counts[category] = counts.get(category, 0) + 1
    mix = [f"{name} ({count})" for name, count in sorted(counts.items(), key=lambda item: (-item[1], item[0]))[:4]]
    strongest = max(candidates, key=lambda item: float(item.get("score") or 0), default=None)
    if strongest:
        headline = f"Audio re-ranking favors {strongest.get('category', 'source leads')} at {clock(strongest.get('t', 0))}. The pass retained {len(candidates)} bounded routes across {', '.join(mix) or 'the caption map'}."
    else:
        headline = "The audio pass retained no safe route candidates."
    return {
        "mode": "audio-feature" if audio_available else "caption-only",
        "headline": headline,
        "signalMix": mix,
        "strongest": {"t": strongest.get("t"), "category": strongest.get("category"), "score": strongest.get("score")} if strongest else None,
        "evidence": "Acoustic energy re-ranks caption signals; it does not prove a joke, speaker, or visual reaction.",
    }


def category_counts(candidates: list[dict]) -> dict[str, int]:
    counts: dict[str, int] = {}
    for candidate in candidates:
        category = str(candidate.get("category") or "OPEN MIC")
        counts[category] = counts.get(category, 0) + 1
    return counts


def clean(text: object) -> str:
    return re.sub(r"\s+", " ", str(text or "")).strip()


def caption_events(video_id: str) -> list[dict]:
    caption_file = CAPTION_DIR / f"{video_id}.json"
    asr_file = CAPTION_DIR / f"{video_id}.asr.json"
    if not caption_file.exists() and asr_file.exists():
        payload = json.loads(asr_file.read_text(encoding="utf-8"))
        return [{"t": max(0.0, float(segment.get("start") or 0)), "end": max(0.05, float(segment.get("end") or segment.get("start") or 0)), "text": clean(segment.get("text")), "evidenceType": "local-whisper-transcript"} for segment in payload.get("segments", []) if clean(segment.get("text"))]
    if not caption_file.exists():
        return []
    payload = json.loads(caption_file.read_text(encoding="utf-8"))
    events: list[dict] = []
    for event in payload.get("events", []):
        segs = event.get("segs") or []
        if not segs:
            continue
        raw = clean("".join(str(seg.get("utf8", "")) for seg in segs))
        if not raw:
            continue
        t = max(0.0, float(event.get("tStartMs", 0)) / 1000.0)
        end = t + max(0.05, float(event.get("dDurationMs", 0)) / 1000.0)
        events.append({"t": t, "end": end, "text": raw, "evidenceType": "youtube-automatic-caption"})
    return events


def caption_window(events: list[dict], index: int, before: float = 8.0, after: float = 22.0) -> str:
    anchor = events[index]
    lines: list[str] = []
    for event in events[max(0, index - 6) : min(len(events), index + 8)]:
        if event["t"] < anchor["t"] - before or event["t"] > anchor["t"] + after:
            continue
        lines.append(event["text"])
    # Keep the excerpt readable without trying to manufacture a clean transcript.
    output: list[str] = []
    for token in clean(" ".join(lines)).split(" "):
        if token and (not output or output[-1].lower() != token.lower()):
            output.append(token)
    return " ".join(output)


def stream_features(audio_file: Path) -> dict:
    """Decode to 8 kHz mono float32 and return one acoustic row per second."""
    command = [str(FFMPEG), "-hide_banner", "-loglevel", "error", "-i", str(audio_file), "-ac", "1", "-ar", "8000", "-f", "f32le", "pipe:1"]
    process = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    frames: list[float] = []
    rows: list[dict] = []
    sample_rate = 8000
    carry = np.empty(0, dtype=np.float32)
    while True:
        block = process.stdout.read(sample_rate * 8 * 10) if process.stdout else b""
        if not block:
            break
        values = np.frombuffer(block, dtype=np.float32)
        if values.size == 0:
            continue
        values = np.concatenate((carry, values))
        usable = values.size - (values.size % sample_rate)
        for second, segment in enumerate(values[:usable].reshape(-1, sample_rate)):
            rms = float(np.sqrt(np.mean(np.square(segment)) + 1e-12))
            peak = float(np.max(np.abs(segment)))
            zero_cross = float(np.mean(np.abs(np.diff(np.signbit(segment)))))
            rows.append({"second": len(rows), "rms": rms, "db": 20.0 * math.log10(max(rms, 1e-6)), "peak": peak, "zcr": zero_cross})
        carry = values[usable:]
    _, stderr = process.communicate()
    if process.returncode != 0:
        raise RuntimeError(f"ffmpeg decode failed for {audio_file.name}: {stderr.decode(errors='replace')[-400:]}")
    if not rows:
        raise RuntimeError(f"No audio rows decoded for {audio_file.name}")
    rms = np.array([row["rms"] for row in rows], dtype=np.float64)
    peak = np.array([row["peak"] for row in rows], dtype=np.float64)
    for row in rows:
        row["energyPercentile"] = float(np.searchsorted(np.sort(rms), row["rms"], side="right") / len(rms) * 100.0)
        row["peakPercentile"] = float(np.searchsorted(np.sort(peak), row["peak"], side="right") / len(peak) * 100.0)
    return {
        "durationSeconds": len(rows),
        "rows": rows,
        "stats": {
            "dbP10": float(np.percentile([r["db"] for r in rows], 10)),
            "dbMedian": float(np.percentile([r["db"] for r in rows], 50)),
            "dbP90": float(np.percentile([r["db"] for r in rows], 90)),
            "energyP90Seconds": int(sum(row["energyPercentile"] >= 90 for row in rows)),
            "peakP95Seconds": int(sum(row["peakPercentile"] >= 95 for row in rows)),
        },
    }


SIGNALS = [
    ("ROOM BREAK", re.compile(r"\[(?:laughter|snorts?|crosstalk)\]|\b(?:oh my god|what the fuck|no way|i'm dying|hilarious|that's funny)\b", re.I)),
    ("WWAM UP IN YA", re.compile(r"\b(?:fuck|fucking|dick|cock|balls?|cum|fart|shit|bitch|piss|boob|boobs|tits?|asshole|boner|poop|dong|wiener(?:s)?|porn|jizz|horny|sexy)\b", re.I)),
    ("STRAIGHT TO STEVE'S ASSHOLE", re.compile(r"\b(?:hate|hated|worst|terrible|awful|sucks?|stupid|dumb|bullshit|garbage|lazy|weak|ruined|don't like|didn't like|not good)\b", re.I)),
    ("FAN SIGNAL", re.compile(r"super\s*chat|\bdonat(?:e|ed|ion)\b|lee(?:\s+the)?\s+machine|michael\s+part(?:on|in)|chat(?:'s| is) asking|question from (?:the )?chat", re.I)),
    ("CHARACTER SIGNAL", re.compile(r"\b(?:loomis|chall[ie]s|slender\s*man|corey feldman|feldman|michael myers|freddy|jason|chucky|tiffany)\b", re.I)),
    ("TAKE GETS NUCLEAR", re.compile(r"\b(?:obviously|literally|never|always|greatest|insane|ridiculous|unacceptable|wrong|right|point blank|period)\b", re.I)),
]


def signal_for(text: str) -> tuple[str, int]:
    hits = [(label, len(pattern.findall(text))) for label, pattern in SIGNALS if pattern.search(text)]
    if not hits:
        return ("OPEN MIC", 0)
    return max(hits, key=lambda pair: pair[1])


def candidate_rows(events: list[dict], audio: dict, max_candidates: int = 15) -> list[dict]:
    rows = audio["rows"]
    candidates: list[dict] = []
    for index, event in enumerate(events):
        text = event["text"]
        label, signal_hits = signal_for(text)
        marker = bool(re.search(r"\[(?:laughter|snorts?|crosstalk|applause)\]", text, re.I))
        words = len(text.split())
        if signal_hits == 0 and not marker and words < 10 and "!" not in text:
            continue
        start_second = max(0, int(event["t"] - 8))
        end_second = min(len(rows), int(event["end"] + 22))
        local = rows[start_second:end_second] or [rows[min(len(rows) - 1, int(event["t"]))]]
        energy = float(np.mean([row["energyPercentile"] for row in local]))
        peak = float(max(row["peakPercentile"] for row in local))
        db_span = float(max(row["db"] for row in local) - min(row["db"] for row in local))
        # Text/laughter establishes what kind of moment it may be; acoustic intensity
        # only re-ranks candidates and is never presented as a joke detector.
        score = min(99.0, 35.0 + signal_hits * 12.0 + (14.0 if marker else 0.0) + min(18.0, words / 3.0) + energy * 0.18 + peak * 0.09 + min(8.0, db_span / 4.0))
        start_time = min(len(rows) - 1, max(0, int(round(event["t"]))))
        end_time = min(len(rows), max(start_time + 1, int(round(max(event["end"], event["t"] + 8)))))
        candidates.append({
            "t": start_time,
            "end": end_time,
            "category": label,
            "label": label,
            "score": round(score, 1),
            "captionExcerpt": caption_window(events, index),
            "audio": {
                "windowSeconds": [start_second, end_second],
                "meanEnergyPercentile": round(energy, 1),
                "peakPercentile": round(peak, 1),
                "dbSpan": round(db_span, 1),
                "markerObserved": marker,
            },
            "signals": {"captionSignalHits": signal_hits, "captionMarker": marker},
            "evidenceBasis": f"canonical YouTube audio + source-local {events[0].get('evidenceType', 'caption')} alignment",
            "reviewStatus": "audio-feature-candidate; playback remains the authority",
        })
    candidates.sort(key=lambda row: (-row["score"], row["t"]))
    picked: list[dict] = []
    # Preserve the recurring WWAM lanes before filling the rest by score. A
    # laughter marker can otherwise crowd out every Steve's Asshole or
    # character receipt in a long show, even when those signals are present.
    priority_categories = ["STRAIGHT TO STEVE'S ASSHOLE", "CHARACTER SIGNAL", "WWAM UP IN YA", "FAN SIGNAL", "TAKE GETS NUCLEAR", "ROOM BREAK"]
    ordered = []
    seen_categories = set()
    for category in priority_categories:
        for candidate in candidates:
            if candidate["category"] == category and candidate not in ordered:
                ordered.append(candidate)
                seen_categories.add(category)
                break
    ordered.extend(candidate for candidate in candidates if candidate not in ordered)
    for candidate in ordered:
        if any(abs(candidate["t"] - row["t"]) < 45 for row in picked):
            continue
        picked.append(candidate)
        if len(picked) >= max_candidates:
            break
    picked.sort(key=lambda row: row["t"])
    for rank, row in enumerate(picked, 1):
        row["rank"] = rank
    return picked


def provenance(video_id: str, date: str, audio_file: Path, duration: int, format_id: str = "139") -> dict:
    digest = hashlib.sha256(audio_file.read_bytes()).hexdigest()
    return {
        "schema": "shokker-lore/audio-acquisition/v1",
        "observedAt": "2026-08-01T00:00:00-04:00",
        "canonicalSource": {"id": video_id, "url": f"https://www.youtube.com/watch?v={video_id}", "uploadDate": date, "durationSeconds": duration},
        "acquiredSource": {"formatId": format_id, "container": audio_file.suffix.lstrip(".") or "unknown", "file": f"source-cache/audio/{audio_file.name}", "bytes": audio_file.stat().st_size, "sha256": digest, "decodeValidation": "complete"},
        "acquisition": {"tool": "yt-dlp", "command": f"python -m yt_dlp --js-runtimes node:C:\\Program Files\\nodejs\\node.exe --remote-components ejs:github --no-playlist --retries 10 --fragment-retries 10 --continue -f {format_id} --ffmpeg-location imageio-ffmpeg ffmpeg-win-x86_64-v7.1.exe", "alignment": "canonical-youtube-media", "rightsNote": "Raw media is retained locally for analysis; public pages link to the official upload and publish bounded timestamps only."},
    }


def main() -> None:
    output: dict = {"schema": "wwam/watch-pass-pilot/v1", "version": "2026-audio-pilot-01", "status": "audio-feature-pilot", "scope": "latest-three-2026-livestreams", "episodes": {}}
    for video_id, date in EPISODES:
        audio_file = AUDIO_DIR / f"{video_id}.m4a"
        if not audio_file.exists():
            raise FileNotFoundError(audio_file)
        events = caption_events(video_id)
        audio = stream_features(audio_file)
        target = runtime_target(audio["durationSeconds"], len(events))
        candidates = candidate_rows(events, audio, max_candidates=target)
        episode = {
            "id": video_id,
            "date": date,
            "status": "audio-feature-pilot",
            "media": {"sourceUrl": f"https://www.youtube.com/watch?v={video_id}", "localFile": f"source-cache/audio/{video_id}.m4a", "container": "m4a", "durationSeconds": audio["durationSeconds"], "audioOnly": True},
            "audit": {"captionEvents": len(events), "audioRows": audio["durationSeconds"], "laughterOrOverlapMarkers": sum(bool(re.search(r"\[(?:laughter|snorts?|crosstalk)\]", event["text"], re.I)) for event in events), "candidateCount": len(candidates), "candidateTarget": target, "candidateCategories": category_counts(candidates), "audioStats": audio["stats"]},
            "candidates": candidates,
            "listeningDigest": listening_digest(candidates),
            "note": "This pilot listened to the canonical audio track and used captions only for navigation. It does not claim a human visual watch, speaker diarization, or a definitive joke/intensity judgment; open the official source at each bounded timestamp.",
            "provenanceFile": f"source-cache/audio/{video_id}.provenance.json",
        }
        output["episodes"][video_id] = episode
        (AUDIO_DIR / f"{video_id}.provenance.json").write_text(json.dumps(provenance(video_id, date, audio_file, audio["durationSeconds"]), indent=2) + "\n", encoding="utf-8")
        print(f"{video_id}: {len(events)} caption events, {audio['durationSeconds']} audio rows, {len(candidates)} candidates")
    js = "window.WWAM_WATCH_PASS_PILOT = " + json.dumps(output, ensure_ascii=False, separators=(",", ":")) + ";\n"
    (DEMO_DIR / "wwam-watch-pass-pilot.js").write_text(js, encoding="utf-8")


if __name__ == "__main__":
    main()
