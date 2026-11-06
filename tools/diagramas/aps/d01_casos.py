"""01 — Diagrama de casos de uso (12 casos essenciais)."""

from pathlib import Path

from lib_drawio import (
    ACTOR, ACTOR_TOP, ASSOC, DEP, Diagram, ELLIPSE, EXTEND, INCLUDE,
    NOTE, OUT, text,
)


def gerar() -> Path:
    d = Diagram("casos-de-uso", 1700, 1120, "Casos de uso — DF Coleta")

    # Fronteira do sistema
    d.v("boundary", "DF Coleta", 280, 100, 1140, 920,
        "rounded=0;whiteSpace=wrap;html=1;fillColor=none;strokeColor=#000000;"
        "strokeWidth=1;align=left;verticalAlign=top;spacingLeft=10;spacingTop=6;"
        "fontFamily=Arial;fontSize=14;fontColor=#000000;fontStyle=1;")

    # Atores
    d.v("actor_cid", "Cidadão", 60, 400, 50, 80, ACTOR)
    d.v("actor_adm", "Administrador", 1470, 400, 50, 80, ACTOR)
    d.v("actor_map", "API de Mapas", 810, 50, 50, 70, ACTOR_TOP)

    # Casos de uso — coluna do cidadão
    pub = [
        ("uc02", "Consultar pontos\nde coleta", 170),
        ("uc04", "Traçar rota no\nGoogle Maps", 290),
        ("uc03", "Visualizar detalhes\ndo ponto", 410),
        ("uc01", "Visualizar informações\ne tipos de resíduos", 530),
        ("uc05", "Comentar sobre\num ponto", 650),
        ("uc06", "Reportar problema", 770),
        ("uc07", "Sugerir novo ponto", 890),
    ]
    for ident, label, cy in pub:
        d.v(ident, label, 495, cy - 37, 250, 74, ELLIPSE)

    # Casos de uso — coluna do administrador
    adm = [
        ("uc08", "Autenticar-se no\npainel", 170),
        ("uc09", "Gerenciar pontos\nde coleta", 300),
        ("uc10", "Gerenciar tipos\nde resíduos", 430),
        ("uc11", "Moderar\ncontribuições", 560),
        ("uc12", "Acompanhar\nindicadores", 690),
    ]
    for ident, label, cy in adm:
        d.v(ident, label, 955, cy - 37, 250, 74, ELLIPSE)

    # Associações dos atores
    for ident, _, _ in pub:
        d.e(f"a_cid_{ident}", "actor_cid", ident, "", ASSOC)
    for ident, _, _ in adm:
        d.e(f"a_adm_{ident}", "actor_adm", ident, "", ASSOC)

    d.e("a_map_uc02", "actor_map", "uc02", "", ASSOC)
    d.e("a_map_uc04", "actor_map", "uc04", "", ASSOC)

    # Relacionamentos entre casos de uso
    # UC04 é uma extensão opcional do detalhe (abrir a rota).
    d.e("ext_uc04_uc03", "uc04", "uc03", "«extend»", EXTEND)

    # A autenticação é pré-condição dos casos do administrador.
    # O vínculo é desenhado uma vez (UC09) e explicado na nota.
    d.e("inc_uc09_uc08", "uc09", "uc08", "«include»", INCLUDE,
        points=[(1080, 263), (1080, 207)])

    # Nota de escopo
    text(d, "nota", (
        "Leitura do recorte: UC06 (relatar problema) está implementado no detalhe do ponto; UC08 exige "
        "sessão do Supabase Auth, validada no servidor em todas as rotas de escrita. A sincronização com "
        "uma API externa é fluxo alternativo <b>previsto</b> do UC09. UC10 a UC12 também exigem UC08. "
        "Busca, filtros, mapa, ordenação e horários aparecem dentro dos fluxos, não como elipses separadas."
    ), 300, 936, 570, 80, NOTE, raw=True)

    out = OUT / "01-casos-de-uso" / "casos-de-uso.drawio"
    d.save(out)
    return out


if __name__ == "__main__":
    print(gerar())
