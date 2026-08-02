#!/usr/bin/env python3
"""Audit the official WWAM RSS feed for full-film commentary releases.

This is intentionally a discovery/audit tool, not a canon promoter. RSS
records are retained as evidence only when their title explicitly says
commentary/watchalong and they carry a playable enclosure plus a duration.
The output makes it easy to spot film lanes that disappeared from YouTube
without pretending the podcast clock is a YouTube timestamp.
"""

from __future__ import annotations

import argparse
import html
import json
import re
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone

RSS_URL = "https://anchor.fm/s/10a245f8/podcast/rss"
TITLE_SIGNAL = re.compile(r"(?i)(full\s+movie\s+commentary|movie\s+commentary|full\s+commentary|watchalong|watch\s*party|commentary$)")
ITUNES = "{http://www.itunes.com/dtds/podcast-1.0.dtd}"


def clean(value: str | None) -> str:
    return re.sub(r"\s+", " ", html.unescape(value or "")).strip()


def duration_seconds(value: str | None) -> int | None:
    text = clean(value)
    if not text:
        return None
    if text.isdigit():
        return int(text)
    parts = [int(part) for part in text.split(":") if part.isdigit()]
    if len(parts) == 3:
        return parts[0] * 3600 + parts[1] * 60 + parts[2]
    if len(parts) == 2:
        return parts[0] * 60 + parts[1]
    return None


def audit() -> dict:
    request = urllib.request.Request(RSS_URL, headers={"User-Agent": "WWAM-watchalong-audit/1.0"})
    root = ET.fromstring(urllib.request.urlopen(request, timeout=30).read())
    records = []
    for item in root.findall("./channel/item"):
        title = clean(item.findtext("title"))
        if not TITLE_SIGNAL.search(title):
            continue
        enclosure = item.find("enclosure")
        url = (enclosure.attrib.get("url") if enclosure is not None else "")
        duration = duration_seconds(item.findtext(f"{ITUNES}duration"))
        # An explicit title without a playable enclosure is an audit lead,
        # never a recovered audio source.
        records.append({
            "title": title,
            "date": clean(item.findtext("pubDate")),
            "guid": clean(item.findtext("guid")),
            "sourceUrl": url,
            "bytes": int(enclosure.attrib.get("length", 0)) if enclosure is not None and enclosure.attrib.get("length", "0").isdigit() else 0,
            "durationSeconds": duration,
            "playable": bool(url and duration),
            "titleExplicit": True,
        })
    return {
        "schema": "shokker-wwam-podcast-commentary-audit/v1",
        "observedAt": datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z"),
        "feedUrl": RSS_URL,
        "records": records,
        "titleExplicitFilmCommentaries": len(records),
        "playable": sum(1 for record in records if record["playable"]),
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", help="optional JSON output path")
    args = parser.parse_args()
    payload = audit()
    rendered = json.dumps(payload, ensure_ascii=False, indent=2)
    if args.output:
        with open(args.output, "w", encoding="utf-8") as handle:
            handle.write(rendered + "\n")
    print(json.dumps({key: payload[key] for key in ("feedUrl", "titleExplicitFilmCommentaries", "playable")}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
