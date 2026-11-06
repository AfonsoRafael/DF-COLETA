/**
 * Programa.cs - gera os dois diagramas revisados do DF Coleta.
 *
 * Compilar (a partir da raiz do projeto):
 *   csc /nologo /target:exe /codepage:65001 /out:tools\diagramas\GerarDiagramas.exe ^
 *       tools\diagramas\Desenho.cs tools\diagramas\DiagramaCasos.cs ^
 *       tools\diagramas\DiagramaClasses.cs tools\diagramas\Programa.cs ^
 *       /r:System.Drawing.dll
 */

using System;
using System.IO;

static class Programa
{
    static void Main()
    {
        string pasta = Path.Combine("docs", "diagramas");
        if (!Directory.Exists(pasta)) Directory.CreateDirectory(pasta);

        string casos = Path.Combine(pasta, "caso-de-uso.png");
        string classes = Path.Combine(pasta, "classes.png");

        DiagramaCasos.Gerar(casos);
        DiagramaClasses.Gerar(classes);

        Console.WriteLine("Gerado: " + casos);
        Console.WriteLine("Gerado: " + classes);
    }
}
