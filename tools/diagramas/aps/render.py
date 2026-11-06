"""Gera e exporta os sete diagramas da APS.

Uso:
    python render.py            # todos
    python render.py 01 07      # apenas os numeros indicados
"""

from __future__ import annotations

import os
import subprocess
import sys
import time
from pathlib import Path

from lib_drawio import OUT

DRAWIO = Path(os.environ["LOCALAPPDATA"]) / "Programs" / "draw.io" / "draw.io.exe"

DIAGRAMS = [
    ("01", "d01_casos", "01-casos-de-uso", "casos-de-uso"),
    ("02", "d02_classes", "02-classes", "classes"),
    ("03", "d03_atividades", "03-atividades", "atividades"),
    ("04", "d04_sequencia", "04-sequencia", "sequencia"),
    ("05", "d05_estados", "05-estados", "estados"),
    ("06", "d06_componentes", "06-componentes", "componentes"),
    ("07", "d07_objetos", "07-objetos", "objetos"),
]


def export(drawio: Path, png: Path) -> bool:
    for _ in range(3):
        subprocess.run(
            [str(DRAWIO), "--no-sandbox", "--export", "--format", "png",
             "--scale", "2", "--size", "diagram", "--border", "20",
             "--output", str(png), str(drawio)],
            check=False,
        )
        time.sleep(1.5)
        if png.exists() and png.stat().st_mtime >= drawio.stat().st_mtime:
            return True
    return png.exists()


def main() -> int:
    wanted = set(sys.argv[1:]) or {d[0] for d in DIAGRAMS}
    here = Path(__file__).resolve().parent
    for number, module, folder, name in DIAGRAMS:
        if number not in wanted:
            continue
        subprocess.run([sys.executable, str(here / f"{module}.py")], check=True)
        drawio = OUT / folder / f"{name}.drawio"
        png = OUT / folder / f"{name}.png"
        ok = export(drawio, png)
        print(f"{number} {name}: {'ok' if ok else 'FALHOU'} -> {png}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
