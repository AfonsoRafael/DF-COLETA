# ♻️ DF Coleta

Sistema web para localização e gerenciamento de pontos de coleta de resíduos no Distrito Federal.

O objetivo do projeto é facilitar o descarte correto de resíduos especiais por meio da centralização de informações sobre pontos de coleta, permitindo que cidadãos encontrem locais adequados para descarte de materiais como pilhas, baterias, eletrônicos, óleo de cozinha, medicamentos, lâmpadas e outros resíduos.

---

##  Contexto Acadêmico

Disciplina: Análise e Projeto de Sistemas (APS)

Instituição: UDF - Centro Universitário do Distrito Federal

Ano: 2025/2026

Objetivo: Aplicar conceitos de Engenharia de Software, levantamento de requisitos, modelagem UML, arquitetura de sistemas e desenvolvimento web em um projeto real.

---
##  Demonstração

Acesse a versão publicada da aplicação:

 **Produção:** https://dfcoleta.vercel.app

 **Código-fonte:** https://github.com/AfonsoRafael/DF-COLETA

---
##  Principais Funcionalidades

### Para os cidadãos

- Consulta de pontos de coleta em lista e mapa
- Pesquisa por nome e endereço
- Filtros por cidade, tipo de estabelecimento e tipo de resíduo
- Visualização detalhada dos pontos
- Integração com Google Maps para geração de rotas
- Comentários sobre os pontos cadastrados
- Relato de problemas e inconsistências
- Sugestão de novos pontos de coleta

### Para administradores

- Cadastro de pontos de coleta
- Edição e remoção de pontos
- Ativação e desativação de pontos
- Gerenciamento dos tipos de resíduos
- Moderação de comentários
- Análise de problemas reportados
- Aprovação ou rejeição de sugestões

---

##  Arquitetura

```text
Frontend (HTML, CSS e JavaScript)
            │
            ▼
      API NestJS
            │
            ▼
 Supabase (PostgreSQL + Auth)
            │
            ▼
      Google Maps
```

O sistema foi desenvolvido seguindo uma arquitetura em camadas, separando apresentação, regras de negócio e persistência de dados.

---

##  Tecnologias Utilizadas

### Frontend

- HTML5
- CSS3
- JavaScript ES6+

### Backend

- Node.js
- NestJS

### Banco de Dados

- PostgreSQL
- Supabase
- Row Level Security (RLS)

### Integrações

- Google Maps API
- Supabase Auth

### Deploy

- Vercel

---

## 📁 Estrutura do Projeto

```text
DF COLETA/
├── frontend/
├── backend/
├── docs/
├── supabase/
└── banco_de_dados.sql
```

---

##  Como Executar

### Backend

```bash
cd backend
cp .env.example .env
npm install
npm run build
node dist/main.js
```

### Frontend

```bash
npx --yes serve frontend -l 5500
```

Acesse:

```text
http://localhost:5500
```

---

##  Autenticação

As funcionalidades administrativas utilizam autenticação por meio do Supabase Auth.

As rotas administrativas exigem:

```text
Authorization: Bearer <token>
```

---

##  Engenharia de Software

Este projeto foi desenvolvido para a disciplina de Análise e Projeto de Sistemas (APS) e inclui documentação UML completa:

- Diagrama de Casos de Uso
- Diagrama de Classes
- Diagrama de Atividades
- Diagramas de Sequência
- Arquitetura do Sistema
- Requisitos Funcionais e Não Funcionais

---

##  Impacto

O DF Coleta busca incentivar práticas sustentáveis e facilitar o descarte correto de resíduos, contribuindo para a conscientização ambiental e para o fortalecimento da logística reversa no Distrito Federal.

---

##  Autores

Projeto desenvolvido pelos alunos da UDF para a disciplina de Análise e Projeto de Sistemas (APS).

### Equipe

- **Afonso Rafael Evangelista da Silva**
  - GitHub: https://github.com/AfonsoRafael

- **André Luidhy Menezes Barbosa**
  - GitHub: https://github.com/Luidhymnz

- **Filipe Augusto Izidro de Melo**
  - GitHub: https://github.com/filipemelosql

- **Maycon de Sousa Palacio**
  - GitHub: https://github.com/maycondesousapalacio-png

- **Ruan Lopes Dourado**
  - GitHub: https://github.com/Ruanlopes99

---

## 📄 Licença

Este projeto está licenciado sob a licença MIT.
