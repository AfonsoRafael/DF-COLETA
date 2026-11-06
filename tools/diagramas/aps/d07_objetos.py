"""07 — Diagrama de objetos com dados reais do ponto 401 (ACAPAS)."""

from pathlib import Path

from lib_drawio import ASSOC, COMP, Diagram, NOTE, OUT, SMALL, object_box, text


def gerar() -> Path:
    d = Diagram("objetos", 1740, 1060, "Objetos — ponto 401 ACAPAS")

    # ------------------------------------------------------------------
    # Objetos
    # ------------------------------------------------------------------
    object_box(d, "adm", "adm : Administrador", [
        "id = 1",
        "nome = \"Administrador DF Coleta\"",
        "email = \"admin@dfcoleta.com\"",
    ], 110, 70, 380)

    object_box(d, "p401", "p401 : PontoColeta", [
        "id = 401",
        "nome = \"ACAPAS\"",
        "tipo = COOPERATIVA",
        "endereco = \"SGON Quadra 05 Lote 23 - DL Norte\"",
        "cidade = \"Plano Piloto\"",
        "latitude = -15.771496",
        "longitude = -47.913668",
        "telefone = \"(61) 3223-1400\"",
        "status = ATIVO",
    ], 600, 350, 560)

    object_box(d, "h_seg", "h401_seg : HorarioFuncionamento", [
        "diaSemana = \"Segunda-Feira\"",
        "horaAbertura = 08:00",
        "horaFechamento = 17:00",
        "ordem = 2",
    ], 60, 275, 330)

    object_box(d, "h_sab", "h401_sab : HorarioFuncionamento", [
        "diaSemana = \"Sábado\"",
        "horaAbertura = 08:00",
        "horaFechamento = 17:00",
        "ordem = 7",
    ], 60, 405, 330)

    object_box(d, "r_metal", "r_metal : Residuo", [
        "id = 7",
        "nome = \"Metal\"",
    ], 1320, 175, 340)

    object_box(d, "r_papel", "r_papel : Residuo", [
        "id = 4",
        "nome = \"Papel e Papelão\"",
    ], 1320, 275, 340)

    object_box(d, "r_plastico", "r_plastico : Residuo", [
        "id = 5",
        "nome = \"Plástico\"",
    ], 1320, 375, 340)

    object_box(d, "r_vidro", "r_vidro : Residuo", [
        "id = 6",
        "nome = \"Vidro\"",
    ], 1320, 475, 340)

    object_box(d, "c1", "c1 : Comentario", [
        "id = 1",
        "nomeAutor = \"Maria Silva\"",
        "texto = \"Ponto limpo e bem sinalizado.\"",
        "curtidas = 4",
        "oficial = false",
        "data = 28/10/2026 15:20",
    ], 600, 710, 560)

    # ------------------------------------------------------------------
    # Ligações
    # ------------------------------------------------------------------
    # Administrador gerencia o ponto.
    d.e("l_adm_ponto", "adm", "p401", "gerencia", ASSOC)
    text(d, "m_adm_1", "1", 396, 184, 18, 18, SMALL)
    text(d, "m_adm_n", "0..*", 700, 322, 34, 18, SMALL)

    # Composição: o ponto possui seus horários.
    d.e("l_h_seg", "p401", "h_seg", "horários", COMP)
    d.e("l_h_sab", "p401", "h_sab", "", COMP)
    text(d, "m_h_1", "1", 566, 372, 18, 18, SMALL)
    text(d, "m_h_n", "0..*", 402, 300, 34, 18, SMALL)

    # Associação N:N entre ponto e resíduos.
    d.e("l_r_metal", "p401", "r_metal", "resíduos", ASSOC)
    d.e("l_r_papel", "p401", "r_papel", "", ASSOC)
    d.e("l_r_plastico", "p401", "r_plastico", "", ASSOC)
    d.e("l_r_vidro", "p401", "r_vidro", "", ASSOC)
    text(d, "m_r_1", "*", 1216, 290, 18, 18, SMALL)
    text(d, "m_r_n", "*", 1292, 470, 18, 18, SMALL)

    # Comentário pertence ao ponto.
    d.e("l_comentario", "c1", "p401", "recebe", ASSOC)
    text(d, "m_c_1", "0..*", 860, 680, 34, 18, SMALL)
    text(d, "m_c_n", "1", 848, 566, 18, 18, SMALL)

    # ------------------------------------------------------------------
    # Notas
    # ------------------------------------------------------------------
    text(d, "nota_horarios", (
        "O ponto tem 7 registros de horário (domingo a sábado, 08:00–17:00). "
        "Aqui aparecem segunda e sábado; terça a sexta repetem o mesmo intervalo."
    ), 60, 545, 330, 100, NOTE)

    text(d, "nota_geral", (
        "Dados consultados na base do DF Coleta em 02/11/2026. "
        "O ponto 401 e seus horários e resíduos são reais. "
        "O administrador e o comentário aparecem como exemplos das "
        "associações; a mesma estrutura vale para os demais pontos."
    ), 1230, 690, 430, 120, NOTE)

    out = OUT / "07-objetos" / "objetos.drawio"
    d.save(out)
    return out


if __name__ == "__main__":
    print(gerar())
