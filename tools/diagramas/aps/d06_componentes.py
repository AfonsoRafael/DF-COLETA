"""06 — Diagrama de componentes do DF Coleta."""

from pathlib import Path

from lib_drawio import (
    BAND, COMPONENT, DEP, Diagram, NOTE, OUT, ROUND, SMALL, text,
)

DASHED = ("endArrow=open;endFill=0;dashed=1;html=1;fontFamily=Arial;"
          "fontSize=10;fontColor=#000000;")


def gerar() -> Path:
    d = Diagram("componentes", 1900, 1140, "Componentes — DF Coleta")

    # ------------------------------------------------------------------
    # Camadas
    # ------------------------------------------------------------------
    d.v("band_front", "Camada de apresentação", 40, 40, 1240, 300, BAND)
    d.v("band_app", "Camada de aplicação", 40, 380, 1240, 380, BAND)
    d.v("band_data", "Camada de dados", 40, 800, 1240, 280, BAND)
    d.v("band_ext", "Serviços externos", 1320, 40, 540, 720, BAND)

    # ------------------------------------------------------------------
    # Apresentação
    # ------------------------------------------------------------------
    d.v("paginas", "Páginas Públicas\nhome · lista · detalhe · sobre · sugestão",
        90, 90, 300, 100, COMPONENT)
    d.v("painel", "Painel Administrativo\n7 telas de gestão",
        450, 90, 300, 100, COMPONENT)
    d.v("mapajs", "mapa.js\n(Leaflet)",
        810, 90, 250, 100, COMPONENT)

    d.v("apijs", "api.js\n(cliente HTTP)",
        450, 235, 300, 75, COMPONENT)

    text(d, "nota_login", (
        "O painel autentica no Supabase Auth. O token volta para o navegador e "
        "segue em cada requisição (Bearer); a API valida a sessão antes de "
        "qualquer escrita."
    ), 80, 232, 320, 92, NOTE)

    # ------------------------------------------------------------------
    # Aplicação
    # ------------------------------------------------------------------
    d.v("api", "API DF Coleta\n(serverless na Vercel)\nREST /api/*",
        370, 470, 430, 240, COMPONENT)

    text(d, "lbl_ifaces", "Interfaces providas pela API", 860, 425, 380, 22, SMALL)

    d.v("ipontos", (
        "<b>«interface»</b><br><b>IPontosColeta</b><br>"
        "<font style='font-size:10'>+ listar() · buscarPorId()<br>"
        "+ criar() · atualizar() · alterarStatus()</font>"
    ), 860, 455, 380, 85, ROUND, raw=True)

    d.v("icontrib", (
        "<b>«interface»</b><br><b>IContribuicoes</b><br>"
        "<font style='font-size:10'>+ comentar() · relatarProblema()<br>"
        "+ sugerir() · moderar()</font>"
    ), 860, 560, 380, 85, ROUND, raw=True)

    d.v("iind", (
        "<b>«interface»</b><br><b>IIndicadores</b><br>"
        "<font style='font-size:10'>+ obterResumo()</font>"
    ), 860, 665, 380, 65, ROUND, raw=True)

    # ------------------------------------------------------------------
    # Dados
    # ------------------------------------------------------------------
    d.v("supabase", (
        "<b>Supabase Postgres</b><br>"
        "<font style='font-size:10'>pontos_coleta · residuos · ponto_residuos<br>"
        "horarios_funcionamento · comentarios<br>"
        "problemas · sugestoes<br>"
        "view pontos_coleta_completo · RLS</font>"
    ), 160, 855, 640, 185, COMPONENT, raw=True)

    text(d, "nota_deploy", (
        "Frontend estático e função serverless publicados na Vercel. "
        "O Supabase guarda os dados e aplica as políticas de RLS."
    ), 880, 860, 350, 170, NOTE)

    # ------------------------------------------------------------------
    # Serviços externos
    # ------------------------------------------------------------------
    d.v("apiext", "API Externa de Pontos\n(prevista)",
        1360, 400, 460, 120, COMPONENT)

    d.v("osm", "OpenStreetMap\n(tiles do mapa)",
        1360, 90, 460, 100, COMPONENT)

    d.v("gmaps", "Google Maps Rotas\n(abrir trajeto)",
        1360, 220, 460, 100, COMPONENT)

    text(d, "nota_ext", (
        "A integração com a API externa de pontos é prevista. "
        "Hoje a base oficial é importada para o Supabase."
    ), 1360, 560, 460, 90, NOTE)

    # ------------------------------------------------------------------
    # Dependências
    # ------------------------------------------------------------------
    d.e("dep_paginas", "paginas", "apijs", "HTTP", DEP,
        points=[(240, 215), (410, 215), (410, 272), (450, 272)])
    d.e("dep_painel", "painel", "apijs", "", DEP)

    d.e("dep_apijs_api", "apijs", "api", "HTTPS / JSON", DEP)
    d.e("dep_api_supa", "api", "supabase", "", DEP)
    text(d, "lbl_sql", "SQL", 556, 772, 40, 18, SMALL)

    d.e("dep_mapa_osm", "mapajs", "osm", "tiles", DEP,
        points=[(1060, 120), (1280, 120), (1280, 140), (1360, 140)])
    d.e("dep_mapa_gmaps", "mapajs", "gmaps", "rota", DEP,
        points=[(1060, 170), (1280, 170), (1280, 270), (1360, 270)])

    # A API realiza (provê) as três interfaces.
    d.e("real_ipontos", "api", "ipontos", "«provê»", DASHED, points=[(832, 497)])
    d.e("real_icontrib", "api", "icontrib", "", DASHED, points=[(832, 602)])
    d.e("real_iind", "api", "iind", "", DASHED, points=[(832, 697)])

    # Integração prevista com a API externa.
    d.e("dep_apiext", "api", "apiext", "", DEP,
        points=[(800, 690), (830, 690), (830, 745), (1295, 745),
                (1295, 460), (1360, 460)])

    out = OUT / "06-componentes" / "componentes.drawio"
    d.save(out)
    return out


if __name__ == "__main__":
    print(gerar())
