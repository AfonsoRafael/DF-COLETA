/**
 * DiagramaCasos.cs - diagrama de casos de uso do DF Coleta.
 *
 * Alterações em relação ao diagrama original (todo o resto é igual):
 *  - ator "API Google Maps" -> "API de Mapas" (o mapa é Leaflet/OpenStreetMap);
 *  - caso "Visualizar localização no Google Maps" -> "Traçar rota no Google Maps";
 *  - novo caso "Autenticar-se" (include de "Acessar página de controle");
 *  - moldura identificada com o nome do sistema.
 */

using System;
using System.Collections.Generic;
using System.Drawing;

static class DiagramaCasos
{
    static readonly Dictionary<string, RectangleF> UCs = new Dictionary<string, RectangleF>();
    static readonly Dictionary<string, string[]> Textos = new Dictionary<string, string[]>();
    static readonly List<PointF> PosRotulos = new List<PointF>();
    static readonly List<string> Rotulos = new List<string>();

    public static void Gerar(string caminho)
    {
        PointF usuario    = new PointF(45, 330);
        PointF admin      = new PointF(54, 1090);
        PointF apiMapas   = new PointF(1015, 160);
        PointF apiExterna = new PointF(1015, 1300);

        using (Bitmap bmp = Desenho.Novo(1120, 1600))
        {
            Desenho.Moldura(95, 10, 860, 1560, "DF Coleta");

            // ---------- casos de uso (apenas mede e guarda) ----------
            UC("u1",  205,   60, "Visualizar informações", "sobre o projeto");
            UC("u2",  205,  150, "Visualizar tipos de", "resíduos aceitos");
            UC("u3",  200,  255, "Visualizar pontos de coleta");
            UC("u4",  465,  200, "Visualizar detalhes do", "ponto");
            UC("u5",  780,  170, "Traçar rota no", "Google Maps");
            UC("u6",  650,  255, "Exibir pontos no mapa");
            UC("u7",  465,  305, "Ordenar por", "proximidade");
            UC("u8",  200,  385, "Realizar pesquisa");
            UC("u9",  465,  350, "Pesquisar endereço");
            UC("u10", 465,  410, "Pesquisar por nome");
            UC("u11", 200,  540, "Realizar filtro");
            UC("u12", 465,  495, "Filtrar por tipo", "de resíduo");
            UC("u13", 465,  557, "Filtrar por cidade");
            UC("u14", 465,  619, "Filtrar por", "estabelecimento");
            UC("u15", 200,  660, "Enviar comentário");
            UC("u16", 200,  740, "Reportar problema");
            UC("u17", 200,  820, "Sugerir novo ponto");
            UC("u18", 200,  910, "Acessar página de", "controle");
            UC("u19", 350, 1000, "Autenticar-se");
            UC("u20", 510,  910, "Visualizar dashboard");
            UC("u21", 755,  860, "Visualizar comentários");
            UC("u22", 755,  940, "Visualizar problemas", "relatados");
            UC("u23", 755, 1020, "Analisar sugestões de", "novos pontos");
            UC("u24", 205, 1135, "Gerenciar pontos de", "coleta");
            UC("u25", 515, 1030, "Cadastrar pontos de", "coleta");
            UC("u26", 515, 1090, "Editar pontos de coleta");
            UC("u27", 515, 1150, "Gerenciar horários");
            UC("u28", 515, 1210, "Ativar/desativar ponto");
            UC("u29", 515, 1270, "Excluir pontos de coleta");
            UC("u30", 505, 1335, "Sincronizar pontos de", "coleta");
            UC("u31", 235, 1440, "Gerenciar tipos de", "resíduos");
            UC("u32", 530, 1400, "Cadastrar tipo de resíduo");
            UC("u33", 530, 1458, "Editar tipo de resíduo");
            UC("u34", 530, 1516, "Excluir tipo de resíduo");

            // ---------- ligações ----------
            string[] publicos = { "u1", "u2", "u3", "u8", "u11", "u15", "u16", "u17" };
            foreach (string id in publicos) LinhaAtor(usuario, id);

            string[] doAdmin = { "u18", "u24", "u30", "u31" };
            foreach (string id in doAdmin) LinhaAtor(admin, id);

            Incluir("u4", "u3", "Extends");
            Incluir("u3", "u6", "Include");
            Incluir("u4", "u5", "Include");
            Incluir("u7", "u3", "Extends");
            Incluir("u8", "u9", "Include");
            Incluir("u8", "u10", "Include");
            Incluir("u11", "u12", "Include");
            Incluir("u11", "u13", "Include");
            Incluir("u11", "u14", "Include");
            Incluir("u18", "u20", "Include");
            Incluir("u18", "u19", "Include", new PointF(300, 958));
            Incluir("u20", "u21", "Extends");
            Incluir("u20", "u22", "Extends");
            Incluir("u20", "u23", "Extends");
            Incluir("u24", "u25", "Include");
            Incluir("u24", "u26", "Include");
            Incluir("u24", "u27", "Include");
            Incluir("u24", "u28", "Include");
            Incluir("u24", "u29", "Include");
            Incluir("u31", "u32", "Include");
            Incluir("u31", "u33", "Include");
            Incluir("u31", "u34", "Include");

            LinhaApi(apiMapas, "u6");
            LinhaApi(apiMapas, "u5");
            LinhaApi(apiExterna, "u30");

            // ---------- elipses (por cima das linhas) ----------
            foreach (KeyValuePair<string, RectangleF> par in UCs)
            {
                Desenho.G.FillEllipse(Brushes.White, par.Value);
                Desenho.G.DrawEllipse(Desenho.Caneta, par.Value);
                TextoUC(par.Key);
            }

            // ---------- rótulos dos include/extends (por cima das elipses) ----------
            for (int i = 0; i < Rotulos.Count; i++)
                Desenho.RotuloFundo(Rotulos[i], PosRotulos[i].X, PosRotulos[i].Y, Desenho.Rotulo);

            // ---------- atores (por cima de tudo) ----------
            Desenho.Ator(usuario.X, usuario.Y, "Usuário");
            Desenho.Ator(admin.X, admin.Y, "Administrador");
            Desenho.Ator(apiMapas.X, apiMapas.Y, "API de Mapas");
            Desenho.Ator(apiExterna.X, apiExterna.Y, "API externa de\npontos de coleta");

            Desenho.Salvar(bmp, caminho);
        }
    }

    static void UC(string id, float cx, float cy, params string[] linhas)
    {
        float largura = 0f;
        foreach (string l in linhas) largura = Math.Max(largura, Desenho.G.MeasureString(l, Desenho.Corpo).Width);
        largura += 46f;
        if (largura < 96f) largura = 96f;

        float altura = linhas.Length * 17f + 26f;
        if (altura < 54f) altura = 54f;

        UCs[id] = new RectangleF(cx - largura / 2f, cy - altura / 2f, largura, altura);
        Textos[id] = linhas;
    }

    static void TextoUC(string id)
    {
        RectangleF r = UCs[id];
        string[] linhas = Textos[id];
        float y0 = r.Y + (r.Height - linhas.Length * 17f) / 2f;

        StringFormat sf = new StringFormat();
        sf.Alignment = StringAlignment.Center;
        sf.LineAlignment = StringAlignment.Center;

        for (int i = 0; i < linhas.Length; i++)
        {
            RectangleF faixa = new RectangleF(r.X, y0 + i * 17f, r.Width, 17f);
            Desenho.G.DrawString(linhas[i], Desenho.Corpo, Brushes.Black, faixa, sf);
        }
    }

    static void LinhaAtor(PointF ator, string id)
    {
        RectangleF uc = UCs[id];
        PointF borda = Desenho.BordaElipse(uc, ator);
        PointF origem = new PointF(ator.X + (ator.X < 500 ? 18f : -18f), ator.Y);
        Desenho.Linha(origem.X, origem.Y, borda.X, borda.Y);
    }

    static void LinhaApi(PointF api, string id)
    {
        RectangleF uc = UCs[id];
        PointF borda = Desenho.BordaElipse(uc, api);
        PointF origem = new PointF(api.X - 18f, api.Y);
        Desenho.Linha(origem.X, origem.Y, borda.X, borda.Y);
    }

    static void Incluir(string de, string para, string rotulo)
    {
        Incluir(de, para, rotulo, new PointF(-1, -1));
    }

    static void Incluir(string de, string para, string rotulo, PointF onde)
    {
        RectangleF a = UCs[de], b = UCs[para];
        PointF ca = Desenho.Centro(a), cb = Desenho.Centro(b);
        PointF pa = Desenho.BordaElipse(a, cb);
        PointF pb = Desenho.BordaElipse(b, ca);

        Desenho.LinhaTracejada(pa.X, pa.Y, pb.X, pb.Y);
        Desenho.Ponta(pb, pa);

        float mx = onde.X < 0 ? (pa.X + pb.X) / 2f : onde.X;
        float my = onde.Y < 0 ? (pa.Y + pb.Y) / 2f - 9f : onde.Y;
        PosRotulos.Add(new PointF(mx, my));
        Rotulos.Add(rotulo);
    }
}
