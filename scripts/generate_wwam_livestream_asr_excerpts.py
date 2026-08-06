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


def clean(text: object) -> str:
    return " ".join(str(text or "").split()).strip()


LOW_SIGNAL_SENTENCES = {
    "you know what i mean",
    "well it happens to the best of us",
    "i don't know",
    "what do you mean",
    "yeah i know",
    "okay i know",
}


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
        # The public card and its audit both count visible whitespace-delimited
        # words.  Keep the generator on that same measure: punctuation inside
        # a token (for example ``myspace.com`` or ``1,005``) must not sneak a
        # four-word fragment through the five-word floor.
        visible_word_count = len(sentence.split())
        if visible_word_count < 5 or len(sentence_words) > limit or not re.search(r"[.!?][\"']?$", sentence):
            continue
        normalized = [word.lower() for word in sentence_words]
        # A joined window can begin in the middle of a thought even when the
        # final token has punctuation. Whisper usually capitalizes a fresh
        # utterance, so a lowercase opening is a useful fail-closed signal.
        if sentence and sentence[0].islower():
            continue
        # A complete sentence is not automatically a useful moment. These
        # are common conversational acknowledgements that make a public card
        # feel padded and tell the listener nothing about the door behind it.
        # Keep the timestamp available, but wait for a sentence with an
        # actual opinion, joke, question, or bit.
        low_signal = re.sub(r"[^a-z0-9' ]+", "", sentence.lower()).strip()
        if low_signal in LOW_SIGNAL_SENTENCES:
            continue
        # Whisper can make a clause look finished by inheriting punctuation
        # from the next window. Do not publish obvious conditional fragments,
        # filler openings, or a short repeated-word stutter as if it were a
        # clean quote; the timestamp remains available for playback review.
        if normalized and normalized[0] in {"uh", "um", "er"}:
            continue
        if normalized and normalized[0] in {"and", "but", "or", "so", "then", "if", "when", "while", "although", "because", "since", "unless", "which", "that"} and "," not in sentence[:90]:
            continue
        # A short ASR window can inherit punctuation while still ending on a
        # dangling preposition, helper verb, or article. Keep that timestamp
        # playable, but do not promote the fragment as public prose.
        if normalized[-1] in {
            "a", "an", "the", "to", "of", "and", "but", "for", "with", "in", "on",
            "at", "is", "are", "was", "were", "be", "been", "being", "did", "does",
            "do", "that", "which", "because", "if", "when", "like", "st", "dr", "mr",
            "ms", "jr", "sr", "etc", "don't", "cant", "can't", "won't", "didn't",
            "isn't", "aren't", "wasn't", "weren't", "couldn't", "wouldn't", "shouldn't",
        }:
            continue
        # Whisper occasionally produces an adjacent stutter or a recognizable
        # hallucinated tail. These are navigation coordinates, not quotes.
        if re.search(r"\b([A-Za-z][A-Za-z'-]*)\s+\1\b", sentence, re.I):
            continue
        # Punctuation can hide the same stutter from the simple whitespace
        # check above (for example, “my, my, my theme song”). Keep the exact
        # audio receipt, but do not make a visibly garbled line the visitor's
        # first description of a listening door.
        if re.search(r"\b([A-Za-z][A-Za-z'-]*)\s*(?:[,;:]\s*|\s+)\1\b", sentence, re.I):
            continue
        if re.search(r"\b(?:did\s+a\s+good|one\s+section|not\s+allowed\s+to|you're\s+not\s+allowed\s+to)\b", sentence, re.I):
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
    window = [
        segment for segment in segments
        if float(segment.get("end", 0)) >= at - 5 and float(segment.get("start", 0)) <= at + 18
    ]
    # Whisper ledgers are chronological, but selecting by distance first can
    # splice the closest clauses together in the wrong order. Keep the public
    # copy conversational by joining speech in source order; use proximity
    # only to choose the small, exact playback receipt set below.
    nearby = sorted(window, key=lambda segment: float(segment.get("start", 0)))
    text = bounded_excerpt(" ".join(str(segment.get("text") or "") for segment in nearby))
    receipt_segments = sorted(
        window,
        key=lambda segment: (abs(float(segment.get("start", 0)) - at), float(segment.get("start", 0))),
    )[:4]
    receipt_segments.sort(key=lambda segment: float(segment.get("start", 0)))
    refs = [
        {
            "start": round(float(segment.get("start", 0)), 3),
            "end": round(float(segment.get("end", 0)), 3),
        }
        for segment in receipt_segments
    ]
    return {
        "excerpt": text,
        "segmentCount": len(window),
        "segmentRefs": refs,
        "evidenceType": "local-whisper-transcript",
        "excerptWordLimit": 16,
    }


TEXT_CUE_RE = re.compile(
    r"\b(?:fuck(?:ing)?|shit|asshole|dick|balls|tits|cunt|horny|poop|piss|suck|cock|boob|boner|goddamn|motherfucker)\b"
    r"|\b(?:hilarious|funny|laugh|laughing|crazy|insane|what the fuck|oh my god|holy shit)\b"
    r"|\b(?:Loomis|Challis|Slenderman|Feldman|Michael Myers|Ghostface|Freddy|Jason|Steve's Asshole|Up in Ya)\b",
    re.I,
)


def text_cue_score(text: str) -> float:
    """Rank transcript-only doors without pretending the text is a joke verdict."""
    tokens = words(text)
    score = min(36.0, len(tokens) * 2.5)
    score += min(36.0, len(TEXT_CUE_RE.findall(text)) * 12.0)
    if re.search(r"[!?]", text):
        score += 10.0
    if re.search(r"\b(?:I|we|they|he|she)\b", text, re.I):
        score += 4.0
    return round(score, 1)


def derived_text_candidates(segments: list[dict], existing_times: list[float], limit: int = 14) -> list[dict]:
    """Find additional transcript-led doors the acoustic pass did not rank.

    These are deliberately secondary: the public app labels them as local
    Whisper listening windows, never as finished quotes or editorial picks.
    A minimum spacing keeps a talkative minute from flooding the route rail.
    """
    usable = [segment for segment in segments if clean(segment.get("text"))]
    raw: list[dict] = []
    for index, segment in enumerate(usable):
        start = float(segment.get("start") or 0)
        window: list[dict] = []
        for candidate in usable[index:index + 4]:
            if window and float(candidate.get("end") or 0) - start > 22:
                break
            window.append(candidate)
            excerpt = bounded_excerpt(" ".join(clean(item.get("text")) for item in window))
            if not excerpt:
                continue
            if any(abs(start - existing) < 24 for existing in existing_times):
                continue
            raw.append({
                "t": round(start, 3),
                **excerpt_for(usable, start),
                "selectionKind": "source-local-whisper-text-cue",
                "selectionScore": text_cue_score(excerpt),
            })
            break
    raw.sort(key=lambda item: (-float(item.get("selectionScore") or 0), float(item.get("t") or 0)))
    picked: list[dict] = []
    for item in raw:
        at = float(item.get("t") or 0)
        if any(abs(at - float(other.get("t") or 0)) < 45 for other in picked):
            continue
        picked.append(item)
        if len(picked) >= limit:
            break
    return sorted(picked, key=lambda item: float(item.get("t") or 0))


def main() -> None:
    audio_pass = load_js_json(DEMO / "wwam-livestream-audio-pass.js")
    # The queue is intentionally broader than the livestream audio-pass
    # registry: it also listens to watchalongs.  Build the public overlay from
    # every verified local ledger so a completed watchalong cannot disappear
    # simply because it is not in the livestream-only ranking file.
    ranked_episodes = audio_pass.get("episodes") or {}
    ledger_ids = {
        path.name.removesuffix(".asr.json")
        for path in CAPTIONS.glob("*.asr.json")
    }
    sources = {}
    for source_id in sorted(set(ranked_episodes) | ledger_ids):
        episode = ranked_episodes.get(source_id) or {}
        ledger_path = CAPTIONS / f"{source_id}.asr.json"
        if not ledger_path.exists():
            continue
        ledger = json.loads(ledger_path.read_text(encoding="utf-8"))
        candidates = []
        existing_times = []
        for candidate in episode.get("candidates") or []:
            at = float(candidate.get("t") or 0)
            aligned = excerpt_for(ledger.get("segments") or [], at)
            existing_times.append(at)
            candidates.append({"t": round(at, 3), **aligned, "selectionKind": "audio-ranked-alignment"})
        candidates.extend(derived_text_candidates(ledger.get("segments") or [], existing_times))
        sources[source_id] = {
            "model": ledger.get("model"),
            "audioSha256": ledger.get("audioSha256"),
            "generatedAt": ledger.get("generatedAt"),
            "coverageMode": ledger.get("coverageMode") or "full-source",
            "coverageWindowCount": int(ledger.get("coverageWindowCount") or 1),
            "speakerDiarized": False,
            "visualContextVerified": False,
            "candidates": candidates,
        }
    payload = {
        "schema": "wwam-livestream-asr-excerpts/v1",
        "policy": "quality-gated local Whisper excerpts plus secondary transcript-cue doors; playback remains the authority",
        "publicExcerptWordLimit": 16,
        "qualityRules": [
            "minimum five words",
            "no dangling clause endings",
            "no adjacent or punctuation-separated repeated tokens",
            "no known Whisper hallucination tails",
            "low-signal conversational acknowledgements are not promoted",
            "transcript-only text cues are secondary listening leads, never editorial picks",
        ],
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
