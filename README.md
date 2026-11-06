# DF Coleta

> Site para localização de pontos de coleta de resíduos no Distrito Federal.

## 📁 Estrutura do Projeto

```
DF COLETA/
├── frontend/               → HTML + CSS + JS puro
│   ├── index.html          → Página principal
│   ├── css/
│   │   ├── global.css      → Estilos globais e componentes
│   │   └── index.css       → Estilos da página inicial
│   ├── js/
│   │   ├── api.js          → Comunicação com a API backend
│   │   ├── mapa.js         → Integração com Google Maps
│   │   ├── pontos.js       → Renderização dos cards de pontos
│   │   └── index.js        → Lógica da página inicial
│   ├── pages/
│   │   ├── pontos.html     → Lista de todos os pontos
│   │   ├── ponto-detalhe.html  → Detalhes de um ponto
│   │   ├── sobre.html      → Sobre o projeto
│   │   └── sugestao.html   → Formulário de sugestão
│   └── assets/
│       ├── img/            → Imagens e logo
│       └── icons/          → Ícones SVG
│
├── backend/                → NestJS API
│   ├── src/
│   │   ├── supabase/       → Módulo global do Supabase
│   │   ├── pontos-coleta/  → CRUD de pontos de coleta
│   │   ├── residuos/       → CRUD de tipos de resíduos
│   │   ├── comentarios/    → Comentários dos usuários
│   │   ├── problemas/      → Problemas relatados
│   │   ├── sugestoes/      → Sugestões de novos pontos
│   │   └── admin/          → Painel administrativo
│   └── .env.example        → Variáveis de ambiente necessárias
│
└── banco_de_dados.sql      → Script SQL para criar as tabelas no Supabase
```

## 🚀 Como Iniciar

O passo a passo completo (Supabase, login, GitHub e Vercel) está em
[`docs/DEPLOY.md`](./docs/DEPLOY.md). Resumo:

### 1. Configurar o Supabase

1. Crie um projeto em [supabase.com](https://supabase.com/dashboard).
2. No **SQL Editor**, execute [`supabase/01-schema.sql`](./supabase/01-schema.sql)
   e depois [`supabase/02-seed.sql`](./supabase/02-seed.sql).
3. Em **Authentication → Users**, crie o admin (`admin@dfcoleta.com`), marcando
   **Auto Confirm User**.
4. Copie a **Project URL** e a chave **service_role** (Settings → API).

### 2. Configurar o Backend

```bash
cd backend
cp .env.example .env
# Edite .env com SUPABASE_URL e SUPABASE_KEY (service_role)
npm run build
node dist/main.js
```

Sem credenciais válidas, a API sobe em **modo mock** (dados em memória), o que
permite desenvolver sem internet.

### 3. Abrir o Frontend

```bash
# Na raiz do projeto
npx --yes serve frontend -l 5500
```

Acesse <http://localhost:5500>. O login do painel fica em
`/pages/admin/login.html` e usa o usuário criado no Supabase Auth.

> ⚠️ O mapa da página inicial usa o Google Maps. Sem chave, o restante do site
> continua funcionando normalmente.

## 🗺️ Rotas da API

| Método | Rota | Acesso | Descrição |
|--------|------|--------|-----------|
| GET | `/pontos-coleta` | público | Lista pontos ativos (`residuo`, `cidade`, `busca`, `tipo`, `estabelecimento`) |
| GET | `/pontos-coleta/:id` | público | Detalhes de um ponto |
| POST | `/pontos-coleta` | admin | Cria ponto |
| PUT | `/pontos-coleta/:id` | admin | Edita ponto |
| PATCH | `/pontos-coleta/:id/status` | admin | Ativa/desativa ponto |
| DELETE | `/pontos-coleta/:id` | admin | Remove ponto |
| GET | `/residuos` | público | Lista tipos de resíduos |
| POST/PUT/DELETE | `/residuos` | admin | Gerencia resíduos |
| GET | `/comentarios/ponto/:id` | público | Comentários de um ponto |
| POST | `/comentarios` | público | Envia comentário |
| GET | `/comentarios` | admin | Lista todos os comentários |
| POST | `/problemas` | público | Relata problema |
| GET | `/problemas` | admin | Lista relatos |
| PATCH | `/problemas/:id/status` | admin | Altera andamento do relato |
| POST | `/sugestoes` | público | Sugere novo ponto |
| GET | `/sugestoes` | admin | Lista sugestões |
| PATCH | `/sugestoes/:id/status` | admin | Aprova/rejeita sugestão |

As rotas **admin** exigem `Authorization: Bearer <token>` do Supabase Auth.

## 🛠️ Stack

- **Frontend:** HTML5, CSS3, JavaScript ES6+
- **Backend:** Node.js + NestJS
- **Banco de dados:** Supabase (PostgreSQL + Auth + RLS)
- **Mapa:** Google Maps API
- **Deploy:** Vercel (frontend estático + API serverless em `/api`)

## ✅ Requisitos atendidos

- Cadastro e consulta de pontos de coleta, com filtros por resíduo, cidade e
  **tipo de estabelecimento**.
- **Horários de funcionamento** editáveis no painel.
- Detalhe do ponto com tipo, horários, mapa, comentários e **relato de problemas**.
- **Geolocalização** com aviso quando indisponível e ordenação por proximidade.
- Sugestões de novos pontos com fluxo de aprovação/rejeição.
- Painel administrativo com login real (Supabase Auth) e rotas protegidas.
- Dados persistidos no PostgreSQL (com RLS), não mais em memória.
