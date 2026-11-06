# Escopo — Redesign de UI/UX do DF Coleta

> **Objetivo central:** remover a estética "genérica de IA" e dar ao DF Coleta uma
> identidade visual sólida, profissional e confiável, **substituindo todos os emojis
> por ícones vetoriais (Lucide)** e refinando a experiência de uso.

---

## 1. Contexto e objetivo

O projeto hoje funciona bem em termos de features, mas a interface "entrega" que foi
gerada por IA: emojis como ícones, componentes com aparência genérica e hierarquia
visual fraca. O redesign busca:

- **Credibilidade** — passar a imagem de serviço público/sério, não de protótipo.
- **Consistência** — um único sistema de ícones, cores, espaçamentos e tipografia.
- **Usabilidade** — menos cliques, filtros mais claros, feedback melhor.
- **Identidade** — visual reconhecível do DF Coleta em todas as telas.

---

## 2. Diagnóstico — "por que parece feito por IA"

| Sinal de "cara de IA" | Onde aparece hoje |
|---|---|
| Emojis como ícones (dependem do sistema, visual infantil) | `dados-mock.ts` (`icone`), `index.js`, `pontos.js`, `mapa.js`, `residuos.html` |
| Ícones de mapa como emoji (📍, 📌, 🔍) | `pontos.js`, `index.js` |
| Excesso de emoji decorativo | estados vazios, badges |
| Componentes genéricos com sombra forte e cantos iguais | cards, botões |
| Textos longos e "comerciais demais" | `sobre.html`, heroes |
| Falta de hierarquia / respiro | seções densas |
| Tipografia sem identidade | Inter padrão em tudo |

**Regra de ouro:** nenhum emoji visível na interface. Todo símbolo = ícone Lucide.

---

## 3. Princípios de design

1. **Ícone > emoji** — sempre vetorial, com `stroke` consistente, herdando a cor do texto.
2. **Menos é mais** — reduzir sombras, gradientes e ruído visual; usar cor com intenção.
3. **Hierarquia clara** — um título forte por seção, subtítulo discreto, corpo legível.
4. **Consistência** — mesmos raios, espaçamentos (escala de 4/8px) e cores em tudo.
5. **Feedback imediato** — toda ação tem loading, sucesso ou erro visível.
6. **Acessível** — contraste AA, foco visível, alvos de toque ≥ 44px, `aria-label` nos ícones.
7. **Mobile-first real** — o mapa e o bottom-sheet são o coração no celular.

---

## 4. Identidade visual (design tokens)

Definir em `frontend/css/global.css` (e reaproveitar em `pages.css` / `admin.css`):

### 4.1 Cor
- **Base:** off-white quente (ex. `#FAF9F5`) ou branco puro — decidir direção.
- **Primária:** verde institucional do DF (manter identidade eco) **ou** acento novo.
- **Semânticas:** sucesso, alerta, erro, informação — com versões "soft" de fundo.
- **Neutros:** 5–7 tons de cinza para texto, borda e fundo.
- Contraste mínimo AA (4.5:1) para texto.

### 4.2 Tipografia
- **Display/Títulos:** fonte com personalidade (ex.: Fraunces, Plus Jakarta Sans).
- **Corpo:** fonte limpa e legível (ex.: Inter).
- **Escala:** 12 / 14 / 16 / 18 / 24 / 32 / 48px, com entrelinha generosa.

### 4.3 Espaçamento, raio e sombra
- Espaçamento na escala **4 · 8 · 12 · 16 · 24 · 32 · 48**.
- Raio: `sm 10px` · `md 16px` · `pill 999px`.
- Sombra: **uma** sombra suave padrão + **uma** de destaque no hover. Sem exageros.

### 4.4 Movimento
- Transições de 150–250ms, `ease-out`.
- Microinterações: hover eleva o card levemente, botões escurecem, foco com anel.

---

## 5. Sistema de ícones (Lucide) — substituição completa

### 5.1 Ícones dos tipos de resíduo

| Resíduo | Emoji atual | Ícone Lucide |
|---|---|---|
| Eletrônicos | 🖥️ | `monitor` |
| Pilhas e Baterias | 🔋 | `battery-charging` |
| Óleo de Cozinha | 🫙 | `droplets` |
| Papel e Papelão | 📦 | `package` |
| Plástico | ♻️ | `recycle` |
| Vidro | 🍾 | `wine` |
| Metal | 🥫 | `wrench` (ou `cog`) |
| Medicamentos | 💊 | `pill` |
| Lâmpadas | 💡 | `lightbulb` |
| TVs Analógicas | 📺 | `tv` |
| (extra admin) 🧴 | | `spray-can` |
| (extra admin) 👕 | | `shirt` |
| (extra admin) 🌱 | | `sprout` |

### 5.2 Ícones de interface (hoje em emoji)

| Uso | Emoji atual | Ícone Lucide |
|---|---|---|
| Lista vazia | 🔍 | `search-x` |
| Distância | 📍 | `navigation` |
| Endereço | 📌 | `map-pin` |
| Fallback de resíduo | ♻️ | `recycle` |
| Destaque/decorativo | ✨ | `sparkles` |

### 5.3 Mudança técnica necessária (importante!)

Hoje o **backend guarda o emoji** no campo `icone`:

```ts
{ id: 1, nome: 'Eletrônicos', icone: '🖥️', descricao: '...' }
```

**Proposta:** trocar o conteúdo do campo por um **slug de ícone** (`'monitor'`) e o
frontend renderiza `<i data-lucide="monitor">`. Assim o ícone vira dado, não texto.

```ts
{ id: 1, nome: 'Eletrônicos', icone: 'monitor', descricao: '...' }
```

Isso exige ajustar:
- `backend/src/mock/dados-mock.ts` (trocar emojis por slugs)
- `backend/banco_de_dados.sql` (opcional: coluna `icone` nos seeds)
- `frontend/pages/admin/residuos.html` → trocar o **seletor de emoji** por um
  **grid de ícones Lucide selecionáveis**
- `frontend/js/index.js`, `pontos.js`, `mapa.js` → remover fallbacks de emoji

---

## 6. Melhorias de UX por tela

### Página inicial / Mapa
- Bottom-sheet com "peek" claro e drag suave; contador de resultados em destaque.
- Pins com ícone do resíduo principal; agrupamento (clustering) quando muito próximos.
- Estado "sem localização" com botão claro para ativar GPS.
- Chips de filtro com cor por categoria e contagem.

### Lista de pontos (`pontos.html`)
- Card com hierarquia: título → endereço (ícone) → tags → ação.
- Ícone de status (ativo/inativo) e distância com ícone.
- Estado vazio ilustrado com ícone (não emoji).

### Detalhe do ponto (`ponto-detalhe.html`)
- Cabeçalho com status + distância; cards com ícones no título.
- Horários em tabela limpa; contato com ícone de telefone.
- Formulário de comentário com validação e feedback claro.

### Painel admin
- Sidebar com ícones consistentes, item ativo destacado por barra + cor.
- Tabelas com hover, badges semânticas e ações em ícones com tooltip.
- Dashboard com métricas legíveis e ícones coloridos coerentes.
- **Seletor de ícones** (substitui emoji picker) em Resíduos.

---

## 7. Componentes a redesenhar

- [ ] Botões (primário, secundário, fantasma, ícone)
- [ ] Inputs / selects / busca com ícone integrado
- [ ] Chips de filtro
- [ ] Badges de status
- [ ] Cards: ponto, resíduo, estatística
- [ ] Tabela admin
- [ ] Modais (criar/editar/excluir)
- [ ] Toast de notificação
- [ ] Estado vazio / skeleton loading
- [ ] Cabeçalho, rodapé e sidebar administrativa

---

## 8. Fases de execução

| Fase | Entrega | Arquivos principais |
|---|---|---|
| **1. Fundação** | Tokens (cores, tipografia, espaçamento) + ícones Lucide globais | `css/global.css` |
| **2. Ícones** | Trocar todos os emojis por ícones (front + mock + admin) | `js/*`, `dados-mock.ts`, `residuos.html` |
| **3. Componentes** | Redesenhar botões, cards, inputs, badges, tabelas | `css/*.css` |
| **4. Telas públicas** | index, pontos, detalhe, sobre, sugestão | `index.html`, `pages/*` |
| **5. Admin** | dashboard + 6 páginas internas | `pages/admin/*` |
| **6. Polimento** | Microinterações, acessibilidade, responsivo, revisão | todos |

---

## 8.1 Status de execução

- [x] **Fase 1 — Fundação** ✅
  - `css/tokens.css` criado: paleta (verde moderno + acento azul), tipografia, formas, sombras e espaçamentos.
  - **Tema claro + escuro** com atributo `[data-theme]` no `<html>`.
  - `global.css`, `pages.css` e `admin.css` passaram a apontar para os tokens (fim dos 3 sistemas separados).
  - `js/tema.js`: alterna tema, salva a escolha (localStorage) e injeta um **botão flutuante sol/lua** em todas as páginas.
- [x] **Fase 2 — Ícones** ✅
  - Backend: campo `icone` agora guarda **slug Lucide** (`dados-mock.ts` + `banco_de_dados.sql`).
  - Frontend: `api.js` com os helpers `iconeResiduo()` / `iconeResiduoHtml()`.
  - `index.js`, `pontos.js` e `mapa.js` sem emojis (🔍→`search-x`, 📍→`navigation`, 📌→`map-pin`).
  - Admin **Resíduos**: seletor de emoji virou **grade de ícones Lucide** com pré-visualização.
- [ ] Fases 3–6 (componentes, telas públicas, admin, polimento).

---

## 9. Fora de escopo (por agora)

- Conectar o Supabase de verdade (é outro trabalho).
- Autenticação real do admin no backend.
- Novas features (favoritos, notificações, login de usuário).
- Internacionalização.

---

## 10. Critérios de aceite

- [ ] **Zero emojis** visíveis em qualquer tela (site + admin).
- [ ] Todos os resíduos e elementos de UI com ícone Lucide coerente.
- [ ] Paleta, tipografia e espaçamentos vindos dos tokens (sem cores soltas).
- [ ] Layout responsivo validado em 360px, 768px e 1280px.
- [ ] Contraste AA e navegação por teclado com foco visível.
- [ ] Estados de loading, vazio, erro e sucesso em todas as telas de dados.
- [ ] Visual consistente entre as 5 páginas públicas e as 7 do admin.

---

## 11. Decisões em aberto (precisamos bater o martelo)

1. **Paleta:** manter o verde institucional ou adotar um acento novo?
2. **Estilo:** Claude-like (quente/minimalista) · Verde moderno · Dark premium?
3. **Tema escuro:** incluir suporte (manual e/ou por preferência do sistema)?
4. **Fonte de títulos:** personalizada (Fraunces / Plus Jakarta) ou manter Inter?
5. **Páginas:** fazer todas de uma vez ou começar por index + pontos?
6. **Prazo/entrega:** é trabalho acadêmico com data? (ajuda a fatiar as fases)
