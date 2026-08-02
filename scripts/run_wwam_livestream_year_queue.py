"""Continue the livestream audio shelves one year at a time.

This is intentionally a resumable queue: acquisition is additive, the audio
pass merges into the existing registry, and canon generation only runs after a
year's pass completes. Raw media stays in ignored source-cache; public output
contains bounded source-linked routes only.
"""

from __future__ import annotations

import argparse
import subprocess
import sys
import time
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
ACQUIRE = ROOT / "scripts" / "acquire_wwam_2026_livestream_audio.py"
PASS = ROOT / "scripts" / "run_wwam_2026_livestream_audio_watch_pass.py"
GENERATE = ROOT / "scripts" / "generate-wwam-livestream-canon.mjs"


def wait_for(pids: list[int]) -> None:
    active = set(pids)
    while active:
        for pid in list(active):
            try:
                import psutil  # type: ignore
                if not psutil.pid_exists(pid):
                    active.remove(pid)
            except Exception:
                # Avoid a dependency requirement: tasklist is available on
                # Windows and gives us a conservative process-exists check.
                result = subprocess.run(["tasklist", "/FI", f"PID eq {pid}"], capture_output=True, text=True, check=False)
                if str(pid) not in result.stdout:
                    active.remove(pid)
        if active:
            print(f"WAITING_FOR_PIDS {sorted(active)}", flush=True)
            time.sleep(20)


def run(command: list[str]) -> None:
    print("RUN", " ".join(str(part) for part in command), flush=True)
    result = subprocess.run(command, cwd=ROOT, check=False)
    if result.returncode:
        raise SystemExit(result.returncode)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--wait-pid", type=int, action="append", default=[])
    parser.add_argument("--from-year", type=int, default=2022)
    parser.add_argument("--to-year", type=int, default=2016)
    args = parser.parse_args()
    if args.wait_pid:
        wait_for(args.wait_pid)
    years = list(range(args.from_year, args.to_year - 1, -1))
    for year in years:
        print(f"YEAR_START {year}", flush=True)
        run([sys.executable, str(ACQUIRE), "--year", str(year), "--limit", "0"])
        run([sys.executable, str(PASS), "--year", str(year)])
        run(["node", str(GENERATE)])
        print(f"YEAR_DONE {year}", flush=True)


if __name__ == "__main__":
    main()
