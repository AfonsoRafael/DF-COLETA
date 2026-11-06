# Deploy do DF Coleta — Supabase + Vercel

Este guia cobre a configuração completa: banco no Supabase, login real do
administrador, teste local e publicação na Vercel (frontend + API no mesmo
projeto).

```
Navegador
   │
   ├── arquivos estáticos (frontend/) ─────────────► Vercel CDN
   │
   └── /api/* ─► função serverless (api/[...caminho].js) ─► NestJS
                                                             │
                                                             ▼
                                                     Supabase (PostgreSQL + Auth)
```

---

## 1. Criar o projeto no Supabase

1. Acesse <https://supabase.com/dashboard> e entre/crie sua conta.
2. Clique em **New project**.
3. Preencha:
   - **Name:** `df-coleta`
   - **Database Password:** crie uma senha forte e guarde (não é a senha do admin do site).
   - **Region:** `South America (São Paulo)` — `sa-east-1`.
4. Aguarde a criação (1–2 minutos).

## 2. Criar as tabelas e os dados iniciais

No projeto, abra **SQL Editor → New query** e execute, nesta ordem:

1. [`supabase/01-schema.sql`](../supabase/01-schema.sql) — tabelas, índices, view e RLS.
2. [`supabase/02-seed.sql`](../supabase/02-seed.sql) — 10 resíduos, 12 pontos, comentários, problemas e sugestões.

> Os dois scripts podem ser executados novamente sem duplicar os dados.
>
> Se o banco já existia antes da versão com curtidas/respostas, execute também
> [`supabase/03-comentarios-curtidas-respostas.sql`](../supabase/03-comentarios-curtidas-respostas.sql).
>
> Se o banco já existia antes das respostas oficiais, execute também
> [`supabase/04-comentarios-oficiais.sql`](../supabase/04-comentarios-oficiais.sql).

Confira em **Table Editor** se as tabelas `pontos_coleta`, `residuos`,
`comentarios`, `problemas` e `sugestoes` foram criadas.

## 3. Criar o usuário administrador

1. Vá em **Authentication → Users → Add user → Create new user**.
2. Preencha:
   - **Email:** `admin@dfcoleta.com`
   - **Password:** `admin123` (troque depois, se quiser)
   - Marque **Auto Confirm User**.
3. Clique em **Create user**.

O login do painel usa esse usuário. Não é preciso criar tabela de admins: o
backend valida o token do Supabase Auth em todas as rotas de escrita.

## 4. Preencher as credenciais

### 4.1 Backend — `backend/.env`

Em **Project Settings → API**, copie:

- **Project URL** → `SUPABASE_URL`
- **service_role** (em *Project API keys*, clique em *Reveal*) → `SUPABASE_KEY`

```env
PORT=3000
SUPABASE_URL=https://SEU-PROJETO.supabase.co
SUPABASE_KEY=SUA-SERVICE-ROLE-KEY
FRONTEND_URL=http://localhost:5500
```

> ⚠️ A chave `service_role` dá acesso total ao banco. Ela fica **somente no
> backend** (arquivo `.env`, que não vai para o GitHub).

### 4.2 Frontend — `frontend/js/supabase-config.js`

Copie a **Project URL** e a chave **anon public**:

```js
window.DF_SUPABASE = {
  url: 'https://SEU-PROJETO.supabase.co',
  anonKey: 'SUA-ANON-KEY',
};
```

> A chave `anon` é pública. Quem protege os dados é o RLS criado no passo 2.

## 5. Testar localmente

Na raiz do projeto:

```powershell
# Backend (recompila e sobe em http://localhost:3000)
cd backend
npm run build
node dist/main.js

# Em outro terminal: frontend em http://localhost:5500
npx --yes serve frontend -l 5500
```

Abra <http://localhost:5500/pages/admin/login.html> e entre com
`admin@dfcoleta.com` / `admin123`.

Checklist:

- [ ] O dashboard mostra 12 pontos, 11 ativos, 10 resíduos.
- [ ] Criar/editar um ponto e **reiniciar o backend** — o dado continua lá.
- [ ] Relatar um problema no detalhe do ponto e vê-lo no admin.
- [ ] Aprovar/rejeitar uma sugestão e recarregar a página — o status permanece.
- [ ] Sair e entrar novamente.

Se o backend subir com a mensagem `Supabase não configurado — usando dados em
memória (mock)`, revise `SUPABASE_URL` e `SUPABASE_KEY` no `.env`.

## 6. Publicar no GitHub

O projeto ainda não é um repositório. Na raiz:

```powershell
git init
git add .
git commit -m "DF Coleta: sistema completo com Supabase e deploy na Vercel"
git branch -M main
```

Crie um repositório vazio no GitHub (sem README) e envie:

```powershell
git remote add origin https://github.com/SEU-USUARIO/df-coleta.git
git push -u origin main
```

> O `.gitignore` já exclui `backend/.env`, `backend/node_modules`, `api/`
> (bundle gerado) e `tools/logs`.

## 7. Publicar na Vercel

1. Acesse <https://vercel.com/new> e importe o repositório.
2. **Framework Preset:** `Other`.
3. Build, output e instalação vêm do [`vercel.json`](../vercel.json):
   - Build: `npm run build` (compila o NestJS e gera `api/[...caminho].js`)
   - Output: `frontend`
4. Em **Environment Variables**, adicione (Production e Preview):

   | Nome | Valor |
   |------|-------|
   | `SUPABASE_URL` | `https://SEU-PROJETO.supabase.co` |
   | `SUPABASE_KEY` | sua chave `service_role` |
   | `FRONTEND_URL` | `https://SEU-PROJETO.vercel.app` |
   | `USE_MOCK` | `false` |

5. Clique em **Deploy**.
6. Depois do primeiro deploy, copie a URL final, ajuste `FRONTEND_URL` e
   faça um novo deploy (ou apenas salve — o próximo build pega o valor).

## 8. Verificar em produção

- [ ] `https://SEU-PROJETO.vercel.app` abre a página inicial com os pontos.
- [ ] `https://SEU-PROJETO.vercel.app/api/pontos-coleta` retorna o JSON.
- [ ] Login em `/pages/admin/login.html` funciona.
- [ ] Criar um ponto no admin e recarregar — continua lá.
- [ ] Relatar um problema pelo site público e vê-lo no admin.

## 9. Problemas comuns

| Sintoma | Causa provável | Solução |
|---------|----------------|---------|
| `Supabase não configurado` no log | URL/chave inválidas ou `USE_MOCK=true` | Revise o `.env` e reinicie |
| Login: "E-mail ou senha incorretos" | Usuário não existe ou senha diferente | Recrie em Authentication → Users |
| Login: "E-mail ainda não confirmado" | Faltou **Auto Confirm User** | Edite o usuário e confirme o e-mail |
| Admin redireciona para o login | Token expirou (1h) | Entre novamente |
| `401` nas rotas do admin | Token inválido | Faça login de novo |
| Página pública sem dados | API fora do ar | Abra `/api/pontos-coleta` e veja o log da Vercel |
| Erro de CORS | Origem não permitida | Ajuste `FRONTEND_URL` (vírgulas separam várias) |

## 10. Estrutura de arquivos usada no deploy

```
api/index.js             → gerado no build (não versionado)
backend/src/vercel.ts    → adaptador serverless
backend/scripts/build-vercel.mjs → empacotamento com esbuild
vercel.json              → build + output + função + rewrite /api/*
supabase/01-schema.sql   → estrutura + RLS
supabase/02-seed.sql     → dados iniciais
supabase/03-comentarios-curtidas-respostas.sql → migração para bancos antigos
supabase/04-comentarios-oficiais.sql → coluna oficial (respostas verificadas)
```
