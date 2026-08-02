"""Audit public watch-like edge leads without promoting them into canon.

The strict watchalong registry intentionally excludes short reactions/reviews
and ambiguous early edits. This pass checks whether a public edge lead has a
local caption receipt, so the exclusion is evidence-backed rather than a blind
title filter. It never invents a full-film claim or timestamps for the canon.
"""

from __future__ import annotations

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DISCOVERY = ROOT / "source-cache" / "wwam-watchalong-discovery.json"
CANON = ROOT / "public" / "demo" / "wwam-watchalong-canon.js"
METADATA = ROOT / "source-cache" / "metadata"
CAPTIONS = ROOT / "source-cache" / "captions"
OUTPUT = ROOT / "source-cache" / "wwam-watchalong-edge-audit.json"


def caption_stats(path: Path) -> tuple[int, float]:
    payload = json.loads(path.read_text(encoding="utf-8"))
    events = payload.get("events") or []
    count = 0
    last = 0.0
    for event in events:
        text = "".join(str(segment.get("utf8") or "") for segment in event.get("segs") or [])
        if not text.strip():
            continue
        count += 1
        last = max(last, (float(event.get("tStartMs") or 0) + float(event.get("dDurationMs") or 0)) / 1000)
    return count, round(last, 2)


def date_from(value: str | None) -> str | None:
    text = str(value or "")
    return f"{text[:4]}-{text[4:6]}-{text[6:8]}" if len(text) == 8 and text.isdigit() else (text or None)


def main() -> None:
    discovery = json.loads(DISCOVERY.read_text(encoding="utf-8"))
    canon_payload = json.JSONDecoder().raw_decode(CANON.read_text(encoding="utf-8").split("=", 1)[1].lstrip())[0]
    canon_ids = {record.get("id") for record in canon_payload.get("episodes") or []}
    metadata = {}
    for path in METADATA.glob("*.json"):
        try:
            record = json.loads(path.read_text(encoding="utf-8"))
            metadata[record.get("id")] = record
        except (OSError, json.JSONDecodeError):
            continue
    public = [
        {**item, "availability": metadata.get(item.get("id"), {}).get("availability", "unknown")}
        for item in discovery.get("broadCandidates") or []
        if item.get("id") not in canon_ids and metadata.get(item.get("id"), {}).get("availability") != "subscriber_only"
    ]
    records = []
    for item in public:
        caption_path = CAPTIONS / f"edge-{item['id']}.en.json3"
        events, span = caption_stats(caption_path) if caption_path.exists() else (0, 0.0)
        records.append({
            "id": item["id"],
            "title": item["title"],
            "date": date_from(metadata.get(item.get("id"), {}).get("upload_date")) or item.get("date"),
            "signal": item.get("signal"),
            "url": f"https://www.youtube.com/watch?v={item['id']}",
            "status": "caption-confirmed-adjacent" if events else "public-metadata-only",
            "captionEvents": events,
            "captionSpanSeconds": span,
            "promotion": "kept-out-of-full-film-canon",
            "reason": "Public reaction/review or short-form watch lead; a local caption receipt confirms the upload is real, but not that it is a complete film commentary." if events else "Public edge lead remains metadata-only until a source-local receipt establishes its format.",
        })
    payload = {
        "schema": "shokker-wwam-watchalong-edge-audit/v1",
        "source": "source-cache/wwam-watchalong-discovery.json",
        "publicEdgeLeads": len(records),
        "captionConfirmed": sum(1 for record in records if record["captionEvents"]),
        "records": records,
        "policy": "Edge receipts are evidence for exclusion, not a promotion into the full-film watchalong canon.",
    }
    OUTPUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({key: payload[key] for key in ("publicEdgeLeads", "captionConfirmed")}))


if __name__ == "__main__":
    main()
