"""Publish bounded ASR excerpts aligned to existing audio-ranked candidates.

Full local Whisper ledgers remain private under source-cache. This output is a
small public navigation layer: at most 16 words, exact source timestamps, and
no speaker/visual/intent inference.
"""

from __future__ import annotations

import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DEMO = ROOT / "public" / "demo"
CAPTIONS = ROOT / "source-cache" / "captions"
OUTPUT = DEMO / "wwam-livestream-asr-excerpts.js"


def load_js_json(path: Path) -> dict:
    raw = path.read_text(encoding="utf-8")
    return json.loads(raw[raw.index("=") + 1 :].strip().rstrip(";"))


def words(text: str) -> list[str]:
    return re.findall(r"[A-Za-z0-9]+(?:['-][A-Za-z0-9]+)*", text)


def bounded_excerpt(text: str, limit: int = 16) -> str:
    text = " ".join(str(text or "").split()).strip()
    if not text:
        return ""
    # Prefer an intact short sentence; it reads better and avoids presenting a
    # clipped ASR breath as a finished quote.
    sentences = re.split(r"(?<=[.!?])\s+", text)
    intact = []
    for raw_sentence in sentences:
        sentence = raw_sentence.strip()
        sentence_words = words(sentence)
        if len(sentence_words) > limit or not re.search(r"[.!?][\"']?$", sentence):
            continue
        normalized = [word.lower() for word in sentence_words]
        # Whisper can make a clause look finished by inheriting punctuation
        # from the next window. Do not publish obvious conditional fragments,
        # filler openings, or a short repeated-word stutter as if it were a
        # clean quote; the timestamp remains available for playback review.
        if normalized and normalized[0] in {"uh", "um", "er"}:
            continue
        if normalized and normalized[0] in {"if", "when", "while", "although", "because", "since", "unless", "which", "that"} and "," not in sentence[:90]:
            continue
        if any(normalized[index:index + 2] == normalized[next_index:next_index + 2]
               for index in range(max(0, len(normalized) - 3))
               for next_index in range(index + 2, min(len(normalized) - 1, index + 7))):
            continue
        if re.search(r"\b(?:it's|he's|she's|they're|i'm|we're)\s+(?:kind of|sort of)\s+(?:was|were|is|are)\b", sentence, re.I):
            continue
        intact.append(sentence)
    if intact:
        return max(intact, key=lambda sentence: len(words(sentence)))
    # A trailing Whisper fragment is still useful to the player, but it is not
    # finished public copy. Leave the excerpt blank and preserve the exact
    # audio timestamp instead of publishing a clipped sentence.
    return ""


def excerpt_for(segments: list[dict], at: float) -> dict:
    nearby = [
        segment for segment in segments
        if float(segment.get("end", 0)) >= at - 5 and float(segment.get("start", 0)) <= at + 18
    ]
    nearby.sort(key=lambda segment: (abs(float(segment.get("start", 0)) - at), float(segment.get("start", 0))))
    text = bounded_excerpt(" ".join(str(segment.get("text") or "") for segment in nearby))
    refs = [
        {
            "start": round(float(segment.get("start", 0)), 3),
            "end": round(float(segment.get("end", 0)), 3),
        }
        for segment in nearby[:4]
    ]
    return {
        "excerpt": text,
        "segmentCount": len(nearby),
        "segmentRefs": refs,
        "evidenceType": "local-whisper-transcript",
        "excerptWordLimit": 16,
    }


def main() -> None:
    audio_pass = load_js_json(DEMO / "wwam-livestream-audio-pass.js")
    sources = {}
    for source_id, episode in (audio_pass.get("episodes") or {}).items():
        ledger_path = CAPTIONS / f"{source_id}.asr.json"
        if not ledger_path.exists():
            continue
        ledger = json.loads(ledger_path.read_text(encoding="utf-8"))
        candidates = []
        for candidate in episode.get("candidates") or []:
            at = float(candidate.get("t") or 0)
            aligned = excerpt_for(ledger.get("segments") or [], at)
            candidates.append({"t": round(at, 3), **aligned})
        sources[source_id] = {
            "model": ledger.get("model"),
            "audioSha256": ledger.get("audioSha256"),
            "generatedAt": ledger.get("generatedAt"),
            "speakerDiarized": False,
            "visualContextVerified": False,
            "candidates": candidates,
        }
    payload = {
        "schema": "wwam-livestream-asr-excerpts/v1",
        "policy": "bounded local Whisper excerpts aligned to existing audio-ranked timestamps; playback remains the authority",
        "publicExcerptWordLimit": 16,
        "sources": sources,
    }
    OUTPUT.write_text(
        "window.WWAM_LIVESTREAM_ASR_EXCERPTS = " +
        json.dumps(payload, ensure_ascii=False, separators=(",", ":")) + ";\n",
        encoding="utf-8",
    )
    print(f"Wrote {OUTPUT}: {len(sources)} sources // {sum(len(item['candidates']) for item in sources.values())} aligned excerpts")


if __name__ == "__main__":
    main()
