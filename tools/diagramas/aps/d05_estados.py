"""05 — Diagrama de estados: ciclo de vida de SugestaoPonto."""

from pathlib import Path

from lib_drawio import Diagram, FLOW, NOTE, OUT, ROUND, SMALL, TEXT, text


def gerar() -> Path:
    d = Diagram("estados", 1400, 990, "Estados — SugestaoPonto")

    # Estado inicial
    d.v("inicio", "", 80, 450, 36, 36,
        "ellipse;fillColor=#000000;strokeColor=#000000;html=1;")

    # Estados
    d.v("pendente", (
        "<b>PENDENTE</b><br><font style='font-size:10'>entry / registrar data<br>"
        "do / exibir na fila de moderação</font>"
    ), 180, 400, 270, 110, ROUND + "arcSize=35;", raw=True)

    d.v("aprovada", (
        "<b>APROVADO</b><br><font style='font-size:10'>entry / criar PontoColeta</font>"
    ), 620, 220, 270, 110, ROUND + "arcSize=35;", raw=True)

    d.v("rejeitada", (
        "<b>REJEITADO</b><br><font style='font-size:10'>do / manter histórico</font>"
    ), 620, 540, 270, 110, ROUND + "arcSize=35;", raw=True)

    # Estado final
    d.v("fim_out", "", 1020, 260, 40, 40,
        "ellipse;fillColor=none;strokeColor=#000000;strokeWidth=2;html=1;")
    d.v("fim_in", "", 1029, 269, 22, 22,
        "ellipse;fillColor=#000000;strokeColor=#000000;html=1;")

    # Transições
    d.e("t_inicio", "inicio", "pendente", "", FLOW)
    text(d, "lbl_inicio", "enviar()\n[dados válidos]", 72, 405, 100, 32, SMALL)

    d.e("t_aprovar", "pendente", "aprovada", "", FLOW,
        points=[(470, 330), (540, 330), (540, 280)])
    text(d, "lbl_aprovar", "aprovar()\n[admin confirma]",
         478, 296, 150, 32, SMALL)

    d.e("t_rejeitar", "pendente", "rejeitada", "", FLOW,
        points=[(470, 500), (540, 500), (540, 600)])
    text(d, "lbl_rejeitar", "rejeitar()\n[admin confirma]",
         478, 505, 150, 32, SMALL)

    d.e("t_reativar", "rejeitada", "pendente", "", FLOW,
        points=[(755, 720), (315, 720)])
    text(d, "lbl_reativar", "reativar()", 500, 700, 90, 18, SMALL)

    d.e("t_concluir", "aprovada", "fim_out", "", FLOW,
        points=[(940, 280)])
    text(d, "lbl_concluir", "concluir()", 900, 245, 90, 18, SMALL)

    # Notas
    text(d, "nota_status", (
        "Status persistido em sugestoes.status com os mesmos literais do estado: "
        "PENDENTE, APROVADO e REJEITADO (PATCH /sugestoes/{id}/status). Aprovar "
        "grava também um novo PontoColeta. O modal de rejeição pede confirmação, "
        "mas o motivo não é gravado no banco."
    ), 80, 760, 470, 96, NOTE)

    text(d, "nota_ciclo", (
        "APROVADO encerra o ciclo da sugestão. O ramo REJEITADO pode voltar para "
        "PENDENTE pelo evento reativar(); por isso o estado final só aparece no "
        "ramo aprovado."
    ), 950, 700, 380, 100, NOTE)

    out = OUT / "05-estados" / "estados.drawio"
    d.save(out)
    return out


if __name__ == "__main__":
    print(gerar())
