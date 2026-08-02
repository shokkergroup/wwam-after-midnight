"""Run the bounded audio viewing pass across every WWAM watchalong dossier.

This is an evidence pass, not a claim that a model visually watched a video.
For each publicly acquirable canonical audio track it decodes one-second audio
features, aligns caption events, and surfaces a runtime-scaled set of ranked
candidate receipts. The official upload remains the authority at every link.
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

from run_wwam_audio_watch_pass import AUDIO_DIR, DEMO_DIR, candidate_rows, caption_events, category_counts, provenance, stream_features


ROOT = Path(__file__).resolve().parents[1]
WATCHALONG_FILE = DEMO_DIR / "wwam-watchalong-canon.js"
KNOWN_FORMATS = {"vN0kpXks-Lk": "140"}
KNOWN_ALTERNATES = {
    "AzrcgoyE7C4": {
        "url": "https://podcasters.spotify.com/pod/show/wewatchedamovie/episodes/Rob-Zombies-H2-Commentary-ehti0c",
        "label": "OFFICIAL WWAM PODCAST VARIANT // NON-ISOMORPHIC TIMELINE",
        "provenanceFile": "source-cache/audio-alternates/AzrcgoyE7C4/provenance.json",
        "note": "The canonical YouTube upload is age-restricted for unauthenticated acquisition. An official WWAM podcast variant exists, but its 105.61-second duration drift has not been timeline-aligned; no YouTube timestamp receipts are manufactured.",
    }
}

ALTERNATE_AUDIO_FILES = {
    "AzrcgoyE7C4": {
        "file": ROOT / "source-cache" / "audio-alternates" / "AzrcgoyE7C4" / "official-wwam-rss-h2-commentary.mp3",
        "transcript": ROOT / "source-cache" / "captions" / "AzrcgoyE7C4.alternate.asr.json",
        "url": "https://podcasters.spotify.com/pod/show/wewatchedamovie/episodes/Rob-Zombies-H2-Commentary-ehti0c",
        "label": "OFFICIAL WWAM PODCAST VARIANT // AUDIO-BOUND ROUTES",
    }
}


def load_json_from_window(path: Path) -> dict:
    raw = path.read_text(encoding="utf-8")
    return json.JSONDecoder().raw_decode(raw.split("=", 1)[1].lstrip())[0]


def audio_file_for(video_id: str) -> Path | None:
    for suffix in (".m4a", ".mp3", ".webm"):
        candidate = AUDIO_DIR / f"{video_id}{suffix}"
        if candidate.exists() and candidate.stat().st_size > 1024:
            return candidate
    return None


def alternate_audio_file_for(video_id: str) -> dict | None:
    config = ALTERNATE_AUDIO_FILES.get(video_id)
    if not config or not config["file"].exists() or config["file"].stat().st_size <= 1024:
        return None
    if not config["transcript"].exists():
        return None
    return config


def alternate_caption_events(config: dict) -> list[dict]:
    payload = json.loads(config["transcript"].read_text(encoding="utf-8"))
    return [
        {
            "t": max(0.0, float(segment.get("start") or 0)),
            "end": max(0.05, float(segment.get("end") or segment.get("start") or 0)),
            "text": str(segment.get("text") or "").strip(),
            "evidenceType": "official-podcast-variant-local-whisper-transcript",
        }
        for segment in payload.get("segments", [])
        if str(segment.get("text") or "").strip()
    ]


def alternate_audio_record(episode: dict, config: dict) -> dict:
    events = alternate_caption_events(config)
    audio = stream_features(config["file"])
    target = runtime_target(audio["durationSeconds"], len(events))
    candidates = candidate_rows(events, audio, max_candidates=target)
    for candidate in candidates:
        candidate["evidenceBasis"] = "official WWAM podcast variant audio + local faster-whisper transcript alignment"
        candidate["reviewStatus"] = "official podcast variant candidate; not a canonical YouTube timestamp"
        candidate["canonicalTimestampMapping"] = False
    marker_count = sum(bool(re.search(r"\[(?:laughter|snorts?|crosstalk|applause)\]", event["text"], re.I)) for event in events)
    digest = listening_digest(candidates, audio["stats"], audio_available=True)
    digest["evidence"] = "Official WWAM podcast-variant audio re-ranks local transcript signals. The variant is 105.61 seconds longer than the canonical YouTube upload, so these times are bound to the podcast player only."
    return {
        "status": "alternate-audio-feature-pilot",
        "label": config["label"],
        "media": {
            "sourceUrl": config["url"],
            "localFile": f"source-cache/audio-alternates/{episode['id']}/official-wwam-rss-h2-commentary.mp3",
            "container": "mp3",
            "durationSeconds": audio["durationSeconds"],
            "audioOnly": True,
            "canonicalAudioAvailable": False,
            "alternateAudioAvailable": True,
            "canonicalTimestampMapping": False,
        },
        "alignment": {
            "status": "non-isomorphic-duration-mismatch",
            "durationDeltaFromCanonicalSeconds": 105.61,
            "exactTimestampMappingEstablished": False,
            "timestampAuthority": "official WWAM podcast variant only",
        },
        "audit": {
            "captionEvents": len(events),
            "audioRows": audio["durationSeconds"],
            "laughterOrOverlapMarkers": marker_count,
            "candidateCount": len(candidates),
            "candidateTarget": target,
            "candidateCategories": category_counts(candidates),
            "audioStats": audio["stats"],
        },
        "candidates": candidates,
        "listeningDigest": digest,
        "note": "This is an official WWAM podcast variant of the same commentary subject. Its audio was decoded and locally transcribed for bounded variant routes; no timestamp is presented as a canonical YouTube timestamp.",
        "provenanceFile": "source-cache/audio-alternates/AzrcgoyE7C4/provenance.json",
    }


def runtime_target(duration_seconds: int, caption_events: int = 0) -> int:
    """Scale browse depth by runtime *and* how much source evidence exists.

    A fixed 15- or 48-card ceiling made dense two-hour commentaries look
    artificially thin. This keeps short tapes navigable while allowing long,
    caption-rich tapes to surface as many bounded routes as their evidence
    supports. The count is not a claim that the list is exhaustive.
    """
    runtime_component = max(15, round(duration_seconds / 300))
    density_bonus = max(0, round(caption_events / 180))
    return max(15, runtime_component + density_bonus)


def title_for(episode: dict) -> str:
    return str(episode.get("movieTitle") or episode.get("title") or episode.get("id") or "WWAM watchalong")


def label_for(episode: dict) -> str:
    return "HALLOWEEN WATCH PASS // AUDIO PILOT" if episode.get("franchiseKey") == "halloween" else "WATCHALONG WATCH PASS // AUDIO PILOT"


def clock(seconds: int | float) -> str:
    value = max(0, int(round(float(seconds or 0))))
    hours, remainder = divmod(value, 3600)
    minutes, secs = divmod(remainder, 60)
    return f"{hours}:{minutes:02d}:{secs:02d}" if hours else f"{minutes}:{secs:02d}"


def listening_digest(candidates: list[dict], audio_stats: dict | None, *, audio_available: bool) -> dict:
    counts: dict[str, int] = {}
    for candidate in candidates:
        category = str(candidate.get("category") or "OPEN MIC")
        counts[category] = counts.get(category, 0) + 1
    mix = [f"{name} ({count})" for name, count in sorted(counts.items(), key=lambda item: (-item[1], item[0]))[:4]]
    strongest = max(candidates, key=lambda item: float(item.get("score") or 0), default=None)
    if audio_available:
        headline = (
            f"Audio re-ranking favors {strongest.get('category', 'source leads')} at {clock(strongest.get('t', 0))}. "
            f"The pass retained {len(candidates)} bounded routes across {', '.join(mix) or 'the caption map'}."
            if strongest else f"The audio pass retained {len(candidates)} bounded routes."
        )
        evidence = "Acoustic energy re-ranks caption signals; it does not prove a joke, speaker, or visual reaction."
        mode = "audio-feature"
    else:
        headline = (
            f"Caption density produces {len(candidates)} bounded routes, led by {strongest.get('category', 'source leads')} at {clock(strongest.get('t', 0))}."
            if strongest else "The caption ledger produced no safe route candidates."
        )
        evidence = "No local audio measurement was available; these are caption-ledger routes and playback remains the authority."
        mode = "caption-only"
    return {"mode": mode, "headline": headline, "signalMix": mix, "strongest": {"t": strongest.get("t"), "category": strongest.get("category"), "score": strongest.get("score")} if strongest else None, "evidence": evidence}


def held_record(episode: dict) -> dict:
    video_id = episode["id"]
    alternate = KNOWN_ALTERNATES.get(video_id)
    record = {
        "id": video_id,
        "date": episode.get("date") or "unknown",
        "title": title_for(episode),
        "status": "held-age-restricted" if alternate else "held-source-unavailable",
        "label": "HALLOWEEN WATCH PASS // HELD SOURCE" if episode.get("franchiseKey") == "halloween" else "WATCHALONG WATCH PASS // HELD SOURCE",
        "media": {"sourceUrl": episode.get("url") or f"https://www.youtube.com/watch?v={video_id}", "audioOnly": True, "canonicalAudioAvailable": False},
        "audit": {"captionEvents": 0, "audioRows": 0, "candidateCount": 0, "candidateTarget": 0},
        "candidates": [],
        "note": alternate["note"] if alternate else "The canonical source has no locally acquired audio receipt. No timestamp candidates are manufactured; open the official source directly.",
        "provenanceFile": alternate["provenanceFile"] if alternate else None,
    }
    if alternate:
        record["alternateSource"] = {"url": alternate["url"], "label": alternate["label"]}
    return record


def caption_only_record(episode: dict, events: list[dict]) -> dict:
    """Keep a caption-backed route alive when YouTube withholds media formats.

    This is intentionally not labeled an audio pass: no acoustic intensity is
    invented. The dossier's bounded caption receipts remain playable through
    the official source URL, while the missing local audio stays visible in
    the evidence state.
    """
    duration = int(episode.get("duration") or 0)
    target = runtime_target(duration, len(events))
    cuts = list((episode.get("dossier") or {}).get("cuts") or [])
    cuts.sort(key=lambda item: (-float(item.get("score") or 0), float(item.get("t") or 0)))
    candidates = []
    for rank, cut in enumerate(cuts[:target], start=1):
        at = int(round(float(cut.get("t") or 0)))
        excerpt = str(cut.get("excerpt") or cut.get("quote") or "Caption receipt available at this timestamp.")
        candidates.append({
            "t": at,
            "end": int(round(float(cut.get("end") or at + 36))),
            "category": cut.get("category") or "CAPTION RECEIPT",
            "label": cut.get("label") or cut.get("category") or "CAPTION RECEIPT",
            "score": float(cut.get("score") or 0),
            "captionExcerpt": excerpt,
            "audio": {"windowSeconds": [at, min(duration or at + 36, at + 36)], "meanEnergyPercentile": None, "peakPercentile": None, "dbSpan": None, "markerObserved": False},
            "signals": {"captionSignalHits": 1, "captionMarker": False},
            "evidenceBasis": "source-local automatic caption alignment; audio unavailable",
            "reviewStatus": "caption-ledger-candidate; playback remains the authority",
            "rank": rank,
        })
    asr_only = bool(events) and events[0].get("evidenceType") == "local-whisper-transcript"
    return {
        "id": episode["id"],
        "date": episode.get("date") or "unknown",
        "title": title_for(episode),
        "status": "caption-ledger-pilot",
        "label": "HALLOWEEN WATCH PASS // ASR PILOT" if asr_only and episode.get("franchiseKey") == "halloween" else ("WATCHALONG WATCH PASS // ASR PILOT" if asr_only else ("HALLOWEEN WATCH PASS // CAPTION PILOT" if episode.get("franchiseKey") == "halloween" else "WATCHALONG WATCH PASS // CAPTION PILOT")),
        "media": {"sourceUrl": episode.get("url") or f"https://www.youtube.com/watch?v={episode['id']}", "audioOnly": True, "canonicalAudioAvailable": False, "captionMapAvailable": True},
        "audit": {"captionEvents": len(events), "audioRows": 0, "laughterOrOverlapMarkers": 0, "candidateCount": len(candidates), "candidateTarget": target, "candidateCategories": category_counts(candidates), "audioStats": {}},
        "candidates": candidates,
        "listeningDigest": listening_digest(candidates, None, audio_available=False),
        "note": ("The public upload has a local Whisper transcript generated from the canonical audio track, but no YouTube caption map was available. These are bounded transcript leads with no acoustic intensity claim; open the official source at each timestamp." if asr_only else "The public upload has a source-local caption map, but YouTube did not expose a locally acquirable media format in this run. These are bounded caption leads—not acoustic intensity measurements. Open the official source at each timestamp."),
        "provenanceFile": None,
    }


def main() -> None:
    existing = load_json_from_window(DEMO_DIR / "wwam-watch-pass-pilot.js")
    output = dict(existing)
    refresh = "--refresh" in sys.argv
    output["version"] = "2026-audio-pilot-04"
    output["scope"] = "latest-three-2026 + all-watchalongs"
    output["scopes"] = ["latest-three-2026", "all-watchalongs"]
    output["selectionPolicy"] = "Evidence-scaled ranked browse set with no fixed 48-card ceiling; longer and denser tapes receive more surfaced receipts. This is not a claim that unlisted caption candidates do not exist."
    output.setdefault("episodes", {})
    canon = load_json_from_window(WATCHALONG_FILE)
    episodes = canon.get("episodes", [])
    if refresh:
        # Re-decode every locally available tape so classifier improvements
        # are actually reflected instead of being hidden by the incremental
        # reuse path.  Missing/held sources are still handled conservatively.
        # Preserve the separate latest-livestream pilot records in this shared
        # file; they are not part of the watchalong canon loop below.
        canon_ids = {episode.get("id") for episode in episodes}
        output["episodes"] = {
            video_id: record for video_id, record in output["episodes"].items()
            if video_id not in canon_ids
        }
    analyzed = 0
    held = 0
    total_audio_seconds = 0
    total_caption_events = 0
    total_candidates = 0
    alternate_audio_analyzed = 0
    alternate_candidates = 0

    for episode in episodes:
        video_id = episode["id"]
        audio_file = audio_file_for(video_id)
        caption_path = ROOT / "source-cache" / "captions" / f"{video_id}.json"
        asr_path = ROOT / "source-cache" / "captions" / f"{video_id}.asr.json"
        has_transcript = caption_path.exists() or asr_path.exists()
        prior = output.get("episodes", {}).get(video_id) or {}
        prior_media = prior.get("media") or {}
        # The pass is intentionally incremental. A prior audio-feature record
        # already contains the decoded one-second rows' aggregate stats and
        # ranked receipts; reuse it unless the local media disappeared. This
        # keeps an archive refresh focused on newly acquired sources instead
        # of decoding every historical tape again.
        desired_prior_target = runtime_target(
            int(prior_media.get("durationSeconds") or episode.get("duration") or 0),
            int((prior.get("audit") or {}).get("captionEvents") or 0),
        )
        if (
            audio_file
            and not refresh
            and prior.get("status") == "audio-feature-pilot"
            and prior_media.get("canonicalAudioAvailable") is True
            and int((prior.get("audit") or {}).get("candidateTarget") or 0) >= desired_prior_target
        ):
            output["episodes"][video_id] = prior
            analyzed += 1
            total_audio_seconds += int((prior.get("audit") or {}).get("audioRows") or 0)
            total_caption_events += int((prior.get("audit") or {}).get("captionEvents") or 0)
            total_candidates += int((prior.get("audit") or {}).get("candidateCount") or len(prior.get("candidates") or []))
            print(f"{video_id}: reused prior audio-feature receipt")
            continue
        if not audio_file and has_transcript:
            events = caption_events(video_id)
            output["episodes"][video_id] = caption_only_record(episode, events)
            analyzed += 1
            total_caption_events += len(events)
            total_candidates += len(output["episodes"][video_id]["candidates"])
            print(f"{video_id}: caption-only ({len(events)} caption events, {len(output['episodes'][video_id]['candidates'])} candidates)")
            continue
        if not audio_file:
            prior_alternate = prior.get("alternateAudio") or {}
            if prior.get("status") == "held-age-restricted" and prior_alternate.get("status") == "alternate-audio-feature-pilot" and alternate_audio_file_for(video_id):
                output["episodes"][video_id] = prior
                held += 1
                alternate_audio_analyzed += 1
                alternate_candidates += int((prior_alternate.get("audit") or {}).get("candidateCount") or len(prior_alternate.get("candidates") or []))
                print(f"{video_id}: reused prior official podcast variant receipt")
                continue
            output["episodes"][video_id] = held_record(episode)
            alternate_config = alternate_audio_file_for(video_id)
            if alternate_config:
                alternate = alternate_audio_record(episode, alternate_config)
                output["episodes"][video_id]["alternateAudio"] = alternate
                output["episodes"][video_id]["alternateSource"]["durationSeconds"] = alternate["media"]["durationSeconds"]
                alternate_audio_analyzed += 1
                alternate_candidates += len(alternate["candidates"])
                print(f"{video_id}: held canonical source + {len(alternate['candidates'])} official podcast-variant candidates")
            else:
                print(f"{video_id}: held (no canonical audio or caption receipt)")
            held += 1
            continue

        if not has_transcript:
            output["episodes"][video_id] = held_record(episode)
            output["episodes"][video_id]["status"] = "held-caption-unavailable"
            output["episodes"][video_id]["note"] = "Canonical audio was acquired, but no source-local caption map was available for safe timestamp alignment. No timestamp candidates are manufactured."
            held += 1
            print(f"{video_id}: held (caption map unavailable)")
            continue

        events = caption_events(video_id)
        audio = stream_features(audio_file)
        target = runtime_target(audio["durationSeconds"], len(events))
        candidates = candidate_rows(events, audio, max_candidates=target)
        container = audio_file.suffix.lstrip(".")
        marker_count = sum(bool(re.search(r"\[(?:laughter|snorts?|crosstalk|applause)\]", event["text"], re.I)) for event in events)
        output["episodes"][video_id] = {
            "id": video_id,
            "date": episode.get("date") or "unknown",
            "title": title_for(episode),
            "status": "audio-feature-pilot",
            "label": label_for(episode),
            "media": {"sourceUrl": episode.get("url") or f"https://www.youtube.com/watch?v={video_id}", "localFile": f"source-cache/audio/{audio_file.name}", "container": container, "durationSeconds": audio["durationSeconds"], "audioOnly": True, "canonicalAudioAvailable": True},
            "audit": {"captionEvents": len(events), "audioRows": audio["durationSeconds"], "laughterOrOverlapMarkers": marker_count, "candidateCount": len(candidates), "candidateTarget": target, "candidateCategories": category_counts(candidates), "audioStats": audio["stats"]},
            "candidates": candidates,
            "listeningDigest": listening_digest(candidates, audio["stats"], audio_available=True),
            "note": "This pass decoded the canonical audio track at one-second feature resolution and aligned ranked windows to the source-local caption map. It does not assign a speaker, claim a visual reaction, or prove that a candidate is objectively funny; open the official source at each bounded timestamp.",
            "provenanceFile": f"source-cache/audio/{video_id}.provenance.json",
        }
        format_id = KNOWN_FORMATS.get(video_id, "139")
        upload_date = str(episode.get("date") or "unknown").replace("-", "")
        (AUDIO_DIR / f"{video_id}.provenance.json").write_text(json.dumps(provenance(video_id, upload_date, audio_file, audio["durationSeconds"], format_id=format_id), indent=2) + "\n", encoding="utf-8")
        analyzed += 1
        total_audio_seconds += audio["durationSeconds"]
        total_caption_events += len(events)
        total_candidates += len(candidates)
        print(f"{video_id}: {len(events)} caption events, {audio['durationSeconds']} audio rows, {len(candidates)} candidates")

    output["coverage"] = {"watchalongEpisodes": len(episodes), "audioAnalyzed": analyzed, "held": held, "alternateAudioAnalyzed": alternate_audio_analyzed, "alternateRankedCandidates": alternate_candidates, "audioSeconds": total_audio_seconds, "captionEvents": total_caption_events, "rankedCandidates": total_candidates}
    js = "window.WWAM_WATCH_PASS_PILOT = " + json.dumps(output, ensure_ascii=False, separators=(",", ":")) + ";\n"
    (DEMO_DIR / "wwam-watch-pass-pilot.js").write_text(js, encoding="utf-8")
    print(f"RESULT watchalongs={len(episodes)} analyzed={analyzed} held={held} candidates={total_candidates}")


if __name__ == "__main__":
    main()
