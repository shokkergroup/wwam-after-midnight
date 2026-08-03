"""Consume the prioritized local-audio ASR queue in bounded overnight batches."""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path

from run_wwam_latest_livestream_asr import install_cuda_dll_search_path, transcribe_one


ROOT = Path(__file__).resolve().parents[1]
QUEUE = ROOT / "source-cache" / "wwam-asr-queue.json"
SELECTOR = ROOT / "scripts" / "select_wwam_asr_queue.mjs"
EXCERPT_GENERATOR = ROOT / "scripts" / "generate_wwam_livestream_asr_excerpts.py"


def refresh_queue() -> dict:
    subprocess.run(["node", str(SELECTOR)], cwd=ROOT, check=True)
    return json.loads(QUEUE.read_text(encoding="utf-8"))


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--batches", type=int, default=3)
    parser.add_argument("--batch-size", type=int, default=3)
    args = parser.parse_args()
    install_cuda_dll_search_path()
    from faster_whisper import WhisperModel

    print("[queue] loading large-v3-turbo on CUDA", flush=True)
    model = WhisperModel("large-v3-turbo", device="cuda", compute_type="float16")
    for batch in range(max(0, args.batches)):
        queue = refresh_queue()
        rows = list(queue.get("next") or [])[: max(1, args.batch_size)]
        if not rows:
            print("[queue] no local-audio sources remain", flush=True)
            return
        ids = [str(row["id"]) for row in rows]
        print(f"[queue] batch {batch + 1} // {', '.join(ids)}", flush=True)
        for source_id in ids:
            transcribe_one(model, source_id)
            # Publish the bounded navigation layer as soon as this source is
            # complete. A neighboring three-hour source should not hold back
            # a finished ledger from reaching the public Wiki.
            subprocess.run([sys.executable, str(EXCERPT_GENERATOR)], cwd=ROOT, check=True)
    print("[queue] bounded batch run complete; generated excerpts are ready for audit/commit", flush=True)


if __name__ == "__main__":
    main()
