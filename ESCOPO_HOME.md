# Escopo — Reformulação da Home (index.html)

> **Meta:** transformar a home de um "mapa com painel" em uma **apresentação do site**
> (landing), com o **mapa pré-carregado** na própria página — que o usuário pode
> **expandir** para tela cheia e **subir a lista** de resultados — e sem a barra
> lateral que deixa a **área administrativa exposta**. Mobile-first, mas impecável no
> desktop.

---

## 1. Diagnóstico da home atual

| Problema | Detalhe |
|---|---|
| **A home é "só mapa"** | já abre no mapa; o usuário não entende o que é o DF Coleta antes de usar. |
| **Sidebar desktop de 380px** | rouba o espaço do mapa e concentra tudo em uma coluna estreita. |
| **Admin fácil de achar** | link "Admin" aparece na nav da sidebar e no rodapé dela. |
| **Densidade no topo (mobile)** | busca + chips + banner demo empilhados cobrem boa parte do mapa. |
| **Duplicação de UI** | busca/chips/lista existem em versão mobile E desktop (manutenção dobrada). |
| **Sem hierarquia de conteúdo** | não há "o que é", "como funciona", "o que descartar". |

---

## 2. Nova arquitetura da informação

```
Home (landing)  →  apresenta o serviço
   │  busca rápida / categorias / "Como funciona" / pontos em destaque
   │
   └──▶ [ Ver mapa ]  →  MAPA (revelado sob demanda)
                          ├── overlay em tela cheia  (opção A)
                          └── página dedicada        (opção B)

Pontos (lista)   →  navegação por lista (já existe)
Detalhe          →  (já existe)
Sobre / Sugerir  →  (já existem)
Admin            →  acesso apenas por URL direta (fora da navegação pública)
```

**Princípio:** a home **vende** o serviço; o mapa **entrega** o serviço.

---

## 3. Wireframe da nova home

### Mobile (≥ 360px)
```
┌───────────────────────────────┐
│ ☰  ♻ DF Coleta        🔍  🌙  │  header slim
├───────────────────────────────┤
│  Descarte certo,              │
│  mais perto de você           │  hero
│  Encontre pontos de coleta…   │
│  ┌─────────────────────────┐  │
│  │ 🔍 O que você quer…     │  │  busca
│  └─────────────────────────┘  │
│  [ Ver mapa ]  [ Pontos ]     │  CTAs
│  ● 42 pontos ● 8 cidades      │
├───────────────────────────────┤
│  O que você pode descartar    │
│  [🖥][🔋][🫙][📦][♻] …         │  chips/categorias (scroll-x)
├───────────────────────────────┤
│  Como funciona                │
│  ① Procure  ② Escolha  ③ Leve │
├───────────────────────────────┤
│  ┌─────────────────────────┐  │
│  │   MAPA (teaser + CTA)   │  │  “Abrir mapa interativo”
│  └─────────────────────────┘  │
├───────────────────────────────┤
│  Pontos em destaque           │
│  ┌─────────────────────────┐  │
│  │ Ecoponto…       2,3 km  │  │
│  └─────────────────────────┘  │
│  [ Ver todos os pontos ]      │
├───────────────────────────────┤
│  Footer  (Sobre · Sugerir)    │  (sem link de Admin)
└───────────────────────────────┘
```

### Desktop (≥ 1024px)
```
┌───────────────────────────────────────────────────────────────┐
│ ♻ DF Coleta    Início  Como funciona  Pontos  Sobre   🔍  🌙  │  header largo
├───────────────────────────────────────────────────────────────┤
│                                                               │
│     Descarte certo, mais perto de você                        │
│     ┌───────────────────────────────────────┐                 │  hero centralizado
│     │ 🔍 O que você quer descartar?         │  [Buscar]       │  (max-width 720)
│     └───────────────────────────────────────┘                 │
│     ● 42 pontos  ● 8 cidades  ● 10 tipos       [ Ver mapa ]    │
│                                                               │
├───────────────────────────────────────────────────────────────┤
│  O que você pode descartar                                    │  grid 5×2 de categorias
│  [🖥][🔋][🫙][📦][♻]                                          │
│  [🍾][🥫][💊][💡][📺]                                          │
├───────────────────────────────────────────────────────────────┤
│  Como funciona          ┌──┐  ┌──┐  ┌──┐                      │
│                         │①│  │②│  │③│  (3 colunas)          │
├───────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────┐  Pontos em destaque          │  mapa à esquerda,
│  │  MAPA (preview + CTA)       │  · card                     │  lista à direita
│  └─────────────────────────────┘  · card                     │
├───────────────────────────────────────────────────────────────┤
│  Footer                                                       │
└───────────────────────────────────────────────────────────────┘
```

---

## 4. Seções da nova home

1. **Header** — logo + navegação (`Início`, `Como funciona`, `Pontos`, `Sobre`) + botão
   de busca + **alternador de tema**. **Sem link de Admin.**
2. **Hero** — título, subtítulo, **barra de busca grande**, botões `Ver mapa` e
   `Ver pontos`, e uma linha de números (pontos / cidades / tipos de resíduo).
3. **Categorias ("O que você pode descartar")** — grade/carrossel de **ícones Lucide**;
   clicar leva aos pontos já filtrados por aquele resíduo.
4. **Como funciona** — 3 passos (Procure → Escolha o ponto → Faça o descarte).
5. **Mapa (pré-carregado + expansível)** — o mapa **já aparece carregado** na seção,
   com botão **Expandir** (tela cheia) e a **lista arrastável** (ver seção 5).
6. **Pontos em destaque** — 3–4 cards + `Ver todos os pontos`.
7. **Footer** — links públicos + créditos. Admin **não** aparece.

---

## 5. Como o mapa aparece (decisão principal)

> **Atualização (revisão do usuário):** o mapa **não** é mais "sob demanda". Ele fica
> **pré-carregado** dentro da própria home (seção "Veja tudo no mapa"), já renderizando
> os tiles e os marcadores. A partir dali o usuário pode **expandir** para tela cheia e
> **subir a lista** de resultados (bottom-sheet arrastável no mobile / painel no desktop).

**Opção A — Mapa embutido + expandir em tela cheia (escolhida)**
- O mapa é inicializado junto com a página, dentro da seção, e **já aparece carregado**.
- Botão **Expandir** (`maximize-2`) coloca **o mesmo mapa** em tela cheia (sem recriar a
  instância do Leaflet — é instantâneo). Fecha com o botão (`minimize-2`) ou `Esc`.
- Lista de resultados **arrastável**:
  - **Mobile:** bottom-sheet com 3 estados — `peek` (só o topo) → `half` → `full`, com
    alça de arrastar (tap na alça também alterna os estados).
  - **Desktop:** painel lateral à esquerda, que dá para ocultar/mostrar.
- Prós: mapa instantâneo, um só layout, sem recarregar. Contras: mais JS/CSS.

**Opção B — Página dedicada (`pages/mapa.html`)**
- A home fica só apresentação; `Ver mapa` navega para uma página do mapa.
- Prós: simples, bom SEO, cada tela com seu layout. Contras: recarrega a página.

> **Recomendação:** **A** no mobile e **B** como base compartilhável — ou seja, mover o
> mapa para `pages/mapa.html` e, na home, o botão abrir esse mapa **em overlay** quando
> o dispositivo for mobile. (Podemos começar por A e evoluir.)

---

## 6. Navegação e acesso ao Admin

- **Nav pública** (header, drawer, footer): `Início`, `Como funciona`, `Pontos`,
  `Sobre`, `Sugerir Ponto`. **Nenhum** item de admin.
- **Acesso ao admin:** apenas por **URL direta** (`pages/admin/login.html`).
  - Opcional: um ícone de **cadeado discreto** no rodapé (`title="Área restrita"`),
    sem texto chamativo.
- Remover o link "Admin" da `sidebar-desktop__nav`, do `menu-drawer__footer` e do
  `sidebar-desktop__footer`.

---

## 7. Impacto técnico

| Item | Ação |
|---|---|
| `frontend/index.html` | reescrever como landing (hero, seções, footer). |
| `frontend/css/index.css` | substituir o layout "fullscreen/sidebar" por layout de **landing** (grid/containers) + estilos do overlay do mapa. |
| `frontend/js/index.js` | separar: (a) lógica da landing (contadores, categorias, destaque) e (b) lógica do mapa (mover para `js/mapa-pagina.js` ou reaproveitar `mapa.js`). |
| `frontend/pages/mapa.html` | **novo** — hospeda o mapa (se opção B/overlay). |
| `mapa.js`, `pontos.js` | sem mudanças de dados; só onde são carregados. |
| Admin (links) | remover da navegação pública. |

---

## 8. Fases

| Fase | Entrega |
|---|---|
| **H1** | Nova estrutura da home (header, hero, categorias, como funciona, footer) + remoção do admin da nav. |
| **H2** | Mapa sob demanda (overlay ou página) reaproveitando `mapa.js`. |
| **H3** | Busca e categorias da home ligadas aos pontos reais (contadores, filtros). |
| **H4** | Responsivo fino (360 → 1440), acessibilidade (foco, `aria`), performance (lazy do mapa). |

---

## 9. Critérios de aceite

- [ ] Abrir a home mostra **conteúdo do site**; o mapa fica em sua seção, **já carregado**.
- [ ] O mapa **expande** para tela cheia (`maximize-2`) e volta ao normal (`minimize-2` / `Esc`).
- [ ] A lista de resultados **sobe e desce** (drag no mobile; painel ocultável no desktop).
- [ ] **Nenhum** link de admin na navegação pública.
- [ ] Layout impecável em **360, 414, 768, 1024, 1440px** (light e dark).
- [ ] Sem duplicação de UI mobile/desktop desnecessária.
- [ ] Categorias e busca levam aos pontos filtrados.

---

## 10. Decisões tomadas

1. **Mapa:** pré-carregado na home + botão **Expandir** para tela cheia. ✅
2. **Admin:** cadeado discreto no rodapé (acesso por URL). ✅
3. **Busca/categorias:** abrem o **mapa já filtrado** (e expandido). ✅
4. Aviso de demonstração: mantido de forma discreta no rodapé. ✅
5. **Lista de resultados arrastável**: bottom-sheet no mobile (`peek`/`half`/`full`) e
   painel ocultável no desktop — "sobe a lista" igual ao comportamento anterior. ✅

---

## 11. Status de execução

- [x] **H1 — Nova estrutura da home** ✅
  - `index.html` reescrito como landing: header, hero com busca, categorias, "Como funciona",
    prévia do mapa, pontos em destaque e footer.
  - **Sidebar de 380px removida**; **links de admin removidos** da navegação.
  - Acesso ao admin apenas pelo **cadeado** no rodapé (`pages/admin/login.html`).
- [x] **H2 — Mapa pré-carregado + expansível + lista arrastável** ✅
  - Mapa Leaflet **inicializado junto com a página** (tiles e marcadores já carregados).
  - Botão **Expandir/Recolher** (`maximize-2`/`minimize-2`): o **mesmo** mapa vai a tela
    cheia via classe `.expandido` (instantâneo, sem recriar a instância) + `Esc`.
  - Lista de resultados **arrastável**: bottom-sheet `peek`/`half`/`full` no mobile
    (com alça; tap alterna os estados) e **painel ocultável** no desktop.
  - Geolocalização pedida **quando a seção do mapa entra na tela** (`IntersectionObserver`).
  - `mapa.js`: popup adaptado aos tokens (dark) + `focarPontoNoMapa()`.
  - Correção: `#mapa` agora cria **contexto de empilhamento** (`z-index:0`) para que os
    panes do Leaflet (`z-index:400`) não cubram a busca nem a lista.
- [x] **H3 — Busca e categorias ligadas aos dados** ✅
  - Contadores reais, categorias dinâmicas e destaques vindos da API.
  - Categoria/busca abrem o mapa **já filtrado**; ordenação por proximidade.
  - Fallback local (`DADOS_FALLBACK`) para a home funcionar sem backend (demo).
- [ ] **H4 — Polimento** (responsivo fino, acessibilidade, performance) — pendente.

### Arquivos
| Arquivo | Situação |
|---|---|
| `frontend/index.html` | reescrito (landing + mapa pré-carregado/expansível) |
| `frontend/css/index.css` | reescrito (landing + mapa/shell/painel, com tokens) |
| `frontend/js/index.js` | reescrito (landing + mapa pré-carregado, expandir, lista arrastável) |
| `frontend/js/mapa.js` | popup com tokens + `focarPontoNoMapa()` |
| `frontend/js/pontos.js` | deixou de ser carregado na home (continua no projeto) |
| `frontend/mockup-home.html` | mockup de referência |

