#!/usr/bin/env python3
"""Generate a Python client for every IDL in ./idls and import every module.

Importing is what catches the failures unit tests miss: invalid syntax, missing
imports and names that only appear once a whole program is rendered.

Each entry in corpus.json declares what is expected:

    "imports"    the client is generated and every module imports
    "generates"  the client is generated, but importing it is known to fail
                 (see the entry's note)

Usage, from the repository root:

    pnpm build
    pip install -r e2e/corpus/requirements.txt
    python3 e2e/corpus/check.py [name ...]
"""

import importlib
import json
import shutil
import subprocess
import sys
import traceback
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent
OUT = HERE / "out"
CORPUS = json.loads((HERE / "corpus.json").read_text())


def generate(name: str, entry: dict, dest: Path) -> str | None:
    """Run the genpy CLI. Returns an error message, or None on success."""
    shutil.rmtree(dest, ignore_errors=True)
    command = ["pnpm", "run", "--silent", "genpy", "-i", str(HERE / "idls" / f"{name}.json"), "-d", str(dest)]
    if "programId" in entry:
        command += ["--program-id", entry["programId"]]
    result = subprocess.run(command, cwd=ROOT, capture_output=True, text=True)
    # genpy catches its own exceptions and prints them, so stderr is the signal.
    errors = [line for line in result.stderr.splitlines() if "Error" in line]
    if result.returncode != 0 or not dest.exists() or errors:
        return (errors or result.stderr.splitlines() or ["no output"])[0][:300]
    return None


def import_all(package: str) -> list[str]:
    """Import every generated module, one by one, collecting failures."""
    failures = []
    for module in sorted(m for m in sys.modules if m == package or m.startswith(package + ".")):
        del sys.modules[module]
    for path in sorted((OUT / package).rglob("*.py")):
        parts = path.relative_to(OUT).with_suffix("").parts
        name = ".".join(parts[:-1] if parts[-1] == "__init__" else parts)
        try:
            importlib.import_module(name)
        except SyntaxError as error:
            failures.append(f"{name}: SyntaxError at {Path(error.filename).name}:{error.lineno}: {(error.text or '').strip()[:80]}")
        except Exception as error:  # noqa: BLE001 - any import failure is a finding
            frame = traceback.extract_tb(error.__traceback__)[-1]
            failures.append(f"{name}: {type(error).__name__}: {str(error)[:140]} ({Path(frame.filename).name}:{frame.lineno})")
    return failures


def main() -> int:
    names = sys.argv[1:] or sorted(CORPUS)
    unknown = [name for name in names if name not in CORPUS]
    if unknown:
        print(f"not in corpus.json: {', '.join(unknown)}")
        return 2

    OUT.mkdir(exist_ok=True)
    sys.path.insert(0, str(OUT))
    failed = []
    for name in names:
        entry = CORPUS[name]
        package = f"{name}_client"
        error = generate(name, entry, OUT / package)
        if error:
            print(f"FAIL {name}: generation failed: {error}")
            failed.append(name)
            continue
        failures = import_all(package)
        if entry["expect"] == "generates":
            print(f"KNOWN {name}: generated; {len(failures)} modules fail to import ({entry.get('note', '')})")
        elif failures:
            print(f"FAIL {name}: {len(failures)} modules fail to import")
            for failure in failures[:5]:
                print(f"       {failure}")
            failed.append(name)
        else:
            print(f"OK   {name}")

    print(f"\n{len(names) - len(failed)}/{len(names)} as expected")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
