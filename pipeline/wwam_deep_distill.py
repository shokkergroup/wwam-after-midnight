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
    ("Direction and camera", "craft", ["director", "directed", "camera", "camera shot", "this shot", "that shot", "shot of", "lighting", "cinematography"]),
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


def excerpt_around_terms(text: str, terms: list[str], limit: int = 23) -> str:
    """Clip around the named subject instead of an unrelated loud word."""
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
    (r"\b(?:works?|doesn['’]?t work|didn['’]?t work|effective|ineffective)\b", 8),
    (r"\b(?:should have|should've|could have|could've|would have|would've)\b", 8),
    (r"\b(?:best|worst|favorite|rank|ranking|better than|worse than)\b", 8),
    (r"\b(?:point is|problem is|what i like|what i hate|what makes|the thing about)\b", 10),
    (r"\b(?:this|that|it) (?:is|was|'s) (?:great|good|bad|terrible|awful|amazing|perfect|stupid|dumb|effective)\b", 8),
]
SEMANTIC_CRAFT_RULE = re.compile(
    r"\b(?:writing|script|dialogue|character|performance|acting|camera|shot|lighting|"
    r"score|soundtrack|ending|reveal|direction|edit|editing|scene)\b",
    re.I,
)
SEMANTIC_REASON_RULE = re.compile(
    r"\b(?:because|the reason|which is why|that is why|that's why|so that)\b",
    re.I,
)


def semantic_take_score(text: str) -> int:
    """Reward an actual stance or craft explanation, never profanity by itself."""
    stance = sum(weight for pattern, weight in SEMANTIC_STANCE_RULES if re.search(pattern, text, re.I))
    craft = 4 if SEMANTIC_CRAFT_RULE.search(text) else 0
    if stance == 0 and craft == 0:
        return 0
    score = stance + craft
    if SEMANTIC_REASON_RULE.search(text):
        score += 6
    if len(text.split()) >= 20:
        score += 1
    if re.search(r"\b(?:oh my god|jesus christ|come on)\b", text, re.I) and stance == 0:
        score = max(0, score - 2)
    return min(score, 32)

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

def guide_moment_candidates(
    lines: list[dict[str, Any]], duration: int | float | None, maximum: int = 16
) -> list[dict[str, Any]]:
    """Find a diverse, runtime-spanning cut index with analysis ahead of raw volume."""
    if not lines:
        return []
    end = max(float(duration or 0), lines[-1]["start"] + lines[-1]["duration"], 1)
    pool: list[dict[str, Any]] = []
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
        category, raw_score, hits = guide_classify(body)
        substance = semantic_take_score(body)
        if raw_score < 6 and substance < 8:
            continue
        if substance >= 8 and category in {
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
        elif sum(hits.values()) == 0:
            category = "FILM READ"
        rank = raw_score + substance * 1.35
        pool.append(
            {
                "t": round(line["start"]),
                "end": round(min(end, line["start"] + 36)),
                "category": category,
                "excerpt": excerpt_words(body, 23),
                "rank": rank,
                "substance": substance,
                "slot": min(5, int(line["start"] / end * 6)),
            }
        )

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

    # Guarantee one strong, preferably substantive stop in every sixth.
    for slot in range(6):
        candidates = [item for item in pool if item["slot"] == slot and eligible(item, 35)]
        candidate = max(
            candidates,
            key=lambda item: (item["substance"] >= 8, item["rank"], item["substance"], -item["t"]),
            default=None,
        )
        if candidate:
            chosen.append(candidate)
            fingerprints.add(" ".join(re.findall(r"[a-z']+", candidate["excerpt"].lower()))[:90])
            category_counts[candidate["category"]] += 1
    # Preserve the WWAM mix: analysis is the spine, while a deep dive still
    # needs comedy, callbacks, theories, and kill-room reactions when present.
    for category in ("OUT OF POCKET", "BREAKDOWN", "BIT ENERGY", "THEORY BOARD", "KILL ROOM"):
        if len(chosen) >= maximum or category_counts[category]:
            continue
        candidate = next(
            (item for item in pool if item["category"] == category and eligible(item, 35)),
            None,
        )
        if candidate:
            chosen.append(candidate)
            fingerprints.add(" ".join(re.findall(r"[a-z']+", candidate["excerpt"].lower()))[:90])
            category_counts[candidate["category"]] += 1
    for candidate in pool:
        if len(chosen) >= maximum:
            break
        if not eligible(candidate, 45):
            continue
        chosen.append(candidate)
        fingerprints.add(" ".join(re.findall(r"[a-z']+", candidate["excerpt"].lower()))[:90])
        category_counts[candidate["category"]] += 1

    for index, candidate in enumerate(sorted(chosen, key=lambda item: item["t"])):
        candidate.pop("slot", None)
        candidate["score"] = min(99, round(35 + candidate.pop("rank") * 1.8))
        candidate["id"] = f"guide-cut-{index + 1:02d}-{candidate['t']}"
    return sorted(chosen, key=lambda item: item["t"])

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


def alias_occurrences(text: str, alias: str) -> int:
    normalized = lexical(alias)
    if not normalized:
        return 0
    body = lexical(text)
    if " " in normalized:
        return (" " + body + " ").count(" " + normalized + " ")
    suffix = r"\w*" if len(normalized) >= 5 else ""
    return len(re.findall(r"\b" + re.escape(normalized) + suffix + r"\b", body))


def local_topic_for_cut(
    seed: dict[str, Any],
    topics: list[dict[str, Any]],
    lines: list[dict[str, Any]],
    at: int | float,
) -> tuple[dict[str, Any] | None, int]:
    """Bind a topic only when the local caption window actually names it."""
    if not topics:
        return None, 0
    body = clean_text(
        " ".join(
            line["text"]
            for line in lines
            if float(at) - 18 <= line["start"] <= float(at) + 42
        )
    )
    selected = {topic["name"]: topic for topic in topics}
    choices: list[tuple[float, int, dict[str, Any]]] = []
    for name, kind, aliases in topic_rules_for_seed(seed):
        topic = selected.get(name)
        if not topic:
            continue
        hits = sum(alias_occurrences(body, alias) for alias in aliases)
        if hits <= 0:
            continue
        specificity = max((len(lexical(alias).split()) for alias in aliases), default=1)
        kind_bonus = 5 if kind in {"character", "place", "performance"} else 0
        local_score = hits * 100 + specificity * 12 + kind_bonus + topic["score"] * 0.02
        choices.append((local_score, hits, topic))
    if not choices:
        return None, 0
    _, hits, topic = max(choices, key=lambda item: (item[0], item[1], item[2]["name"]))
    return topic, hits


def build_episode_guide(
    seed: dict[str, Any], lines: list[dict[str, Any]], duration: int | float | None
) -> dict[str, Any] | None:
    """Build an evidence-backed episode spine without making speaker claims."""
    if not lines:
        return None
    end = max(float(duration or 0), lines[-1]["start"] + lines[-1]["duration"], 1)
    topics = topic_candidates(seed, lines)
    cuts = guide_moment_candidates(lines, end)
    if len(cuts) < 6:
        return None
    for cut in cuts:
        topic, support = local_topic_for_cut(seed, topics, lines, cut["t"])
        cut["topic"] = topic["name"] if topic else seed["film"]
        cut["topicBasis"] = "local-caption-match" if topic else "film-context-fallback"
        cut["topicSupport"] = support
        cut["label"] = CATEGORY_COPY.get(cut["category"], cut["category"].lower())

    chapters: list[dict[str, Any]] = []
    chapter_cut_ids: set[str] = set()
    for slot in range(6):
        start = end * slot / 6
        stop = end * (slot + 1) / 6
        candidates = [cut for cut in cuts if start <= cut["t"] < stop and cut["id"] not in chapter_cut_ids]
        if not candidates:
            candidates = [cut for cut in cuts if cut["id"] not in chapter_cut_ids]
        if not candidates:
            break
        cut = max(
            candidates,
            key=lambda item: (item.get("substance", 0), item["score"], -abs(item["t"] - (start + stop) / 2)),
        )
        chapter_cut_ids.add(cut["id"])
        subject = cut["topic"]
        if cut["topicBasis"] == "local-caption-match":
            body = (
                f"{subject} is explicitly present in this stretch. "
                f"At {clock_label(cut['t'])}, the saved cut registers {cut['label']}."
            )
        else:
            body = (
                f"The clearest saved turn in this stretch lands at {clock_label(cut['t'])}: "
                f"{cut['label']} during the {seed['film']} commentary."
            )
        chapters.append(
            {
                "id": f"act-{slot + 1:02d}",
                "act": slot + 1,
                "label": f"{subject} // {cut['category'].title()}",
                "at": cut["t"],
                "end": cut["end"],
                "body": body,
                "excerpt": cut["excerpt"],
                "category": cut["category"],
                "topic": subject,
                "cutId": cut["id"],
            }
        )

    take_arc: list[dict[str, Any]] = []
    phases = [
        ("OPENING READ", 0.00, 0.28),
        ("MIDPOINT TURN", 0.32, 0.70),
        ("LATE VERDICT", 0.82, 1.01),
    ]
    take_cut_ids: set[str] = set()
    for phase_index, (phase, lower, upper) in enumerate(phases):
        candidates = [cut for cut in cuts if end * lower <= cut["t"] <= end * upper]
        unused = [cut for cut in candidates if cut["id"] not in chapter_cut_ids and cut["id"] not in take_cut_ids]
        if unused:
            candidates = unused
        if not candidates:
            fallback_start = end * phase_index / 3
            fallback_stop = end * (phase_index + 1) / 3
            candidates = [cut for cut in cuts if fallback_start <= cut["t"] <= fallback_stop]
        if not candidates:
            continue
        cut = max(
            candidates,
            key=lambda item: (
                item.get("substance", 0) >= 8,
                item.get("substance", 0),
                item["score"],
                item["t"] if phase == "LATE VERDICT" else -item["t"],
            ),
        )
        take_cut_ids.add(cut["id"])
        take_arc.append(
            {
                "phase": phase,
                "label": f"{cut['topic']} // {cut['category'].title()}",
                "at": cut["t"],
                "end": cut["end"],
                "body": (
                    f"The {phase.lower()} lands at {clock_label(cut['t'])}: "
                    f"{cut['label']} centered on {cut['topic']}."
                ),
                "excerpt": cut["excerpt"],
                "category": cut["category"],
                "cutId": cut["id"],
            }
        )

    category_counts = Counter(cut["category"] for cut in cuts)
    top_names = [topic["name"] for topic in topics[:4]]
    strongest = max(cuts, key=lambda item: (item.get("substance", 0), item["score"]))
    praise = category_counts["LOVE LETTER"]
    negative = category_counts["FRANCHISE FELONY"]
    comedy = sum(category_counts[label] for label in ("OUT OF POCKET", "BREAKDOWN", "BIT ENERGY"))
    substantive = sum(1 for cut in cuts if cut.get("substance", 0) >= 8)
    opening = take_arc[0] if take_arc else None
    late = take_arc[-1] if take_arc else None
    movement = ""
    if opening and late:
        movement = (
            f" The mapped take moves from {opening['label']} at {clock_label(opening['at'])} "
            f"to {late['label']} at {clock_label(late['at'])}."
        )
    overview = (
        f"In {seed['film']}, {natural_list(top_names)} anchor the recurring conversation.{movement} "
        f"Across {clock_label(end)}, sixteen playable cuts preserve {substantive} explicit takes or craft reads, "
        f"alongside {praise} praise spike{'s' if praise != 1 else ''}, {negative} hard negative turn{'s' if negative != 1 else ''}, "
        f"and {comedy} comedy or out-of-pocket turn{'s' if comedy != 1 else ''}. "
        f"The strongest analysis-weighted cut lands at {clock_label(strongest['t'])}: {strongest['label']} centered on {strongest['topic']}."
    )
    return {
        "schema": "wwam-episode-guide/v2",
        "basis": "full-caption local-topic binding plus analysis-weighted runtime-spanning candidates; speaker identity and audio origin remain unverified",
        "overview": overview,
        "chapters": chapters,
        "takeArc": take_arc,
        "threads": topics[:8],
        "cuts": cuts,
        "metrics": {
            "chapters": len(chapters),
            "threads": len(topics[:8]),
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
        "method": "Full available YouTube auto-caption pass; legacy Hot 100 excerpts remain stable while Episode Guide V2 adds recurring-subject concentration, six runtime acts, a three-stage take arc, and a sixteen-cut playable index.",
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
