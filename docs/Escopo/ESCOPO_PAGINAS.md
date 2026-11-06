# Escopo — Redesign das telas (públicas + admin)

> Continuação do `ESCOPO_REDESIGN.md`. As **fases 1 e 2** (tokens + ícones Lucide)
> já foram aplicadas em todas as páginas. A **home** (`index.html` / `index.css`)
> foi redesenhada do zero e passa a ser a **referência visual** das demais telas.

---

## 1. Diagnóstico (levantamento feito no código e no navegador)

### O que já está bom

| Item | Situação |
| --- | --- |
| Cabeçalho das públicas | Já usa o componente novo `.header`, com item ativo, ícones Lucide e CTA "Sugerir" |
| `pontos.html` | Hero + busca + card de filtros no padrão novo, tudo alinhado |
| Login do admin | Layout dividido (painel verde + formulário) bem resolvido |
| Tokens / tema | `tokens.css` importado por `global.css`, `pages.css` e `admin.css` — claro/escuro chega em todas |
| Ícones | 15 a 36 ícones Lucide por página, zero emoji |

### O que está quebrado ou legado (evidências coletadas)

| Problema | Onde | Evidência |
| --- | --- | --- |
| **Cards de ponto no estilo antigo** | `js/pontos.js` → `pontos.html` | O JS monta `class="card-ponto"` + `card-ponto__tags` + `.tag` (classes legadas do `global.css`, com cor fixa `#e8f5e9`) |
| **Botão de tema flutuante sobrepõe conteúdo** | todas as páginas internas | Aparece no meio da lista de pontos e em cima do rodapé do login |
| **Classe quebrada por replace** | `admin/pontos.html`, `admin/residuos.html` | `class="admin-modal__title modal__cabecalho h3"` → três classes coladas, uma delas é lixo |
| **Estilos inline com cor fixa** | telas do admin | 13 ocorrências de `background:#fff` / `color:#000` que ignoram o dark mode |
| **URL fixa do backend** | `admin/dashboard.html` (3), `pontos.html` (2), `residuos.html` (2), `comentarios.html` (1) | `http://localhost:3000` escrito na mão → quebra ao abrir o admin de outro aparelho |
| **CSS morto** | `css/global.css` | `.botao--*`, `.campo__*`, `.alerta--*`, `.filtros__*`, `.secao__titulo`, `.cabecalho*` — definidos e nunca usados (≈37 blocos) |
| **Cards longos e pouco informativos** | `pontos.html` | Cartões de uma coluna só, com muito espaço vertical e sem hierarquia visual |
| **Arquivos de estudo na entrega** | `frontend/` | `design-ideias.html`, `mockup-home.html` |

---

## 2. Decisões

1. **Sem build/templating** — o HTML continua estático por página. O rodapé e o
   cabeçalho são repetidos, mas com o **mesmo markup** e as mesmas classes.
2. **Evoluir, não reescrever** — as páginas já usam o sistema de componentes
   (`.header`, `.page-hero`, `.card-section`, `.card`, `.btn`, `.chip`).
   O trabalho é **polir esse sistema** no padrão da home, não trocar tudo.
3. **Um único componente de card** — a listagem de pontos passa a usar o mesmo
   `.card` da home; o `pontos.js` para de fabricar classes próprias.
4. **Chips como componente único** — resíduos/cidade/status usam `.chip` (com
   ícone Lucide e cor por tipo), aposentando `.tag`.
5. **Botão de tema** — nas páginas internas ele deixa de ser flutuante e vira
   um item do cabeçalho (igual à home), acabando com a sobreposição.
6. **Admin: um só caminho para o backend** — trocar as URLs fixas pelo
   `API_BASE_URL` que já existe em `js/api.js`.

---

## 3. Fases

### Fase A — Limpeza ✅
- [x] Remover do `global.css` os blocos mortos (`.cabecalho*`, `.botao*`,
      `.campo__*`, `.alerta--*`, `.filtros__*`, `.secao__titulo`, `.tag`,
      `.card-ponto*`) **depois** de migrar quem os usa. (493 → 217 linhas)
- [x] Corrigir a classe quebrada nos modais do admin.
- [x] Tirar `design-ideias.html` e `mockup-home.html` da entrega (`docs/mockups/`).

### Fase B — Páginas públicas (4) ✅
- [x] `pontos.html`: card novo (ícone do resíduo principal,
      nome, endereço, chips de resíduos, distância, ação "ver detalhes",
      badge de status), **grade de 2 colunas no desktop**, estado vazio bonito.
- [x] `ponto-detalhe.html`: revisar hierarquia (título, endereço, contato,
      mapa, horários, resíduos, comentários) e alinhar ao padrão da home.
- [x] `sobre.html`: revisar seções, cards de passo/estatística e CTA.
- [x] `sugestao.html`: revisar formulário (rótulos, foco, estados de erro/sucesso).
- [x] Cabeçalho e rodapé iguais em todas, com o tema no header.
- [x] Botão de tema deixa de sobrepor o conteúdo.

### Fase C — Admin (7 telas)
- [x] Sidebar/topbar no padrão dos tokens (antes com cores fixas).
- [x] Remover os estilos inline com cor fixa → dark mode completo.
- [x] Trocar `http://localhost:3000` por `DF_API_BASE` (host automático).
- [x] Tabelas trocadas por listas de cards (`.admin-item`) em `admin/pontos.html`
      e `admin/residuos.html`; no dashboard a tabela-resumo foi mantida com
      `min-width` e rolagem própria.
- [x] Badges de status (Ativo/Pendente/Resolvido) com os tokens.
- [x] Modais e toasts padronizados; foco preso no modal (acessibilidade).
      Componente único `.admin-modal` (os aliases `.modal-overlay`/`.modal*`
      saíram) e um só `.admin-toast` com tokens, no lugar de 3 cópias.
      O `admin-base.js` cuida de ARIA, foco inicial, ciclo de Tab, ESC,
      clique no fundo, trava de rolagem e devolução do foco.

### Fase D — Verificação
- [x] Larguras 360 / 480 / 768 / 1024 / 1440 sem rolagem horizontal.
      *(auditoria automática: 11 telas × 5 larguras = 55 combinações, 0 estouros;
      a tabela-resumo do dashboard rola dentro do próprio container, por escolha)*
- [x] Tema claro e escuro em todas as telas. *(verificado por captura nas telas
      públicas e no admin: pontos, resíduos, comentários, sugestões e login)*
- [x] Navegação por teclado (foco visível, ESC fecha modal).
- [x] `prefers-reduced-motion` respeitado.

### Fase E — Navegação única ✅
O sintoma era "parecem dois sites diferentes": a home tinha um cabeçalho
(`.site-header`/`.nav`) e as internas tinham outro (`.header`), com menus
diferentes (a home listava "Como funciona"; as internas listavam "Mapa").

- [x] `css/navegacao.css`: **arquivo único** com o cabeçalho e o rodapé do site
      público. Usa só tokens `--df-*`, então vale igual no claro e no escuro.
- [x] As 5 páginas públicas (`index`, `pontos`, `ponto-detalhe`, `sobre`,
      `sugestao`) usam **exatamente o mesmo markup** de cabeçalho e rodapé, com
      **caminhos absolutos** (`/index.html`, `/pages/...`) para o bloco ser idêntico.
- [x] Menu enxuto: **Início · Pontos · Sobre · Sugerir** (CTA) + botão de tema +
      hambúrguer. Item ativo com `aria-current="page"`.
- [x] "Como funciona" saiu do menu e voltou como **botão no topo da home**
      (âncora `#como-funciona`).
- [x] Rodapé único: Início · Pontos · Sobre · Sugerir Ponto + **cadeado do admin**.
- [x] Admin segue discreto: só o cadeado no rodapé → `/pages/admin/login.html`.
- [x] Celular: menu em gaveta logo abaixo do cabeçalho, itens de ~50px, fecha ao
      tocar; 0 rolagem horizontal a 360px nas 5 páginas.
- [x] Mapa em tela cheia da home foi para `z-index: 1100` (cobre o cabeçalho fixo).
- [x] CSS antigo removido: `.site-header*`, `.nav`, `.brand*`, `.footer-grid`,
      `.footer-links`, `.footer-copy`, `.lock-link` (index.css) e `.header*`,
      `.footer*`, `.pular-link` (pages.css). Nada de JS dependia delas.

### Fase F — ODS na página Sobre ✅
- [x] Seção **"Os ODS que o DF Coleta ajuda a cumprir"** na `sobre.html`,
      entre "Nosso Impacto em Números" e o CTA final.
- [x] **ODS 11 — Cidades e Comunidades Sustentáveis** como principal
      (meta 11.6 — impacto ambiental urbano e gestão de resíduos).
- [x] **ODS 12 — Consumo e Produção Responsáveis** (meta 12.5 — prevenção,
      redução, reciclagem e reutilização) como secundário.
- [x] Componente `.ods-item` no `pages.css`, com os modificadores
      `.ods-item--11 / --12` guardando o **tom legível de cada ODS** em cada tema.
- [x] Texto sustenta o **software como instrumento**: o projeto não substitui a
      política pública, entrega a ela dado organizado, consultável e aberto —
      justificativa alinhada a Ciência da Computação.
- [x] Verificado no claro/escuro e a 360px (grade vira uma coluna, pills de metas
      não estouram, 0 rolagem horizontal).

*Por que esses dois:* o professor de Análise e Projeto de Sistemas usa
exatamente **"gestão de coleta seletiva → ODS 11 e ODS 12"** como exemplo.
O DF Coleta se encaixa no exemplo e passa a adotar **11 (principal) + 12
(secundário)** também na página Sobre, alinhando site e documentação da APS.
No itinerário extensionista o recorte era 13 + 6 + 3 (ODS disponíveis no
formulário daquela atividade); aqui vale o recorte da disciplina.

### Fase G — Redesign da página Sobre ✅
- [x] **Fora as barras laterais coloridas** dos cartões de ODS (o `border-left` de
      4 px que dava cara de template). Os objetivos viraram uma **lista com fios
      finos**: número grande na cor do ODS, título, texto e metas em linha.
- [x] Missão: fora o cartãozão com selo; virou **coluna de leitura centralizada**
      (760px, cabeçalho e bloco no centro), com a frase de destaque entre dois
      fios em vez de uma caixa.
- [x] Como funciona: fora a grade de três cartões idênticos; viraram **três passos
      com régua no topo** e numeração grande.
- [x] Impacto em números: fora a grade de quatro cartões com ícone em quadradinho;
      virou **uma faixa única com fios divisórios** (2×2 no celular).
- [x] Chamada final: sem o brilho radial; **painel verde sólido** com texto à
      esquerda e botões logo abaixo.
- [x] Cabeçalho de seção passou a ser **alinhado à esquerda**, com rótulo pequeno
      em maiúsculas (`.card-section__rotulo`) no lugar do selo acima de cada
      título.
- [x] Componentes novos, todos exclusivos da Sobre: `.passos`, `.numeros`,
      `.missao`, `.ods-item` e `.chamada`. O CSS antigo (`.step-card`,
      `.stat-card`, `.mission-*`, `.cta-banner`, `.ods-card`) e os utilitários que
      ficaram órfãos (`.grid-3`, `.grid-4`) saíram do `pages.css`.
- [x] Cores dos ODS: a cor oficial pura não passa em contraste no claro nem no
      escuro, então cada ODS guarda um tom legível (`--ods-tinta`) por tema.
- [x] Conferido no claro/escuro, em 912 px e 360 px, sem rolagem horizontal.

### Fase H — Organização do painel admin ✅
- [x] `admin/problemas.html` e `admin/sugestoes.html` foram **reescritos no padrão
      das demais telas**: gaveta com "Menu Principal" e "Moderação", barra
      superior com subtítulo e botão Atualizar, quatro cartões de estatística,
      barra de filtros no cartão e lista em `.admin-item`.
- [x] Os dois arquivos **deixaram de ter `<style>` próprio**: cores fixas
      (`#f0fdf4`, `#166534`, `#fef3c7`...) e o card artesanal
      (`.problema-card` / `.sugestao-card`) saíram.
- [x] **Fora as barras de cor**: o `border-left` de 3 px no texto do comentário
      e o de 4 px no toast (o mesmo padrão visual que já havia sido recusado no
      Sobre). O texto agora é um bloco neutro (`.admin-item__texto`).
- [x] As telas de problemas e sugestões passam a **mostrar o grupo "Moderação"**
      na gaveta e o subtítulo correspondente na barra superior, como Comentários.
- [x] CSS de **filtros e de estado vazio** (`.filtros-card`, `.filtros-grid`,
      `.busca-wrapper`, `.btn-limpar-busca`, `.empty-state`) estava copiado em
      três arquivos; agora vive só no `admin.css` (seção 18). As barras de
      filtro usam `flex-wrap`, então se ajustam sozinhas de 360 px a 1440 px.
- [x] Dados reais da API respeitados: `status` (`EM_ANALISE`), `severidade` e
      `residuos_sugeridos` (texto separado por vírgulas) agora aparecem nos
      cards; os textos vindos do banco passam por `esc()` antes do `innerHTML`.
- [x] Conferido em claro/escuro, 912 px e 360 px (gaveta fechada, sem rolagem
      horizontal) e com o modal de aprovação e o toast funcionando.

---

## 4. Critérios de aceite

1. Nenhuma tela com cor fixa (`#fff`, `#000`, `white`) fora dos tokens.
2. Mesmo cabeçalho, rodapé e card de ponto em todas as páginas públicas.
3. Zero emoji; todo símbolo em Lucide.
4. Nenhuma sobreposição do botão de tema sobre conteúdo em qualquer largura.
5. Admin funcionando tanto por `localhost` quanto pelo IP da rede.
6. Dark mode legível em todas as telas (nenhum texto branco sobre branco).
7. Nenhuma rolagem horizontal entre 360 px e 1440 px.

---

## 5. Status de execução

| Fase | Situação | Observação |
| --- | --- | --- |
| A — Limpeza | ✅ Concluída | CSS morto fora; classes dos modais corrigidas; mockups em `docs/mockups/`. |
| B — Páginas públicas | ✅ Concluída | 4 telas no padrão novo; tema no cabeçalho. |
| C — Admin | ✅ Concluída | Cores tokenizadas, `DF_API_BASE`, listas em cards, modal e toast únicos com foco preso. |
| D — Verificação | ✅ Concluída | 55 combinações de largura sem estouro; claro/escuro e teclado conferidos. |
| E — Navegação única | ✅ Concluída | `navegacao.css` + mesmo markup nas 5 públicas; menu Início·Pontos·Sobre·Sugerir; celular em gaveta; CSS duplicado removido. |
| F — ODS no Sobre | ✅ Concluída | Seção com ODS 11 (principal) + 12, metas 11.6 e 12.5, tons legíveis em `.ods-item`; claro/escuro e 360px conferidos. |
| G — Redesign do Sobre | ✅ Concluída | Barras laterais e cartões genéricos fora; missão em coluna de leitura, passos com régua, números em faixa única, ODS em lista com fios e chamada sólida. |
| H — Organização do admin | ✅ Concluída | Problemas e Sugestões no mesmo esqueleto das demais telas; barras de cor fora; "Moderação" em todo o menu; filtros e estado vazio num só lugar. |

Correção de percurso: o botão de tema do admin ficava solto sobre a sidebar
porque o `tema.js` escutava `DOMContentLoaded` em `window` (dispara depois) e o
`admin-base.js` em `document`. Agora o `tema.js` registra em `document` e avisa
por `df:tema-botao-pronto`; o botão entra na barra superior em todas as telas do
admin, e na tela de login vai para o canto superior.

### Pendências conhecidas (fora do redesign visual)
- `frontend/js/pontos.js` é código morto (nenhuma página o inclui); foi mantido
  no disco, mas não usa mais as classes legadas.
- Dados em memória: `SupabaseService` ainda não ligado no `app.module.ts`.
- Autenticação do admin é só no cliente (`admin123` no `sessionStorage`).
- `proximoId = 1` fixo em `problemas.service.ts` e `sugestoes.service.ts`.
- HTML montado por `innerHTML` sem escapar dados (risco de XSS) em
  `dashboard.html`, `pontos.html`, `residuos.html` e `comentarios.html`;
  `problemas.html` e `sugestoes.html` já passam os textos por `esc()`.
- Req 28 (formulário público de relato) e req 24 (admin cadastrar horários)
  não implementados.
- Todas as listas do painel usam o mesmo `.admin-item`; a exceção é
  `comentarios.html`, que mantém o `.card-comentario` em grade de duas colunas.
- Só ficou uma tabela no painel: a de resumo do `dashboard.html`, que rola
  dentro do próprio container.

---

## 6. Diagramas

Os dois diagramas da raiz (`Diagrama de caso de uso.png` e
`Possivel diagrama de classe.png`) foram refeitos no mesmo estilo, só com as
correções e o que faltava. As versões novas estão em `docs/diagramas/`
(`caso-de-uso.png` e `classes.png`, com `LEIA-ME.md` explicando cada mudança);
os originais continuam intactos.

O que foi corrigido:
- ator "API Google Maps" -> "API de Mapas" (o mapa é Leaflet/OpenStreetMap;
  Google Maps só na rota);
- "Visualizar localização no Google Maps" -> "Traçar rota no Google Maps";
- caso "Autenticar-se" incluído em "Acessar página de controle";
- `APIGoogleMaps` -> `APIMapas` (`exibirMapa`, `calcularProximidade`,
  `abrirRota`);
- `ProblemaRelato` com `severidade` e `status`, `SugestaoPonto` com `cidade` e
  `residuosSugeridos` — campos que já existem no código;
- as três classes de cima (`HorarioFuncionamento`, `Residuo` e `StatusPonto`)
  ligadas por **associação simples** — saiu o losango de composição, que além
  de misturar notação com as outras duas estava do lado errado da linha;
- `Comentario.comentar()` e `ProblemaRelato.relatar()`, ligando cada classe ao
  seu caso de uso.

A versão anterior do diagrama de classes está em
`docs/diagramas/historico/classes-2026-10-22.png`.

O que os diagramas prevêem e o código ainda não tem: relato público de problema
(req 28), CRUD de horários (req 24), autenticação real do admin, sincronização
com API externa e persistência (repositórios).

Roteiro dos **diagramas de sequência** (raias, mensagens, retornos e blocos
`alt`/`opt`) em `docs/diagramas/sequencia.md` — 15 fluxos, dos públicos aos do
painel, com os dois previstos (relato de problema e sincronização) marcados.
As versões prontas estão em `docs/diagramas/sequencia/`: 15 `.puml` (fonte
PlantUML) + 15 `.png` (imagem), no mesmo estilo dos outros diagramas, com a
tabela de situação (implementado × previsto) no `LEIA-ME.md` da pasta.
