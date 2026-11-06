"""03 — Diagrama de atividades: consultar pontos e traçar rota."""

from pathlib import Path

from lib_drawio import (
    DIAMOND, Diagram, FLOW, LANE, NOTE, OUT, ROUND, SMALL, text,
)

STRAIGHT = ("endArrow=block;endFill=1;html=1;fontFamily=Arial;"
            "fontSize=10;fontColor=#000000;")


def gerar() -> Path:
    d = Diagram("atividades", 1750, 1300, "Atividades — consulta e rota")

    lanes = [
        ("lane_c", "Cidadão", 30, 40, 300, 1220),
        ("lane_i", "Interface web", 350, 40, 420, 1220),
        ("lane_a", "API DF Coleta", 790, 40, 340, 1220),
        ("lane_s", "Supabase", 1150, 40, 260, 1220),
        ("lane_m", "API de Mapas", 1430, 40, 280, 1220),
    ]
    for ident, label, x, y, w, h in lanes:
        d.v(ident, label, x, y, w, h,
            LANE + "fontStyle=1;verticalAlign=top;spacingTop=10;")

    def act(ident, label, x, y, w, h):
        d.v(ident, label, x, y, w, h, ROUND)

    def decision(ident, label, x, y, w, h):
        d.v(ident, label, x, y, w, h, DIAMOND)

    def start(ident, x, y):
        d.v(ident, "", x, y, 36, 36,
            "ellipse;fillColor=#000000;strokeColor=#000000;html=1;")

    def end(ident, x, y):
        d.v(ident + "_out", "", x, y, 36, 36,
            "ellipse;fillColor=none;strokeColor=#000000;strokeWidth=2;html=1;")
        d.v(ident + "_in", "", x + 9, y + 9, 18, 18,
            "ellipse;fillColor=#000000;strokeColor=#000000;html=1;")

    def bar(ident, x, y, w, h):
        d.v(ident, "", x, y, w, h,
            "rounded=0;fillColor=#000000;strokeColor=#000000;html=1;")

    # Fluxo principal
    start("inicio", 162, 70)
    act("c_access", "Acessar a home", 70, 120, 220, 50)
    act("i_load", "Carregar a página e preparar as requisições", 390, 190, 340, 55)

    bar("fork", 810, 270, 280, 8)
    act("a_points", "GET /pontos-coleta", 810, 300, 130, 55)
    act("a_res", "GET /residuos", 960, 300, 130, 55)
    bar("join", 810, 380, 280, 8)

    act("s_query", "Consultar pontos ativos e resíduos", 1170, 350, 220, 60)
    act("a_return", "Retornar JSON", 830, 490, 240, 50)

    decision("i_dec_api", "API respondeu?", 510, 480, 140, 80)
    act("i_fallback", "Usar DADOS_FALLBACK", 380, 590, 180, 50)
    act("i_render", "Renderizar mapa, destaques e filtros", 580, 590, 230, 60)

    act("c_search", "Buscar / filtrar / ordenar", 70, 680, 220, 55)
    act("i_filter", "Filtrar e ordenar em memória", 580, 680, 230, 55)
    decision("i_dec_results", "Há resultados?", 620, 760, 150, 80)
    act("i_empty", "Exibir estado vazio", 390, 960, 180, 50)
    end("fim_vazio", 462, 1030)

    act("c_select", "Selecionar ponto", 70, 870, 220, 55)
    act("i_detail", "Abrir detalhe e pedir comentários", 580, 870, 230, 55)
    act("a_detail", "GET /pontos-coleta/{id}\n+ /comentarios", 810, 950, 250, 60)
    act("s_return", "Retornar ponto e comentários", 1170, 950, 220, 60)
    act("i_display", "Exibir detalhe, horários e resíduos", 580, 1040, 230, 60)

    decision("c_dec_route", "Traçar rota?", 540, 1130, 150, 80)
    act("m_maps", "Abrir Google Maps", 1450, 1145, 240, 55)
    end("fim_rota", 1552, 1210)
    end("fim_sem_rota", 597, 1222)

    # Ligações
    d.e("e_start", "inicio", "c_access")
    d.e("e_access", "c_access", "i_load")
    d.e("e_load_fork", "i_load", "fork", "", FLOW,
        points=[(560, 258), (950, 258)])
    d.e("e_fork_points", "fork", "a_points", "", FLOW)
    d.e("e_fork_res", "fork", "a_res", "", FLOW)
    d.e("e_points_join", "a_points", "join", "", FLOW)
    d.e("e_res_join", "a_res", "join", "", FLOW)

    d.e("e_join_s", "join", "s_query", "", STRAIGHT)
    d.e("e_s_return", "s_query", "a_return", "", FLOW,
        points=[(1280, 515)])
    d.e("e_return_dec", "a_return", "i_dec_api", "", STRAIGHT)

    d.e("e_dec_yes", "i_dec_api", "i_render", "", FLOW,
        points=[(580, 560), (695, 590)])
    d.e("e_dec_no", "i_dec_api", "i_fallback", "", FLOW,
        points=[(510, 520), (470, 590)])
    d.e("e_fallback_render", "i_fallback", "i_render", "", FLOW,
        points=[(470, 620), (580, 620)])
    text(d, "lbl_api_sim", "[sim]", 579, 556, 44, 18, SMALL)
    text(d, "lbl_api_nao", "[não]", 455, 548, 44, 18, SMALL)

    d.e("e_render_search", "i_render", "c_search", "", FLOW,
        points=[(695, 665), (180, 665)])
    d.e("e_search_filter", "c_search", "i_filter")
    d.e("e_filter_dec", "i_filter", "i_dec_results")

    d.e("e_dec_results_yes", "i_dec_results", "c_select", "", FLOW,
        points=[(695, 850), (180, 850)])
    d.e("e_dec_results_no", "i_dec_results", "i_empty", "", FLOW,
        points=[(620, 800), (480, 800), (480, 960)])
    d.e("e_empty_end", "i_empty", "fim_vazio")
    text(d, "lbl_res_sim", "[sim]", 593, 840, 44, 18, SMALL)
    text(d, "lbl_res_nao", "[não]", 498, 778, 44, 18, SMALL)

    d.e("e_select_detail", "c_select", "i_detail", "", STRAIGHT)
    d.e("e_detail_api", "i_detail", "a_detail", "", FLOW,
        points=[(810, 897), (935, 897)])
    d.e("e_detail_s", "a_detail", "s_return", "", STRAIGHT)
    d.e("e_s_display", "s_return", "i_display", "", FLOW,
        points=[(1280, 1070)])
    d.e("e_display_dec", "i_display", "c_dec_route", "", FLOW)
    d.e("e_route_yes", "c_dec_route", "m_maps", "", STRAIGHT)
    d.e("e_route_no", "c_dec_route", "fim_sem_rota", "", FLOW)
    d.e("e_maps_end", "m_maps", "fim_rota")

    text(d, "lbl_rota_sim", "[sim]", 693, 1152, 44, 18, SMALL)
    text(d, "lbl_rota_nao", "[não]", 642, 1214, 44, 18, SMALL)

    text(d, "nota_mapa", (
        "O mapa do site é Leaflet + OpenStreetMap. "
        "O Google Maps é aberto em nova aba apenas para o trajeto. "
        "As duas chamadas iniciais rodam em paralelo (Promise.all)."
    ), 1440, 900, 260, 120, NOTE)

    out = OUT / "03-atividades" / "atividades.drawio"
    d.save(out)
    return out


if __name__ == "__main__":
    print(gerar())
