param(
    [Parameter(Mandatory = $true)][string]$Pasta
)

Add-Type -AssemblyName System.IO.Compression | Out-Null

# --- codificação usada pelo PlantUML (deflate + base64 modificado) ----------
function Encode6([int]$b) {
    if ($b -lt 10) { return [char](48 + $b) }   # 0-9
    $b = $b - 10
    if ($b -lt 26) { return [char](65 + $b) }   # A-Z
    $b = $b - 26
    if ($b -lt 26) { return [char](97 + $b) }   # a-z
    $b = $b - 26
    if ($b -eq 0) { return [char]45 }           # -
    if ($b -eq 1) { return [char]95 }           # _
    return [char]63                             # ?
}

function Codificar([string]$texto) {
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($texto)

    $ms = New-Object System.IO.MemoryStream
    $ds = New-Object System.IO.Compression.DeflateStream(
        $ms,
        [System.IO.Compression.CompressionMode]::Compress,
        $true
    )
    $ds.Write($bytes, 0, $bytes.Length)
    $ds.Dispose()
    $comp = $ms.ToArray()
    $ms.Dispose()

    $sb = New-Object System.Text.StringBuilder
    $i = 0
    while ($i -lt $comp.Length) {
        $b1 = [int]$comp[$i]
        $b2 = 0
        $b3 = 0
        if ($i + 1 -lt $comp.Length) { $b2 = [int]$comp[$i + 1] }
        if ($i + 2 -lt $comp.Length) { $b3 = [int]$comp[$i + 2] }

        [void]$sb.Append((Encode6 ($b1 -shr 2)))
        [void]$sb.Append((Encode6 (((($b1 -band 3) -shl 4) -bor ($b2 -shr 4)))))
        [void]$sb.Append((Encode6 (((($b2 -band 15) -shl 2) -bor ($b3 -shr 6)))))
        [void]$sb.Append((Encode6 ($b3 -band 63)))
        $i += 3
    }
    return $sb.ToString()
}

# --- renderiza cada .puml em .png pelo servidor oficial ---------------------
$arquivos = Get-ChildItem -Path $Pasta -Filter *.puml | Sort-Object Name
if (-not $arquivos) { Write-Host "Nenhum .puml em $Pasta"; exit 1 }

$falhas = 0
foreach ($f in $arquivos) {
    $texto = [System.IO.File]::ReadAllText($f.FullName, [System.Text.Encoding]::UTF8)
    $enc = Codificar $texto
    $url = "https://www.plantuml.com/plantuml/png/" + $enc
    $destino = [System.IO.Path]::ChangeExtension($f.FullName, ".png")

    try {
        Invoke-WebRequest -Uri $url -OutFile $destino -UseBasicParsing -TimeoutSec 90 `
            -UserAgent "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" | Out-Null
        $kb = (Get-Item $destino).Length / 1KB
        Write-Host ("OK   {0,-38} {1,8:N1} KB" -f $f.Name, $kb)
    }
    catch {
        $falhas++
        Write-Host ("ERRO {0}: {1}" -f $f.Name, $_.Exception.Message)
    }
}

Write-Host ""
Write-Host ("{0} arquivo(s), {1} falha(s)." -f $arquivos.Count, $falhas)
