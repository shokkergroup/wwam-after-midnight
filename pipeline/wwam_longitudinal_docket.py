#!/usr/bin/env python3
"""Build WWAM's first longitudinal prediction/response docket offline.

The generator reads only checked-in public source metadata and the existing
gitignored local JSON3 caption caches. It validates every short public excerpt
against an exact bounded caption window, keeps full caption/event payloads out
of the artifact, and refuses to publish a verdict, speaker, causality claim,
mind-change claim, or promotion permission.

The four launch cases are intentionally small and strong:

* an anger forecast followed by later character-death talk, left OPEN;
* a #1 anticipation candidate followed by positive local reception;
* pre-release theater hope followed by two mixed local commentary receipts; and
* a commentary plan followed by continued planning, still open at snapshot.

Every machine pair remains MAY_RESOLVE. MAY_SUPPORT, MAY_BE_MIXED, and OPEN are
navigation signals only, never truth states.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import unicodedata
from datetime import date
from pathlib import Path
from typing import Any, Iterable


ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public" / "demo"
CAPTIONS = ROOT / "source-cache" / "captions"
ATLAS_PATH = PUBLIC / "archive-atlas-data.js"
CATALOG_PATH = PUBLIC / "catalog.js"
OUTPUT_PATH = PUBLIC / "longitudinal-docket-data.js"
PUBLIC_ASSIGNMENT = "WWAM_LONGITUDINAL_DOCKETS"
SCHEMA = "shokker-youtube-wiki/longitudinal-docket-data/v1"
SCHEMA_VERSION = "1.0.0"
GENERATED = "2026-07-24"
SNAPSHOT_DATE = "2026-07-23"
CHANNEL_PACK_FINGERPRINT = "cp1-f9ad38be22481b5d"
EXCERPT_WORD_LIMIT = 16
MAX_PUBLIC_BYTES = 32_000
LONGITUDINAL_VOCABULARY = {
    "product": "THE TAPE KEEPS SCORE",
    "forecast": "BEFORE TAPE",
    "response": "AFTER TAPE",
    "unresolved": "THE TAPE PLEADS THE FIFTH",
    "editBrief": "BEFORE / AFTER EDIT BRIEF",
}
PROVENANCE_VALUES = {
    "generator": "offline-bounded-evidence-pipeline",
    "privateInput": "local-caption-cache",
    "publicInput": "bounded-source-metadata-and-caption-excerpts",
    "integrityNote": "change-detector-only",
}

ASSIGNMENT_RE = re.compile(r"^window\.([A-Z0-9_]+)\s*=\s*(.*);\s*$", re.S)
WORD_RE = re.compile(r"[a-z0-9]+(?:'[a-z0-9]+)?")
CENSOR_RE = re.compile(r"\[\s*(?:_+\s*_*|bleep)\s*\]", re.I)
FORBIDDEN_PUBLIC_KEYS = {
    "audio",
    "captions",
    "events",
    "media",
    "rawcaptions",
    "rawtranscript",
    "segs",
    "transcript",
    "video",
}
PROTOTYPE_KEYS = {"__proto__", "constructor", "prototype"}
ALLOWED_SOURCE_LANES = {
    "archive-deep-10",
    "commentary",
    "fresh-live",
    "popular-live",
}
ALLOWED_SUBJECT_TYPES = {
    "bit",
    "character",
    "film",
    "franchise",
    "person",
    "source",
    "topic",
}
UNSAFE_TRUTH_LANGUAGE_RE = re.compile(
    r"\b(?:(?:called|calls)\s+it(?:\s+exactly)?|nailed\s+it|came\s+true|"
    r"affirmed|confirmed|contradicted|correct|debunked|definitely|disproved|"
    r"false|fulfilled|inaccurate|incorrect|proved|proven|right|settled|"
    r"supported|true|verified|vindicated|wrong|"
    r"(?:prediction|forecast|promise)\s+"
    r"(?:delivered|failed|fulfilled|kept|resolved))\b",
    re.I,
)


SOURCE_SPECS: tuple[dict[str, Any], ...] = (
    {
        "id": "ZMaNz5FTCwY",
        "reference": "atlas",
        "title": "HALLOWEEN SPOILER Q and A LIVE!!!!!!!!",
        "date": "2018-10-21",
        "durationSeconds": 7353,
        "referenceLane": "popular-25",
        "lane": "popular-live",
        "contentMode": "spoiler-q-and-a",
    },
    {
        "id": "5HfhwoDSQ0E",
        "reference": "catalog",
        "title": "HALLOWEEN KILLS COMMENTARY",
        "date": "2021-10-30",
        "durationSeconds": 6667,
        "lane": "commentary",
        "contentMode": "feature-commentary",
    },
    {
        "id": "O5vtdQnH7uc",
        "reference": "atlas",
        "title": "Most Anticipated Movies of 2023 LIVE!",
        "date": "2022-12-29",
        "durationSeconds": 12095,
        "referenceLane": "popular-25",
        "lane": "popular-live",
        "contentMode": "anticipated-movies",
    },
    {
        "id": "ISDlaQ9DWSM",
        "reference": "catalog",
        "title": "SCREAM VI Full Movie Commentary",
        "date": "2023-04-25",
        "durationSeconds": 7187,
        "lane": "commentary",
        "contentMode": "feature-commentary",
    },
    {
        "id": "ETuRUYiQEBM",
        "reference": "atlas",
        "title": "Halloween Ends Q & A Plus Whatever! Live!",
        "date": "2022-07-28",
        "durationSeconds": 10777,
        "referenceLane": "archive-deep-batch-04",
        "lane": "archive-deep-10",
        "contentMode": "q-and-a",
    },
    {
        "id": "I6QKteG_hK0",
        "reference": "catalog",
        "title": "Halloween Ends Full Movie Commentary",
        "date": "2022-10-18",
        "durationSeconds": 7268,
        "lane": "commentary",
        "contentMode": "feature-commentary",
    },
    {
        "id": "7PzSj-oIRjA",
        "reference": "atlas",
        "title": "We Watched A Movie LIVE! Movie News and More!",
        "date": "2026-06-25",
        "durationSeconds": 14860,
        "referenceLane": "fresh-10",
        "lane": "fresh-live",
        "contentMode": "movie-news",
    },
    {
        "id": "LV2rmwEA0w4",
        "reference": "atlas",
        "title": "We Watched A Movie Live! Movie News and More",
        "date": "2026-07-23",
        "durationSeconds": 12785,
        "referenceLane": "fresh-10",
        "lane": "fresh-live",
        "contentMode": "movie-news",
    },
)


SUBJECTS: tuple[dict[str, str], ...] = (
    {"id": "film:halloween-ends", "label": "Halloween Ends", "type": "film"},
    {"id": "film:scream-7", "label": "Scream 7", "type": "film"},
    {"id": "film:scream-vi", "label": "Scream VI", "type": "film"},
    {"id": "franchise:halloween", "label": "Halloween", "type": "franchise"},
    {"id": "franchise:scream", "label": "Scream", "type": "franchise"},
    {
        "id": "topic:anticipation-reception",
        "label": "Anticipation → reception",
        "type": "topic",
    },
    {
        "id": "topic:commentary-plan",
        "label": "Commentary plan",
        "type": "topic",
    },
    {
        "id": "topic:anger-to-death-talk",
        "label": "Anger forecast → later death talk",
        "type": "topic",
    },
)


CLAIM_SEEDS: tuple[dict[str, Any], ...] = (
    {
        "id": "claim:anger-forecast",
        "sourceId": "ZMaNz5FTCwY",
        "t": 6131.5,
        "window": {"from": 6126.22, "to": 6150.25},
        "excerpt": (
            "I think Michaels gonna be really pissed about how Judy Greer "
            "is character tricked him"
        ),
        "cueTerms": ["character tricked him", "really pissed"],
        "subjects": [
            "franchise:halloween",
            "topic:anger-to-death-talk",
        ],
        "subjectBindings": [
            {
                "subjectId": "franchise:halloween",
                "basis": "source-title",
                "cue": "Halloween",
            },
            {
                "subjectId": "topic:anger-to-death-talk",
                "basis": "excerpt",
                "cue": "really pissed",
            },
        ],
    },
    {
        "id": "claim:scream-vi-number-one",
        "sourceId": "O5vtdQnH7uc",
        "t": 11809.14,
        "window": {"from": 11807.819, "to": 11824.62},
        "excerpt": (
            "my number one's gonna be Scream Six um my favorite horror franchise"
        ),
        "cueTerms": ["favorite horror franchise", "number one's gonna be"],
        "subjects": [
            "film:scream-vi",
            "franchise:scream",
            "topic:anticipation-reception",
        ],
        "subjectBindings": [
            {
                "subjectId": "film:scream-vi",
                "basis": "excerpt",
                "cue": "Scream Six",
            },
            {
                "subjectId": "franchise:scream",
                "basis": "excerpt",
                "cue": "Scream",
            },
            {
                "subjectId": "topic:anticipation-reception",
                "basis": "excerpt",
                "cue": "number one's gonna be",
            },
        ],
    },
    {
        "id": "claim:halloween-ends-theater-hope",
        "sourceId": "ETuRUYiQEBM",
        "t": 8507.2,
        "window": {"from": 8506.399, "to": 8512.72},
        "excerpt": (
            "hope when we go to the theater and see Halloween Ends "
            "we get just blown away"
        ),
        "cueTerms": ["hope when we go to the theater", "just blown away"],
        "subjects": [
            "film:halloween-ends",
            "franchise:halloween",
            "topic:anticipation-reception",
        ],
        "subjectBindings": [
            {
                "subjectId": "film:halloween-ends",
                "basis": "excerpt",
                "cue": "Halloween Ends",
            },
            {
                "subjectId": "franchise:halloween",
                "basis": "excerpt",
                "cue": "Halloween",
            },
            {
                "subjectId": "topic:anticipation-reception",
                "basis": "excerpt",
                "cue": "just blown away",
            },
        ],
    },
    {
        "id": "claim:scream-7-commentary-plan",
        "sourceId": "7PzSj-oIRjA",
        "t": 7254.84,
        "window": {"from": 7251.84, "to": 7264.48},
        "excerpt": "this month we're going to be doing Scream 7 commentary",
        "cueTerms": ["Scream 7 commentary", "this month"],
        "subjects": [
            "film:scream-7",
            "franchise:scream",
            "topic:commentary-plan",
        ],
        "subjectBindings": [
            {
                "subjectId": "film:scream-7",
                "basis": "excerpt",
                "cue": "Scream 7",
            },
            {
                "subjectId": "franchise:scream",
                "basis": "excerpt",
                "cue": "Scream",
            },
            {
                "subjectId": "topic:commentary-plan",
                "basis": "excerpt",
                "cue": "going to be doing",
            },
        ],
    },
)


RESPONSE_SEEDS: tuple[dict[str, Any], ...] = (
    {
        "id": "response:later-death-talk",
        "sourceId": "5HfhwoDSQ0E",
        "t": 6110,
        "window": {"from": 6103.679, "to": 6116.88},
        "excerpt": "it's not a dream she's [BLEEP] dead Karen's dead",
        "cueTerms": ["Karen's dead", "not a dream"],
        "subjects": [
            "franchise:halloween",
            "topic:anger-to-death-talk",
        ],
        "subjectBindings": [
            {
                "subjectId": "franchise:halloween",
                "basis": "source-title",
                "cue": "Halloween",
            },
            {
                "subjectId": "topic:anger-to-death-talk",
                "basis": "excerpt",
                "cue": "dead",
            },
        ],
        "additionalReceipts": [],
    },
    {
        "id": "response:scream-vi-positive-reception",
        "sourceId": "ISDlaQ9DWSM",
        "t": 7067.4,
        "window": {"from": 7057.92, "to": 7077.36},
        "excerpt": "it's still [BLEEP] rules Scream is the best man",
        "cueTerms": ["Scream is the best", "still [BLEEP] rules"],
        "subjects": [
            "film:scream-vi",
            "franchise:scream",
            "topic:anticipation-reception",
        ],
        "subjectBindings": [
            {
                "subjectId": "film:scream-vi",
                "basis": "source-title",
                "cue": "Scream VI",
            },
            {
                "subjectId": "franchise:scream",
                "basis": "excerpt",
                "cue": "Scream",
            },
            {
                "subjectId": "topic:anticipation-reception",
                "basis": "excerpt",
                "cue": "still [BLEEP] rules",
            },
        ],
        "additionalReceipts": [],
    },
    {
        "id": "response:halloween-ends-mixed-commentary",
        "sourceId": "I6QKteG_hK0",
        "t": 6817.619,
        "window": {"from": 6815.58, "to": 6822.78},
        "excerpt": (
            "it was a failure in the sense of what you promised it would be"
        ),
        "cueTerms": ["a failure", "promised it would be"],
        "subjects": [
            "film:halloween-ends",
            "franchise:halloween",
            "topic:anticipation-reception",
        ],
        "subjectBindings": [
            {
                "subjectId": "film:halloween-ends",
                "basis": "source-title",
                "cue": "Halloween Ends",
            },
            {
                "subjectId": "franchise:halloween",
                "basis": "source-title",
                "cue": "Halloween",
            },
            {
                "subjectId": "topic:anticipation-reception",
                "basis": "excerpt",
                "cue": "a failure",
            },
        ],
        "additionalReceipts": [
            {
                "id": "receipt:halloween-ends-standalone-positive-assessment",
                "t": 6823.679,
                "window": {"from": 6822.78, "to": 6829.199},
                "excerpt": "as a standalone movie I still ended up liking it",
                "cueTerms": ["standalone movie", "ended up liking it"],
            }
        ],
    },
    {
        "id": "response:scream-7-july-31-scheduled",
        "sourceId": "LV2rmwEA0w4",
        "t": 3811.52,
        "window": {"from": 3808.319, "to": 3816},
        "excerpt": "we're also doing Scream 7 on the 31st",
        "cueTerms": ["doing Scream 7", "on the 31st"],
        "subjects": [
            "film:scream-7",
            "franchise:scream",
            "topic:commentary-plan",
        ],
        "subjectBindings": [
            {
                "subjectId": "film:scream-7",
                "basis": "excerpt",
                "cue": "Scream 7",
            },
            {
                "subjectId": "franchise:scream",
                "basis": "excerpt",
                "cue": "Scream",
            },
            {
                "subjectId": "topic:commentary-plan",
                "basis": "excerpt",
                "cue": "doing",
            },
        ],
        "additionalReceipts": [],
    },
)


DOCKET_SEEDS: tuple[dict[str, Any], ...] = (
    {
        "id": "docket:anger-forecast-to-death-talk",
        "claimId": "claim:anger-forecast",
        "responseId": "response:later-death-talk",
        "subjects": [
            "franchise:halloween",
            "topic:anger-to-death-talk",
        ],
        "pairSignal": "OPEN",
        "pairBasis": [
            "chronological-distinct-sources",
            "no-causality-claim",
            "no-speaker-continuity-claim",
            "role-cues-present",
            "shared-subjects",
        ],
        "resolutionBlockedBy": [
            "authenticated-human-review-required",
            "outcome-not-independently-verified",
            "speaker-not-diarized",
            "whole-work-visual-review-required",
        ],
        "requiresWholeWorkVisualReview": True,
    },
    {
        "id": "docket:scream-vi-anticipation-to-reception",
        "claimId": "claim:scream-vi-number-one",
        "responseId": "response:scream-vi-positive-reception",
        "subjects": [
            "film:scream-vi",
            "franchise:scream",
            "topic:anticipation-reception",
        ],
        "pairSignal": "MAY_SUPPORT",
        "pairBasis": [
            "chronological-distinct-sources",
            "expectation-reception-candidate",
            "no-mind-change-claim",
            "no-speaker-continuity-claim",
            "role-cues-present",
            "shared-subjects",
        ],
        "resolutionBlockedBy": [
            "authenticated-human-review-required",
            "outcome-not-independently-verified",
            "speaker-not-diarized",
        ],
        "requiresWholeWorkVisualReview": False,
    },
    {
        "id": "docket:halloween-ends-excitement-to-mixed-reaction",
        "claimId": "claim:halloween-ends-theater-hope",
        "responseId": "response:halloween-ends-mixed-commentary",
        "subjects": [
            "film:halloween-ends",
            "franchise:halloween",
            "topic:anticipation-reception",
        ],
        "pairSignal": "MAY_BE_MIXED",
        "pairBasis": [
            "chronological-distinct-sources",
            "local-judgments-only",
            "mixed-response-receipts",
            "no-mind-change-claim",
            "no-speaker-continuity-claim",
            "role-cues-present",
            "shared-subjects",
        ],
        "resolutionBlockedBy": [
            "authenticated-human-review-required",
            "mixed-local-judgments",
            "outcome-not-independently-verified",
            "speaker-not-diarized",
        ],
        "requiresWholeWorkVisualReview": False,
    },
    {
        "id": "docket:scream-7-commentary-plan-open",
        "claimId": "claim:scream-7-commentary-plan",
        "responseId": "response:scream-7-july-31-scheduled",
        "subjects": [
            "film:scream-7",
            "franchise:scream",
            "topic:commentary-plan",
        ],
        "pairSignal": "OPEN",
        "pairBasis": [
            "absence-not-channel-wide",
            "chronological-distinct-sources",
            "open-corpus-snapshot",
            "no-speaker-continuity-claim",
            "planning-continuation-candidate",
            "role-cues-present",
            "shared-subjects",
        ],
        "resolutionBlockedBy": [
            "authenticated-human-review-required",
            "corpus-absence-not-channel-wide",
            "future-delivery-unverified",
            "outcome-not-independently-verified",
            "speaker-not-diarized",
        ],
        "requiresWholeWorkVisualReview": False,
    },
)


def javascript_value(value: Any) -> Any:
    """Normalize Python numbers to JSON.stringify-compatible values."""
    if isinstance(value, float) and value.is_integer():
        return int(value)
    if isinstance(value, list):
        return [javascript_value(item) for item in value]
    if isinstance(value, tuple):
        return [javascript_value(item) for item in value]
    if isinstance(value, dict):
        return {key: javascript_value(item) for key, item in value.items()}
    return value


def stable_json(value: Any) -> str:
    """Stable JSON that preserves array order, used for private source hashes."""
    return json.dumps(
        javascript_value(value),
        ensure_ascii=False,
        sort_keys=True,
        separators=(",", ":"),
    )


def semantic_value(value: Any) -> Any:
    """Mirror the engine's semantic artifact fingerprint normalization."""
    value = javascript_value(value)
    if isinstance(value, list):
        output = [semantic_value(item) for item in value]
        if all(isinstance(item, str) for item in output):
            return sorted(output)
        if output and all(
            isinstance(item, dict) and isinstance(item.get("id"), str)
            for item in output
        ):
            return sorted(output, key=lambda item: item["id"])
        if output and all(
            isinstance(item, dict) and isinstance(item.get("subjectId"), str)
            for item in output
        ):
            return sorted(
                output,
                key=lambda item: (
                    item["subjectId"],
                    str(item.get("basis", "")),
                    str(item.get("cue", "")),
                ),
            )
        return output
    if isinstance(value, dict):
        return {
            key: semantic_value(value[key])
            for key in sorted(value)
        }
    return value


def semantic_json(value: Any) -> str:
    return json.dumps(
        semantic_value(value),
        ensure_ascii=False,
        sort_keys=True,
        separators=(",", ":"),
    )


def sha256_label(value: Any) -> str:
    return "sha256:" + hashlib.sha256(
        stable_json(value).encode("utf-8")
    ).hexdigest()


def fnv1a32(text: str) -> str:
    current = 0x811C9DC5
    for byte in text.encode("utf-8"):
        current ^= byte
        current = (current * 0x01000193) & 0xFFFFFFFF
    return f"fnv1a32:{current:08x}"


def read_assignment(path: Path, expected: str) -> Any:
    match = ASSIGNMENT_RE.match(path.read_text(encoding="utf-8"))
    if not match or match.group(1) != expected:
        raise RuntimeError(f"{path.name} is not a window.{expected} assignment")
    return json.loads(match.group(2))


def caption_path(source_id: str) -> Path:
    return CAPTIONS / f"{source_id}.json"


def caption_cues(payload: dict[str, Any]) -> list[dict[str, Any]]:
    cues: list[dict[str, Any]] = []
    for event in payload.get("events", []):
        parts = [
            str(segment.get("utf8", ""))
            for segment in event.get("segs", [])
        ]
        text = "".join(parts).replace("\xa0", " ").strip()
        if not text:
            continue
        text = re.sub(r"\[\s*_+\s*_*\s*\]", "[BLEEP]", text)
        cues.append(
            {
                "start": round(float(event.get("tStartMs", 0)) / 1000, 3),
                "duration": round(float(event.get("dDurationMs", 0)) / 1000, 3),
                "text": re.sub(r"\s+", " ", text).strip(),
            }
        )
    return cues


def normalize_words(value: Any) -> list[str]:
    text = unicodedata.normalize("NFKD", str(value or ""))
    text = "".join(
        character for character in text
        if not unicodedata.combining(character)
    )
    text = text.replace("’", "'").replace("‘", "'").lower()
    text = CENSOR_RE.sub(" bleep ", text)
    return WORD_RE.findall(text)


def contains_words(haystack: list[str], needle: list[str]) -> bool:
    if not needle or len(needle) > len(haystack):
        return False
    return any(
        haystack[index:index + len(needle)] == needle
        for index in range(len(haystack) - len(needle) + 1)
    )


def public_word_count(value: Any) -> int:
    return len(normalize_words(value))


def source_window_words(
    cues: list[dict[str, Any]],
    window: dict[str, float],
) -> list[str]:
    selected = [
        cue["text"]
        for cue in cues
        if (
            cue["start"] <= float(window["to"])
            and cue["start"] + max(0, cue["duration"]) >= float(window["from"])
        )
    ]
    return normalize_words(" ".join(selected))


def excerpt_start(
    cues: list[dict[str, Any]],
    window: dict[str, float],
    excerpt: str,
) -> float | None:
    words: list[str] = []
    starts: list[float] = []
    for cue in cues:
        if not (
            cue["start"] <= float(window["to"])
            and cue["start"] + max(0, cue["duration"]) >= float(window["from"])
        ):
            continue
        cue_words = normalize_words(cue["text"])
        words.extend(cue_words)
        starts.extend([float(cue["start"])] * len(cue_words))
    needle = normalize_words(excerpt)
    for index in range(len(words) - len(needle) + 1):
        if words[index:index + len(needle)] == needle:
            return starts[index]
    return None


def validate_receipt_binding(
    *,
    source_id: str,
    duration: int,
    cues: list[dict[str, Any]],
    receipt: dict[str, Any],
    path: str,
) -> None:
    timestamp = float(receipt["t"])
    window = receipt["window"]
    start = float(window["from"])
    end = float(window["to"])
    if not (0 <= start <= timestamp <= end <= duration):
        raise RuntimeError(f"{path} has an invalid timestamp/window")
    expected_url = (
        f"https://www.youtube.com/watch?v={source_id}&t={int(timestamp)}s"
    )
    if receipt.get("url", expected_url) != expected_url:
        raise RuntimeError(f"{path} has a noncanonical timestamp URL")
    excerpt_words = normalize_words(receipt["excerpt"])
    if not (1 <= len(excerpt_words) <= EXCERPT_WORD_LIMIT):
        raise RuntimeError(f"{path} exceeds the {EXCERPT_WORD_LIMIT}-word limit")
    context_words = source_window_words(cues, window)
    if not contains_words(context_words, excerpt_words):
        raise RuntimeError(
            f"{path} excerpt is not an exact normalized sequence in "
            f"{source_id} {start:.3f}-{end:.3f}"
        )
    bound_start = excerpt_start(cues, window, receipt["excerpt"])
    if bound_start is None or abs(timestamp - bound_start) > 3.001:
        raise RuntimeError(
            f"{path} timestamp {timestamp:.3f} is not within three seconds "
            f"of excerpt start {bound_start!r}"
        )
    for cue in receipt["cueTerms"]:
        cue_words = normalize_words(cue)
        if not cue_words or not contains_words(excerpt_words, cue_words):
            raise RuntimeError(
                f"{path} cue {cue!r} is not grounded in its public excerpt"
            )


def source_metadata() -> dict[str, dict[str, Any]]:
    atlas = read_assignment(ATLAS_PATH, "WWAM_ARCHIVE_ATLAS")
    catalog = read_assignment(CATALOG_PATH, "WWAM_CATALOG")
    atlas_map = {record["id"]: record for record in atlas["records"]}
    catalog_map = {record["id"]: record for record in catalog}
    records: dict[str, dict[str, Any]] = {}
    for spec in SOURCE_SPECS:
        source_id = spec["id"]
        reference = (
            atlas_map.get(source_id)
            if spec["reference"] == "atlas"
            else catalog_map.get(source_id)
        )
        if not reference:
            raise RuntimeError(
                f"{source_id} is missing from its checked public metadata lane"
            )
        for key, expected in (
            ("title", spec["title"]),
            ("date", spec["date"]),
            ("duration", spec["durationSeconds"]),
        ):
            if reference.get(key) != expected:
                raise RuntimeError(
                    f"{source_id} metadata changed: {key} "
                    f"{reference.get(key)!r} != {expected!r}"
                )
        expected_url = f"https://www.youtube.com/watch?v={source_id}"
        if reference.get("url") != expected_url:
            raise RuntimeError(f"{source_id} canonical URL changed")
        if spec["reference"] == "atlas":
            if spec["referenceLane"] not in reference.get("lanes", []):
                raise RuntimeError(
                    f"{source_id} left its expected {spec['referenceLane']} lane"
                )
            if reference.get("coverage") != "deeply-indexed":
                raise RuntimeError(f"{source_id} is no longer deeply indexed")
        elif reference.get("transcript") is not True:
            raise RuntimeError(
                f"{source_id} is no longer a captioned commentary record"
            )
        records[source_id] = reference
    return records


def build_source(
    spec: dict[str, Any],
    caption_payload: dict[str, Any],
) -> dict[str, Any]:
    source_id = spec["id"]
    return {
        "id": source_id,
        "title": spec["title"],
        "date": spec["date"],
        "durationSeconds": spec["durationSeconds"],
        "url": f"https://www.youtube.com/watch?v={source_id}",
        "lane": spec["lane"],
        "contentMode": spec["contentMode"],
        "rightsMode": "standard-caption-candidates",
        "evidenceAccess": "short-caption-candidate",
        "captionTrack": "youtube-automatic-caption",
        "captionPayloadSha256": sha256_label(caption_payload),
        "speakerDiarized": False,
        "originAttribution": False,
        "visualContextVerified": False,
        "promotionAllowed": False,
    }


def build_candidate(
    seed: dict[str, Any],
    role: str,
) -> dict[str, Any]:
    source_id = seed["sourceId"]
    timestamp = seed["t"]
    candidate = {
        "id": seed["id"],
        "sourceId": source_id,
        "role": role,
        "t": timestamp,
        "url": (
            f"https://www.youtube.com/watch?v={source_id}&t={int(timestamp)}s"
        ),
        "window": seed["window"],
        "excerpt": seed["excerpt"],
        "excerptMode": "normalized-automatic-caption-sequence",
        "subjects": seed["subjects"],
        "subjectBindings": seed["subjectBindings"],
        "cueType": (
            "explicit-forecast-language"
            if role == "forecast"
            else "retrospective-response-language"
        ),
        "cueTerms": seed["cueTerms"],
        "additionalReceipts": [],
        "speaker": None,
        "originStatus": "not-inferred",
        "reviewStatus": "machine-candidate",
        "promotionAllowed": False,
        "visualContextVerified": False,
    }
    for receipt in seed.get("additionalReceipts", []):
        receipt_copy = {
            "id": receipt["id"],
            "t": receipt["t"],
            "url": (
                f"https://www.youtube.com/watch?v={source_id}"
                f"&t={int(receipt['t'])}s"
            ),
            "window": receipt["window"],
            "excerpt": receipt["excerpt"],
            "excerptMode": "normalized-automatic-caption-sequence",
            "cueTerms": receipt["cueTerms"],
        }
        candidate["additionalReceipts"].append(receipt_copy)
    return candidate


def build_docket(
    seed: dict[str, Any],
    claims: dict[str, dict[str, Any]],
    responses: dict[str, dict[str, Any]],
    sources: dict[str, dict[str, Any]],
) -> dict[str, Any]:
    claim = claims[seed["claimId"]]
    response = responses[seed["responseId"]]
    forecast_date = sources[claim["sourceId"]]["date"]
    response_date = sources[response["sourceId"]]["date"]
    delta = (date.fromisoformat(response_date) - date.fromisoformat(forecast_date)).days
    if delta <= 0:
        raise RuntimeError(f"{seed['id']} is not longitudinal")
    subject_map = {subject["id"]: subject for subject in SUBJECTS}
    primary_subject = sorted(
        (subject_map[subject_id] for subject_id in seed["subjects"]),
        key=lambda subject: (
            subject["type"] == "topic",
            subject["id"],
        ),
    )[0]
    title = (
        f"{primary_subject['label']} // "
        f"{LONGITUDINAL_VOCABULARY['forecast']} → "
        f"{LONGITUDINAL_VOCABULARY['response']}"
    )
    return {
        "id": seed["id"],
        "title": title,
        "claimId": seed["claimId"],
        "responseId": seed["responseId"],
        "subjects": seed["subjects"],
        "relationship": "MAY_RESOLVE",
        "pairSignal": seed["pairSignal"],
        "pairBasis": seed["pairBasis"],
        "chronology": {
            "forecastDate": forecast_date,
            "responseDate": response_date,
            "daysBetween": delta,
        },
        "verdict": None,
        "resolutionStatus": "unresolved",
        "reviewStatus": "machine-paired-unreviewed",
        "resolutionBlockedBy": seed["resolutionBlockedBy"],
        "requiresOutcomeVerification": True,
        "requiresWholeWorkVisualReview": seed["requiresWholeWorkVisualReview"],
        "visualOutcomeVerified": False,
        "speaker": None,
        "promotionAllowed": False,
    }


def iter_keys(value: Any) -> Iterable[str]:
    if isinstance(value, dict):
        for key, child in value.items():
            yield key
            yield from iter_keys(child)
    elif isinstance(value, list):
        for child in value:
            yield from iter_keys(child)


def iter_candidates(payload: dict[str, Any]) -> Iterable[dict[str, Any]]:
    yield from payload["claims"]
    yield from payload["responses"]


def validate_payload(
    payload: dict[str, Any],
    caption_payloads: dict[str, dict[str, Any]],
    cue_maps: dict[str, list[dict[str, Any]]],
) -> None:
    if payload["schema"] != SCHEMA or payload["schemaVersion"] != SCHEMA_VERSION:
        raise RuntimeError("Longitudinal docket schema changed")
    if payload["channel"]["packFingerprint"] != CHANNEL_PACK_FINGERPRINT:
        raise RuntimeError("Longitudinal docket ChannelPack binding changed")
    if payload["labels"] != LONGITUDINAL_VOCABULARY:
        raise RuntimeError("Longitudinal display labels escaped the ChannelPack vocabulary")
    for key, expected in PROVENANCE_VALUES.items():
        if payload["provenance"].get(key) != expected:
            raise RuntimeError(f"Longitudinal provenance field {key} is not canonical")
    if len(payload["sources"]) != 8 or len(payload["dockets"]) != 4:
        raise RuntimeError("Launch docket must remain exactly eight sources/four cases")
    if len({source["id"] for source in payload["sources"]}) != 8:
        raise RuntimeError("Launch docket source IDs must be unique")
    if len({docket["id"] for docket in payload["dockets"]}) != 4:
        raise RuntimeError("Launch docket IDs must be unique")

    source_map = {source["id"]: source for source in payload["sources"]}
    subject_ids = {subject["id"] for subject in payload["subjects"]}
    if any(
        subject["type"] not in ALLOWED_SUBJECT_TYPES
        for subject in payload["subjects"]
    ):
        raise RuntimeError("Launch subject type escaped the WWAM ChannelPack taxonomy")
    for source in payload["sources"]:
        if source["lane"] not in ALLOWED_SOURCE_LANES:
            raise RuntimeError("Launch source lane escaped the WWAM ChannelPack")
        if source["rightsMode"] != "standard-caption-candidates":
            raise RuntimeError("Launch evidence cannot use restricted source audio")
        if (
            source["evidenceAccess"] != "short-caption-candidate"
            or source["speakerDiarized"] is not False
            or source["originAttribution"] is not False
            or source["visualContextVerified"] is not False
            or source["promotionAllowed"] is not False
        ):
            raise RuntimeError(f"{source['id']} source firewall changed")
        expected_hash = sha256_label(caption_payloads[source["id"]])
        if source["captionPayloadSha256"] != expected_hash:
            raise RuntimeError(f"{source['id']} private caption hash changed")

    for candidate in iter_candidates(payload):
        source = source_map[candidate["sourceId"]]
        validate_receipt_binding(
            source_id=source["id"],
            duration=source["durationSeconds"],
            cues=cue_maps[source["id"]],
            receipt=candidate,
            path=candidate["id"],
        )
        declared_subjects = candidate["subjects"]
        bound_subjects = [
            binding["subjectId"]
            for binding in candidate["subjectBindings"]
        ]
        if (
            len(bound_subjects) != len(set(bound_subjects))
            or sorted(bound_subjects) != sorted(declared_subjects)
            or any(subject_id not in subject_ids for subject_id in declared_subjects)
        ):
            raise RuntimeError(
                f"{candidate['id']} subject bindings do not exactly match"
            )
        for binding in candidate["subjectBindings"]:
            cue_words = normalize_words(binding["cue"])
            if binding["basis"] == "excerpt":
                grounding_words = normalize_words(candidate["excerpt"])
            elif binding["basis"] == "source-title":
                grounding_words = normalize_words(source["title"])
            else:
                raise RuntimeError(
                    f"{candidate['id']} has unsupported subject binding basis"
                )
            if not contains_words(grounding_words, cue_words):
                raise RuntimeError(
                    f"{candidate['id']} subject {binding['subjectId']} "
                    f"is not grounded by {binding['cue']!r}"
                )
        if (
            candidate["speaker"] is not None
            or candidate["promotionAllowed"] is not False
            or candidate["originStatus"] != "not-inferred"
            or candidate["reviewStatus"] != "machine-candidate"
        ):
            raise RuntimeError(f"{candidate['id']} candidate firewall changed")
        for receipt in candidate["additionalReceipts"]:
            validate_receipt_binding(
                source_id=source["id"],
                duration=source["durationSeconds"],
                cues=cue_maps[source["id"]],
                receipt=receipt,
                path=f"{candidate['id']}/{receipt['id']}",
            )

    for docket in payload["dockets"]:
        registered = {subject["id"]: subject for subject in payload["subjects"]}
        primary_subject = sorted(
            (registered[subject_id] for subject_id in docket["subjects"]),
            key=lambda subject: (
                subject["type"] == "topic",
                subject["id"],
            ),
        )[0]
        expected_title = (
            f"{primary_subject['label']} // "
            f"{LONGITUDINAL_VOCABULARY['forecast']} → "
            f"{LONGITUDINAL_VOCABULARY['response']}"
        )
        if docket["title"] != expected_title:
            raise RuntimeError(f"{docket['id']} title is not deterministic")
        if (
            docket["relationship"] != "MAY_RESOLVE"
            or docket["pairSignal"] not in {"MAY_SUPPORT", "MAY_BE_MIXED", "OPEN"}
            or docket["verdict"] is not None
            or docket["resolutionStatus"] != "unresolved"
            or docket["reviewStatus"] != "machine-paired-unreviewed"
            or docket["visualOutcomeVerified"] is not False
            or docket["speaker"] is not None
            or docket["promotionAllowed"] is not False
        ):
            raise RuntimeError(f"{docket['id']} truth firewall changed")
        if (
            "no-speaker-continuity-claim" not in docket["pairBasis"]
            or "speaker-not-diarized" not in docket["resolutionBlockedBy"]
        ):
            raise RuntimeError(
                f"{docket['id']} lost its speaker-continuity firewall"
            )
        if docket["pairSignal"] == "MAY_BE_MIXED":
            response = next(
                item for item in payload["responses"]
                if item["id"] == docket["responseId"]
            )
            if (
                not response["additionalReceipts"]
                or "mixed-response-receipts" not in docket["pairBasis"]
            ):
                raise RuntimeError("MAY_BE_MIXED lost its countervailing receipt")

    caption_set = {
        source["id"]: source["captionPayloadSha256"]
        for source in payload["sources"]
    }
    if payload["fingerprints"]["captionSetSha256"] != sha256_label(caption_set):
        raise RuntimeError("Caption-set fingerprint changed")
    fingerprint_input = json.loads(json.dumps(payload))
    del fingerprint_input["fingerprints"]["publicFnv1a"]
    actual_public = fnv1a32(semantic_json(fingerprint_input))
    if payload["fingerprints"]["publicFnv1a"] != actual_public:
        raise RuntimeError("Public longitudinal docket fingerprint changed")

    forbidden = sorted(
        key for key in iter_keys(payload)
        if key.lower() in FORBIDDEN_PUBLIC_KEYS
    )
    if forbidden:
        raise RuntimeError(f"Private payload keys escaped publicly: {forbidden}")
    prototype_keys = sorted(
        key for key in iter_keys(payload)
        if key in PROTOTYPE_KEYS
    )
    if prototype_keys:
        raise RuntimeError(
            f"Prototype-sensitive keys escaped publicly: {prototype_keys}"
        )
    truth_surfaces = [
        *payload["labels"].values(),
        *(docket["title"] for docket in payload["dockets"]),
    ]
    if any(UNSAFE_TRUTH_LANGUAGE_RE.search(value) for value in truth_surfaces):
        raise RuntimeError("An unresolved launch surface implies a final truth verdict")
    if any(
        public_word_count(candidate["excerpt"]) > EXCERPT_WORD_LIMIT
        for candidate in iter_candidates(payload)
    ):
        raise RuntimeError("A public candidate exceeded the excerpt limit")


def build_payload() -> dict[str, Any]:
    source_metadata()
    caption_payloads: dict[str, dict[str, Any]] = {}
    cue_maps: dict[str, list[dict[str, Any]]] = {}
    sources: list[dict[str, Any]] = []
    for spec in SOURCE_SPECS:
        source_id = spec["id"]
        path = caption_path(source_id)
        if not path.exists():
            raise RuntimeError(f"Missing local caption cache: {path}")
        caption_payload = json.loads(path.read_text(encoding="utf-8"))
        cues = caption_cues(caption_payload)
        if len(cues) < 50:
            raise RuntimeError(f"{source_id} has only {len(cues)} usable caption cues")
        caption_payloads[source_id] = caption_payload
        cue_maps[source_id] = cues
        sources.append(build_source(spec, caption_payload))

    claims = [build_candidate(seed, "forecast") for seed in CLAIM_SEEDS]
    responses = [build_candidate(seed, "response") for seed in RESPONSE_SEEDS]
    claim_map = {claim["id"]: claim for claim in claims}
    response_map = {response["id"]: response for response in responses}
    source_map = {source["id"]: source for source in sources}
    dockets = [
        build_docket(seed, claim_map, response_map, source_map)
        for seed in DOCKET_SEEDS
    ]
    caption_set = {
        source["id"]: source["captionPayloadSha256"]
        for source in sources
    }
    payload: dict[str, Any] = {
        "schema": SCHEMA,
        "schemaVersion": SCHEMA_VERSION,
        "generated": GENERATED,
        "snapshotDate": SNAPSHOT_DATE,
        "channel": {
            "id": "wwam",
            "label": "We Watched A Movie",
            "packFingerprint": CHANNEL_PACK_FINGERPRINT,
            "platform": "youtube",
            "canonicalUrl": "https://www.youtube.com/@WeWatchedAMovie",
        },
        "labels": dict(LONGITUDINAL_VOCABULARY),
        "policy": {
            "machineOutputState": "quarantine",
            "machinePairRelationship": "MAY_RESOLVE",
            "verdictAuthority": "authenticated-human-review-required",
            "promotionRequiresHumanReview": True,
            "preserveContradictions": True,
            "publicExcerptWords": EXCERPT_WORD_LIMIT,
            "timestampRequired": True,
            "sourceUrlRequired": True,
            "noSpeakerGuessing": True,
            "trailerAudioBoundaryRule": "topic-navigation-only",
            "visualOutcomeRule": "unresolved-until-whole-work-review",
            "exportRule": "bounded-public-evidence-only",
        },
        "provenance": {
            "generator": PROVENANCE_VALUES["generator"],
            "networkUsed": False,
            "privateInput": PROVENANCE_VALUES["privateInput"],
            "publicInput": PROVENANCE_VALUES["publicInput"],
            "fullCaptionPayloadPublic": False,
            "integrityNote": PROVENANCE_VALUES["integrityNote"],
        },
        "subjects": list(SUBJECTS),
        "sources": sources,
        "claims": claims,
        "responses": responses,
        "dockets": dockets,
        "fingerprints": {
            "captionSetSha256": sha256_label(caption_set),
        },
    }
    payload["fingerprints"]["publicFnv1a"] = fnv1a32(semantic_json(payload))
    validate_payload(payload, caption_payloads, cue_maps)
    return payload


def render(payload: dict[str, Any]) -> str:
    return (
        f"window.{PUBLIC_ASSIGNMENT} = "
        + json.dumps(payload, ensure_ascii=False, separators=(",", ":"))
        + ";\n"
    )


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--check",
        action="store_true",
        help="Rebuild offline and require a byte-identical public artifact.",
    )
    args = parser.parse_args()

    payload = build_payload()
    source = render(payload)
    source_bytes = source.encode("utf-8")
    if len(source_bytes) >= MAX_PUBLIC_BYTES:
        raise RuntimeError(
            f"Longitudinal docket is {len(source_bytes):,} bytes; "
            f"limit is {MAX_PUBLIC_BYTES:,}"
        )
    if args.check:
        if not OUTPUT_PATH.exists():
            raise RuntimeError(f"Missing generated artifact: {OUTPUT_PATH}")
        if OUTPUT_PATH.read_bytes() != source_bytes:
            raise RuntimeError(
                "Longitudinal docket is stale; run "
                "pipeline/wwam_longitudinal_docket.py"
            )
        print(
            f"Validated {OUTPUT_PATH.name}: {len(payload['dockets'])} cases, "
            f"{len(payload['sources'])} sources, "
            f"{len(source_bytes):,} public bytes, "
            f"{payload['fingerprints']['publicFnv1a']}"
        )
        return 0

    OUTPUT_PATH.write_bytes(source_bytes)
    print(
        f"Wrote {OUTPUT_PATH.name}: {len(payload['dockets'])} cases, "
        f"{len(payload['sources'])} sources, "
        f"{len(source_bytes):,} public bytes, "
        f"{payload['fingerprints']['publicFnv1a']}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
