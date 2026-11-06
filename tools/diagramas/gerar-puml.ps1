param(
    [string]$Fonte   = "tools\diagramas\sequencia-fonte.txt",
    [string]$Destino = "docs\diagramas\sequencia"
)

# Estilo comum: branco e preto, sem sombra, fonte Arial.
$estilo = @"
@startuml
skinparam backgroundColor #FFFFFF
skinparam shadowing false
skinparam defaultFontName Arial
skinparam defaultFontSize 13
skinparam dpi 160
skinparam sequenceArrowColor #000000
skinparam sequenceArrowFontColor #000000
skinparam sequenceArrowFontSize 11
skinparam sequenceParticipantBackgroundColor #FFFFFF
skinparam sequenceParticipantBorderColor #000000
skinparam sequenceParticipantFontColor #000000
skinparam actorBackgroundColor #FFFFFF
skinparam actorBorderColor #000000
skinparam actorFontColor #000000
skinparam lifeLineBorderColor #999999
skinparam sequenceGroupBorderColor #000000
skinparam sequenceGroupBackgroundColor #FFFFFF
skinparam sequenceGroupHeaderFontColor #000000
skinparam sequenceGroupHeaderFontSize 11
skinparam sequenceGroupFontColor #000000
skinparam sequenceGroupFontSize 11
skinparam noteBackgroundColor #FFFFFF
skinparam noteBorderColor #000000
skinparam noteFontColor #000000
hide footbox
"@

$texto = [System.IO.File]::ReadAllText($Fonte, [System.Text.Encoding]::UTF8)
$blocos = [regex]::Split($texto, '(?m)^@@\s+')

New-Item -ItemType Directory -Force $Destino | Out-Null
$semBom = New-Object System.Text.UTF8Encoding($false)
$total = 0

foreach ($b in $blocos) {
    if (-not $b.Trim()) { continue }

    $linhas = $b -split "\r?\n"
    $nome = $linhas[0].Trim()
    $corpo = ($linhas | Select-Object -Skip 1) -join "`n"

    $puml = $estilo.TrimEnd() + "`n" + $corpo.Trim() + "`n@enduml`n"
    $caminho = Join-Path $Destino ($nome + ".puml")
    [System.IO.File]::WriteAllText($caminho, $puml, $semBom)
    Write-Host ("gerado  {0}" -f $caminho)
    $total++
}

Write-Host ""
Write-Host ("{0} arquivo(s) .puml em {1}" -f $total, $Destino)
