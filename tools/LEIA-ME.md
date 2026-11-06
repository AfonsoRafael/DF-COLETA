# DF Coleta — ligar tudo com um clique

Este é o "botão de ligar" do projeto: sobe o **backend** e o **frontend**, libera
as portas no firewall e mostra um **QR Code** para abrir o site no celular.

---

## Como usar

Dê um duplo clique em:

| Arquivo | O que faz |
| --- | --- |
| **`DF-Coleta.exe`** | Abre o painel de controle (janela do PowerShell). |
| `DF-Coleta.bat` | A mesma coisa, sem precisar do .exe. |

O painel fica assim:

```
  ╔══════════════════════════════════════════════════════════════╗
  ║   D F   C O L E T A   ·   central de controle                ║
  ╚══════════════════════════════════════════════════════════════╝

  PC     SEU-PC
  Wi-Fi  CASA OI FIBRA  2.4G
  IP     192.168.1.64

  BACKEND    ● no ar
             http://192.168.1.64:3000   pid 12600  [prod]
  FRONTEND   ● no ar
             http://192.168.1.64:5500   pid 8188
```

Para abrir no celular: escolha **5** (aparece o QR na tela) e aponte a câmera.
O celular precisa estar **na mesma rede Wi-Fi** do computador.

### Menu

```
 ── servidores ──   1) Iniciar tudo   2) Parar tudo   3) Reiniciar
 ── acesso ──────   4) Abrir no PC    5) QR da página  6) QR do Wi-Fi  7) QR na tela
 ── manutenção ──   8) Status/testar  9) Firewall  10) Build  11) Logs
 ── sistema ─────  12) Ajustes  13) Ajuda   0) Sair    x) Sair e parar tudo
```

Em **12) Ajustes** dá para trocar o modo do backend, o estilo do QR, se abre o
site sozinho e **qual IP entra no QR** (útil com VPN ou mais de uma placa de rede).

> Saindo com **0** os servidores continuam no ar (para não cortar o celular).
> Saindo com **x** tudo é encerrado.

---

## Pela linha de comando

```powershell
.\DF-Coleta.exe                       # abre o painel
.\DF-Coleta.exe -Acao iniciar         # sobe tudo e mostra o QR
.\DF-Coleta.exe -Acao iniciar -NaoAbrir
.\DF-Coleta.exe -Acao parar
.\DF-Coleta.exe -Acao status          # painel + teste das conexões
.\DF-Coleta.exe -Acao qr
.\DF-Coleta.exe -Acao wifi
.\DF-Coleta.exe -Acao firewall        # pede permissão de administrador
.\DF-Coleta.exe -Acao build
.\DF-Coleta.exe -Acao logs
```

Os mesmos comandos funcionam no script:

```powershell
.\tools\DF-Coleta.ps1 -Acao status
```

---

## O que está por dentro

| Arquivo | Papel |
| --- | --- |
| `DF-Coleta.exe` / `.bat` | Atalho na raiz. O `.exe` só chama o script do painel. |
| `tools/DF-Coleta.ps1` | O painel: sobe/derruba processos, firewall, logs, QR, ajustes. |
| `tools/servidor.js` | Servidor estático do `frontend/` (Node puro, sem dependências). |
| `tools/qr.js` | Desenha o QR no terminal e salva `tools/qr-code.png`. |
| `tools/gerar-icone.ps1` | Regenera `tools/df-coleta.ico` (ícone do .exe). |
| `tools/Launcher.cs` | Código do `.exe` (empacotador do painel). |
| `tools/estado.json` | Lembra os PIDs e os ajustes entre execuções. |
| `tools/logs/` | Saída do backend e do frontend. |

### Portas

| Porta | Serviço |
| --- | --- |
| **3000** | Backend NestJS (`/pontos-coleta`, `/residuos`, ...) |
| **5500** | Frontend (arquivos HTML/CSS/JS) |

O backend sobe em `0.0.0.0`, então o celular fala com ele pelo IP da rede.
O frontend descobre o IP sozinho (`js/api.js`).

### Modos do backend

- **auto** *(padrão)* — usa `backend/dist` se já existir build; senão, `npm run start:dev`.
- **prod** — `node dist/main.js` (leva ~4 s, não recarrega sozinho).
- **dev** — `npm run start:dev` (recarrega ao salvar, mas é mais pesado).

Troque em **12) Ajustes**. Depois de mexer no backend em modo *prod*, rode
**10) Compilar backend** (ou `npm run build` dentro de `backend/`).

---

## Funciona em qualquer rede?

Resposta curta: **na prática sim** — o que costuma barrar é o próprio Wi-Fi do
lugar, não o programa.

### O que ele resolve sozinho

| Situação | Como se comporta |
| --- | --- |
| Qualquer rede com internet (casa, trabalho, hotspot do celular) | Descobre o IP da placa que tem rota para a internet. |
| Várias placas (Wi-Fi + Ethernet + Bluetooth + VirtualBox) | Ignora `169.254.x.x` (esses nunca servem) e escolhe a placa certa. |
| Rede classificada como **Pública** ou **Privada** | A regra do firewall é criada para **todos os perfis** (`-Profile Any`): vale nas duas. |
| Rede nova (mudou de casa, foi para um café) | A regra é permanente no Windows: continua valendo. |
| IP fora do padrão (`10.x`, `100.64.x` do Tailscale, IPv6, nome `meu-pc.local`) | O backend libera essas faixas e nomes no CORS. |
| VPN ligada | Se a VPN virar a rota padrão, o IP sugerido pode ser o dela. Use **12 → 4** e escolha o IP da placa Wi-Fi/Ethernet. |

> Os servidores escutam em `0.0.0.0` (todas as placas), não só no localhost.

### O que pode barrar (e não é o programa)

| Situação | Por quê |
| --- | --- |
| Wi-Fi de hotel, visitante, shopping ou empresa | "Isolamento de clientes": o roteador proíbe um aparelho de falar com o outro. Nenhum ajuste no PC resolve. |
| Rede que abre página de login (captive portal) | O celular ainda não está de fato na rede. |
| Firewall corporativo / antivírus | Pode bloquear as portas 3000 e 5500 mesmo com a regra criada. |
| Rede **somente IPv6** | O QR aponta para IPv4. Bem raro no Brasil. |
| Celular com dados móveis ligados | Ele precisa estar na mesma rede Wi-Fi do computador. |

**Plano B para apresentar o trabalho em qualquer lugar:** ligue o **hotspot do
próprio PC** (Configurações → Rede → Ponto de acesso móvel), conecte o celular
nele e gere o QR. Aí a rede é sua e não tem isolamento.

---

## Problemas comuns

**O celular não abre a página**
1. Celular e PC têm que estar na **mesma rede** (não use dados móveis).
2. Teste em **8) Status / testar conexões** — a linha `frontend (rede)` tem que responder.
3. Rode **9) Liberar portas no firewall** (pede administrador). Ele também avisa
   se existir alguma regra de **bloqueio** para o `node.exe` (bloqueio ganha de liberação).
4. Se o Wi-Fi for de hotel/visitante/empresa, pode ser **isolamento de clientes** —
   veja *Funciona em qualquer rede?* acima e use o hotspot do PC.
5. Tem mais de uma placa (VPN, VirtualBox)? O painel mostra os outros IPs;
   troque em **12) Ajustes → 4) IP usado no QR**.

**O QR não é lido pela câmera**
- O QR do terminal é claro sobre escuro em muitos temas. Se falhar:
  - **12) Ajustes → 2) Estilo do QR → invertido**; ou
  - use **7) Abrir o QR na tela do PC** (QR grande no navegador); ou
  - abra a imagem `tools/qr-code.png`.

**"O Windows protegeu o seu PC" ao abrir o .exe**
- O executável é compilado localmente, sem assinatura digital. Clique em
  *Mais informações → Executar assim mesmo*. Para não repetir:
  ```powershell
  Unblock-File .\DF-Coleta.exe, .\tools\DF-Coleta.ps1
  ```

**O backend não sobe**
- Veja **11) Ver logs** (ou `tools/logs/backend.erro.log`).
- Confira o Node: `node -v` (o projeto usa Node 18+; testado no 24).
- Sem backend, a home ainda funciona com os dados de exemplo do próprio frontend.

**A porta está ocupada**
- O painel adota o processo que já estiver escutando. Se quiser limpar,
  use **2) Parar tudo**.

---

## Recompilar o .exe

Só é preciso se você mudar `tools/Launcher.cs` ou o ícone:

```powershell
# 1) ícone (opcional)
powershell -File tools\gerar-icone.ps1

# 2) executável
& "$env:WINDIR\Microsoft.NET\Framework64\v4.0.30319\csc.exe" `
    /nologo /target:exe /optimize+ /codepage:65001 `
    /win32icon:"tools\df-coleta.ico" `
    /out:"DF-Coleta.exe" "tools\Launcher.cs"
```

O `.exe` **não** embute o servidor: ele só chama o painel, então precisa
continuar na pasta raiz do projeto, ao lado de `tools/`.

---

## Dependências

- **Node.js** (backend e servidor do frontend).
- **PowerShell 5.1** (já vem no Windows).
- Pacote `qrcode` em `tools/` — instalado uma vez:
  ```powershell
  cd tools; npm install
  ```
  Sem ele, o painel continua funcionando e o QR aparece só na tela (**7**).
