#Requires -Version 5.1
<#
    gerar-icone.ps1 — cria tools\df-coleta.ico (16 a 256 px)
    ------------------------------------------------------------------
    Desenha um quadrado verde arredondado (cores da marca) com o
    símbolo de reciclagem em branco e monta um .ico com vários
    tamanhos, no formato DIB (o mais compatível com o Windows).

    Uso:  powershell -File tools\gerar-icone.ps1
#>
[CmdletBinding()]
param(
    [string]$Destino
)

if (-not $Destino) { $Destino = Join-Path $PSScriptRoot 'df-coleta.ico' }

Add-Type -AssemblyName System.Drawing

$script:Tamanhos = @(16, 32, 48, 64, 128, 256)
$script:VerdeClaro = '#1cb05f'
$script:VerdeEscuro = '#0b6b3a'

function Novo-BitmapIcone {
    param([int]$Lado)

    $bmp = New-Object System.Drawing.Bitmap($Lado, $Lado, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode     = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAlias
    $g.Clear([System.Drawing.Color]::Transparent)

    $margem = [Math]::Max(0, [int]($Lado * 0.045))
    $raio   = [Math]::Max(1, [int]($Lado * 0.24))
    $ladoUtil = $Lado - 2 * $margem

    # quadrado arredondado
    $caminho = New-Object System.Drawing.Drawing2D.GraphicsPath
    $caminho.AddArc($margem, $margem, $raio * 2, $raio * 2, 180, 90)
    $caminho.AddArc($margem + $ladoUtil - $raio * 2, $margem, $raio * 2, $raio * 2, 270, 90)
    $caminho.AddArc($margem + $ladoUtil - $raio * 2, $margem + $ladoUtil - $raio * 2, $raio * 2, $raio * 2, 0, 90)
    $caminho.AddArc($margem, $margem + $ladoUtil - $raio * 2, $raio * 2, $raio * 2, 90, 90)
    $caminho.CloseFigure()

    $p1 = New-Object System.Drawing.Point($margem, $margem)
    $p2 = New-Object System.Drawing.Point(($margem + $ladoUtil), ($margem + $ladoUtil))
    $gradiente = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        $p1, $p2,
        [System.Drawing.ColorTranslator]::FromHtml($script:VerdeClaro),
        [System.Drawing.ColorTranslator]::FromHtml($script:VerdeEscuro))

    $g.FillPath($gradiente, $caminho)

    # símbolo de reciclagem (U+267B), branco, centralizado
    $fonte = $null
    foreach ($nome in @('Segoe UI Symbol', 'Segoe UI', 'Arial')) {
        try {
            $fonte = New-Object System.Drawing.Font($nome, [float]($Lado * 0.68),
                [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
            break
        } catch { $fonte = $null }
    }
    if ($fonte) {
        $formato = New-Object System.Drawing.StringFormat
        $formato.Alignment     = [System.Drawing.StringAlignment]::Center
        $formato.LineAlignment = [System.Drawing.StringAlignment]::Center
        $area = New-Object System.Drawing.RectangleF(0, [float]($Lado * 0.03), [float]$Lado, [float]$Lado)
        $g.DrawString([string][char]0x267B, $fonte, [System.Drawing.Brushes]::White, $area, $formato)
        $fonte.Dispose()
    }

    $g.Dispose()

    if ($bmp.PixelFormat -ne [System.Drawing.Imaging.PixelFormat]::Format32bppArgb) {
        $convertido = $bmp.Clone(`
            (New-Object System.Drawing.Rectangle(0, 0, $bmp.Width, $bmp.Height)), `
            [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
        $bmp.Dispose()
        $bmp = $convertido
    }

    return $bmp
}

function Converter-Para-Dib {
    param([System.Drawing.Bitmap]$Bitmap)

    $lado   = $Bitmap.Width
    $stride = $lado * 4
    $area   = New-Object System.Drawing.Rectangle(0, 0, $lado, $lado)

    $bloqueado = $Bitmap.LockBits($area,
        [System.Drawing.Imaging.ImageLockMode]::ReadOnly,
        [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

    $total = $bloqueado.Stride * $lado
    $origem = New-Object byte[] $total
    [System.Runtime.InteropServices.Marshal]::Copy($bloqueado.Scan0, $origem, 0, $total)
    $Bitmap.UnlockBits($bloqueado)

    $mascara = [int]([Math]::Ceiling($lado / 32.0) * 4 * $lado)

    $mem = New-Object System.IO.MemoryStream
    $bin = New-Object System.IO.BinaryWriter($mem)

    # BITMAPINFOHEADER
    $bin.Write([uint32]40)
    $bin.Write([int32]$lado)
    $bin.Write([int32]($lado * 2))   # altura dobrada (DIB + máscara)
    $bin.Write([uint16]1)
    $bin.Write([uint16]32)
    $bin.Write([uint32]0)            # BI_RGB
    $bin.Write([uint32]($lado * $lado * 4 + $mascara))
    $bin.Write([int32]0)
    $bin.Write([int32]0)
    $bin.Write([uint32]0)
    $bin.Write([uint32]0)

    # pixels BGRA de baixo para cima
    for ($y = $lado - 1; $y -ge 0; $y--) {
        $deslocamento = [Math]::Abs($bloqueado.Stride) * $y
        $quantidade = [Math]::Min($stride, $origem.Length - $deslocamento)
        $bin.Write($origem, $deslocamento, $quantidade)
    }

    # máscara AND (tudo 0: a transparência vem do canal alfa)
    $bin.Write((New-Object byte[] $mascara))

    $bin.Flush()
    return ,$mem.ToArray()
}

# ------------------------------------------------------------------- execução
$imagens = @()
foreach ($lado in $script:Tamanhos) {
    $bmp = Novo-BitmapIcone -Lado $lado
    $dib = Converter-Para-Dib -Bitmap $bmp
    $bmp.Dispose()
    $imagens += ,$dib
    Write-Host ("  {0,3} x {0,-3} ok" -f $lado) -ForegroundColor DarkGray
}

$mem = New-Object System.IO.MemoryStream
$bin = New-Object System.IO.BinaryWriter($mem)

$bin.Write([uint16]0)                       # reservado
$bin.Write([uint16]1)                       # tipo 1 = ícone
$bin.Write([uint16]$script:Tamanhos.Count)

$deslocamentoImagem = 6 + 16 * $script:Tamanhos.Count
for ($i = 0; $i -lt $script:Tamanhos.Count; $i++) {
    $lado = $script:Tamanhos[$i]
    $byte = $lado
    if ($lado -ge 256) { $byte = 0 }        # 0 = 256

    $bin.Write([byte]$byte)                 # largura
    $bin.Write([byte]$byte)                 # altura
    $bin.Write([byte]0)                     # cores da paleta
    $bin.Write([byte]0)                     # reservado
    $bin.Write([uint16]1)                   # planos
    $bin.Write([uint16]32)                  # bits por pixel
    $bin.Write([uint32]$imagens[$i].Length)
    $bin.Write([uint32]$deslocamentoImagem)

    $deslocamentoImagem += $imagens[$i].Length
}

foreach ($imagem in $imagens) { $bin.Write($imagem) }
$bin.Flush()

[System.IO.File]::WriteAllBytes($Destino, $mem.ToArray())
$bin.Dispose()
$mem.Dispose()

Write-Host ''
Write-Host "  ícone gerado: $Destino ($([Math]::Round((Get-Item $Destino).Length / 1024, 1)) KB)" -ForegroundColor Green
