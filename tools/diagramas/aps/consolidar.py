"""Consolida os 7 diagramas da APS em um único .drawio com 7 páginas.

Uso: python consolidar.py
Saída: docs/diagramas/aps/DF-Coleta-Diagramas.drawio
"""

from __future__ import annotations

import re
from pathlib import Path

from lib_drawio import OUT

PAGINAS = [
    ("01-casos-de-uso/casos-de-uso.drawio", "6.1 Casos de Uso"),
    ("02-classes/classes.drawio", "6.2 Classes"),
    ("03-atividades/atividades.drawio", "6.3 Atividades"),
    ("04-sequencia/sequencia.drawio", "6.4 Sequência"),
    ("05-estados/estados.drawio", "6.5 Estados"),
    ("06-componentes/componentes.drawio", "6.6 Componentes"),
    ("07-objetos/objetos.drawio", "6.7 Objetos"),
]

BLOCO = re.compile(r"<diagram\b[^>]*>.*?</diagram>", re.S)


def main() -> int:
    partes: list[str] = []
    for caminho, titulo in PAGINAS:
        origem = OUT / caminho
        texto = origem.read_text(encoding="utf-8")
        bloco = BLOCO.search(texto)
        if not bloco:
            raise SystemExit(f"sem <diagram> em {origem}")
        xml = bloco.group(0)
        # Renomeia a página para o número da seção do documento.
        xml = re.sub(r'(<diagram\b[^>]*\bname=")[^"]*(")', rf"\g<1>{titulo}\g<2>", xml, count=1)
        partes.append(xml)

    destino = OUT / "DF-Coleta-Diagramas.drawio"
    destino.write_text(
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<mxfile host="app.diagrams.net" modified="2026-11-03T00:00:00.000Z" '
        'agent="df-coleta" version="24.0.0">\n'
        + "\n".join(partes)
        + "\n</mxfile>\n",
        encoding="utf-8",
    )
    print(f"{destino} ({destino.stat().st_size} bytes, {len(partes)} páginas)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
