/**
 * Desenho.cs - utilitarios de desenho (estilo dos diagramas originais:
 * fundo branco, traco preto fino, Arial, atores em palito).
 */

using System;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.Drawing.Text;

static class Desenho
{
    public const float S = 2f;                  // PNG em 2x, mais nitido
    public static Graphics G;

    public static readonly Font Corpo      = new Font("Arial", 13f,   FontStyle.Regular, GraphicsUnit.Pixel);
    public static readonly Font CorpoMenor = new Font("Arial", 12f,   FontStyle.Regular, GraphicsUnit.Pixel);
    public static readonly Font Titulo     = new Font("Arial", 13.5f, FontStyle.Bold,    GraphicsUnit.Pixel);
    public static readonly Font Negrito    = new Font("Arial", 13f,   FontStyle.Bold,    GraphicsUnit.Pixel);
    public static readonly Font Rotulo     = new Font("Arial", 11f,   FontStyle.Regular, GraphicsUnit.Pixel);
    public static readonly Font Pequena    = new Font("Arial", 10f,   FontStyle.Regular, GraphicsUnit.Pixel);
    public static readonly Font Estereo    = new Font("Arial", 10.5f, FontStyle.Regular, GraphicsUnit.Pixel);

    public static readonly Pen Caneta = new Pen(Color.Black, 1f);

    public static Bitmap Novo(int largura, int altura)
    {
        Bitmap bmp = new Bitmap((int)(largura * S), (int)(altura * S));
        G = Graphics.FromImage(bmp);
        G.SmoothingMode = SmoothingMode.AntiAlias;
        G.TextRenderingHint = TextRenderingHint.AntiAlias;
        G.PixelOffsetMode = PixelOffsetMode.HighQuality;
        G.Clear(Color.White);
        G.ScaleTransform(S, S);
        return bmp;
    }

    public static void Salvar(Bitmap bmp, string caminho)
    {
        bmp.Save(caminho, ImageFormat.Png);
        bmp.Dispose();
    }

    public static void Linha(float x1, float y1, float x2, float y2)
    {
        G.DrawLine(Caneta, x1, y1, x2, y2);
    }

    public static void LinhaTracejada(float x1, float y1, float x2, float y2)
    {
        using (Pen p = new Pen(Color.Black, 1f))
        {
            p.DashStyle = DashStyle.Dash;
            p.DashPattern = new float[] { 4f, 3f };
            G.DrawLine(p, x1, y1, x2, y2);
        }
    }

    public static void Poli(bool tracejada, params PointF[] pts)
    {
        for (int i = 0; i < pts.Length - 1; i++)
        {
            if (tracejada) LinhaTracejada(pts[i].X, pts[i].Y, pts[i + 1].X, pts[i + 1].Y);
            else Linha(pts[i].X, pts[i].Y, pts[i + 1].X, pts[i + 1].Y);
        }
    }

    /** Ponta de seta aberta, na extremidade "ponta", vinda de "origem". */
    public static void Ponta(PointF ponta, PointF origem)
    {
        double ang = Math.Atan2(ponta.Y - origem.Y, ponta.X - origem.X);
        float comp = 9f;
        for (int i = -1; i <= 1; i += 2)
        {
            double a = ang + Math.PI + i * 0.40;
            PointF p = new PointF(
                (float)(ponta.X + comp * Math.Cos(a)),
                (float)(ponta.Y + comp * Math.Sin(a)));
            Linha(ponta.X, ponta.Y, p.X, p.Y);
        }
    }

    public static void Texto(string s, float x, float y, Font f)
    {
        G.DrawString(s, f, Brushes.Black, x, y);
    }

    public static void TextoCentro(string s, float cx, float y, Font f)
    {
        SizeF m = G.MeasureString(s, f);
        G.DrawString(s, f, Brushes.Black, cx - m.Width / 2f, y);
    }

    /** Rotulo com fundo branco, para ficar por cima das linhas. */
    public static void RotuloFundo(string s, float cx, float cy, Font f)
    {
        SizeF m = G.MeasureString(s, f);
        G.FillRectangle(Brushes.White, cx - m.Width / 2f - 2f, cy - m.Height / 2f, m.Width + 4f, m.Height);
        G.DrawString(s, f, Brushes.Black, cx - m.Width / 2f, cy - m.Height / 2f);
    }

    public static void RotuloEsq(string s, float x, float cy, Font f)
    {
        SizeF m = G.MeasureString(s, f);
        G.FillRectangle(Brushes.White, x - 2f, cy - m.Height / 2f, m.Width + 4f, m.Height);
        G.DrawString(s, f, Brushes.Black, x, cy - m.Height / 2f);
    }

    public static PointF Centro(RectangleF r)
    {
        return new PointF(r.X + r.Width / 2f, r.Y + r.Height / 2f);
    }

    /** Ponto da borda da elipse na direcao de "alvo". */
    public static PointF BordaElipse(RectangleF r, PointF alvo)
    {
        float cx = r.X + r.Width / 2f, cy = r.Y + r.Height / 2f;
        float dx = alvo.X - cx, dy = alvo.Y - cy;
        float a = r.Width / 2f, b = r.Height / 2f;
        if (dx == 0 && dy == 0) return new PointF(cx, cy);
        float t = (float)(1.0 / Math.Sqrt((dx * dx) / (a * a) + (dy * dy) / (b * b)));
        return new PointF(cx + dx * t, cy + dy * t);
    }

    /** Ator em palito; (x, y) e o topo da cabeca. Devolve a ancora das linhas. */
    public static PointF Ator(float x, float y, string nome)
    {
        G.DrawEllipse(Caneta, x - 9f, y, 18f, 18f);
        Linha(x, y + 18f, x, y + 46f);
        Linha(x - 17f, y + 30f, x + 17f, y + 30f);
        Linha(x - 14f, y + 68f, x, y + 46f);
        Linha(x + 14f, y + 68f, x, y + 46f);

        string[] partes = nome.Split('\n');
        for (int i = 0; i < partes.Length; i++)
            TextoCentro(partes[i], x, y + 74f + i * 14f, Corpo);

        return new PointF(x, y + 30f);
    }

    /** Moldura do sistema, com a aba de titulo no canto. */
    public static void Moldura(float x, float y, float w, float h, string titulo)
    {
        G.DrawRectangle(Caneta, x, y, w, h);
        float larguraAba = Math.Max(70f, G.MeasureString(titulo, Pequena).Width + 16f);
        G.FillRectangle(Brushes.White, x, y, larguraAba, 17f);
        G.DrawRectangle(Caneta, x, y, larguraAba, 17f);
        TextoCentro(titulo, x + larguraAba / 2f, y + 2f, Pequena);
    }
}
