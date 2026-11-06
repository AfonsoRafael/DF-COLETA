#Requires -Version 5.1
<#
    DF-Coleta.ps1 — Central de controle do DF Coleta
    ------------------------------------------------------------------
    Sobe o backend (NestJS, porta 3000) e o frontend (servidor estático,
    porta 5500), libera as portas no firewall, gera o QR Code para abrir
    no celular e mostra tudo num painel.

    Uso:
        .\tools\DF-Coleta.ps1                      # abre o painel
        .\tools\DF-Coleta.ps1 -Acao status         # só o status
        .\tools\DF-Coleta.ps1 -Acao iniciar
        .\tools\DF-Coleta.ps1 -Acao parar

    Ações: menu, iniciar, parar, reiniciar, status, qr, wifi, abrir,
           firewall, build, logs, testar, ajuda
#>
[CmdletBinding()]
param(
    [ValidateSet('menu', 'iniciar', 'parar', 'reiniciar', 'status', 'qr', 'wifi', 'abrir', 'firewall', 'build', 'logs', 'testar', 'ajuda')]
    [string]$Acao = 'menu',

    [switch]$NaoAbrir
)

$ErrorActionPreference = 'Continue'

try { [Console]::OutputEncoding = [System.Text.Encoding]::UTF8 } catch { }
try { $Host.UI.RawUI.WindowTitle = 'DF Coleta - central de controle' } catch { }

# ------------------------------------------------------------------- caminhos
$script:Raiz       = Split-Path -Parent $PSScriptRoot
$script:PastaFront = Join-Path $script:Raiz 'frontend'
$script:PastaBack  = Join-Path $script:Raiz 'backend'
$script:PastaLogs  = Join-Path $PSScriptRoot 'logs'
$script:ArqEstado  = Join-Path $PSScriptRoot 'estado.json'
$script:ArqQrPng   = Join-Path $PSScriptRoot 'qr-code.png'

$script:PortaFront = 5500
$script:PortaBack  = 3000

$script:Config = @{
    ModoBackend    = 'auto'     # auto | prod | dev
    EstiloQr       = 'normal'   # normal | invertido
    AbrirAoIniciar = $true
    IpEscolhido    = ''         # vazio = pega a interface com rota para a internet
}
$script:Estado = @{ Backend = $null; Frontend = $null }

if (-not (Test-Path $script:PastaLogs)) { New-Item -ItemType Directory -Path $script:PastaLogs -Force | Out-Null }

# ==================================================================== utilidades
function Escrever {
    param([string]$Texto, [string]$Cor = 'Gray')
    Write-Host $Texto -ForegroundColor $Cor
}
function Ok       { param([string]$T) Escrever "  [ok] $T"    'Green' }
function Info     { param([string]$T) Escrever "  [i]  $T"    'Cyan' }
function Aviso    { param([string]$T) Escrever "  [!]  $T"    'Yellow' }
function ErroMsg  { param([string]$T) Escrever "  [x]  $T"    'Red' }
function Pausar   { Read-Host '  ENTER para continuar' | Out-Null }

function Obter-IpsLocais {
    $lista = @()
    try {
        $lista = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
            Where-Object {
                $_.IPAddress -notlike '127.*' -and
                $_.IPAddress -notlike '169.254.*' -and
                $_.PrefixOrigin -ne 'WellKnown'
            } |
            Sort-Object IPAddress |
            Select-Object -ExpandProperty IPAddress -Unique
    } catch { }
    # o chamador sempre usa @(Obter-IpsLocais) para virar lista
    return $lista
}

function Obter-IpLocal {
    # 1) escolha manual feita em Ajustes (útil quando existe VPN ou 2 placas)
    if ($script:Config.IpEscolhido) {
        if (@(Obter-IpsLocais) -contains $script:Config.IpEscolhido) { return $script:Config.IpEscolhido }
    }

    # 2) interface que tem rota para a internet (o caminho normal)
    try {
        $udp = New-Object System.Net.Sockets.UdpClient
        $udp.Connect('8.8.8.8', 65530)
        $ip = $udp.LocalEndPoint.Address.ToString()
        $udp.Close()
        if ($ip -and $ip -ne '0.0.0.0' -and $ip -notlike '127.*' -and $ip -notlike '169.254.*') { return $ip }
    } catch { }

    # 3) primeira faixa de rede local
    $ips = @(Obter-IpsLocais)
    $local = $ips | Where-Object { $_ -match '^(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.|100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\.)' } | Select-Object -First 1
    if ($local) { return $local }
    if ($ips.Count) { return $ips[0] }
    return 'localhost'
}

function Obter-Ssid {
    try {
        $linha = netsh wlan show interfaces 2>$null | Select-String -Pattern '^\s+SSID\s+:' | Select-Object -First 1
        if ($linha) { return ($linha.ToString() -split ':', 2)[1].Trim() }
    } catch { }
    return $null
}

function Obter-SenhaWifi {
    param([string]$Ssid)
    if ([string]::IsNullOrWhiteSpace($Ssid)) { return $null }
    try {
        $saida = netsh wlan show profile name="$Ssid" key=clear 2>$null
        $linha = $saida | Select-String -Pattern 'Key Content|da Chave|de la clave' | Select-Object -First 1
        if ($linha) { return ($linha.ToString() -split ':', 2)[1].Trim() }
    } catch { }
    return $null
}

function Testar-Porta {
    param([int]$Porta)
    $c = Get-NetTCPConnection -LocalPort $Porta -State Listen -ErrorAction SilentlyContinue
    return [bool]$c
}

function Obter-PidPorta {
    param([int]$Porta)
    $c = Get-NetTCPConnection -LocalPort $Porta -State Listen -ErrorAction SilentlyContinue
    if (-not $c) { return $null }
    return ($c | Select-Object -First 1).OwningProcess
}

function Processo-Vivo {
    param($IdProc)
    if (-not $IdProc) { return $false }
    return [bool](Get-Process -Id $IdProc -ErrorAction SilentlyContinue)
}

function Eh-Admin {
    $p = [Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()
    return $p.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

# ======================================================================= estado
function Ler-Estado {
    if (Test-Path $script:ArqEstado) {
        try {
            $json = Get-Content $script:ArqEstado -Raw -Encoding UTF8 | ConvertFrom-Json
            if ($json.modoBackend) { $script:Config.ModoBackend = [string]$json.modoBackend }
            if ($json.estiloQr)    { $script:Config.EstiloQr    = [string]$json.estiloQr }
            if ($null -ne $json.abrirAoIniciar) { $script:Config.AbrirAoIniciar = [bool]$json.abrirAoIniciar }
            if ($json.ipEscolhido) { $script:Config.IpEscolhido = [string]$json.ipEscolhido }
            if ($json.backend)  { $script:Estado.Backend  = @{ Pid = [int]$json.backend.pid;  Modo = [string]$json.backend.modo } }
            if ($json.frontend) { $script:Estado.Frontend = @{ Pid = [int]$json.frontend.pid } }
        } catch {
            Aviso 'Não consegui ler o arquivo de estado (vou recomeçar do zero).'
        }
    }

    foreach ($chave in @('Backend', 'Frontend')) {
        $proc = $script:Estado[$chave]
        if ($proc -and -not (Processo-Vivo $proc.Pid)) { $script:Estado[$chave] = $null }
    }
}

function Gravar-Estado {
    $dados = [ordered]@{
        modoBackend    = $script:Config.ModoBackend
        estiloQr       = $script:Config.EstiloQr
        abrirAoIniciar = $script:Config.AbrirAoIniciar
        ipEscolhido    = $script:Config.IpEscolhido
        backend        = $null
        frontend       = $null
    }
    if ($script:Estado.Backend)  { $dados.backend  = [ordered]@{ pid = $script:Estado.Backend.Pid; modo = $script:Estado.Backend.Modo } }
    if ($script:Estado.Frontend) { $dados.frontend = [ordered]@{ pid = $script:Estado.Frontend.Pid } }
    try { $dados | ConvertTo-Json -Depth 5 | Set-Content -Path $script:ArqEstado -Encoding UTF8 } catch { }
}

# ==================================================================== processos
function Parar-Processo {
    param($IdProc, [string]$Nome = 'processo')
    if (-not $IdProc) { return }
    if (-not (Processo-Vivo $IdProc)) { return }
    try {
        & taskkill /PID $IdProc /T /F 2>&1 | Out-Null
        Ok "$Nome parado (pid $IdProc)."
    } catch {
        try { Stop-Process -Id $IdProc -Force -ErrorAction Stop; Ok "$Nome parado (pid $IdProc)." }
        catch { ErroMsg "Não consegui parar o $Nome (pid $IdProc)." }
    }
}

function Parar-Tudo {
    Param()
    Ler-Estado

    if ($script:Estado.Backend)  { Parar-Processo $script:Estado.Backend.Pid  'backend' }
    if ($script:Estado.Frontend) { Parar-Processo $script:Estado.Frontend.Pid 'frontend' }

    # rede de segurança: algo ainda escutando nas portas?
    foreach ($porta in @($script:PortaBack, $script:PortaFront)) {
        $procId = Obter-PidPorta $porta
        if ($procId) {
            Aviso "A porta $porta ainda estava ocupada (pid $procId) — encerrando."
            Parar-Processo $procId "processo da porta $porta"
        }
    }

    $script:Estado.Backend  = $null
    $script:Estado.Frontend = $null
    Gravar-Estado
    Start-Sleep -Milliseconds 400
}

function Aguardar-Porta {
    param([int]$Porta, [int]$TimeoutSeg = 60)
    $limite = (Get-Date).AddSeconds($TimeoutSeg)
    while ((Get-Date) -lt $limite) {
        if (Testar-Porta $Porta) { return $true }
        Start-Sleep -Milliseconds 500
    }
    return $false
}

function Iniciar-Backend {
    Param()

    if (Testar-Porta $script:PortaBack) {
        $procId = Obter-PidPorta $script:PortaBack
        Aviso "A porta $script:PortaBack já estava em uso (pid $procId) — vou adotar esse processo."
        $script:Estado.Backend = @{ Pid = $procId; Modo = 'externo' }
        Gravar-Estado
        return $true
    }

    $distMain = Join-Path $script:PastaBack 'dist\main.js'
    $modo = $script:Config.ModoBackend
    if ($modo -eq 'auto') {
        if (Test-Path $distMain) { $modo = 'prod' } else { $modo = 'dev' }
    }
    if ($modo -eq 'prod' -and -not (Test-Path $distMain)) {
        Aviso 'Não existe build em backend\dist — vou usar o modo dev.'
        $modo = 'dev'
    }

    if ($modo -eq 'prod') {
        $exe = (Get-Command node -ErrorAction SilentlyContinue).Source
        $argumentos = @('dist/main.js')
        $descricao = 'node dist/main.js (prod)'
    } else {
        $npm = (Get-Command npm.cmd -ErrorAction SilentlyContinue).Source
        if (-not $npm) { $npm = (Get-Command npm -ErrorAction SilentlyContinue).Source }
        if (-not $npm) { ErroMsg 'Não encontrei o npm no PATH. O backend precisa do Node.js instalado.'; return $false }
        $exe = $npm
        $argumentos = @('run', 'start:dev')
        $descricao = 'npm run start:dev (watch)'
    }

    if (-not $exe) { ErroMsg 'Não encontrei o node no PATH.'; return $false }

    $logOut = Join-Path $script:PastaLogs 'backend.log'
    $logErr = Join-Path $script:PastaLogs 'backend.erro.log'
    Remove-Item $logOut, $logErr -Force -ErrorAction SilentlyContinue

    Info "Subindo backend: $descricao"
    try {
        $proc = Start-Process -FilePath $exe -ArgumentList $argumentos -WorkingDirectory $script:PastaBack `
            -WindowStyle Hidden -RedirectStandardOutput $logOut -RedirectStandardError $logErr -PassThru
    } catch {
        ErroMsg "Falha ao subir o backend: $($_.Exception.Message)"
        return $false
    }

    $script:Estado.Backend = @{ Pid = $proc.Id; Modo = $modo }
    Gravar-Estado

    if (Aguardar-Porta $script:PortaBack 90) { Ok "Backend no ar (pid $($proc.Id), modo $modo)."; return $true }

    ErroMsg 'O backend não respondeu a tempo. Veja os logs (opção 11).'
    Get-Content $logErr -Tail 15 -ErrorAction SilentlyContinue | ForEach-Object { Escrever "    $_" 'DarkGray' }
    return $false
}

function Iniciar-Frontend {
    Param()

    if (Testar-Porta $script:PortaFront) {
        $procId = Obter-PidPorta $script:PortaFront
        Aviso "A porta $script:PortaFront já estava em uso (pid $procId) — vou adotar esse processo."
        $script:Estado.Frontend = @{ Pid = $procId }
        Gravar-Estado
        return $true
    }

    $node = (Get-Command node -ErrorAction SilentlyContinue).Source
    if (-not $node) { ErroMsg 'Não encontrei o node no PATH.'; return $false }

    $logOut = Join-Path $script:PastaLogs 'frontend.log'
    $logErr = Join-Path $script:PastaLogs 'frontend.erro.log'
    Remove-Item $logOut, $logErr -Force -ErrorAction SilentlyContinue

    Info "Subindo frontend na porta $script:PortaFront..."
    try {
        $proc = Start-Process -FilePath $node `
            -ArgumentList @("`"$(Join-Path $PSScriptRoot 'servidor.js')`"", "$script:PortaFront", "`"$script:PastaFront`"") `
            -WorkingDirectory $PSScriptRoot -WindowStyle Hidden `
            -RedirectStandardOutput $logOut -RedirectStandardError $logErr -PassThru
    } catch {
        ErroMsg "Falha ao subir o frontend: $($_.Exception.Message)"
        return $false
    }

    $script:Estado.Frontend = @{ Pid = $proc.Id }
    Gravar-Estado

    if (Aguardar-Porta $script:PortaFront 20) { Ok "Frontend no ar (pid $($proc.Id))."; return $true }

    ErroMsg 'O frontend não respondeu a tempo. Veja os logs (opção 11).'
    Get-Content $logErr -Tail 15 -ErrorAction SilentlyContinue | ForEach-Object { Escrever "    $_" 'DarkGray' }
    return $false
}

function Iniciar-Tudo {
    Param([switch]$SemQr, [switch]$SemAbrir)

    Ler-Estado
    Escrever ''
    Escrever '  Subindo os servidores...' 'White'
    Escrever ''

    $okBack = Iniciar-Backend
    $okFront = Iniciar-Frontend

    Escrever ''
    if ($okFront -and -not $SemQr) { Mostrar-QrPagina }

    $deveAbrir = $script:Config.AbrirAoIniciar -and -not $SemAbrir -and -not $script:ForcarSemAbrir
    if ($okFront -and $deveAbrir) {
        Start-Process "http://localhost:$script:PortaFront/" | Out-Null
    }
    if (-not $okBack) { Aviso 'O frontend funciona mesmo sem o backend (usa os dados de exemplo).' }
}

# ======================================================================= painel
function Mostrar-Painel {
    Ler-Estado
    Clear-Host

    $ip   = Obter-IpLocal
    $ssid = Obter-Ssid

    Write-Host ''
    Escrever '  ╔══════════════════════════════════════════════════════════════╗' 'DarkGreen'
    Escrever '  ║   D F   C O L E T A   ·   central de controle                ║' 'Green'
    Escrever '  ╚══════════════════════════════════════════════════════════════╝' 'DarkGreen'
    Write-Host ''

    $maquina = $env:COMPUTERNAME
    Escrever ("  PC     {0}" -f $maquina) 'Gray'
    if ($ssid) { Escrever ("  Wi-Fi  {0}" -f $ssid) 'Gray' }
    Escrever ("  IP     {0}" -f $ip) 'Gray'

    $outros = @(Obter-IpsLocais) | Where-Object { $_ -ne $ip }
    if ($outros.Count) {
        Escrever ("  outros {0}" -f ($outros -join ', ')) 'DarkGray'
        Escrever '         (troque o IP do QR em 12 → 4)' 'DarkGray'
    }
    Write-Host ''

    # ---- backend
    $backOn = Testar-Porta $script:PortaBack
    $backPid = Obter-PidPorta $script:PortaBack
    $modo = ''
    if ($script:Estado.Backend -and $script:Estado.Backend.Modo) { $modo = "  [$($script:Estado.Backend.Modo)]" }

    if ($backOn) {
        Write-Host '  BACKEND    ' -NoNewline -ForegroundColor Gray
        Escrever '● no ar' 'Green'
        Escrever ("             http://{0}:{1}   pid {2}{3}" -f $ip, $script:PortaBack, $backPid, $modo) 'DarkGray'
    } else {
        Write-Host '  BACKEND    ' -NoNewline -ForegroundColor Gray
        Escrever '○ parado' 'DarkGray'
        Escrever ("             (porta {0} livre)" -f $script:PortaBack) 'DarkGray'
    }

    # ---- frontend
    $frontOn = Testar-Porta $script:PortaFront
    $frontPid = Obter-PidPorta $script:PortaFront
    if ($frontOn) {
        Write-Host '  FRONTEND   ' -NoNewline -ForegroundColor Gray
        Escrever '● no ar' 'Green'
        Escrever ("             http://{0}:{1}   pid {2}" -f $ip, $script:PortaFront, $frontPid) 'DarkGray'
        Escrever ("             http://localhost:{0}" -f $script:PortaFront) 'DarkGray'
    } else {
        Write-Host '  FRONTEND   ' -NoNewline -ForegroundColor Gray
        Escrever '○ parado' 'DarkGray'
        Escrever ("             (porta {0} livre)" -f $script:PortaFront) 'DarkGray'
    }

    Write-Host ''
    if ($frontOn -and $backOn) {
        Escrever '  Tudo pronto — abra o QR (opção 5) e escaneie com o celular.' 'Green'
    } else {
        Escrever '  Use a opção 1 para subir tudo.' 'Yellow'
    }
    Write-Host ''
}

function Mostrar-Menu {
    Escrever '  ── servidores ────────────────────────────────────────' 'DarkGray'
    Escrever '   1) Iniciar tudo                (backend + frontend)' 'White'
    Escrever '   2) Parar tudo' 'White'
    Escrever '   3) Reiniciar' 'White'
    Write-Host ''
    Escrever '  ── acesso ────────────────────────────────────────────' 'DarkGray'
    Escrever '   4) Abrir no navegador do PC' 'White'
    Escrever '   5) Mostrar QR Code da página   (celular)' 'White'
    Escrever '   6) QR do Wi-Fi                 (mostra a senha)' 'White'
    Escrever '   7) Abrir o QR na tela do PC    (navegador)' 'White'
    Write-Host ''
    Escrever '  ── manutenção ────────────────────────────────────────' 'DarkGray'
    Escrever '   8) Status / testar conexões' 'White'
    Escrever '   9) Liberar portas no firewall  (pede admin)' 'White'
    Escrever '  10) Compilar backend             (npm run build)' 'White'
    Escrever '  11) Ver logs' 'White'
    Write-Host ''
    Escrever '  ── sistema ───────────────────────────────────────────' 'DarkGray'
    Escrever '  12) Ajustes' 'White'
    Escrever '  13) Ajuda' 'White'
    Escrever '   0) Sair                       (servidores continuam)' 'DarkGray'
    Escrever '   x) Sair e parar tudo' 'DarkGray'
    Write-Host ''
}

# =========================================================================== QR
function Mostrar-QrPagina {
    Param()

    $ip = Obter-IpLocal
    $url = "http://${ip}:$script:PortaFront/"
    $extra = @()
    if ($script:Config.EstiloQr -eq 'invertido') { $extra += '--inverter' }

    Write-Host ''
    Escrever '  ═══ QR CODE — abra no celular ═══' 'DarkGreen'
    & node (Join-Path $PSScriptRoot 'qr.js') --pequeno @extra --png $script:ArqQrPng --titulo 'Aponte a câmera do celular' $url
    Escrever "  O celular precisa estar na mesma rede Wi-Fi ($(Obter-Ssid))." 'DarkGray'
    Escrever '  Não conseguiu ler? Use a opção 7 (QR na tela) ou ajuste o estilo em 12.' 'DarkGray'
    Write-Host ''
}

function Mostrar-QrWifi {
    Param()

    $ssid = Obter-Ssid
    if (-not $ssid) {
        ErroMsg 'Não identifiquei nenhuma rede Wi-Fi conectada (talvez você use cabo).'
        return
    }

    $senha = Obter-SenhaWifi $ssid
    Write-Host ''
    Escrever '  ═══ QR CODE — entrar na rede Wi-Fi ═══' 'DarkGreen'
    if ($senha) {
        Aviso 'A senha do Wi-Fi vai aparecer abaixo (não mostre para estranhos).'
        & node (Join-Path $PSScriptRoot 'qr.js') --pequeno --wifi $ssid $senha
    } else {
        Aviso 'Não consegui ler a senha (rede aberta, sem permissão ou perfil restrito).'
        & node (Join-Path $PSScriptRoot 'qr.js') --pequeno --wifi $ssid ''
    }
    Write-Host ''
}

function Abrir-QrNaTela {
    if (-not (Testar-Porta $script:PortaFront)) {
        ErroMsg 'O frontend está parado — inicie primeiro (opção 1).'
        return
    }
    Start-Process "http://localhost:$script:PortaFront/qr" | Out-Null
    Ok 'Abri o QR Code no navegador (mostre a tela para o celular).'
}

# ======================================================================= acesso
function Abrir-Site {
    if (-not (Testar-Porta $script:PortaFront)) {
        Aviso 'O frontend está parado — vou iniciar antes.'
        Iniciar-Frontend | Out-Null
    }
    Start-Process "http://localhost:$script:PortaFront/" | Out-Null
    Ok "Abrindo http://localhost:$script:PortaFront/ ..."
}

# ==================================================================== firewall
function Liberar-Firewall {
    Param()

    if (-not (Eh-Admin)) {
        Aviso 'Isso precisa de permissão de administrador — vou abrir uma janela elevada.'
        try {
            Start-Process -FilePath 'powershell.exe' -Verb RunAs -ArgumentList @(
                '-NoProfile', '-ExecutionPolicy', 'Bypass',
                '-File', "`"$PSCommandPath`"", '-Acao', 'firewall'
            ) | Out-Null
            Info 'Confirme a janela do Windows e veja o resultado lá.'
        } catch {
            ErroMsg 'Você cancelou a elevação (ou ela falhou).'
        }
        return
    }

    foreach ($porta in @($script:PortaBack, $script:PortaFront)) {
        $regras = Get-NetFirewallRule -DisplayName "*DF Coleta*" -ErrorAction SilentlyContinue |
            Where-Object { $_.Direction -eq 'Inbound' -and $_.Enabled -eq 'True' -and $_.Action -eq 'Allow' }

        $atende = $false
        foreach ($r in $regras) {
            $filtro = $r | Get-NetFirewallPortFilter
            if ($filtro.Protocol -eq 'TCP' -and "$($filtro.LocalPort)" -eq "$porta") { $atende = $true; break }
        }

        if ($atende) {
            Ok "A porta $porta já estava liberada."
        } else {
            try {
                New-NetFirewallRule -DisplayName "DF Coleta :$porta" -Direction Inbound -Action Allow `
                    -Protocol TCP -LocalPort $porta -Profile Any -Description 'DF Coleta (servidor local)' | Out-Null
                Ok "Porta $porta liberada."
            } catch {
                ErroMsg "Falha ao liberar a porta $porta : $($_.Exception.Message)"
            }
        }
    }

    # regras repetidas
    $duplicadas = Get-NetFirewallRule -DisplayName '*DF Coleta*' -ErrorAction SilentlyContinue
    $sobra = @()
    foreach ($grupo in ($duplicadas | Group-Object DisplayName)) {
        if ($grupo.Count -gt 1) { $sobra += $grupo.Group | Select-Object -Skip 1 }
    }
    if ($sobra.Count -gt 0) {
        Write-Host ''
        Aviso "Existem $($sobra.Count) regras repetidas de 'DF Coleta'."
        $resposta = Read-Host '  Remover as repetidas? (s/n)'
        if ($resposta -match '^[sSyY]') {
            $sobra | Remove-NetFirewallRule -ErrorAction SilentlyContinue
            Ok 'Regras repetidas removidas.'
        } else {
            Info 'Mantive as regras.'
        }
    }

    # bloqueios têm prioridade sobre liberações — vale conferir se existe algum
    $bloqueios = @()
    try {
        $bloqueios = Get-NetFirewallRule -Direction Inbound -Action Block -Enabled True -ErrorAction SilentlyContinue |
            Where-Object { $_.DisplayName -match 'node|DF Coleta' }
    } catch { }

    if ($bloqueios.Count) {
        Write-Host ''
        Aviso 'Encontrei regra(s) de BLOQUEIO que podem barrar o celular:'
        foreach ($b in $bloqueios) { Escrever ("    - {0}" -f $b.DisplayName) 'DarkYellow' }
        Escrever '    (no Windows, bloqueio ganha de liberação)' 'DarkGray'
        $respostaBloqueio = Read-Host '  Remover essas regras de bloqueio? (s/n)'
        if ($respostaBloqueio -match '^[sSyY]') {
            $bloqueios | Remove-NetFirewallRule -ErrorAction SilentlyContinue
            Ok 'Regras de bloqueio removidas.'
        }
    }

    Write-Host ''
    Info 'A regra vale para rede Privada, Pública e de Domínio — serve em qualquer rede.'
    Escrever '  Se ainda assim o celular não abrir:' 'DarkGray'
    Escrever '   • Wi-Fi de visitante/hotel/empresa costuma ter "isolamento de clientes"' 'DarkGray'
    Escrever '     (o roteador proíbe um aparelho de falar com o outro — nenhum ajuste aqui resolve).' 'DarkGray'
    Escrever '   • Rede que exige login em página (captive portal) também atrapalha.' 'DarkGray'
    Escrever '   • Teste com o celular no seu roteador pessoal ou no hotspot do próprio PC.' 'DarkGray'
}

# ================================================================ manutenção
function Compilar-Backend {
    Write-Host ''
    Info 'Rodando npm run build no backend (pode demorar)...'
    Write-Host ''
    if (-not (Test-Path (Join-Path $script:PastaBack 'node_modules'))) {
        Aviso 'A pasta backend\node_modules não existe — rode npm install primeiro.'
    }
    Push-Location $script:PastaBack
    try {
        & npm run build
        if ($LASTEXITCODE -eq 0) { Ok 'Build concluído.' } else { ErroMsg "O build terminou com código $LASTEXITCODE." }
    } finally {
        Pop-Location
    }
}

function Mostrar-Logs {
    Write-Host ''
    foreach ($par in @(
        @{ Nome = 'backend';  Out = 'backend.log';  Err = 'backend.erro.log' },
        @{ Nome = 'frontend'; Out = 'frontend.log'; Err = 'frontend.erro.log' }
    )) {
        $arq = Join-Path $script:PastaLogs $par.Out
        Escrever "  ── $($par.Nome) ────────────────────────────────" 'DarkGray'
        if (Test-Path $arq) {
            Get-Content $arq -Tail 20 -Encoding UTF8 -ErrorAction SilentlyContinue | ForEach-Object { Escrever "    $_" 'Gray' }
        } else {
            Escrever '    (sem log ainda)' 'DarkGray'
        }
        $arqErr = Join-Path $script:PastaLogs $par.Err
        if ((Test-Path $arqErr) -and (Get-Item $arqErr).Length -gt 0) {
            Escrever "    -- erros --" 'DarkGray'
            Get-Content $arqErr -Tail 10 -Encoding UTF8 -ErrorAction SilentlyContinue | ForEach-Object { Escrever "    $_" 'DarkRed' }
        }
        Write-Host ''
    }
}

function Testar-Conexoes {
    Write-Host ''
    $ip = Obter-IpLocal

    $alvos = @(
        @{ Nome = 'backend  (localhost)'; Url = "http://localhost:$script:PortaBack/pontos-coleta" }
        @{ Nome = 'backend  (rede)';      Url = "http://${ip}:$script:PortaBack/pontos-coleta" }
        @{ Nome = 'frontend (localhost)'; Url = "http://localhost:$script:PortaFront/" }
        @{ Nome = 'frontend (rede)';      Url = "http://${ip}:$script:PortaFront/" }
    )

    foreach ($alvo in $alvos) {
        Write-Host ("  {0,-22} " -f $alvo.Nome) -NoNewline -ForegroundColor Gray
        try {
            $crono = [System.Diagnostics.Stopwatch]::StartNew()
            $resp = Invoke-WebRequest -Uri $alvo.Url -UseBasicParsing -TimeoutSec 6
            $crono.Stop()
            $cor = 'Green'; if ($resp.StatusCode -ge 400) { $cor = 'Yellow' }
            Write-Host ("HTTP {0}  ({1} ms)" -f $resp.StatusCode, $crono.ElapsedMilliseconds) -ForegroundColor $cor
        } catch {
            $codigo = $null
            if ($_.Exception.Response) { $codigo = [int]$_.Exception.Response.StatusCode }
            if ($codigo) { Write-Host "HTTP $codigo" -ForegroundColor Yellow }
            else { Write-Host 'sem resposta' -ForegroundColor Red }
        }
    }

    Write-Host ''
    if ((Testar-Porta $script:PortaBack) -and (Testar-Porta $script:PortaFront)) {
        Ok 'As duas portas estão escutando.'
    } else {
        Aviso 'Alguma porta não está escutando — use a opção 1.'
    }
}

# =================================================================== ajustes
function Mostrar-Ajustes {
    Param()
    Ler-Estado
    Write-Host ''
    Escrever '  ── ajustes ───────────────────────────────────────────' 'DarkGray'
    Escrever ("   1) Modo do backend .... {0}   (auto/prod/dev)" -f $script:Config.ModoBackend) 'White'
    Escrever ("   2) Estilo do QR ....... {0}   (normal/invertido)" -f $script:Config.EstiloQr) 'White'
    $abrir = 'não'; if ($script:Config.AbrirAoIniciar) { $abrir = 'sim' }
    Escrever ("   3) Abrir o site ao iniciar ... {0}" -f $abrir) 'White'

    $ipAtual = Obter-IpLocal
    $ipTexto = $ipAtual
    if ($script:Config.IpEscolhido) { $ipTexto = "$ipAtual  (fixado)" }
    Escrever ("   4) IP usado no QR ..... {0}" -f $ipTexto) 'White'
    Escrever '   0) Voltar' 'DarkGray'
    Write-Host ''

    $opcao = (Read-Host '  Escolha').Trim()

    switch ($opcao) {
        '1' {
            $ordem = @('auto', 'prod', 'dev')
            $i = [array]::IndexOf($ordem, $script:Config.ModoBackend)
            $script:Config.ModoBackend = $ordem[($i + 1) % $ordem.Count]
            Gravar-Estado
            Ok "Modo do backend agora é: $($script:Config.ModoBackend)"
        }
        '2' {
            if ($script:Config.EstiloQr -eq 'normal') { $script:Config.EstiloQr = 'invertido' } else { $script:Config.EstiloQr = 'normal' }
            Gravar-Estado
            Ok "Estilo do QR agora é: $($script:Config.EstiloQr)"
        }
        '3' {
            $script:Config.AbrirAoIniciar = -not $script:Config.AbrirAoIniciar
            Gravar-Estado
            $t = 'não'; if ($script:Config.AbrirAoIniciar) { $t = 'sim' }
            Ok "Abrir o site ao iniciar: $t"
        }
        '4' {
            $ips = @(Obter-IpsLocais)
            Write-Host ''
            Escrever ("   automático → {0}" -f (Obter-IpLocal)) 'Gray'
            for ($i = 0; $i -lt $ips.Count; $i++) {
                Escrever ("   {0}) {1}" -f ($i + 1), $ips[$i]) 'White'
            }
            Escrever '   0) voltar para automático' 'Gray'
            Write-Host ''
            $escolha = (Read-Host '  Número do IP').Trim()

            if ($escolha -eq '0') {
                $script:Config.IpEscolhido = ''
                Gravar-Estado
                Ok 'Voltei para o IP automático.'
            } elseif ($escolha -match '^\d+$' -and [int]$escolha -ge 1 -and [int]$escolha -le $ips.Count) {
                $script:Config.IpEscolhido = $ips[[int]$escolha - 1]
                Gravar-Estado
                Ok "O QR agora usa o IP $($script:Config.IpEscolhido)"
            } else {
                Aviso 'Número inválido — nada mudou.'
            }
        }
        default { }
    }
}

# ======================================================================= ajuda
function Mostrar-Ajuda {
    Write-Host ''
    Escrever '  ── como funciona ─────────────────────────────────────' 'DarkGray'
    Write-Host ''
    Escrever '  O DF Coleta precisa de dois processos:' 'Gray'
    Escrever "    • backend  → API NestJS na porta $script:PortaBack" 'Gray'
    Escrever "    • frontend → servidor de arquivos na porta $script:PortaFront" 'Gray'
    Write-Host ''
    Escrever '  O celular acessa o frontend pelo IP do PC na rede Wi-Fi.' 'Gray'
    Escrever '  Ele descobre o IP e gera o QR Code para você (opção 5).' 'Gray'
    Write-Host ''
    Escrever '  ── linha de comando ──────────────────────────────────' 'DarkGray'
    Write-Host ''
    Escrever '    .\tools\DF-Coleta.ps1 -Acao iniciar' 'White'
    Escrever '    .\tools\DF-Coleta.ps1 -Acao parar' 'White'
    Escrever '    .\tools\DF-Coleta.ps1 -Acao status' 'White'
    Escrever '    .\tools\DF-Coleta.ps1 -Acao qr' 'White'
    Write-Host ''
    Escrever '  ── dicas ─────────────────────────────────────────────' 'DarkGray'
    Write-Host ''
    Escrever '  • Se a primeira execução for bloqueada, rode uma vez:' 'Gray'
    Escrever '      Unblock-File .\DF-Coleta.exe, .\tools\DF-Coleta.ps1' 'White'
    Escrever '  • O QR do terminal pode não funcionar em telas claras:' 'Gray'
    Escrever '      ajuste em 12 → Estilo do QR → invertido' 'White'
    Escrever '  • Alternativa: opção 7 mostra um QR gigante no navegador.' 'Gray'
    Write-Host ''
}

# ==================================================================== executor
function Executar-Acao {
    param([string]$Qual)

    switch ($Qual) {
        'iniciar'   { Iniciar-Tudo }
        'parar'     { Write-Host ''; Parar-Tudo }
        'reiniciar' { Write-Host ''; Parar-Tudo; Iniciar-Tudo }
        'status'    { Mostrar-Painel; Testar-Conexoes }
        'qr'        { Mostrar-QrPagina }
        'wifi'      { Mostrar-QrWifi }
        'abrir'     { Abrir-Site }
        'firewall'  { Write-Host ''; Liberar-Firewall }
        'build'     { Compilar-Backend }
        'logs'      { Mostrar-Logs }
        'testar'    { Mostrar-Painel; Testar-Conexoes }
        'ajuda'     { Mostrar-Ajuda }
    }
}

# ======================================================================== main
Ler-Estado

if ($Acao -ne 'menu') {
    if ($NaoAbrir) { $script:ForcarSemAbrir = $true }
    Write-Host ''
    Executar-Acao $Acao
    Write-Host ''
    exit 0
}

# ---- painel interativo
while ($true) {
    Mostrar-Painel
    Mostrar-Menu

    $opcao = (Read-Host '  Escolha').Trim().ToLower()

    switch ($opcao) {
        '1'  { Iniciar-Tudo; Pausar }
        '2'  { Parar-Tudo; Pausar }
        '3'  { Parar-Tudo; Write-Host ''; Iniciar-Tudo; Pausar }
        '4'  { Abrir-Site; Start-Sleep -Seconds 1 }
        '5'  { Mostrar-QrPagina; Pausar }
        '6'  { Mostrar-QrWifi; Pausar }
        '7'  { Abrir-QrNaTela; Start-Sleep -Seconds 1 }
        '8'  { Testar-Conexoes; Pausar }
        '9'  { Liberar-Firewall; Pausar }
        '10' { Compilar-Backend; Pausar }
        '11' { Mostrar-Logs; Pausar }
        '12' { Mostrar-Ajustes; Pausar }
        '13' { Mostrar-Ajuda; Pausar }
        '0'  {
            Write-Host ''
            Info 'Saindo — os servidores continuam rodando (use a opção 2 para parar).'
            Write-Host ''
            exit 0
        }
        'x'  {
            Write-Host ''
            Parar-Tudo
            Info 'Tudo parado. Até logo!'
            Write-Host ''
            exit 0
        }
        default {
            Aviso 'Opção inválida.'
            Start-Sleep -Milliseconds 700
        }
    }
}
