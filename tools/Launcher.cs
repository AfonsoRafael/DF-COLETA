// ============================================================================
//  DF-Coleta.exe — abre o painel de controle do DF Coleta (tools\DF-Coleta.ps1)
// ----------------------------------------------------------------------------
//  Este arquivo é só o empacotador: ele localiza o script PowerShell que fica
//  ao lado do executável e o executa no mesmo console, repassando os
//  argumentos. Assim você tem um .exe de verdade, sem instalar nada.
//
//  Como compilar (o csc.exe já vem no Windows):
//    "C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe" ^
//        /nologo /target:exe /optimize+ /codepage:65001 ^
//        /win32icon:"tools\df-coleta.ico" ^
//        /out:"DF-Coleta.exe" "tools\Launcher.cs"
// ============================================================================

using System;
using System.Diagnostics;
using System.IO;
using System.Reflection;
using System.Text;

[assembly: AssemblyTitle("DF Coleta")]
[assembly: AssemblyProduct("DF Coleta")]
[assembly: AssemblyDescription("Central de controle do DF Coleta (servidores + QR Code)")]
[assembly: AssemblyCompany("DF Coleta")]
[assembly: AssemblyVersion("1.0.0.0")]
[assembly: AssemblyFileVersion("1.0.0.0")]

internal static class Iniciador
{
    private const string NomeScript = "DF-Coleta.ps1";

    private static int Main(string[] args)
    {
        Console.OutputEncoding = Encoding.UTF8;
        Console.Title = "DF Coleta — central de controle";

        string pasta = AppDomain.CurrentDomain.BaseDirectory;
        string script = Path.Combine(pasta, "tools", NomeScript);

        if (!File.Exists(script))
        {
            Console.Error.WriteLine("Não encontrei o painel de controle:");
            Console.Error.WriteLine("   " + script);
            Console.Error.WriteLine();
            Console.Error.WriteLine("Mantenha o DF-Coleta.exe na pasta raiz do projeto, junto da pasta 'tools'.");
            return Parar(1);
        }

        string argumentos = "-NoProfile -ExecutionPolicy Bypass -File \"" + script + "\"";
        foreach (string argumento in args)
        {
            argumentos += " " + (argumento.IndexOf(' ') >= 0 ? "\"" + argumento + "\"" : argumento);
        }

        ProcessStartInfo informacoes = new ProcessStartInfo("powershell.exe", argumentos);
        informacoes.UseShellExecute = false;
        informacoes.WorkingDirectory = pasta;

        try
        {
            using (Process processo = Process.Start(informacoes))
            {
                processo.WaitForExit();
                if (processo.ExitCode != 0) { return Parar(processo.ExitCode); }
                return 0;
            }
        }
        catch (Exception erro)
        {
            Console.Error.WriteLine("Não consegui abrir o PowerShell: " + erro.Message);
            return Parar(1);
        }
    }

    private static int Parar(int codigo)
    {
        Console.WriteLine();
        Console.Write("Pressione ENTER para fechar...");
        Console.ReadLine();
        return codigo;
    }
}
