# Escopo — Ajustes da Home (rodada 2)

> **Contexto:** a home já está reformulada (landing + mapa pré-carregado/expansível +
> lista arrastável). Esta rodada resolve **3 incômodos** apontados pelo usuário:
> scrollbar fora do tema, mapa "esquisito" no mobile e falta de um "minimizar" para a
> lista de pontos.
>
> Documento de escopo — **nada foi alterado no código ainda**.

---

## Resumo das 3 mudanças

| # | Mudança | Onde |
|---|---|---|
| **A** | Barra de rolagem no **tema do sistema/site** (não a padrão do navegador) | global (todas as páginas) |
| **B** | **Mobile:** mapa vira um **preview** centrado na localização, com **"Abrir para mais detalhes"** | `index.html` / `index.css` / `index.js` |
| **C** | **Minimizar / reexibir a lista de pontos** (botão flutuante para reabrir) | `index.html` / `index.css` / `index.js` |
| **D** | **Busca**: texto cortado no mobile + redesenho (botão circular + atalhos) | `index.html` / `index.css` / `index.js` |

---

## A) Barra de rolagem temática

### Problema
A scrollbar aparece com o visual **padrão do navegador** (cinza claro), destoando do
tema — principalmente no **dark mode**, onde ela "estoura" na tela verde-escura.

### Proposta
1. **`color-scheme`** no `<html>` para o navegador desenhar controles nativos coerentes:
   - `[data-theme="light"] { color-scheme: light; }`
   - `[data-theme="dark"]  { color-scheme: dark; }`
   (isso já faz a scrollbar nativa seguir o tema em Chrome/Edge/Firefox).
2. **Tokens de scrollbar** em `tokens.css`:
   ```css
   --df-scrollbar-thumb: ...;   /* claro: --df-border-strong | escuro: --df-border-strong */
   --df-scrollbar-thumb-hover: ...;
   --df-scrollbar-track: transparent;
   ```
3. **Regras** em `global.css` (vale para o site inteiro):
   ```css
   html { scrollbar-color: var(--df-scrollbar-thumb) var(--df-scrollbar-track);
          scrollbar-width: thin; }
   ::-webkit-scrollbar { width: 10px; height: 10px; }
   ::-webkit-scrollbar-track { background: var(--df-scrollbar-track); }
   ::-webkit-scrollbar-thumb { background: var(--df-scrollbar-thumb);
                               border-radius: 999px; border: 2px solid transparent;
                               background-clip: padding-box; }
   ::-webkit-scrollbar-thumb:hover { background: var(--df-scrollbar-thumb-hover); }
   ```
4. **Exceções já existentes:** o `.chip-row` continua com a barra **oculta** (scroll-x
   de chips) — sem mudança.

### Critérios de aceite
- [ ] Light: scrollbar discreta (thumb cinza-esverdeado, trilho transparente).
- [ ] Dark: scrollbar escura, sem "flash" claro.
- [ ] Vale para a página toda **e** para contêineres com scroll (ex.: lista do mapa).
- [ ] Não quebra o scroll horizontal de chips (barra continua escondida ali).

---

## B) Mobile: preview do mapa + "Abrir para mais detalhes"

### Problema
No mobile o mapa hoje ocupa **78vh** já na home, com a bottom-sheet por cima — fica
"esquisito": um mapa grande, parcialmente coberto, e sem uma ação clara. O usuário quer
um **preview** enxuto, posicionado **de acordo com a localização**, com um botão claro
de **"abrir para mais detalhes"**.

### Proposta (apenas < 768px)
1. **Altura do preview:** `.mapa-shell-holder` passa a `~42vh` (mín. 260px, máx. 340px)
   no mobile. No desktop continua ~540px.
2. **Mapa em modo "preview" no mobile** (não-interativo):
   - Desliga handlers do Leaflet: `dragging`, `touchZoom`, `scrollWheelZoom`,
     `doubleClickZoom`, `boxZoom`, `keyboard`; esconde o controle de zoom.
   - **Tap em qualquer lugar do preview** → abre em tela cheia (mesmo fluxo do expandir).
3. **Centralizado na localização:**
   - Ao chegar a geolocalização → `flyTo` da posição do usuário (zoom ~13) com o pino "você está aqui".
   - Sem permissão/localização → centro de **Brasília/DF** (zoom ~11).
4. **Sobreposição de CTA** no rodapé do preview (gradiente + botão):
   - Botão principal: **“Abrir para mais detalhes”** (`maximize-2`) → tela cheia.
   - Botão secundário: **“Ver lista (N)”** (`list`) → abre a tela cheia já com a lista
     em meia tela (ver item C).
   - Selo/legenda discreta: “Toque para explorar”.
5. **Ao expandir** (`.expandido`): o mapa volta a ser **totalmente interativo** e o chrome
   completo (busca, mostrar/ocultar lista, minimizar) entra em cena.
6. **Desktop:** **sem mudança** — mapa interativo inline + painel lateral.

> Observação técnica: é a **mesma instância** do Leaflet; ligamos/desligamos os handlers
> ao alternar preview ↔ tela cheia (`map.dragging.enable()/disable()`, etc.).

### Critérios de aceite
- [ ] Mobile: o mapa aparece como **preview compacto**, sem a bottom-sheet por cima.
- [ ] Preview **centralizado na localização** do usuário (ou Brasília, se negada).
- [ ] Botão **“Abrir para mais detalhes”** leva à tela cheia interativa.
- [ ] Tap no preview também abre; arrastar no preview **não** move o mapa.
- [ ] Desktop **inalterado**.

---

## C) Minimizar / reexibir a lista de pontos

### Problema
Não dá para **esconder a lista** e reabrir depois de forma óbvia ("tipo um minimizar").
No desktop o botão existe mas é discreto; no mobile só dá para arrastar.

### Proposta
1. **Botão “minimizar” no cabeçalho da lista** (`chevron-down` no mobile /
   `panel-left-close` no desktop):
   - Mobile: sheet vai para o estado **`oculto`** (desliza para baixo, fora da tela).
   - Desktop: painel some (`.painel-oculto`).
2. **Estado novo no mobile:** `oculto` (além de `peek` / `half` / `full`).
   O arrasto da alça já permite chegar nele (o snap inclui `oculto`).
3. **Botão flutuante para reabrir** (aparece só quando a lista está oculta):
   - Mobile e desktop: **“Ver lista (N)”** com ícone `list` e o **contador** de pontos
     filtrados; fica fixo no canto inferior do mapa.
   - Click → reabre: mobile em `peek` (ou `half`), desktop com o painel visível.
4. **Unificar a lógica em JS:** `minimizarLista()` / `reabrirLista()`, reaproveitando o
   `posicionarSheet()` e o `togglePainel()` já existentes, para não duplicar código.
5. O **contador** (N) acompanha os filtros/busca ativos.

### Critérios de aceite
- [ ] Dá para **esconder a lista** (botão minimizar) no mobile e no desktop.
- [ ] Com a lista oculta, aparece o botão **“Ver lista (N)”** e ele **reabre**.
- [ ] O botão flutuante **não** aparece quando a lista já está visível.
- [ ] Arrastar a alça para baixo no mobile **também** oculta a lista.
- [ ] N reflete os filtros ativos.

---

## D) Redesenho da busca (opção A + atalhos)

### Problema
No mobile a busca do hero era **1 linha com ícone + input + botão "Buscar"**; num 360px
sobravam ~180px e o placeholder longo (`"O que você quer descartar? Ex: pilhas, óleo,
eletrônicos"`, 63 caracteres) **cortava no meio da frase**.

### Proposta / implementação
- **Placeholder curto** e à prova de corte: `"Buscar resíduo ou ponto…"` + `text-overflow: ellipsis`.
- **Mobile:** o botão vira um **círculo só com a lupa** (44×44), então o campo ocupa a largura
  toda. No **desktop** mantém o texto "Buscar".
- **Atalhos**: faixa de chips (**até 4 no mobile**, 5 no desktop) com os resíduos
  populares → 1 toque abre o mapa **já filtrado**.
- Botão passou a usar `type="submit"` com `aria-label` e ícone de lupa.

### Critérios de aceite
- [x] Mobile 360/414: placeholder **sem corte** e botão circular.
- [x] Desktop: barra com botão "Buscar" e **5 atalhos em uma linha**.
- [x] Atalho abre o mapa filtrado (ex.: "Eletrônicos" → 2 pontos).
- [x] Light/dark ok.

---

## Arquivos afetados

| Arquivo | Mudança |
|---|---|
| `frontend/css/tokens.css` | tokens de scrollbar + `color-scheme` |
| `frontend/css/global.css` | regras de scrollbar (Site inteiro) |
| `frontend/css/index.css` | preview mobile, CTA overlay, botão flutuante, estado `oculto` |
| `frontend/index.html` | CTA do preview + botão flutuante “Ver lista” + botão minimizar no head |
| `frontend/js/index.js` | modo preview (handlers), centralização por localização, minimizar/reexibir |
| `frontend/js/mapa.js` | helpers para ligar/desligar interação + `flyTo` na localização |

---

## Fases sugeridas

| Fase | Entrega |
|---|---|
| **R1** | **(A)** Scrollbar temática (tokens + global + color-scheme). |
| **R2** | **(C)** Minimizar/reexibir lista (desktop + mobile) — menor risco, alto ganho. |
| **R3** | **(B)** Preview mobile + CTA “Abrir para mais detalhes” + centralização. |
| **R4** | Polimento: 360→1440, dark mode, teclado/aria, `prefers-reduced-motion`. |

---

## Pontos a confirmar (decisões) — ✅ confirmados

1. **Scrollbar** — seguir o **tema ativo** (auto pelo sistema, ou manual pelo botão). ✅
2. **Altura do preview no mobile** — `42vh` (mín. 260 / máx. 340). ✅
3. **Preview no mobile** — mostrar os **marcadores dos pontos + pino da localização**. ✅
4. **Botão reabrir lista** — **flutuante no canto inferior** ("Ver lista (N)"). ✅
5. **Ordem de execução** — R1 → R2 → R3. ✅

---

## Status

- [x] **R1** — Scrollbar temática ✅
  - `color-scheme` (light/dark) + tokens `--df-scrollbar-*` em `tokens.css`.
  - `scrollbar-color`/`scrollbar-width` + `::-webkit-scrollbar` em `global.css`.
- [x] **R2** — Minimizar/reexibir lista ✅
  - Botão **minimizar** no cabeçalho da lista (mobile: estado `oculto`; desktop: `.painel-oculto`).
  - Botão flutuante **“Ver lista (N)”** aparece só quando a lista está oculta (mobile: em tela
    cheia; desktop: sempre que oculta) e reabre. Contador acompanha os filtros.
  - Arrastar a alça para baixo também oculta (snap com `oculto`).
- [x] **R3** — Preview mobile ✅
  - `<768px`: preview `~42vh` **não-interativo** (drag/zoom desligados via
    `definirInteracaoMapa()`), com os marcadores e o pino da localização.
  - Centraliza na localização do usuário (ou Brasília, se negada).
  - Sobreposição com **“Abrir para mais detalhes”** e **“Ver lista (N)”**; tap no preview
    também abre. Ao expandir, tudo volta a ser interativo. Desktop inalterado.
- [x] **R4** — Polimento (360→1440, acessibilidade, `prefers-reduced-motion`, mapa escuro) ✅
  - **Varredura 360→1440**: sem overflow horizontal em 360/390/414/480/600/768/834/1024/1280/1440.
    Breakpoints novos (`≥1024`, `≥1280`, `≤380`); `.wrap` vai a 1180px e o mapa cresce
    (42vh no mobile → 540 → 580 → 640px).
  - **Acessibilidade**: link “Pular para o conteúdo” + `<main id="conteudo">`; anel de foco
    `:focus-visible` global; contador com `role="status"`/`aria-live="polite"`; lista oculta com
    `inert` + `aria-hidden`; `aria-expanded`/`aria-controls` nos botões de lista e de expandir;
    foco entra no mapa ao expandir e volta ao elemento de origem ao fechar (Esc); ao minimizar o
    foco vai para “Ver lista” e ao reabrir para a lista; faixa de filtros com `role="group"`,
    `tabindex="0"` e `scroll-margin-inline` nos chips; ícones Lucide marcados como decorativos
    (`aria-hidden` + `focusable="false"`) em **todas** as páginas (via `tema.js`).
  - **`prefers-reduced-motion`**: bloco global (transições, animações e rolagem suave desligadas)
    + durações do Leaflet (`flyTo`) e abertura de popup reduzidas.
  - **Mapa escuro**: no tema escuro os tiles ganham um **filtro CSS** que os escurece
    (`invert/hue-rotate`, aplicado só na `.leaflet-tile-pane`, então pinos e popups mantêm as
    cores reais). Foi a troca de plano: os tiles “dark” do CARTO passaram a exigir **API key**
    (vinham com marca d'água "API KEY REQUIRED"), então mantivemos o OpenStreetMap — sem chave e
    sem provedor extra — e escurecemos por filtro. Popups, zoom e atribuição tokenizados; pinos
    com a cor da marca do tema e “você está aqui” com pulso.
  - **Correções achadas no caminho**: ícone `hand-pointer` não existe no Lucide → `pointer`;
    `API_BASE_URL` gerava `http://:3000` em `file://` → cai para `localhost`.

### R4) Critérios de aceite
- [x] Nenhuma largura de 360 a 1440 cria rolagem horizontal.
- [x] Navegação só por teclado: skip link, foco visível, foco preso coerente ao esconder/mostrar a lista.
- [x] `Esc` fecha a tela cheia e devolve o foco a quem abriu.
- [x] Leitor de tela anuncia a contagem de pontos e o estado dos botões (`aria-expanded`).
- [x] Lista oculta não é alcançável por Tab (`inert`).
- [x] Com “reduzir movimento” no sistema, o mapa não voa e as transições não animam.
- [x] Tema escuro: mapa escuro de verdade (tiles escurecidos por filtro), sem “bloco branco”.
- [x] Sem dependência de provedor com API key / marca d'água no mapa.
- [x] Console sem avisos de ícone inexistente (auditados os 85 ícones usados).

- [x] **D** — Redesenho da busca (botão circular no mobile + atalhos) ✅
- [x] **E** — Controles dos filtros (chips) ✅
  - Setas ‹ › no cabeçalho da lista (desktop) para rolar os chips na horizontal.
  - Setas desabilitadas/escondidas conforme a posição (início/fim) + degradê indicando "tem mais".
  - Roda do mouse no desktop rola os chips na horizontal; no mobile continua por toque.
  - Pílula **ativa vai para a 1ª posição** (sempre à vista, com rolagem resetada).
  - Pílula ativa mostra um **“x”** e clicar nela (qualquer parte) **desmarca o filtro**.
  - `aria-pressed` + `title` (“Remover filtro”) e `prefers-reduced-motion` respeitado.

### E) Critérios de aceite
- [x] Desktop: setas ‹ › visíveis, com estados certo no início/meio/fim e degradê nas bordas.
- [x] Mobile: setas ocultas (rolagem por toque); degradê continua indicando mais filtros.
- [x] Pílula escolhida em 1º lugar, sem rolagem, com “x” para desmarcar.
- [x] Clicar na pílula ativa limpa o filtro (volta para “Todos” e reordena).
- [x] Filtro aplicado por busca/atalho usa o mesmo caminho (`abrirMapa`) → reordena e mostra o “x”.
- [x] Texto da pílula ativa continua legível no hover (light e dark).

### Arquivos tocados
| Arquivo | Mudança |
|---|---|
| `frontend/css/tokens.css` | `color-scheme` + tokens de scrollbar; removida regra órfã da sidebar; hover do chip escopado |
| `frontend/css/global.css` | scrollbar do site; **foco visível global; `prefers-reduced-motion`; Leaflet integrado ao tema (popup/zoom/atribuição) e marcadores** |
| `frontend/css/index.css` | preview mobile, botão minimizar, botão flutuante, estado `oculto`, setas dos chips + degradê + “x” da pílula, **skip link, breakpoints 1024/1280/≤380 e foco dos chips** |
| `frontend/index.html` | preview + botão “Ver lista” + botão minimizar + setas dos chips, **skip link, `<main>`, ARIA (live/expanded/controls/inert)** |
| `frontend/js/index.js` | modos preview/tela cheia, minimizar/reexibir, CTA, centralização, chips (reordenar/limpar/rolar), **foco e ARIA da lista, ícones decorativos** |
| `frontend/js/mapa.js` | `definirInteracaoMapa()`, **cores dos pinos por token, ícone “você está aqui”, duração conforme movimento reduzido** |
| `frontend/js/tema.js` | **evento `df:tema` na troca de tema + ícones decorativos em todas as páginas** |
| `frontend/js/api.js` | **fallback de host em `file://`** |

