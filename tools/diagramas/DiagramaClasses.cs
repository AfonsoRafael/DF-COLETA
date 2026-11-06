/**
 * DiagramaClasses.cs - diagrama de classes do DF Coleta.
 *
 * Alterações em relação ao original (o resto continua igual):
 *  - "APIGoogleMaps" -> "APIMapas" (Leaflet/OpenStreetMap no mapa,
 *    Google Maps só para a rota);
 *  - ProblemaRelato ganhou "severidade" e "status" (existem no código);
 *  - SugestaoPonto ganhou "cidade" e "residuosSugeridos".
 *
 * Ajustes pedidos na revisão do professor:
 *  - as três classes de cima (HorarioFuncionamento, Residuo e StatusPonto)
 *    ligadas por associação simples (saiu o losango de composição, que
 *    também estava do lado errado da linha);
 *  - Comentario ganhou "+ comentar()" e ProblemaRelato ganhou "+ relatar()".
 */

using System;
using System.Collections.Generic;
using System.Drawing;

class DefClasse
{
    public string Titulo;
    public string[] Atributos;
    public string[] Metodos;
    public RectangleF R;
    public bool EhEnumeracao;
}

static class DiagramaClasses
{
    static void Poli(bool tracejada, params PointF[] pts)
    {
        Desenho.Poli(tracejada, pts);
    }

    public static void Gerar(string caminho)
    {
        using (Bitmap bmp = Desenho.Novo(1320, 830))
        {
            // ---------- medidas ----------
            DefClasse horario = Classe("HorarioFuncionamento",
                new string[] { "- id: int", "- diaSemana: String", "- horaAbertura: Time", "- horaFechamento: Time" },
                new string[0], 330, 20, 185);

            DefClasse residuo = Classe("Residuo",
                new string[] { "- id: int", "- nome: String", "- descricao: String" },
                new string[0], 570, 15, 165);

            DefClasse status = Enumeracao("StatusPonto",
                new string[] { "ATIVO", "INATIVO", "EM_ANALISE" }, 825, 15, 190);

            DefClasse ponto = Classe("PontoColeta",
                new string[] { "- id: int", "- nome: String", "- endereco: String", "- cidade: String",
                               "- latitude: Double", "- longitude: Double", "- telefone: String",
                               "- status: StatusPonto" },
                new string[] { "+ exibirDetalhes(): void" }, 570, 250, 170);

            DefClasse admin = Classe("Administrador",
                new string[] { "- id: int", "- nome: String", "- senha: String" },
                new string[] { "+ cadastrarPonto(): void", "+ editarPonto(): void", "+ excluirPonto(): void",
                               "+ sincronizarPontos(): void", "+ gerenciarResiduos(): void" },
                105, 580, 165);

            DefClasse comentario = Classe("Comentario",
                new string[] { "- id: int", "- nomeAutor: String", "- emailAutor: String",
                               "- textoComentario: String", "- data: Date" },
                new string[] { "+ comentar(): void" }, 305, 580, 165);

            DefClasse problema = Classe("ProblemaRelato",
                new string[] { "- id: int", "- nomeAutor: String", "- emailAutor: String",
                               "- textoProblema: String", "- data: Date",
                               "- severidade: String", "- status: String" },
                new string[] { "+ relatar(): void" }, 520, 580, 165);

            DefClasse sugestao = Classe("SugestaoPonto",
                new string[] { "- id: int", "- nomeAutor: String", "- emailAutor: String",
                               "- textoSugestao: String", "- data: Date", "- nomeLocal: String",
                               "- endereco: String", "- cidade: String", "- residuosSugeridos: String" },
                new string[0], 735, 580, 165);

            DefClasse apiExterna = Classe("APIExternaPontos",
                new string[0],
                new string[] { "+ sincronizarPontos(): void" }, 960, 580, 170);

            DefClasse apiMapas = Classe("APIMapas",
                new string[0],
                new string[] { "+ exibirMapa(): void", "+ calcularProximidade(): double", "+ abrirRota(lat, lng): void" },
                1175, 580, 175);

            // ---------- ligações (antes das caixas) ----------
            // Os três de cima ligam por associação simples: sem losango.
            float xHor = horario.R.X + horario.R.Width / 2f;

            Poli(false,
                new PointF(xHor, horario.R.Bottom),
                new PointF(xHor, 295f),
                new PointF(ponto.R.Left, 295f));
            Desenho.RotuloFundo("Possui", 400, 283, Desenho.Rotulo);
            Desenho.Texto("1..*", xHor + 6f, horario.R.Bottom + 4f, Desenho.Rotulo);
            Desenho.Texto("1", ponto.R.Left - 16f, 300f, Desenho.Rotulo);

            float xRes = residuo.R.X + residuo.R.Width / 2f;
            Poli(false, new PointF(xRes, residuo.R.Bottom), new PointF(xRes, ponto.R.Top));
            Desenho.RotuloFundo("Aceita", xRes + 48f, 180f, Desenho.Rotulo);
            Desenho.Texto("*", xRes + 6f, residuo.R.Bottom + 2f, Desenho.Rotulo);
            Desenho.Texto("*", xRes + 6f, ponto.R.Top - 18f, Desenho.Rotulo);

            float xSt = status.R.X + status.R.Width / 2f;
            Poli(false,
                new PointF(xSt, status.R.Bottom),
                new PointF(xSt, 310f),
                new PointF(ponto.R.Right, 310f));
            Desenho.RotuloFundo("Possui status", (xSt + ponto.R.Right) / 2f, 298f, Desenho.Rotulo);

            Poli(false,
                new PointF(admin.R.X + admin.R.Width / 2f, admin.R.Top),
                new PointF(admin.R.X + admin.R.Width / 2f, 390f),
                new PointF(ponto.R.Left, 390f));
            Desenho.RotuloEsq("Gerencia", admin.R.X + admin.R.Width / 2f + 8f, 480f, Desenho.Rotulo);
            Desenho.Texto("1", admin.R.X + admin.R.Width / 2f + 6f, admin.R.Top - 18f, Desenho.Rotulo);
            Desenho.Texto("0..*", ponto.R.Left - 34f, 378f, Desenho.Rotulo);

            Poli(false,
                new PointF(comentario.R.X + comentario.R.Width / 2f, comentario.R.Top),
                new PointF(comentario.R.X + comentario.R.Width / 2f, 420f),
                new PointF(ponto.R.Left, 420f));
            Desenho.RotuloFundo("Refere-se", comentario.R.X + comentario.R.Width / 2f + 45f, 408f, Desenho.Rotulo);
            Desenho.Texto("*", comentario.R.X + comentario.R.Width / 2f + 6f, comentario.R.Top - 18f, Desenho.Rotulo);
            Desenho.Texto("1", ponto.R.Left - 14f, 425f, Desenho.Rotulo);

            float xProb = problema.R.X + problema.R.Width / 2f;
            Poli(false, new PointF(xProb, problema.R.Top), new PointF(xProb, ponto.R.Bottom));
            Desenho.RotuloFundo("Pertence a", xProb + 45f, 520f, Desenho.Rotulo);
            Desenho.Texto("*", xProb + 6f, problema.R.Top - 18f, Desenho.Rotulo);
            Desenho.Texto("1", xProb + 6f, ponto.R.Bottom + 4f, Desenho.Rotulo);

            float xSug = sugestao.R.X + sugestao.R.Width / 2f;
            Poli(true,
                new PointF(xSug, sugestao.R.Top),
                new PointF(xSug, 425f),
                new PointF(ponto.R.Right, 425f));
            Desenho.Ponta(new PointF(ponto.R.Right, 425f), new PointF(xSug, 425f));
            Desenho.RotuloEsq("Pode originar", xSug + 8f, 505f, Desenho.Rotulo);
            Desenho.Texto("*", xSug + 6f, sugestao.R.Top - 18f, Desenho.Rotulo);
            Desenho.Texto("0..1", ponto.R.Right + 6f, 408f, Desenho.Rotulo);

            float xApiExt = apiExterna.R.X + apiExterna.R.Width / 2f;
            Poli(true,
                new PointF(xApiExt, apiExterna.R.Top),
                new PointF(xApiExt, 390f),
                new PointF(ponto.R.Right, 390f));
            Desenho.Ponta(new PointF(ponto.R.Right, 390f), new PointF(xApiExt, 390f));
            Desenho.RotuloFundo("Sincroniza", 790f, 378f, Desenho.Rotulo);

            float xApiMapa = apiMapas.R.X + apiMapas.R.Width / 2f;
            Poli(true,
                new PointF(xApiMapa, apiMapas.R.Top),
                new PointF(xApiMapa, 350f),
                new PointF(ponto.R.Right, 350f));
            Desenho.Ponta(new PointF(ponto.R.Right, 350f), new PointF(xApiMapa, 350f));
            Desenho.RotuloFundo("Localiza", 1000f, 338f, Desenho.Rotulo);

            // ---------- caixas ----------
            Desenhar(horario);
            Desenhar(residuo);
            Desenhar(status);
            Desenhar(ponto);
            Desenhar(admin);
            Desenhar(comentario);
            Desenhar(problema);
            Desenhar(sugestao);
            Desenhar(apiExterna);
            Desenhar(apiMapas);

            Desenho.Salvar(bmp, caminho);
        }
    }

    static DefClasse Classe(string titulo, string[] atributos, string[] metodos, float cx, float topo, float minLargura)
    {
        float largura = Math.Max(minLargura, Desenho.G.MeasureString(titulo, Desenho.Titulo).Width + 26f);
        foreach (string a in atributos) largura = Math.Max(largura, Desenho.G.MeasureString(a, Desenho.CorpoMenor).Width + 18f);
        foreach (string m in metodos) largura = Math.Max(largura, Desenho.G.MeasureString(m, Desenho.CorpoMenor).Width + 18f);

        float altura = 34f + atributos.Length * 17f + 8f;
        if (metodos.Length > 0) altura += metodos.Length * 17f + 12f;
        altura += 2f;

        DefClasse d = new DefClasse();
        d.Titulo = titulo; d.Atributos = atributos; d.Metodos = metodos;
        d.R = new RectangleF(cx - largura / 2f, topo, largura, altura);
        return d;
    }

    static DefClasse Enumeracao(string nome, string[] valores, float cx, float topo, float minLargura)
    {
        float largura = Math.Max(minLargura, Desenho.G.MeasureString(nome, Desenho.Titulo).Width + 26f);
        largura = Math.Max(largura, Desenho.G.MeasureString("<<enumeration>>", Desenho.Estereo).Width + 24f);
        foreach (string v in valores) largura = Math.Max(largura, Desenho.G.MeasureString(v, Desenho.CorpoMenor).Width + 18f);

        float altura = 40f + 8f + valores.Length * 17f + 6f;

        DefClasse d = new DefClasse();
        d.Titulo = nome; d.Atributos = valores; d.Metodos = new string[0];
        d.EhEnumeracao = true;
        d.R = new RectangleF(cx - largura / 2f, topo, largura, altura);
        return d;
    }

    static void Desenhar(DefClasse d)
    {
        RectangleF r = d.R;
        Desenho.G.FillRectangle(Brushes.White, r);
        Desenho.G.DrawRectangle(Desenho.Caneta, r.X, r.Y, r.Width, r.Height);

        if (d.EhEnumeracao)
        {
            // enumeração: estereótipo + nome
            Desenho.TextoCentro("«enumeration»", r.X + r.Width / 2f, r.Y + 3f, Desenho.Estereo);
            Desenho.TextoCentro(d.Titulo, r.X + r.Width / 2f, r.Y + 18f, Desenho.Titulo);
            Desenho.Linha(r.X, r.Y + 38f, r.Right, r.Y + 38f);
            for (int i = 0; i < d.Atributos.Length; i++)
                Desenho.Texto(d.Atributos[i], r.X + 9f, r.Y + 44f + i * 17f, Desenho.CorpoMenor);
            return;
        }

        Desenho.TextoCentro(d.Titulo, r.X + r.Width / 2f, r.Y + 7f, Desenho.Titulo);
        Desenho.Linha(r.X, r.Y + 32f, r.Right, r.Y + 32f);

        float y = r.Y + 37f;
        for (int i = 0; i < d.Atributos.Length; i++)
            Desenho.Texto(d.Atributos[i], r.X + 8f, y + i * 17f, Desenho.CorpoMenor);

        if (d.Metodos.Length > 0)
        {
            float yDiv;
            if (d.Atributos.Length > 0)
            {
                yDiv = y + d.Atributos.Length * 17f + 4f;
                Desenho.Linha(r.X, yDiv, r.Right, yDiv);
            }
            else
            {
                yDiv = r.Y + 32f;   // a linha do título já separa
            }

            for (int i = 0; i < d.Metodos.Length; i++)
                Desenho.Texto(d.Metodos[i], r.X + 8f, yDiv + 4f + i * 17f, Desenho.CorpoMenor);
        }
    }

    static void Losango(PointF topo)
    {
        PointF[] pts = new PointF[]
        {
            new PointF(topo.X, topo.Y),
            new PointF(topo.X + 5f, topo.Y + 8f),
            new PointF(topo.X, topo.Y + 16f),
            new PointF(topo.X - 5f, topo.Y + 8f)
        };
        Desenho.G.FillPolygon(Brushes.Black, pts);
    }
}
