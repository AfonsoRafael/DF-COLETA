"""04 — Diagrama de sequência: cadastrar/editar ponto de coleta."""

from pathlib import Path

from lib_drawio import ACTOR, Diagram, FRAME, LIFELINE, NOTE, OUT, SMALL, text


def gerar() -> Path:
    d = Diagram("sequencia", 1600, 1200, "Sequência — cadastrar/editar ponto")

    # Participantes
    d.v("admin", "Administrador", 100, 55, 50, 70, ACTOR)
    d.v("admin_line", "", 124, 130, 2, 920, "line;strokeWidth=1;dashed=1;html=1;")
    d.v("tela", ":TelaPontos", 380, 80, 160, 980, LIFELINE)
    d.v("api", ":API", 760, 80, 140, 980, LIFELINE)
    d.v("supa", ":Supabase", 1120, 80, 160, 980, LIFELINE)

    # Barras de ativação
    d.v("bar_tela", "", 456, 155, 8, 880,
        "rounded=0;fillColor=#FFFFFF;strokeColor=#000000;html=1;")
    d.v("bar_api_1", "", 826, 230, 8, 180,
        "rounded=0;fillColor=#FFFFFF;strokeColor=#000000;html=1;")
    d.v("bar_api_2", "", 826, 650, 8, 385,
        "rounded=0;fillColor=#FFFFFF;strokeColor=#000000;html=1;")
    d.v("bar_supa_1", "", 1196, 305, 8, 90,
        "rounded=0;fillColor=#FFFFFF;strokeColor=#000000;html=1;")
    d.v("bar_supa_2", "", 1196, 730, 8, 160,
        "rounded=0;fillColor=#FFFFFF;strokeColor=#000000;html=1;")

    MSG = ("html=1;verticalAlign=bottom;endArrow=block;endFill=1;fontFamily=Arial;"
           "fontSize=9;fontColor=#000000;whiteSpace=wrap;labelWidth=220;")
    RET = ("html=1;verticalAlign=bottom;endArrow=open;endFill=0;dashed=1;fontFamily=Arial;"
           "fontSize=9;fontColor=#000000;whiteSpace=wrap;labelWidth=220;")

    def msg(ident, y, x1, x2, value, dashed=False, style=None):
        d.ep(ident, (x1, y), (x2, y), value, style or (RET if dashed else MSG))

    def selfmsg(ident, y, x, value, dashed=False):
        style = RET if dashed else MSG
        d.ep(ident, (x, y), (x, y + 18), value, style,
             points=[(x + 55, y), (x + 55, y + 18)])

    # 1–4: abertura e carga inicial
    msg("m01", 160, 125, 456, "abrir painel de pontos")
    selfmsg("m02", 198, 464, "verificarAuth()")
    msg("m03", 236, 464, 826, "GET /residuos")
    msg("m04", 274, 464, 826, "GET /pontos-coleta?todos=true")
    msg("m05", 312, 834, 1196, "SELECT residuos / pontos")
    msg("m06", 350, 1196, 834, "listas", dashed=True)
    msg("m07", 388, 826, 464, "200 JSON", dashed=True)
    selfmsg("m08", 426, 464, "renderizar lista e estatísticas")

    # 9–12: abertura do modal e preenchimento
    msg("m09", 464, 125, 456, "clicar em Novo ponto / Editar")
    selfmsg("m10", 502, 464, "abrir modal")
    msg("m11", 540, 125, 456, "preencher e confirmar")
    selfmsg("m12", 578, 464, "validar campos")

    # 13: caminho alternativo de validação
    msg("m13", 620, 456, 125, "toast de erro", dashed=True,
        style=RET.replace("verticalAlign=bottom", "verticalAlign=top"))

    # 14–15: alt novo / editar
    msg("m14", 670, 464, 826, "POST /pontos-coleta")
    msg("m15", 712, 464, 826, "PUT /pontos-coleta/{id}")

    # 16–19: persistência
    msg("m16", 750, 834, 1196, "INSERT / UPDATE ponto")
    msg("m17", 788, 834, 1196, "DELETE + INSERT ponto_residuos")
    msg("m18", 826, 834, 1196, "DELETE + INSERT horarios")
    msg("m19", 864, 1196, 834, "ok", dashed=True)
    msg("m20", 902, 826, 464, "201 / 200 JSON", dashed=True)

    # 21–23: recarga e confirmação
    msg("m21", 940, 464, 826, "GET /pontos-coleta?todos=true")
    msg("m22", 978, 826, 464, "lista atualizada", dashed=True)
    msg("m23", 1016, 456, 125, "toast de sucesso", dashed=True)

    # Fragmentos
    d.v("opt_validacao", "", 60, 596, 540, 54, FRAME)
    text(d, "lbl_opt", "opt [campos inválidos]", 64, 600, 220, 20,
         "text;fontFamily=Arial;fontSize=10;fontColor=#000000;html=1;"
         "whiteSpace=wrap;align=left;verticalAlign=middle;")
    d.v("alt_novo", "alt [novo]", 360, 650, 540, 88, FRAME)
    d.v("else_editar", "", 360, 694, 540, 2,
        "line;strokeWidth=1;dashed=1;html=1;")
    text(d, "else_label", "else [editar]", 368, 696, 100, 16, SMALL)
    d.v("opt_residuos", "opt [resíduos e horários informados]", 740, 758, 500, 100, FRAME)

    text(d, "nota_auth", (
        "Cada requisição leva o token do Supabase Auth (Bearer), injetado por "
        "admin-base.js e validado pela API. Sem sessão válida, a tela redireciona "
        "para o login."
    ), 580, 1070, 480, 72, NOTE)

    text(d, "nota_erro", (
        "Erro 4xx/5xx: a API devolve a mensagem, a tela mostra um toast de erro, "
        "o modal permanece aberto para correção e a lista não é recarregada."
    ), 1080, 1070, 440, 72, NOTE)

    out = OUT / "04-sequencia" / "sequencia.drawio"
    d.save(out)
    return out


if __name__ == "__main__":
    print(gerar())
