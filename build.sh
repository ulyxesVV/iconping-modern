#!/bin/sh
set -eu
cd "$(dirname "$0")"
if command -v glib-compile-schemas >/dev/null 2>&1; then
    glib-compile-schemas schemas
fi
python3 - <<'PY'
import json
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile

metadata = json.loads(Path("metadata.json").read_text())
archive = Path(f"{metadata['uuid']}.shell-extension.zip")
entries = [
    Path("metadata.json"),
    Path("extension.js"),
    Path("prefs.js"),
    Path("icons"),
    Path("schemas/org.gnome.shell.extensions.iconpingmodern.gschema.xml"),
    Path("schemas/gschemas.compiled"),
    Path("COPYING"),
    Path("README.md"),
]
with ZipFile(archive, "w", ZIP_DEFLATED) as package:
    for entry in entries:
        if not entry.exists():
            continue
        paths = sorted(entry.rglob("*")) if entry.is_dir() else [entry]
        for path in paths:
            if path.is_file():
                package.write(path, path.as_posix())
print(f"Erstellt: {archive}")
PY
