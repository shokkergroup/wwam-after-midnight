#!/usr/bin/env python3
"""Build the bounded WWAM watchalong catalog and a citation-first deep distill.

The local cache may contain full YouTube auto-captions. It is deliberately
gitignored. Public output contains only short, timestamped excerpts and derived
scores so the prototype can prove its work without republishing transcripts.
"""

from __future__ import annotations

import argparse
import concurrent.futures
import hashlib
import html
import json
import math
import re
import statistics
import sys
import urllib.request
from collections import Counter, defaultdict
from datetime import datetime
from pathlib import Path
from typing import Any

from yt_dlp import YoutubeDL


ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / "source-cache"
PUBLIC = ROOT / "public" / "demo"
EXISTING_CATALOG = PUBLIC / "catalog.js"


def resolve_observed_at(value: str | None = None) -> str:
    """Return an explicit timezone-aware observation time for a build."""
    if value:
        normalized = value.strip()
        try:
            parsed = datetime.fromisoformat(normalized.replace("Z", "+00:00"))
        except ValueError as error:
            raise ValueError("--observed-at must be an ISO-8601 timestamp") from error
        if parsed.tzinfo is None:
            raise ValueError("--observed-at must include a UTC offset or Z")
    else:
        parsed = datetime.now().astimezone()
    return parsed.isoformat(timespec="seconds")


def observed_date(observed_at: str) -> str:
    return datetime.fromisoformat(observed_at.replace("Z", "+00:00")).date().isoformat()


def fingerprint_ids(items: list[dict[str, Any]]) -> str:
    """Fingerprint an ordered source/feed window without copying its metadata."""
    payload = json.dumps(
        [str(item.get("id") or "") for item in items],
        ensure_ascii=False,
        separators=(",", ":"),
    )
    return "sha256:" + hashlib.sha256(payload.encode("utf-8")).hexdigest()

NEW_CANON = [
    ("2G8lpFaeIdw", "Scream", "Scream (1996)", 1),
    ("wwJIsIRuR8w", "Scream", "Scream 2", 2),
    ("jLIfEdg8Oc0", "Scream", "Scream 3", 3),
    ("5et_A1tYnio", "Scream", "Scream 4", 4),
    ("hQu1Y1GZozI", "Scream", "Scream (2022)", 5),
    ("ISDlaQ9DWSM", "Scream", "Scream VI", 6),
    ("7qgebnDYVi4", "A Nightmare on Elm Street", "A Nightmare on Elm Street (1984)", 1),
    ("HNN0SEy2qtY", "A Nightmare on Elm Street", "Freddy's Revenge", 2),
    ("c15otfZ8HkU", "A Nightmare on Elm Street", "Dream Warriors", 3),
    ("rLXnU3Rsj-4", "A Nightmare on Elm Street", "The Dream Master", 4),
    ("l8HKF-nXdyc", "A Nightmare on Elm Street", "The Dream Child", 5),
    ("e7aq2cqVf-k", "A Nightmare on Elm Street", "Freddy's Dead", 6),
    ("vFdRkvErLmQ", "A Nightmare on Elm Street", "Wes Craven's New Nightmare", 7),
    ("qTQdWKcwn4A", "A Nightmare on Elm Street", "A Nightmare on Elm Street (2010)", 8),
]

FRANCHISE_META = {
    "Halloween": {
        "slug": "halloween",
        "killer": "MICHAEL",
        "lab": "LOOMIS LOGIC",
        "prompt": "Where does Loomis logic become a public-safety emergency?",
    },
    "Friday the 13th": {
        "slug": "friday",
        "killer": "JASON",
        "lab": "JASON'S TRAVEL AGENT",
        "prompt": "When does Crystal Lake's zoning board finally give up?",
    },
    "Scream": {
        "slug": "scream",
        "killer": "GHOSTFACE",
        "lab": "THE SUSPECT BOARD",
        "prompt": "Which confidence level ages worst after the killer reveal?",
    },
    "A Nightmare on Elm Street": {
        "slug": "elm-street",
        "killer": "FREDDY",
        "lab": "DREAM LOGIC COURT",
        "prompt": "At what exact second does dream logic lose its attorney?",
    },
}

CATEGORY_RULES = {
    "OUT OF POCKET": {
        "weight": 8,
        "terms": [
            r"\bfuck(?:ing|ed)?\b", r"\bshit(?:ty)?\b", r"\bbitch(?:es)?\b",
            r"\basshole\b", r"\bdick\b", r"\bbastard\b", r"\bmotherfucker\b",
            r"\bwhat the hell\b", r"\bgoddamn\b",
        ],
    },
    "FRANCHISE FELONY": {
        "weight": 7,
        "terms": [
            r"\bworst\b", r"\bterrible\b", r"\bawful\b", r"\bstupid\b",
            r"\bdumb\b", r"\bgarbage\b", r"\btrash\b", r"\bhate\b",
            r"\bsucks?\b", r"\bruin(?:ed|s)?\b", r"\bpiece of shit\b",
        ],
    },
    "LOVE LETTER": {
        "weight": 5,
        "terms": [
            r"\blove\b", r"\bbest\b", r"\bfavorite\b", r"\bamazing\b",
            r"\bperfect\b", r"\bawesome\b", r"\bgreatest\b", r"\bbeautiful\b",
        ],
    },
    "THEORY BOARD": {
        "weight": 6,
        "terms": [
            r"\bi bet\b", r"\bmy theory\b", r"\bprediction\b",
            r"\bhas to be\b", r"\bkiller is\b", r"\bwatch this\b",
            r"\bhere's what(?:'s| is) going to happen\b", r"\bcalling it now\b",
            r"\bi guarantee\b", r"\bmark my words\b",
        ],
    },
    "KILL ROOM": {
        "weight": 5,
        "terms": [
            r"\bkill(?:ed|er|ing|s)?\b", r"\bmurder\b", r"\bblood\b",
            r"\bdecapitat", r"\bstab(?:bed|bing|s)?\b", r"\bdead\b",
            r"\bhead\b", r"\bknife\b", r"\bbody\b", r"\bguts\b",
        ],
    },
    "BIT ENERGY": {
        "weight": 5,
        "terms": [
            r"\bremember when\b", r"\bevery time\b", r"\bagain\b",
            r"\bcallback\b", r"\brunning joke\b", r"\bwe always\b",
            r"\byou always\b", r"\bthere it is\b",
        ],
    },
    "BREAKDOWN": {
        "weight": 6,
        "terms": [
            r"\blaugh", r"\bhilarious\b", r"\bfunny\b", r"\bcrying\b",
            r"\bi can't\b", r"\boh my god\b", r"\bjesus christ\b",
            r"\blosing my mind\b", r"\bcome on\b",
        ],
    },
    "HORROR BRAIN": {
        "weight": 4,
        "terms": [
            r"\bcreepy\b", r"\bscary\b", r"\bnightmare\b", r"\bmonster\b",
            r"\bghost\b", r"\bdemon\b", r"\bmask\b", r"\bscream\b",
            r"\bslasher\b", r"\bboogeyman\b", r"\bfreddy\b", r"\bjason\b",
            r"\bmichael\b", r"\bghostface\b",
        ],
    },
}

# A watchalong is not just a pile of loud lines. These rules recover the
# recurring subjects that give an episode its shape. They stay deliberately
# channel-specific: character and lore names matter here in a way they would
# not in a generic podcast index.
COMMON_TOPIC_RULES = [
    ("Kill scenes", "craft", ["kill", "killed", "death", "murder", "stab", "decapitat"]),
    ("The mask and the look", "craft", ["mask", "costume", "makeup", "the look", "design"]),
    ("Score and sound", "craft", ["score", "soundtrack", "theme music", "music", "sound design"]),
    ("Performances", "craft", ["acting", "performance", "actor", "actress", "played by", "portray"]),
    ("Writing and movie logic", "craft", ["writing", "script", "dialogue", "plot hole", "makes no sense", "movie logic"]),
    ("Ending and reveal", "craft", ["ending", "finale", "final act", "reveal", "twist"]),
    ("Franchise ranking", "opinion", ["best one", "worst one", "favorite", "rank", "ranking", "in the franchise"]),
    ("Effects and gore", "craft", ["practical effect", "special effect", "gore", "blood", "prosthetic", "makeup effect"]),
    ("Comedy and camp", "tone", ["funny", "hilarious", "laugh", "campy", "goofy", "ridiculous"]),
    ("Lore and continuity", "lore", ["canon", "continuity", "timeline", "backstory", "sequel", "lore"]),
    ("Direction and camera", "craft", ["director", "directed", "camera", "camera shot", "this shot", "that shot", "shot of", "lighting", "cinematography", "panavision", "pana vision"]),
    ("The opening", "structure", ["opening scene", "the opening", "beginning", "intro", "first scene"]),
]

FRANCHISE_TOPIC_RULES = {
    "Halloween": [
        ("Michael Myers", "character", ["michael myers", "michael", "the shape"]),
        ("Dr. Loomis", "character", ["dr loomis", "doctor loomis", "loomis"]),
        ("Laurie Strode", "character", ["laurie strode", "laurie"]),
        ("Jamie Lloyd", "character", ["jamie lloyd", "jamie"]),
        ("Rachel Carruthers", "character", ["rachel carruthers", "rachel"]),
        ("Tina Williams", "character", ["tina williams", "tina"]),
        ("Dr. Challis", "character", ["dr challis", "doctor challis", "challis"]),
        ("Silver Shamrock", "lore", ["silver shamrock", "conal cochran", "cochran"]),
        ("The Thorn timeline", "lore", ["thorn", "curse of thorn", "thorn timeline"]),
        ("Haddonfield", "place", ["haddonfield"]),
    ],
    "Friday the 13th": [
        ("Jason Voorhees", "character", ["jason voorhees", "jason"]),
        ("Pamela Voorhees", "character", ["pamela voorhees", "mrs voorhees", "pamela"]),
        ("Tommy Jarvis", "character", ["tommy jarvis", "tommy"]),
        ("Camp Crystal Lake", "place", ["camp crystal lake", "crystal lake"]),
        ("The counselors", "character", ["counselor", "counsellor"]),
        ("The final girl", "trope", ["final girl"]),
        ("Jason's look", "craft", ["jason mask", "hockey mask", "jason looks"]),
    ],
    "Scream": [
        ("Ghostface", "character", ["ghostface", "ghost face"]),
        ("Sidney Prescott", "character", ["sidney prescott", "sidney", "sydney"]),
        ("Gale Weathers", "character", ["gale weathers", "gale"]),
        ("Dewey Riley", "character", ["dewey riley", "dewey"]),
        ("Randy Meeks", "character", ["randy meeks", "randy"]),
        ("Kirby Reed", "character", ["kirby reed", "kirby"]),
        ("The killer reveal", "lore", ["who the killer", "the killers", "killer reveal"]),
        ("The horror rules", "lore", ["the rules", "horror rules", "movie rules", "meta"]),
    ],
    "A Nightmare on Elm Street": [
        ("Freddy Krueger", "character", ["freddy krueger", "freddy", "krueger"]),
        ("Nancy Thompson", "character", ["nancy thompson", "nancy"]),
        ("Jesse Walsh", "character", ["jesse walsh", "jesse"]),
        ("The Dream Warriors", "lore", ["dream warriors", "dream warrior"]),
        ("Dream logic", "lore", ["dream logic", "dream sequence", "the dream", "dreams"]),
        ("Elm Street", "place", ["elm street"]),
        ("Freddy's glove", "craft", ["freddy glove", "the glove", "razor glove"]),
        ("Robert Englund", "performance", ["robert englund", "englund"]),
    ],
}

CATEGORY_COPY = {
    "OUT OF POCKET": "an out-of-pocket detour",
    "FRANCHISE FELONY": "a hard negative take",
    "LOVE LETTER": "a full-throated piece of praise",
    "THEORY BOARD": "a prediction or theory",
    "KILL ROOM": "a kill-scene reaction",
    "BIT ENERGY": "a callback or running bit",
    "BREAKDOWN": "a room-breaking comedy turn",
    "HORROR BRAIN": "a horror-lore tangent",
    "FILM READ": "an explicit piece of movie analysis",
}
STRONG_WORDS = re.compile(
    r"\b(fuck|shit|bitch|asshole|dick|goddamn|worst|hate|love|best|"
    r"amazing|stupid|terrible|killer|dead|murder|blood|jesus christ)\b",
    re.I,
)
DISALLOWED_EXCERPT = re.compile(
    r"\b(?:n[\W_]*[i1][\W_]*g[\W_]*g|f[\W_]*a[\W_]*g[\W_]*g|r[\W_]*e[\W_]*t[\W_]*a[\W_]*r[\W_]*d)\w*",
    re.I,
)
FILLER = re.compile(r"^(?:\[.*?\]\s*)+$|^(?:music|applause|foreign)$", re.I)


def parse_existing_catalog() -> list[dict[str, Any]]:
    raw = EXISTING_CATALOG.read_text(encoding="utf-8")
    payload = raw.split("=", 1)[1].strip().rstrip(";")
    return json.loads(payload)


def canon() -> list[dict[str, Any]]:
    items = parse_existing_catalog()
    by_id = {item["id"]: item for item in items}
    for video_id, franchise, film, order in NEW_CANON:
        by_id.setdefault(
            video_id,
            {
                "id": video_id,
                "franchise": franchise,
                "film": film,
                "order": order,
                "url": f"https://www.youtube.com/watch?v={video_id}",
            },
        )
    return sorted(
        by_id.values(),
        key=lambda item: (
            list(FRANCHISE_META).index(item["franchise"]),
            item["order"],
        ),
    )


def choose_caption_url(info: dict[str, Any]) -> str | None:
    automatic = info.get("automatic_captions") or {}
    manual = info.get("subtitles") or {}
    for bank in (manual, automatic):
        for lang in ("en-orig", "en", "en-US", "en-GB"):
            tracks = bank.get(lang) or []
            for fmt in tracks:
                if fmt.get("ext") == "json3" and fmt.get("url"):
                    return fmt["url"]
    return None


def fetch_json(url: str) -> Any:
    request = urllib.request.Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0",
            "Accept-Language": "en-US,en;q=0.9",
        },
    )
    with urllib.request.urlopen(request, timeout=45) as response:
        return json.load(response)


def extract_metadata(
    seed: dict[str, Any],
    refresh: bool,
    require_live_status: bool = False,
    observed_at: str | None = None,
) -> dict[str, Any]:
    video_id = seed["id"]
    info_path = CACHE / "metadata" / f"{video_id}.json"
    if not refresh and info_path.exists():
        info = json.loads(info_path.read_text(encoding="utf-8"))
        if not require_live_status or info.get("live_status"):
            return info

    observation = resolve_observed_at(observed_at)
    options = {
        "quiet": True,
        "no_warnings": True,
        "skip_download": True,
        "extract_flat": False,
        # Keep factual metadata even when an age gate withholds media formats.
        "ignore_no_formats_error": True,
        "socket_timeout": 45,
        "extractor_args": {
            "youtube": {
                "player_client": ["web_safari"],
            },
        },
    }
    with YoutubeDL(options) as ydl:
        raw = ydl.extract_info(seed["url"], download=False)
    info = {
        "id": raw.get("id"),
        "title": raw.get("title"),
        "upload_date": raw.get("upload_date"),
        "duration": raw.get("duration"),
        "view_count": raw.get("view_count"),
        "channel": raw.get("channel"),
        "channel_id": raw.get("channel_id"),
        "thumbnail": raw.get("thumbnail"),
        "caption_url": choose_caption_url(raw),
        "age_limit": raw.get("age_limit"),
        "availability": raw.get("availability"),
        "live_status": raw.get("live_status"),
        "observed_at": observation,
    }
    info_path.parent.mkdir(parents=True, exist_ok=True)
    info_path.write_text(json.dumps(info, ensure_ascii=False), encoding="utf-8")
    return info


def extract_one(
    seed: dict[str, Any],
    refresh: bool,
    *,
    require_live_status: bool = False,
    observed_at: str | None = None,
    info: dict[str, Any] | None = None,
    cache_only: bool = False,
) -> tuple[dict[str, Any], list[dict[str, Any]]]:
    video_id = seed["id"]
    captions_path = CACHE / "captions" / f"{video_id}.json"
    info_path = CACHE / "metadata" / f"{video_id}.json"
    if info is None:
        if cache_only:
            info = json.loads(info_path.read_text(encoding="utf-8")) if info_path.exists() else {}
        else:
            info = extract_metadata(
                seed,
                refresh,
                require_live_status=require_live_status,
                observed_at=observed_at,
            )

    if not refresh and captions_path.exists():
        payload = json.loads(captions_path.read_text(encoding="utf-8"))
    elif info.get("caption_url"):
        payload = fetch_json(info["caption_url"])
        captions_path.parent.mkdir(parents=True, exist_ok=True)
        captions_path.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")
    else:
        payload = {}
    return info, parse_json3(payload)


def clean_text(value: str) -> str:
    value = html.unescape(value).replace("\n", " ")
    value = re.sub(r"<[^>]+>", "", value)
    value = re.sub(r"\[\s*__\s*\]", "[BLEEP]", value)
    value = re.sub(r"\s+", " ", value).strip()
    return value


def parse_json3(payload: dict[str, Any]) -> list[dict[str, Any]]:
    lines: list[dict[str, Any]] = []
    for event in payload.get("events") or []:
        text = clean_text("".join(segment.get("utf8", "") for segment in event.get("segs") or []))
        if not text or FILLER.match(text):
            continue
        start = float(event.get("tStartMs", 0)) / 1000
        duration = float(event.get("dDurationMs", 0)) / 1000
        if lines and text == lines[-1]["text"]:
            continue
        lines.append({"start": round(start, 2), "duration": round(duration, 2), "text": text})
    return lines


def excerpt_words(text: str, limit: int = 22) -> str:
    text = re.sub(r"^\s*\?+\s*", "", text)
    text = re.sub(r"\s*\?+\s*$", "", text).strip()
    words = text.split()
    if len(words) <= limit:
        return text
    anchor = next((i for i, word in enumerate(words) if STRONG_WORDS.search(word)), len(words) // 2)
    left = max(0, min(anchor - 6, len(words) - limit))
    clipped = " ".join(words[left : left + limit])
    return ("… " if left else "") + clipped + (" …" if left + limit < len(words) else "")


def lexical(value: str) -> str:
    """Normalize caption text for bounded phrase matching."""
    return re.sub(r"[^a-z0-9']+", " ", value.lower()).strip()


FOREIGN_FILM_REFERENCES = (
    ("friday the 13th franchise", "friday the 13th"),
    ("the 13th", "friday the 13th"),
    ("jason x", "jason x"),
    ("jason goes to hell", "jason goes to hell"),
    ("jason takes manhattan", "jason takes manhattan"),
    ("freddy vs jason", "freddy vs jason"),
    ("freddys revenge", "freddys revenge"),
    ("new nightmare", "new nightmare"),
    ("dream warriors", "dream warriors"),
    ("dream child", "dream child"),
    ("scary movie", "scary movie"),
    ("halloween ends", "halloween ends"),
    ("halloween kills", "halloween kills"),
)


def names_another_film(seed: dict[str, Any], excerpt: str) -> bool:
    """Veto a closing receipt that explicitly names a different movie."""
    body = lexical(excerpt)
    current = lexical(seed.get("film") or "")
    return any(
        phrase in body and current_title not in current
        for phrase, current_title in FOREIGN_FILM_REFERENCES
    )


def evidence_pair_distance(cut: dict[str, Any]) -> int:
    """Measure how tightly a displayed subject and evaluation are coupled."""
    words = lexical(cut.get("excerpt") or "").split()
    topic = lexical(cut.get("topicEvidence") or "").split()
    category = lexical(cut.get("categoryEvidence") or "").split()
    if not words or not topic or not category:
        return 999
    topic_positions = [
        index for index in range(len(words) - len(topic) + 1)
        if words[index:index + len(topic)] == topic
    ]
    category_positions = [
        index for index in range(len(words) - len(category) + 1)
        if words[index:index + len(category)] == category
    ]
    if not topic_positions or not category_positions:
        return 999
    return min(abs(left - right) for left in topic_positions for right in category_positions)


def excerpt_around_terms(text: str, terms: list[str], limit: int = 23) -> str:
    """Clip around the named subject instead of an unrelated loud word."""
    text = re.sub(r"^\s*\?+\s*", "", text)
    text = re.sub(r"\s*\?+\s*$", "", text).strip()
    words = text.split()
    if len(words) <= limit:
        return text
    normalized_words = [lexical(word) for word in words]
    targets = [lexical(term).split() for term in terms if lexical(term)]
    anchor: int | None = None
    for index in range(len(words)):
        for target in targets:
            if index + len(target) > len(words):
                continue
            sample = normalized_words[index : index + len(target)]
            if all(
                actual == expected or (len(expected) >= 5 and actual.startswith(expected))
                for actual, expected in zip(sample, target)
            ):
                anchor = index
                break
        if anchor is not None:
            break
    if anchor is None:
        return excerpt_words(text, limit)
    left = max(0, min(anchor - 7, len(words) - limit))
    clipped = " ".join(words[left : left + limit])
    return ("… " if left else "") + clipped + (" …" if left + limit < len(words) else "")


def context_excerpt(
    lines: list[dict[str, Any]],
    index: int,
    limit: int = 25,
    terms: list[str] | None = None,
) -> str:
    """Return a short public excerpt around one caption event."""
    group: list[str] = []
    start = max(0, index - 1)
    anchor_start = lines[index]["start"]
    for line in lines[start : index + 5]:
        if abs(line["start"] - anchor_start) > 14:
            continue
        group.append(line["text"])
        if len(" ".join(group).split()) >= 38:
            break
    body = clean_text(" ".join(group))
    return excerpt_around_terms(body, terms, max(5, limit - 2)) if terms else excerpt_words(body, max(5, limit - 2))

def topic_rules_for_seed(seed: dict[str, Any]) -> list[tuple[str, str, list[str]]]:
    """Return topic rules with weak single-name aliases scoped to the film."""
    film = lexical(seed.get("film") or "")
    output: list[tuple[str, str, list[str]]] = []
    for name, kind, aliases in COMMON_TOPIC_RULES + FRANCHISE_TOPIC_RULES.get(seed["franchise"], []):
        bounded_aliases = list(aliases)
        if name == "Jamie Lloyd" and not any(token in film for token in ("halloween 4", "halloween 5")):
            bounded_aliases = [alias for alias in bounded_aliases if lexical(alias) != "jamie"]
        if name == "Rachel Carruthers" and not any(token in film for token in ("halloween 4", "halloween 5")):
            bounded_aliases = [alias for alias in bounded_aliases if lexical(alias) != "rachel"]
        if name == "Tina Williams" and "halloween 5" not in film:
            bounded_aliases = [alias for alias in bounded_aliases if lexical(alias) != "tina"]
        output.append((name, kind, bounded_aliases))
    return output

def topic_candidates(
    seed: dict[str, Any], lines: list[dict[str, Any]], maximum: int = 9
) -> list[dict[str, Any]]:
    """Recover episode subjects, their concentration, and a playable anchor."""
    rules = topic_rules_for_seed(seed)
    searchable = [" " + lexical(line["text"]) + " " for line in lines]
    output: list[dict[str, Any]] = []
    for name, kind, aliases in rules:
        alias_tokens = [lexical(alias) for alias in aliases if lexical(alias)]
        matches: list[int] = []
        last_start = -10.0
        for index, body in enumerate(searchable):
            if not any(" " + alias + " " in body for alias in alias_tokens):
                continue
            # Auto-captions often repeat rolling fragments. One hit every two
            # seconds is enough to prove recurrence without inflating counts.
            if lines[index]["start"] - last_start < 2:
                continue
            matches.append(index)
            last_start = lines[index]["start"]
        minimum = 2 if kind in {"character", "place", "performance"} else 3
        if len(matches) < minimum:
            continue

        best_index = matches[0]
        best_cluster = 1
        best_value = -1.0
        for index in matches:
            at = lines[index]["start"]
            cluster = sum(
                1 for other in matches
                if abs(lines[other]["start"] - at) <= 150
            )
            _, raw, _ = classify(lines[index]["text"])
            value = cluster * 10 + raw + min(len(lines[index]["text"].split()), 24) * 0.15
            if value > best_value:
                best_index = index
                best_cluster = cluster
                best_value = value
        receipt = context_excerpt(lines, best_index, terms=alias_tokens)
        if not receipt or DISALLOWED_EXCERPT.search(receipt):
            continue
        importance = (
            len(matches) * (1.35 if kind in {"character", "place", "performance"} else 1.0)
            + best_cluster * 3.2
        )
        output.append(
            {
                "name": name,
                "kind": kind,
                "mentions": len(matches),
                "cluster": best_cluster,
                "first": round(lines[matches[0]]["start"]),
                "peak": round(lines[best_index]["start"]),
                "receipt": receipt,
                "score": round(importance, 2),
            }
        )

    output.sort(key=lambda item: (-item["score"], -item["mentions"], item["peak"], item["name"]))
    selected: list[dict[str, Any]] = []
    kind_counts: Counter[str] = Counter()
    for topic in output:
        if topic["kind"] == "character" and kind_counts["character"] >= 4:
            continue
        selected.append(topic)
        kind_counts[topic["kind"]] += 1
        if len(selected) >= maximum:
            break
    return selected


SEMANTIC_STANCE_RULES = [
    (r"\bi (?:think|feel|believe)\b", 5),
    (r"\bi (?:love|hate|prefer|wish)\b", 8),
    (r"\b(?:works?|doesn(?:'|\u2019)t work|does not work|didn(?:'|\u2019)t work|effective|ineffective)\b", 8),
    (r"\b(?:should have|should've|could have|could've|would have|would've)\b", 8),
    (r"\b(?:best|worst|favorite|rank|ranking|better than|worse than)\b", 8),
    (r"\b(?:point is|problem is|what i like|what i hate|what makes|the thing about)\b", 10),
    (r"\b(?:this|that|it) (?:is|was|'s) (?:great|good|bad|terrible|awful|amazing|perfect|stupid|dumb|effective)\b", 8),
]
# A stance is only treated as movie analysis when the same short excerpt also
# contains a film object or a clear deictic judgment. This prevents "I hate
# math" and "I love that flashlight" from becoming editorial verdicts merely
# because they are loud.
EDITORIAL_OBJECT_RULE = re.compile(
    r"\b(?:movie|film|scene|shot|sequence|character|performance|acting|actor|actress|"
    r"camera|lighting|cinematography|score|soundtrack|music|sound design|ending|opening|"
    r"reveal|twist|direction|director|edit|editing|writing|script|dialogue|plot|story|"
    r"mask|costume|makeup|effect|effects|gore|kill|sequel|remake|reboot|franchise|"
    r"timeline|lore|freddy|jason|michael|ghostface|loomis|sidney|dewey|gale|laurie|"
    r"jamie|rachel|tina|nancy|kirby|randy|challis|silver shamrock)\b",
    re.I,
)
DEICTIC_JUDGMENT_RULE = re.compile(
    r"\b(?:i (?:love|hate|prefer) (?:this|that|it)|"
    r"(?:this|that|it) (?:works?|doesn(?:'|\u2019)t work|does not work)|"
    r"(?:this|that|it) (?:is|was|'s) (?:great|good|bad|terrible|awful|amazing|perfect|stupid|dumb|effective))\b",
    re.I,
)
SEMANTIC_REASON_RULE = re.compile(
    r"\b(?:because|the reason|which is why|that is why|that's why|so that)\b",
    re.I,
)
VERDICT_RULES = [
    (r"\b(?:final thoughts?|final verdict|overall|at the end of the day)\b", 14),
    (r"\b(?:one of the (?:best|worst)|best in the franchise|worst in the franchise)\b", 12),
    (r"\b(?:this|that) (?:movie|film|one) (?:is|was|'s) (?:great|good|bad|terrible|awful|amazing|perfect|stupid|dumb)\b", 12),
    (r"\b(?:i|we) (?:love|hate) (?:this|that|the) (?:movie|film|one)\b", 12),
    (r"\b(?:favorite|least favorite|rank|ranking)\b.{0,30}\b(?:movie|film|franchise|series|one)\b", 10),
    (r"\b(?:great|good|bad|terrible|awful|fun) movie\b", 10),
    (r"\bsaved the best for last\b", 10),
]


def semantic_take_details(text: str) -> tuple[int, str]:
    """Return a grounded analysis score and the exact supporting stance cue."""
    matches = [
        (weight, match.group(0))
        for pattern, weight in SEMANTIC_STANCE_RULES
        if (match := re.search(pattern, text, re.I))
    ]
    if not matches:
        return 0, ""
    object_match = EDITORIAL_OBJECT_RULE.search(text)
    deictic_match = DEICTIC_JUDGMENT_RULE.search(text)
    if not object_match and not deictic_match:
        return 0, ""
    stance = sum(weight for weight, _ in matches)
    score = stance + (4 if object_match else 0)
    if SEMANTIC_REASON_RULE.search(text):
        score += 6
    if len(text.split()) >= 20:
        score += 1
    evidence = max(matches, key=lambda item: (item[0], len(item[1])))[1]
    return min(score, 32), evidence


def semantic_take_score(text: str) -> int:
    """Reward an actual stance or craft explanation, never profanity by itself."""
    return semantic_take_details(text)[0]


def verdict_signal_details(text: str) -> tuple[int, str]:
    """Identify explicit summary/verdict language rather than any late reaction."""
    matches = [
        (weight, match.group(0))
        for pattern, weight in VERDICT_RULES
        if (match := re.search(pattern, text, re.I))
    ]
    if not matches:
        return 0, ""
    weight, evidence = max(matches, key=lambda item: (item[0], len(item[1])))
    return weight + (3 if SEMANTIC_REASON_RULE.search(text) else 0), evidence

GUIDE_CATEGORY_EXCLUSIONS = {
    "KILL ROOM": {r"\bhead\b", r"\bbody\b"},
    "BIT ENERGY": {r"\bagain\b"},
    "BREAKDOWN": {r"\bi can't\b", r"\boh my god\b", r"\bcome on\b"},
}
GUIDE_LOGISTICS = re.compile(
    r"\b(?:press play|hit play|pause (?:the )?movie|sync(?:ed|ing)? up|countdown|"
    r"three two one|hear the movie|movie in the background|haven['’]?t got in the movie|"
    r"not in the movie yet|headphones|blu[ -]?ray timestamp)\b",
    re.I,
)


def guide_classify(text: str) -> tuple[str, float, dict[str, int]]:
    """Use stricter labels for the guide while leaving the legacy Hot 100 untouched."""
    hits: dict[str, int] = {}
    weighted: dict[str, float] = {}
    for category, rule in CATEGORY_RULES.items():
        excluded = GUIDE_CATEGORY_EXCLUSIONS.get(category, set())
        count = sum(
            len(re.findall(pattern, text, re.I))
            for pattern in rule["terms"]
            if pattern not in excluded
        )
        hits[category] = count
        weighted[category] = count * rule["weight"]
    category = max(weighted, key=weighted.get)
    raw = weighted[category] + sum(hits.values()) * 1.6
    punctuation = min(text.count("!") * 1.7 + text.count("?") * 0.8, 7)
    return category, raw + punctuation, hits

def guide_category_evidence(text: str, category: str) -> tuple[int, str]:
    """Return the exact visible phrase that earns a non-analysis category."""
    if category == "FILM READ":
        score, evidence = semantic_take_details(text)
        return (1 if score >= 8 and evidence else 0), evidence
    excluded = GUIDE_CATEGORY_EXCLUSIONS.get(category, set())
    matches = [
        match.group(0)
        for pattern in CATEGORY_RULES.get(category, {}).get("terms", [])
        if pattern not in excluded
        for match in re.finditer(pattern, text, re.I)
    ]
    if not matches:
        return 0, ""
    return len(matches), max(matches, key=len)


def evidence_windows(text: str, limit: int = 23) -> list[tuple[str, str]]:
    """Return every short contiguous receipt and its display-safe clipping."""
    words = text.split()
    if len(words) <= limit:
        return [(text, text)]
    output: list[tuple[str, str]] = []
    final_left = len(words) - limit
    # Three overlapping windows are enough to cover a forty-word candidate
    # while keeping a full 65-hour cache-only rebuild comfortably local.
    for left in sorted({0, final_left // 2, final_left}):
        plain = " ".join(words[left : left + limit])
        display = ("... " if left else "") + plain
        if left + limit < len(words):
            display += " ..."
        output.append((plain, display))
    return output


def grounded_evidence_window(
    seed: dict[str, Any], topics: list[dict[str, Any]], text: str
) -> dict[str, Any] | None:
    """Select one receipt whose displayed words support every public label."""
    choices: list[dict[str, Any]] = []
    for plain, excerpt in evidence_windows(text):
        category, raw_score, hits = guide_classify(plain)
        substance, editorial_evidence = semantic_take_details(plain)
        if sum(hits.values()) == 0:
            if substance < 8:
                continue
            category = "FILM READ"
        elif substance >= 8 and category in {
            "OUT OF POCKET", "BREAKDOWN", "HORROR BRAIN", "KILL ROOM", "BIT ENERGY"
        }:
            negative_hits = hits.get("FRANCHISE FELONY", 0)
            praise_hits = hits.get("LOVE LETTER", 0)
            if negative_hits and negative_hits >= praise_hits:
                category = "FRANCHISE FELONY"
            elif praise_hits:
                category = "LOVE LETTER"
            else:
                category = "FILM READ"
        category_support, category_evidence = guide_category_evidence(plain, category)
        if category_support <= 0:
            continue
        topic, topic_support, topic_evidence = local_topic_for_text(seed, topics, plain)
        verdict_signal, verdict_evidence = verdict_signal_details(plain)
        rank = (
            raw_score
            + substance * 1.55
            + (16 if topic else 0)
            + min(topic_support, 3) * 2
            + verdict_signal * 0.35
        )
        choices.append(
            {
                "category": category,
                "excerpt": excerpt,
                "substance": substance,
                "editorialEvidence": editorial_evidence,
                "categorySupport": category_support,
                "categoryEvidence": category_evidence,
                "topic": topic["name"] if topic else seed["film"],
                "topicBasis": "local-caption-match" if topic else "film-context-fallback",
                "topicSupport": topic_support,
                "topicEvidence": topic_evidence,
                "verdictSignal": verdict_signal,
                "verdictEvidence": verdict_evidence,
                "evidenceBasis": (
                    "topic-and-category-in-same-excerpt"
                    if topic
                    else "category-in-excerpt-film-context-only"
                ),
                "rank": rank,
            }
        )
    if not choices:
        return None
    return max(
        choices,
        key=lambda item: (
            item["substance"] >= 8,
            item["rank"],
            item["topicBasis"] == "local-caption-match",
            item["verdictSignal"],
        ),
    )


def guide_moment_candidates(
    seed: dict[str, Any],
    topics: list[dict[str, Any]],
    lines: list[dict[str, Any]],
    duration: int | float | None,
    maximum: int = 16,
) -> list[dict[str, Any]]:
    """Find a diverse, runtime-spanning cut index with receipt-level grounding."""
    if not lines:
        return []
    end = max(float(duration or 0), lines[-1]["start"] + lines[-1]["duration"], 1)
    rough_pool: list[dict[str, Any]] = []
    for index, line in enumerate(lines):
        group = [line]
        for nxt in lines[index + 1 : index + 7]:
            if nxt["start"] - group[-1]["start"] > 9:
                break
            group.append(nxt)
            if len(" ".join(item["text"] for item in group).split()) >= 42:
                break
        body = clean_text(" ".join(item["text"] for item in group))
        if len(body.split()) < 8 or DISALLOWED_EXCERPT.search(body) or GUIDE_LOGISTICS.search(body):
            continue
        body_category, body_raw_score, body_hits = guide_classify(body)
        body_substance = semantic_take_score(body)
        if sum(body_hits.values()) == 0 and body_substance < 8:
            continue
        if body_raw_score < 6 and body_substance < 8:
            continue
        body_verdict, _ = verdict_signal_details(body)
        rough_pool.append(
            {
                "body": body,
                "bodyCategory": body_category,
                "roughRank": body_raw_score + body_substance * 1.35 + body_verdict * 0.4,
                "t": round(line["start"]),
                "end": round(min(end, line["start"] + 36)),
                "slot": min(5, int(line["start"] / end * 6)),
                "verdict": body_verdict,
            }
        )

    # Receipt-level grounding is more expensive than rough signal detection.
    # Shortlist generously by runtime lane, category, and closing-verdict signal
    # before testing every displayed 23-word window.
    shortlisted: dict[int, dict[str, Any]] = {}
    for slot in range(6):
        lane = sorted(
            (item for item in rough_pool if item["slot"] == slot),
            key=lambda item: (-item["roughRank"], item["t"]),
        )
        for item in lane[:120]:
            shortlisted[item["t"]] = item
    for category in CATEGORY_RULES:
        lane = sorted(
            (item for item in rough_pool if item["bodyCategory"] == category),
            key=lambda item: (-item["roughRank"], item["t"]),
        )
        for item in lane[:18]:
            shortlisted[item["t"]] = item
    for item in sorted(
        (item for item in rough_pool if item["slot"] == 5 and item["verdict"] >= 10),
        key=lambda item: (-item["verdict"], -item["roughRank"], -item["t"]),
    )[:30]:
        shortlisted[item["t"]] = item

    pool: list[dict[str, Any]] = []
    for rough in shortlisted.values():
        grounded = grounded_evidence_window(seed, topics, rough["body"])
        if not grounded:
            continue
        grounded.update({key: rough[key] for key in ("t", "end", "slot")})
        pool.append(grounded)

    pool.sort(key=lambda item: (-item["rank"], -item["substance"], item["t"]))
    chosen: list[dict[str, Any]] = []
    fingerprints: set[str] = set()
    category_counts: Counter[str] = Counter()

    def eligible(candidate: dict[str, Any], separation: int) -> bool:
        fingerprint = " ".join(re.findall(r"[a-z']+", candidate["excerpt"].lower()))[:90]
        return (
            fingerprint not in fingerprints
            and category_counts[candidate["category"]] < 4
            and not any(abs(candidate["t"] - item["t"]) < separation for item in chosen)
        )

    def keep(candidate: dict[str, Any]) -> None:
        chosen.append(candidate)
        fingerprints.add(" ".join(re.findall(r"[a-z']+", candidate["excerpt"].lower()))[:90])
        category_counts[candidate["category"]] += 1

    # Guarantee one strong stop in every sixth. In the final sixth, explicit
    # verdict language outranks a merely late reaction.
    for slot in range(6):
        candidates = [item for item in pool if item["slot"] == slot and eligible(item, 35)]
        candidate = max(
            candidates,
            key=lambda item: (
                item["verdictSignal"] >= 10 if slot == 5 else item["substance"] >= 8,
                item["substance"] >= 8,
                item["topicBasis"] == "local-caption-match",
                item["verdictSignal"],
                item["rank"],
                -item["t"],
            ),
            default=None,
        )
        if candidate:
            keep(candidate)

    # Keep at least one playable receipt for each recurring subject when the
    # evidence pool contains one. This lets Ask surface specific craft terms
    # such as Panavision instead of allowing one loud character to consume the
    # entire runtime-sized cut budget.
    for topic in topics:
        if len(chosen) >= maximum:
            break
        if any(item["topic"] == topic["name"] for item in chosen):
            continue
        candidates = [
            item
            for item in pool
            if item["topic"] == topic["name"]
            and item["topicBasis"] == "local-caption-match"
            and eligible(item, 18)
        ]
        candidate = max(
            candidates,
            key=lambda item: (
                lexical(item.get("topicEvidence", ""))
                not in {"camera", "camera shot", "this shot", "that shot", "shot of", "lighting", "director", "directed"},
                len(lexical(item.get("topicEvidence", "")).split()),
                len(item.get("topicEvidence", "")),
                item.get("substance", 0) >= 8,
                item.get("substance", 0),
                item["rank"],
                -item["t"],
            ),
            default=None,
        )
        if candidate:
            keep(candidate)

    # Preserve the WWAM mix: analysis is the spine, while a deep dive still
    # needs comedy, callbacks, theories, and kill-room reactions when present.
    for category in ("FRANCHISE FELONY", "LOVE LETTER", "OUT OF POCKET", "BREAKDOWN", "BIT ENERGY", "THEORY BOARD", "KILL ROOM"):
        if len(chosen) >= maximum or category_counts[category]:
            continue
        candidate = next(
            (item for item in pool if item["category"] == category and eligible(item, 35)),
            None,
        )
        if candidate:
            keep(candidate)

    # Fill to the runtime-sized target while relaxing only temporal spacing, never evidence or
    # per-category caps.
    for separation in (45, 30, 18):
        for candidate in pool:
            if len(chosen) >= maximum:
                break
            if not eligible(candidate, separation):
                continue
            keep(candidate)
        if len(chosen) >= maximum:
            break

    ordered = sorted(chosen, key=lambda item: item["t"])
    for index, candidate in enumerate(ordered):
        candidate.pop("slot", None)
        candidate["score"] = min(99, round(35 + candidate.pop("rank") * 1.65))
        candidate["id"] = f"guide-cut-{index + 1:02d}-{candidate['t']}"
        candidate["label"] = CATEGORY_COPY.get(
            candidate["category"], candidate["category"].lower()
        )
    return ordered


def natural_list(values: list[str]) -> str:
    values = list(dict.fromkeys(value for value in values if value))
    if not values:
        return "the movie itself"
    if len(values) == 1:
        return values[0]
    if len(values) == 2:
        return values[0] + " and " + values[1]
    return ", ".join(values[:-1]) + ", and " + values[-1]


def clock_label(seconds: int | float) -> str:
    total = max(0, round(seconds))
    hours, remainder = divmod(total, 3600)
    minutes, secs = divmod(remainder, 60)
    return f"{hours}:{minutes:02d}:{secs:02d}" if hours else f"{minutes}:{secs:02d}"


def alias_occurrences_in_lexical(body: str, alias: str) -> int:
    """Count one alias in already-normalized receipt text."""
    normalized = lexical(alias)
    if not normalized:
        return 0
    if " " in normalized:
        return (" " + body + " ").count(" " + normalized + " ")
    suffix = r"\w*" if len(normalized) >= 5 else ""
    return len(re.findall(r"\b" + re.escape(normalized) + suffix + r"\b", body))


def alias_occurrences(text: str, alias: str) -> int:
    return alias_occurrences_in_lexical(lexical(text), alias)


def local_topic_for_text(
    seed: dict[str, Any],
    topics: list[dict[str, Any]],
    text: str,
) -> tuple[dict[str, Any] | None, int, str]:
    """Bind a subject only when the exact public receipt contains its alias."""
    if not topics:
        return None, 0, ""
    selected = {topic["name"]: topic for topic in topics}
    body = lexical(text)
    choices: list[tuple[float, int, str, dict[str, Any]]] = []
    for name, kind, aliases in topic_rules_for_seed(seed):
        topic = selected.get(name)
        if not topic:
            continue
        alias_hits = []
        for alias in aliases:
            count = alias_occurrences_in_lexical(body, alias)
            if count > 0:
                alias_hits.append((count, alias))
        if not alias_hits:
            continue
        hits = sum(count for count, _ in alias_hits)
        evidence_alias = max(
            alias_hits,
            key=lambda item: (item[0], len(lexical(item[1]).split()), len(item[1])),
        )[1]
        specificity = len(lexical(evidence_alias).split())
        kind_bonus = 5 if kind in {"character", "place", "performance"} else 0
        local_score = hits * 100 + specificity * 12 + kind_bonus + topic["score"] * 0.02
        choices.append((local_score, hits, evidence_alias, topic))
    if not choices:
        return None, 0, ""
    _, hits, evidence_alias, topic = max(
        choices, key=lambda item: (item[0], item[1], item[3]["name"])
    )
    return topic, hits, evidence_alias


ACT_LANE_COPY = [
    "The cold-open checkpoint",
    "The setup stretch",
    "The first major turn",
    "The halfway checkpoint",
    "The escalation stretch",
    "The closing stretch",
    "The final lap",
]
CHAPTER_STAGE_COPY = (
    "{topic} takes over the {lane} at {at}.",
    "At {at}, the {lane} belongs to {topic}.",
    "The {lane} swings toward {topic} at {at}.",
    "{topic} becomes the center of the {lane} at {at}.",
)
CATEGORY_MOMENT_COPY = {
    "OUT OF POCKET": (
        "{quote} sends {topic} and the commentary through the side door.",
        "Then {topic} knocks the watch off its rails with {quote}.",
        "The detour around {topic} arrives fully formed in {quote}.",
        "The movie talk around {topic} goes gloriously sideways in {quote}.",
    ),
    "FRANCHISE FELONY": (
        "The prosecution brings {topic} to the stand with {quote}.",
        "{quote} is where the gloves come off around {topic}.",
        "The tape files its {topic} complaint in four words: {quote}.",
        "{quote} turns the case against {topic} into a franchise felony.",
    ),
    "LOVE LETTER": (
        "The affection for {topic} is impossible to miss in {quote}.",
        "{quote} turns {topic} into a full WWAM valentine.",
        "The tape goes soft for {topic}, right down to {quote}.",
        "The defense of {topic} gets its cleanest language in {quote}.",
    ),
    "THEORY BOARD": (
        "{quote} opens the conspiracy board around {topic}.",
        "The {topic} prediction machine starts humming with {quote}.",
        "{quote} sends {topic} into theory-board territory.",
        "The tape starts drawing red string from {topic} to {quote}.",
    ),
    "KILL ROOM": (
        "{quote} puts the {topic} kill talk under the microscope.",
        "The kill-room light comes on around {topic} with {quote}.",
        "{quote} makes {topic} the night's forensic stop.",
        "The body-count conversation around {topic} sharpens through {quote}.",
    ),
    "BIT ENERGY": (
        "{quote} brings the {topic} running-bit energy back around.",
        "The callback bell for {topic} rings on {quote}.",
        "{quote} is where the {topic} bit finds another life.",
        "The room recognizes its {topic} joke in {quote}.",
    ),
    "BREAKDOWN": (
        "{quote} is where the room breaks around {topic}.",
        "The {topic} laugh pressure finally blows at {quote}.",
        "{quote} turns {topic} into a full commentary pileup.",
        "The comedy spike around {topic} announces itself with {quote}.",
    ),
    "HORROR BRAIN": (
        "{quote} kicks open the {topic} horror-lore cabinet.",
        "The franchise brain around {topic} takes over at {quote}.",
        "{quote} sends {topic} deeper into horror history.",
        "The lore detour around {topic} begins with {quote}.",
    ),
    "FILM READ": (
        "{quote} turns {topic} into a nuts-and-bolts movie read.",
        "The craft conversation around {topic} gets real in {quote}.",
        "{quote} starts taking the filmmaking around {topic} apart.",
        "A closer look at {topic} begins with {quote}.",
    ),
}
TOPIC_KIND_COPY = {
    "character": "character-led",
    "place": "location-led",
    "performance": "performance-led",
    "craft": "craft-led",
    "lore": "lore-led",
    "opinion": "verdict-led",
    "tone": "tone-led",
    "structure": "structure-led",
}


def stable_voice_choice(options: tuple[str, ...], *parts: Any) -> str:
    """Choose repeatable channel copy without pretending the choice is evidence."""
    key = "|".join(str(part) for part in parts)
    digest = hashlib.sha256(key.encode("utf-8")).digest()
    return options[int.from_bytes(digest[:4], "big") % len(options)]


def evidence_fragment(cut: dict[str, Any], maximum: int = 10) -> str:
    """Return a short exact-caption fragment centered on this cut's evidence."""
    tokens = re.findall(
        r"\[BLEEP\]|[A-Za-z0-9]+(?:['-][A-Za-z0-9]+)*",
        cut.get("excerpt", ""),
    )
    # A topic is a navigation label, not a spoken quote. Quoting it when the
    # caption window is empty makes topic names masquerade as dialogue.
    if not tokens:
        return "this moment"
    lowered = [lexical(token) for token in tokens]
    anchors = [
        cut.get("verdictEvidence", ""),
        cut.get("editorialEvidence", ""),
        cut.get("categoryEvidence", ""),
        cut.get("topicEvidence", ""),
    ]
    anchor_tokens = sorted(
        (
            [part for part in lexical(anchor).split() if part]
            for anchor in anchors
            if anchor
        ),
        key=lambda parts: (len(parts), sum(len(part) for part in parts)),
        reverse=True,
    )
    start = 0
    stop = min(len(tokens), maximum)
    found = False
    for anchor in anchor_tokens:
        for index in range(0, len(lowered) - len(anchor) + 1):
            if lowered[index : index + len(anchor)] != anchor:
                continue
            start = index
            stop = min(len(tokens), start + maximum)
            if stop - start < 5:
                start = max(0, stop - maximum)
            found = True
            break
        if found:
            break
    leading_filler = {"and", "but", "so", "yeah", "oh", "uh", "um", "like", "of", "the", "a", "an"}
    trailing_filler = {
        "and", "but", "so", "or", "to", "of", "the", "a", "an", "if", "because",
        "he", "she", "they", "he's", "she's", "they're", "it's", "i", "you", "we",
        "on", "in", "at", "with", "for", "from", "is", "was", "are", "were",
        "do", "does", "did", "don't", "can't", "can", "like", "bleep",
    }
    fragment_tokens = tokens[start:stop]
    while len(fragment_tokens) > 3 and lexical(fragment_tokens[0]) in leading_filler:
        fragment_tokens.pop(0)
    while len(fragment_tokens) > 3 and lexical(fragment_tokens[-1]) in trailing_filler:
        fragment_tokens.pop()
    fragment = " ".join(fragment_tokens).strip()
    return fragment or "this moment"


def quoted_fragment(cut: dict[str, Any]) -> str:
    fragment = evidence_fragment(cut)
    # These are editorial labels, not transcript reproductions. Sentence-case
    # a mid-window opening so the surrounding copy remains readable.
    if fragment and fragment[0].islower():
        fragment = fragment[0].upper() + fragment[1:]
    return (
        "\N{LEFT DOUBLE QUOTATION MARK}"
        + fragment
        + "\N{RIGHT DOUBLE QUOTATION MARK}"
    )


def category_moment_sentence(cut: dict[str, Any], voice_key: str) -> str:
    options = CATEGORY_MOMENT_COPY.get(
        cut["category"],
        ("{quote} is the language that defines the stop.",),
    )
    template = stable_voice_choice(
        options,
        voice_key,
        cut["category"],
        cut["topic"],
        cut["t"],
    )
    return template.format(quote=quoted_fragment(cut), topic=cut["topic"])


def chapter_editorial_body(
    slot: int,
    chapter_total: int,
    cut: dict[str, Any],
    film: str,
    voice_key: str,
) -> tuple[str, str]:
    if slot == chapter_total - 1:
        lane = "The closing stretch"
    elif chapter_total == 7 and slot == 5:
        lane = "The late escalation"
    else:
        lane = ACT_LANE_COPY[slot]
    at = clock_label(cut["t"])
    lane_name = lane.removeprefix("The ").lower()
    moment = category_moment_sentence(cut, f"{voice_key}:chapter:{slot}")
    if cut["topicBasis"] == "local-caption-match":
        lead = stable_voice_choice(
            CHAPTER_STAGE_COPY,
            voice_key,
            "chapter-lead",
            slot,
            cut["topic"],
        ).format(topic=cut["topic"], lane=lane_name, at=at)
        return (
            f"{lead} {moment}",
            "topic-and-category-in-same-excerpt",
        )
    lead = stable_voice_choice(
        (
            "At {at}, the {lane} stays with {film}.",
            "{film} holds the {lane} at {at}.",
            "The {lane} returns to {film} at {at}.",
        ),
        voice_key,
        "chapter-fallback",
        slot,
    ).format(at=at, lane=lane_name, film=film)
    return (
        f"{lead} {moment}",
        "category-in-excerpt-film-context-only",
    )


def take_editorial_body(
    lane: str,
    cut: dict[str, Any],
    voice_key: str,
    explicit_verdict: bool = False,
) -> tuple[str, str]:
    at = clock_label(cut["t"])
    moment = category_moment_sentence(cut, f"{voice_key}:take:{lane}")
    if lane == "closing" and explicit_verdict:
        lead = stable_voice_choice(
            (
                "The tape does hand down a verdict at {at}, and {topic} gets the final word.",
                "At {at}, the closing verdict finally arrives through {topic}.",
                "{topic} carries the tape's actual final ruling at {at}.",
            ),
            voice_key,
            "take-explicit-closing",
            cut["topic"],
        ).format(at=at, topic=cut["topic"])
        return (
            f"{lead} {moment}",
            "explicit-verdict-language",
        )
    if lane == "closing":
        lead = stable_voice_choice(
            (
                "There is no tidy final verdict, so {topic} at {at} becomes the exit sign.",
                "The tape never sums itself up cleanly; its last useful stop is {topic} at {at}.",
                "Without one neat verdict, the route leaves us with {topic} at {at}.",
            ),
            voice_key,
            "take-fallback-closing",
            cut["topic"],
        ).format(topic=cut["topic"], at=at)
        return (
            f"{lead} {moment}",
            "late-evaluative-fallback",
        )
    lane_options = (
        (
            "Open the route at {at}, where {topic} takes the first swing.",
            "The short route starts with {topic} at {at}.",
            "Begin at {at}: {topic} sets the night's first marker.",
        )
        if lane == "opening"
        else (
            "The route changes direction at {at} with {topic}.",
            "{topic} owns the midpoint turn at {at}.",
            "At {at}, the watch path pivots toward {topic}.",
        )
    )
    if cut["topicBasis"] == "local-caption-match":
        lead = stable_voice_choice(
            lane_options,
            voice_key,
            f"take-{lane}",
            cut["topic"],
        ).format(at=at, topic=cut["topic"])
        return (
            f"{lead} {moment}",
            "topic-and-category-in-same-excerpt",
        )
    lead = stable_voice_choice(
        (
            "The route's {lane} stop lands on the movie at {at}.",
            "At {at}, the movie itself controls the {lane} turn.",
        ),
        voice_key,
        f"take-{lane}-fallback",
    ).format(lane=lane, at=at)
    return (
        f"{lead} {moment}",
        "category-in-excerpt-film-context-only",
    )


def build_episode_guide(
    seed: dict[str, Any], lines: list[dict[str, Any]], duration: int | float | None
) -> dict[str, Any] | None:
    """Build an evidence-backed episode spine without making speaker claims."""
    if not lines:
        return None
    end = max(float(duration or 0), lines[-1]["start"] + lines[-1]["duration"], 1)
    if end < 5700:
        chapter_target, cut_target, thread_target, runtime_band = 5, 13, 6, "FEATURE"
    elif end < 6600:
        chapter_target, cut_target, thread_target, runtime_band = 6, 15, 7, "EXTENDED"
    else:
        chapter_target, cut_target, thread_target, runtime_band = 7, 17, 8, "MARATHON"
    topics = topic_candidates(seed, lines, maximum=thread_target)
    cuts = guide_moment_candidates(
        seed,
        topics,
        lines,
        end,
        maximum=cut_target,
    )
    if len(cuts) < 6:
        return None

    chapters: list[dict[str, Any]] = []
    chapter_cut_ids: set[str] = set()
    for slot in range(chapter_target):
        start = end * slot / chapter_target
        stop = end * (slot + 1) / chapter_target
        candidates = [cut for cut in cuts if start <= cut["t"] < stop and cut["id"] not in chapter_cut_ids]
        if not candidates:
            candidates = [cut for cut in cuts if cut["id"] not in chapter_cut_ids]
        if not candidates:
            break
        cut = max(
            candidates,
            key=lambda item: (
                item.get("substance", 0) >= 8,
                item["topicBasis"] == "local-caption-match",
                item.get("substance", 0),
                item["score"],
                -abs(item["t"] - (start + stop) / 2),
            ),
        )
        chapter_cut_ids.add(cut["id"])
        body, evidence_basis = chapter_editorial_body(
            slot,
            chapter_target,
            cut,
            seed["film"],
            seed["id"],
        )
        chapters.append(
            {
                "id": f"act-{slot + 1:02d}",
                "act": slot + 1,
                "label": f"{cut['topic']} // {cut['category'].title()}",
                "at": cut["t"],
                "end": cut["end"],
                "body": body,
                "excerpt": cut["excerpt"],
                "category": cut["category"],
                "topic": cut["topic"],
                "cutId": cut["id"],
                "evidenceBasis": evidence_basis,
            }
        )

    # Fallback selection can borrow a cut outside its original runtime slot.
    # Re-sort after selection so an act-by-act guide never runs backward.
    chapters.sort(key=lambda chapter: chapter["at"])
    for chapter_index, chapter in enumerate(chapters):
        cut = next(cut for cut in cuts if cut["id"] == chapter["cutId"])
        body, evidence_basis = chapter_editorial_body(
            chapter_index,
            len(chapters),
            cut,
            seed["film"],
            seed["id"],
        )
        chapter.update(
            {
                "id": f"act-{chapter_index + 1:02d}",
                "act": chapter_index + 1,
                "body": body,
                "evidenceBasis": evidence_basis,
            }
        )

    take_arc: list[dict[str, Any]] = []
    phases = [
        ("opening", "OPENING READ", 0.00, 0.28),
        ("midpoint", "MIDPOINT TURN", 0.32, 0.70),
        ("closing", "", 0.82, 1.01),
    ]
    take_cut_ids: set[str] = set()
    for phase_index, (lane, fixed_phase, lower, upper) in enumerate(phases):
        candidates = [cut for cut in cuts if end * lower <= cut["t"] <= end * upper]
        if lane != "closing":
            unused = [
                cut for cut in candidates
                if cut["id"] not in chapter_cut_ids and cut["id"] not in take_cut_ids
            ]
            if unused:
                candidates = unused
        if not candidates:
            fallback_start = end * phase_index / 3
            fallback_stop = end * (phase_index + 1) / 3
            candidates = [cut for cut in cuts if fallback_start <= cut["t"] <= fallback_stop]
        if not candidates:
            continue
        if lane == "closing":
            # A late evaluative phrase is not useful if it belongs to another
            # movie or an outro plug. Remove explicit cross-film receipts, then
            # prefer a locally named subject whenever the window contains one.
            same_film_candidates = [
                item for item in candidates
                if not names_another_film(seed, item["excerpt"])
            ]
            if same_film_candidates:
                candidates = same_film_candidates
            else:
                clean_late_candidates = [
                    item for item in cuts
                    if item["t"] >= end * 0.70
                    and not names_another_film(seed, item["excerpt"])
                ]
                if clean_late_candidates:
                    candidates = clean_late_candidates
            local_candidates = [
                item for item in candidates
                if item["topicBasis"] == "local-caption-match"
            ]
            if local_candidates:
                candidates = local_candidates
            cut = max(
                candidates,
                key=lambda item: (
                    item.get("substance", 0) >= 8,
                    item.get("substance", 0),
                    item.get("verdictSignal", 0),
                    item["id"] not in chapter_cut_ids,
                    item["score"],
                    item["t"],
                ),
            )
        else:
            cut = max(
                candidates,
                key=lambda item: (
                    item.get("substance", 0) >= 8,
                    item["topicBasis"] == "local-caption-match",
                    item.get("substance", 0),
                    item["score"],
                    -item["t"],
                ),
            )
        take_cut_ids.add(cut["id"])
        # Caption cues can find a useful late-show take, but cannot prove a settled verdict.
        explicit_verdict = False
        phase = fixed_phase or "CLOSING READ"
        body, evidence_basis = take_editorial_body(
            lane,
            cut,
            seed["id"],
            explicit_verdict,
        )
        take_arc.append(
            {
                "phase": phase,
                "label": f"{cut['topic']} // {cut['category'].title()}",
                "at": cut["t"],
                "end": cut["end"],
                "body": body,
                "excerpt": cut["excerpt"],
                "category": cut["category"],
                "cutId": cut["id"],
                "evidenceBasis": evidence_basis,
            }
        )

    category_counts = Counter(cut["category"] for cut in cuts)
    praise = category_counts["LOVE LETTER"]
    negative = category_counts["FRANCHISE FELONY"]
    comedy = sum(category_counts[label] for label in ("OUT OF POCKET", "BREAKDOWN", "BIT ENERGY"))
    substantive = sum(1 for cut in cuts if cut.get("substance", 0) >= 8)
    strongest_pool = [
        cut
        for cut in cuts
        if cut["topicBasis"] == "local-caption-match"
        and cut.get("substance", 0) >= 8
        and (
            cut["category"] not in {"LOVE LETTER", "FRANCHISE FELONY"}
            or evidence_pair_distance(cut) <= 8
        )
    ]
    if not strongest_pool:
        strongest_pool = [
            cut for cut in cuts if cut["topicBasis"] == "local-caption-match"
        ] or cuts
    strongest = max(
        strongest_pool,
        key=lambda item: (
            item.get("substance", 0),
            item.get("topicSupport", 0),
            item["score"],
        ),
    )
    primary, secondary = topics[0], topics[1]
    side_names = [topic["name"] for topic in topics[2:4]]
    map_style = TOPIC_KIND_COPY.get(primary["kind"], "conversation-led")
    opening = take_arc[0]
    midpoint = take_arc[1]
    closing = take_arc[-1]
    if closing["phase"] == "FINAL VERDICT":
        closing_clause = (
            f"reaches explicit verdict language at {clock_label(closing['at'])} on "
            f"{closing['label']}"
        )
        fan_closing = stable_voice_choice(
            (
                "closes the case with {label} at {at}",
                "hands {label} the final ruling at {at}",
                "lets {label} deliver the verdict at {at}",
                "signs off on {label} at {at} with an actual verdict",
            ),
            seed["id"],
            "fan-closing-explicit",
        ).format(label=closing["label"], at=clock_label(closing["at"]))
    else:
        closing_clause = (
            f"ends on a bounded closing read at {clock_label(closing['at'])} on "
            f"{closing['label']}; no unsupported final verdict is invented"
        )
        fan_closing = stable_voice_choice(
            (
                "leaves through {label} at {at} without forcing a verdict",
                "uses {label} at {at} as its last honest read",
                "signs off with {label} at {at}, no fake verdict attached",
                "fades out on {label} at {at}",
            ),
            seed["id"],
            "fan-closing-fallback",
        ).format(label=closing["label"], at=clock_label(closing["at"]))
    if praise >= negative + 2:
        mix_clause = "The saved reaction ledger leans more defense than prosecution"
        tone_options = (
            "This watch is more love letter than hit job, although the knives still come out.",
            "Affection wins the scorecard, but the prosecution still gets a few loud objections.",
            "The tape mostly wants to defend the movie and only occasionally drags it into court.",
            "Love carries the night; the complaints hit hard because they are the exception.",
        )
    elif negative >= praise + 2:
        mix_clause = "The saved reaction ledger leans more prosecution than defense"
        tone_options = (
            "This one brings the knives: the prosecution wins more rounds than the defense.",
            "The watch spends more time building a case against the movie than rescuing it.",
            "Complaints drive the tape, with praise arriving as the hard-earned surprise.",
            "The movie stays on trial most of the night, and the defense has to fight for oxygen.",
        )
    elif comedy >= max(praise, negative):
        mix_clause = "Comedy is the strongest side engine around the editorial spine"
        tone_options = (
            "Movie talk keeps getting hijacked by callbacks, side quests, and beautifully unnecessary exits.",
            "The commentary tries to stay on the film; the comedy keeps stealing the steering wheel.",
            "This is a movie discussion with a trap door under nearly every serious point.",
            "The laughs are not garnish here. They keep rerouting the entire watch.",
        )
    else:
        mix_clause = "Praise and prosecution stay in productive tension"
        tone_options = (
            "The night keeps bouncing between genuine affection and a case for the prosecution.",
            "Love and aggravated complaint spend the whole tape trading control of the room.",
            "Neither the defense nor the prosecution owns this one for long.",
            "Every clean save seems to invite a new objection, which gives the watch its pulse.",
        )
    fan_tone = stable_voice_choice(
        tone_options,
        seed["id"],
        "episode-tone",
        praise,
        negative,
        comedy,
    )
    strongest_quote = quoted_fragment(strongest)
    overview_templates = (
        (
            "{film} spends the night orbiting {primary}, with {secondary} pulling nearly as hard "
            "and {sides} stalking the edges. {tone} For the short route, enter through "
            "{opening_label} at {opening_at}, pivot to {midpoint_label} at {midpoint_at}, and "
            "stay until the tape {closing_path}. The essential stop is {strongest_topic} at "
            "{strongest_at}; the source cut carries {strongest_quote}."
        ),
        (
            "On this {film} commentary, {primary} is the magnet and {secondary} is the counterweight; "
            "{sides} keep changing the shape of the conversation. {tone} The three-stop cut is "
            "{opening_label} at {opening_at}, {midpoint_label} at {midpoint_at}, then a finish "
            "that {closing_path}. But the single clip that best catches the night is "
            "{strongest_topic} at {strongest_at}, carrying {strongest_quote}."
        ),
        (
            "{film} plays less like a straight watch than a tug-of-war between {primary} and "
            "{secondary}, with {sides} repeatedly stealing oxygen. {tone} Start at "
            "{opening_at} for {opening_label}; make the middle jump at {midpoint_at} for "
            "{midpoint_label}; then follow the tape as it {closing_path}. The night's calling-card "
            "moment is {strongest_topic} at {strongest_at}, where the caption catches "
            "{strongest_quote}."
        ),
        (
            "The personality of this {film} watch lives in the triangle between {primary}, "
            "{secondary}, and {sides}. {tone} Its quickest guided run opens on {opening_label} at "
            "{opening_at}, breaks toward {midpoint_label} at {midpoint_at}, and {closing_path}. "
            "One stop rises above the route: {strongest_topic} at {strongest_at}, built around "
            "the exact line {strongest_quote}."
        ),
        (
            "Come to {film} for {primary}; stay for the way {secondary}, {sides}, and the room's "
            "mood keep fighting for the next turn. {tone} The clean route begins with "
            "{opening_label} at {opening_at}, swerves into {midpoint_label} at {midpoint_at}, and "
            "{closing_path}. If there is one stop to play cold, make it {strongest_topic} at "
            "{strongest_at}: {strongest_quote}."
        ),
        (
            "This version of {film} keeps returning to {primary}, but {secondary} supplies the "
            "friction and {sides} keep opening new doors. {tone} Use {opening_label} at "
            "{opening_at} as the entrance, {midpoint_label} at {midpoint_at} as the hard turn, "
            "and the closing path that {closing_path}. The sharpest snapshot arrives on "
            "{strongest_topic} at {strongest_at}, with {strongest_quote} sitting inside the cut."
        ),
    )
    overview = stable_voice_choice(
        overview_templates,
        seed["id"],
        "episode-overview",
    ).format(
        film=seed["film"],
        primary=primary["name"],
        secondary=secondary["name"],
        sides=natural_list(side_names),
        tone=fan_tone,
        opening_label=opening["label"],
        opening_at=clock_label(opening["at"]),
        midpoint_label=midpoint["label"],
        midpoint_at=clock_label(midpoint["at"]),
        closing_path=fan_closing,
        strongest_topic=strongest["topic"],
        strongest_at=clock_label(strongest["t"]),
        strongest_quote=strongest_quote,
    )
    evidence_summary = (
        f"{seed['film']} gets a {map_style} evidence map: {primary['name']} leads with "
        f"{primary['mentions']} spaced caption matches and a dense cluster near "
        f"{clock_label(primary['peak'])}, while {secondary['name']} supplies "
        f"{secondary['mentions']} matches. {natural_list(side_names)} form the next two "
        f"recurring lanes. The three-stop path opens at {clock_label(opening['at'])} on "
        f"{opening['label']}, pivots at {clock_label(midpoint['at'])} on {midpoint['label']}, "
        f"and {closing_clause}. {mix_clause}: the {len(cuts)}-cut ledger contains {substantive} "
        f"explicit evaluative or craft reads, {praise} praise spike{'s' if praise != 1 else ''}, "
        f"{negative} hard negative turn{'s' if negative != 1 else ''}, and {comedy} comedy or "
        f"out-of-pocket turn{'s' if comedy != 1 else ''}. The strongest analysis-weighted "
        f"receipt lands at {clock_label(strongest['t'])} around {strongest['topic']}."
    )
    cut_by_id = {cut["id"]: cut for cut in cuts}

    def fan_receipt(
        key: str,
        label: str,
        cut: dict[str, Any] | None,
        body: str,
    ) -> dict[str, Any] | None:
        if not cut:
            return None
        return {
            "key": key,
            "label": label,
            "body": body,
            "at": cut["t"],
            "end": cut["end"],
            "cutId": cut["id"],
            "category": cut["category"],
            "topic": cut["topic"],
            "excerpt": cut["excerpt"],
            "evidenceBasis": cut["evidenceBasis"],
        }

    strongest_love = max(
        (cut for cut in cuts if cut["category"] == "LOVE LETTER"),
        key=lambda item: (item["score"], item.get("substance", 0)),
        default=None,
    )
    strongest_hate = max(
        (cut for cut in cuts if cut["category"] == "FRANCHISE FELONY"),
        key=lambda item: (item["score"], item.get("substance", 0)),
        default=None,
    )
    wildest = max(
        (
            cut
            for cut in cuts
            if cut["category"] in {"OUT OF POCKET", "BREAKDOWN", "BIT ENERGY"}
        ),
        key=lambda item: (item["score"], item.get("substance", 0)),
        default=strongest,
    )
    closing_cut = cut_by_id.get(closing["cutId"], strongest)
    why_templates = (
        (
            "{film} matters here because the tape cannot leave {primary} alone; {secondary} "
            "keeps tugging it in another direction. The must-play {category} turn lands on "
            "{topic} at {at}, with {quote} as its fingerprint. The four cards below trace what "
            "the night loved, buried, derailed into, and left behind."
        ),
        (
            "This night's fingerprint is the friction between {primary} and {secondary}. "
            "Its defining stop is {topic} at {at}, where {quote} pushes the tape into "
            "{category} territory. From there, the quick path splits into the defense, "
            "Steve's Asshole, the wildest detour, and the last word."
        ),
        (
            "Why keep this {film} commentary in the vault? {primary} supplies the obsession, "
            "{secondary} supplies the counterweight, and {topic} at {at} supplies the clip to "
            "play first. The exact cut carries {quote}. Everything below maps the love, the "
            "complaint, the derailment, and the way out."
        ),
        (
            "The reason this {film} night sticks is not one generic verdict. It is the route "
            "from {primary} to {secondary}, crowned by a {category} stop on {topic} at {at}. "
            "Its source language is {quote}. Use the four cuts below as the night's fast, loud "
            "memory path."
        ),
        (
            "{primary} sets the obsession; the pressure lands in {secondary}, but the clip "
            "that bottles this {film} watch arrives on {topic} at {at}. {quote} is the line "
            "inside that {category} turn. The cards below separate the save, the burial, the "
            "side quest, and the final taste."
        ),
    )
    why_body = stable_voice_choice(
        why_templates,
        seed["id"],
        "fan-read-why",
    ).format(
        film=seed["film"],
        primary=primary["name"],
        secondary=secondary["name"],
        category=strongest["category"].title(),
        topic=strongest["topic"],
        at=clock_label(strongest["t"]),
        quote=quoted_fragment(strongest),
    )

    fan_card_templates = {
        "loved": (
            "At {at}, {topic} gets the night's biggest save. The turn lives in {quote}.",
            "{topic} wins the defense table at {at}, powered by {quote}.",
            "The warmest cut belongs to {topic} at {at}; {quote} is the valentine.",
            "The tape plants its flag for {topic} at {at}. The love is right there in {quote}.",
            "For the cleanest defense of the night, play {topic} at {at} and listen for {quote}.",
        ),
        "hated": (
            "{topic} gets launched straight to Steve's Asshole at {at}; {quote} is the shove.",
            "The night's sharpest burial hits {topic} at {at}, and it comes armed with {quote}.",
            "At {at}, the prosecution closes in on {topic}. The loaded phrase is {quote}.",
            "Steve's Asshole opens for {topic} at {at}; the source cut does the damage with {quote}.",
            "The complaint peaks on {topic} at {at}, where {quote} takes off the gloves.",
        ),
        "wildestDetour": (
            "At {at}, {topic} sends the watch through a side wall. The trigger is {quote}.",
            "The night's strangest exit ramp appears around {topic} at {at}: {quote}.",
            "{topic} owns the hard left turn at {at}, with {quote} steering the wreck.",
            "The movie briefly loses custody of the commentary at {at}; {topic} and {quote} take over.",
            "For the derailment, jump to {topic} at {at}. It starts with {quote}.",
        ),
        "lastWord": (
            "The file exits on {topic} at {at}, leaving {quote} in the doorway.",
            "{topic} carries the last useful read at {at}; the tape leaves us with {quote}.",
            "The closing taste arrives on {topic} at {at}, built around {quote}.",
            "At {at}, {topic} gets the final playable word. The line inside it is {quote}.",
            "The route signs off with {topic} at {at} and the source phrase {quote}.",
        ),
    }

    def fan_card_body(kind: str, cut: dict[str, Any] | None) -> str:
        if not cut:
            return ""
        template = stable_voice_choice(
            fan_card_templates[kind],
            seed["id"],
            "fan-card",
            kind,
            cut["id"],
        )
        return template.format(
            topic=cut["topic"],
            at=clock_label(cut["t"]),
            quote=quoted_fragment(cut),
        )

    fan_read = {
        "whyThisNightMatters": {
            "label": "WHY THIS NIGHT MATTERS",
            "body": why_body,
            "primaryThread": primary["name"],
            "secondaryThread": secondary["name"],
            "strongestCutId": strongest["id"],
        },
        "loved": fan_receipt(
            "loved",
            "WHAT THE TAPE DEFENDED",
            strongest_love,
            fan_card_body("loved", strongest_love),
        ),
        "hated": fan_receipt(
            "hated",
            "STRAIGHT TO STEVE'S ASSHOLE",
            strongest_hate,
            fan_card_body("hated", strongest_hate),
        ),
        "wildestDetour": fan_receipt(
            "wildestDetour",
            "WILDEST DETOUR",
            wildest,
            fan_card_body("wildestDetour", wildest),
        ),
        "lastWord": fan_receipt(
            "lastWord",
            "THE LAST WORD",
            closing_cut,
            fan_card_body("lastWord", closing_cut),
        ),
    }
    return {
        "schema": "wwam-episode-guide/v2",
        "basis": "full-caption runtime mapping with every public cut label supported inside its displayed excerpt; speaker identity and audio origin remain unverified",
        "overview": overview,
        "evidenceSummary": evidence_summary,
        "shape": {
            "runtimeBand": runtime_band,
            "chapters": len(chapters),
            "threads": len(topics),
            "cuts": len(cuts),
        },
        "fanRead": fan_read,
        "chapters": chapters,
        "takeArc": take_arc,
        "threads": topics,
        "cuts": cuts,
        "metrics": {
            "chapters": len(chapters),
            "threads": len(topics),
            "cuts": len(cuts),
            "praise": praise,
            "negative": negative,
            "comedy": comedy,
            "substantive": substantive,
        },
    }

def classify(text: str) -> tuple[str, float, dict[str, int]]:
    lower = text.lower()
    hits: dict[str, int] = {}
    weighted: dict[str, float] = {}
    for category, rule in CATEGORY_RULES.items():
        count = sum(len(re.findall(pattern, lower, re.I)) for pattern in rule["terms"])
        hits[category] = count
        weighted[category] = count * rule["weight"]
    category = max(weighted, key=weighted.get)
    raw = weighted[category] + sum(hits.values()) * 1.6
    punctuation = min(text.count("!") * 1.7 + text.count("?") * 0.8, 7)
    return category, raw + punctuation, hits


def moment_candidates(lines: list[dict[str, Any]]) -> list[dict[str, Any]]:
    candidates: list[dict[str, Any]] = []
    for index, line in enumerate(lines):
        group = [line]
        for nxt in lines[index + 1 : index + 4]:
            if nxt["start"] - group[-1]["start"] > 8:
                break
            group.append(nxt)
            if len(" ".join(item["text"] for item in group).split()) >= 18:
                break
        text = clean_text(" ".join(item["text"] for item in group))
        if len(text.split()) < 5 or DISALLOWED_EXCERPT.search(text):
            continue
        category, raw_score, hits = classify(text)
        if raw_score < 5:
            continue
        candidates.append(
            {
                "t": round(line["start"]),
                "quote": excerpt_words(text),
                "category": category,
                "raw": raw_score,
                "hits": hits,
            }
        )

    candidates.sort(key=lambda item: (-item["raw"], item["t"]))
    chosen: list[dict[str, Any]] = []
    fingerprints: set[str] = set()
    category_counts: Counter[str] = Counter()
    for candidate in candidates:
        fingerprint = " ".join(re.findall(r"[a-z']+", candidate["quote"].lower()))[:80]
        if any(abs(candidate["t"] - item["t"]) < 40 for item in chosen):
            continue
        if fingerprint in fingerprints:
            continue
        if category_counts[candidate["category"]] >= 3:
            continue
        fingerprints.add(fingerprint)
        category_counts[candidate["category"]] += 1
        chosen.append(candidate)
        if len(chosen) >= 8:
            break
    return chosen


def tone_arc(lines: list[dict[str, Any]], duration: int | float | None) -> list[dict[str, Any]]:
    if not lines:
        return []
    end = max(float(duration or 0), lines[-1]["start"] + lines[-1]["duration"], 1)
    bins = [{"heat": 0.0, "categories": Counter()} for _ in range(8)]
    for line in lines:
        category, raw, hits = classify(line["text"])
        slot = min(7, int((line["start"] / end) * 8))
        if raw:
            bins[slot]["heat"] += raw
            bins[slot]["categories"][category] += sum(hits.values())
    heats = [bucket["heat"] for bucket in bins]
    peak = max(heats) or 1
    output = []
    for index, bucket in enumerate(bins):
        dominant = bucket["categories"].most_common(1)
        output.append(
            {
                "chapter": index + 1,
                "heat": round(18 + 82 * (bucket["heat"] / peak)),
                "dominant": dominant[0][0] if dominant and dominant[0][1] else "DEAD AIR",
            }
        )
    return output


def verdict(metrics: dict[str, int], moments: list[dict[str, Any]]) -> str:
    hottest = moments[0]["category"] if moments else "ARCHIVE STATIC"
    roast = metrics.get("FRANCHISE FELONY", 0)
    love = metrics.get("LOVE LETTER", 0)
    profane = metrics.get("OUT OF POCKET", 0)
    if roast > love * 1.35:
        posture = "a hostile intervention disguised as a watchalong"
    elif love > roast * 1.35:
        posture = "a love letter that keeps a weapon under the table"
    else:
        posture = "an argument between affection and aggravated franchise assault"
    if profane > 80:
        voltage = "The profanity fuse does not survive the runtime."
    elif profane > 35:
        voltage = "The language earns the red-band wrapper."
    else:
        voltage = "The knives are mostly rhetorical, but they are sharpened."
    return f"This tape plays like {posture}. Its strongest evidence cluster is {hottest.lower()}. {voltage}"


def build_tape(seed: dict[str, Any], info: dict[str, Any], lines: list[dict[str, Any]]) -> tuple[dict[str, Any], dict[str, Any]]:
    upload_date = info.get("upload_date")
    date = f"{upload_date[:4]}-{upload_date[4:6]}-{upload_date[6:]}" if upload_date else seed.get("date")
    duration = info.get("duration") or seed.get("duration")
    metrics: Counter[str] = Counter()
    word_count = 0
    for line in lines:
        word_count += len(line["text"].split())
        _, _, hits = classify(line["text"])
        metrics.update(hits)
    moments = moment_candidates(lines)
    for moment in moments:
        moment["score"] = min(99, round(41 + moment.pop("raw") * 2.35))
        moment.pop("hits", None)
        moment["id"] = f"{seed['id']}-{moment['t']}"
    metric_total = sum(metrics.values()) or 1
    unhinged = min(
        99,
        round(
            24
            + metrics["OUT OF POCKET"] * 0.34
            + metrics["FRANCHISE FELONY"] * 0.31
            + metrics["BREAKDOWN"] * 0.24
            + math.log(metric_total + 1, 2) * 3.2
        ),
    )
    episode_guide = build_episode_guide(seed, lines, duration)
    distill = {
        "id": seed["id"],
        "wordsAudited": word_count,
        "captionMinutes": round((lines[-1]["start"] / 60) if lines else 0),
        "unhinged": unhinged,
        "verdict": verdict(dict(metrics), moments),
        "metrics": dict(metrics),
        "arc": tone_arc(lines, duration),
        "moments": moments,
        "episodeGuide": episode_guide,
    }
    catalog_item = {
        "id": seed["id"],
        "franchise": seed["franchise"],
        "film": seed["film"],
        "order": seed["order"],
        "title": info.get("title") or seed.get("title") or seed["film"],
        "date": date,
        "duration": duration,
        "views": info.get("view_count") or seed.get("views"),
        "thumbnail": (
            f"https://i.ytimg.com/vi/{seed['id']}/maxresdefault.jpg"
            if info.get("title")
            else seed.get("thumbnail")
        ),
        "transcript": bool(lines),
        "url": seed["url"],
    }
    age_limit = info.get("age_limit")
    if age_limit is None:
        age_limit = seed.get("ageLimit")
    availability = info.get("availability") or seed.get("availability")
    live_status = info.get("live_status") or seed.get("liveStatus")
    metadata_observed_at = info.get("observed_at") or seed.get("viewsObservedAt")
    if age_limit is not None:
        catalog_item["ageLimit"] = age_limit
    if availability:
        catalog_item["availability"] = availability
    if live_status:
        catalog_item["liveStatus"] = live_status
    if metadata_observed_at:
        catalog_item["viewsObservedAt"] = metadata_observed_at
    return catalog_item, distill


def normalize_hot100(tapes: list[dict[str, Any]]) -> list[dict[str, Any]]:
    pool = []
    for tape in tapes:
        for moment in tape["moments"]:
            pool.append({**moment, "tapeId": tape["id"]})
    pool.sort(key=lambda item: (-item["score"], item["tapeId"], item["t"]))
    per_tape: Counter[str] = Counter()
    category_counts: Counter[str] = Counter()
    hot = []
    for item in pool:
        if per_tape[item["tapeId"]] >= 4:
            continue
        if category_counts[item["category"]] >= 24:
            continue
        per_tape[item["tapeId"]] += 1
        category_counts[item["category"]] += 1
        hot.append(item)
        if len(hot) >= 100:
            break
    for rank, item in enumerate(hot, 1):
        item["rank"] = rank
    return hot


def js_assignment(name: str, payload: Any) -> str:
    return f"window.{name} = {json.dumps(payload, ensure_ascii=False, separators=(',', ':'))};\n"


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--refresh", action="store_true", help="Ignore local metadata/caption cache.")
    parser.add_argument("--workers", type=int, default=4)
    parser.add_argument(
        "--deep-only",
        action="store_true",
        help="Rebuild deep-distill.js from cache without rewriting catalog.js.",
    )
    parser.add_argument(
        "--observed-at",
        help="Timezone-aware ISO-8601 build observation time; defaults to the local runtime.",
    )
    args = parser.parse_args()
    observed_at = resolve_observed_at(args.observed_at)

    seeds = canon()
    print(f"Auditing {len(seeds)} bounded-canon watchalongs…", flush=True)
    extracted: dict[str, tuple[dict[str, Any], list[dict[str, Any]]]] = {}
    with concurrent.futures.ThreadPoolExecutor(max_workers=max(1, args.workers)) as pool:
        futures = {
            pool.submit(
                extract_one,
                seed,
                args.refresh,
                observed_at=observed_at,
                cache_only=args.deep_only,
            ): seed
            for seed in seeds
        }
        for future in concurrent.futures.as_completed(futures):
            seed = futures[future]
            try:
                extracted[seed["id"]] = future.result()
                info, lines = extracted[seed["id"]]
                print(f"  {seed['id']}  {len(lines):5d} caption events  {info.get('title')}", flush=True)
            except Exception as error:
                print(f"  {seed['id']}  ERROR {error}", file=sys.stderr, flush=True)
                extracted[seed["id"]] = ({}, [])

    catalog = []
    tapes = []
    for seed in seeds:
        info, lines = extracted[seed["id"]]
        catalog_item, tape = build_tape(seed, info, lines)
        catalog.append(catalog_item)
        tapes.append(tape)

    hot100 = normalize_hot100(tapes)
    total_words = sum(tape["wordsAudited"] for tape in tapes)
    total_caption_minutes = sum(tape["captionMinutes"] for tape in tapes)
    franchise_counts = Counter(item["franchise"] for item in catalog)
    scores = [tape["unhinged"] for tape in tapes if tape["wordsAudited"]]
    deep = {
        "generated": observed_date(observed_at),
        "observedAt": observed_at,
        "provenance": {
            "generator": "pipeline/wwam_deep_distill.py",
            "observedAt": observed_at,
            "sourceFingerprint": fingerprint_ids(seeds),
            "sourceCount": len(seeds),
        },
        "method": "Full available YouTube auto-caption pass; legacy Hot 100 excerpts remain stable while Episode Guide V2 adds recurring-subject concentration, runtime-sized chapters, a three-stage take arc, fan-first synthesis, and a playable cut index.",
        "scope": "Four bounded watchalong paths only. Reviews, news streams, and non-commentary uploads are excluded.",
        "meta": {
            "tapes": len(catalog),
            "captioned": sum(1 for item in catalog if item["transcript"]),
            "wordsAudited": total_words,
            "captionHours": round(total_caption_minutes / 60),
            "franchises": len(franchise_counts),
            "hotMoments": len(hot100),
            "medianUnhinged": round(statistics.median(scores)) if scores else 0,
            "episodeGuides": sum(1 for tape in tapes if tape.get("episodeGuide")),
            "guideChapters": sum(len((tape.get("episodeGuide") or {}).get("chapters", [])) for tape in tapes),
            "guideCuts": sum(len((tape.get("episodeGuide") or {}).get("cuts", [])) for tape in tapes),
        },
        "franchises": [
            {
                "name": name,
                **FRANCHISE_META[name],
                "tapes": franchise_counts[name],
                "wordsAudited": sum(
                    tape["wordsAudited"]
                    for tape in tapes
                    if next(item for item in catalog if item["id"] == tape["id"])["franchise"] == name
                ),
                "avgUnhinged": round(
                    statistics.mean(
                        tape["unhinged"]
                        for tape in tapes
                        if next(item for item in catalog if item["id"] == tape["id"])["franchise"] == name
                    )
                ),
            }
            for name in FRANCHISE_META
        ],
        "tapes": tapes,
        "hot100": hot100,
    }

    guide_records = [
        {"id": tape["id"], "episodeGuide": tape["episodeGuide"]}
        for tape in tapes
        if tape.get("episodeGuide")
    ]
    episode_guides = {
        "schema": "wwam-episode-guides/v2",
        "generated": observed_date(observed_at),
        "observedAt": observed_at,
        "provenance": deep["provenance"],
        "meta": {
            "guides": len(guide_records),
            "chapters": sum(len(record["episodeGuide"]["chapters"]) for record in guide_records),
            "cuts": sum(len(record["episodeGuide"]["cuts"]) for record in guide_records),
        },
        "guides": guide_records,
    }
    # The episode dossiers are demand-loaded only when someone opens a Show
    # Wiki. The homepage keeps the legacy tape/Hot 100 payload lightweight.
    deep["tapes"] = [
        {key: value for key, value in tape.items() if key != "episodeGuide"}
        for tape in tapes
    ]

    PUBLIC.mkdir(parents=True, exist_ok=True)
    if not args.deep_only:
        (PUBLIC / "catalog.js").write_text(js_assignment("WWAM_CATALOG", catalog), encoding="utf-8")
    (PUBLIC / "deep-distill.js").write_text(js_assignment("WWAM_DEEP_DISTILL", deep), encoding="utf-8")
    (PUBLIC / "episode-guides.js").write_text(
        js_assignment("WWAM_EPISODE_GUIDES", episode_guides),
        encoding="utf-8",
    )
    report = {
        "catalog": len(catalog),
        "captioned": deep["meta"]["captioned"],
        "words": total_words,
        "hours": deep["meta"]["captionHours"],
        "hot100": len(hot100),
    }
    print(json.dumps(report, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
