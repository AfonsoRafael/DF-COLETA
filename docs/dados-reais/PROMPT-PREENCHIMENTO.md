# Prompt para a IA de busca (Google/Gemini) — telefone e horário

Use o texto abaixo junto com o arquivo **`contatos-para-preencher.xlsx`** (ou o `.csv` equivalente).

---

## Contexto

Estou montando o **DF Coleta**, um sistema acadêmico que mostra pontos de coleta de resíduos no
Distrito Federal. O arquivo anexo tem **414 pontos reais**, com nome, endereço, cidade, coordenadas e
os resíduos aceitos. Parte deles já tem telefone e horário (colunas `telefone_atual`,
`horario_atual`, `fonte_atual`), obtidos de bases públicas (CNES/DATASUS e OpenStreetMap).

## Tarefa

Pesquise na internet e preencha, para o maior número de linhas possível:

| Coluna | O que preencher |
| --- | --- |
| `TELEFONE_CONFIRMADO` | Telefone do estabelecimento **naquele endereço** |
| `HORARIO_CONFIRMADO` | Horário de funcionamento por dia da semana |
| `FONTE_URL` | Link exato de onde tirou a informação |
| `OBSERVACAO` | Ressalvas (número é central? loja fechou? endereço divergente?) |

## Regras

1. **Não invente.** Se não achar com segurança, deixe vazio. Prefiro 20% confirmado a 100% chutado.
2. **Não altere** as colunas `id`, `nome`, `tipo`, `endereco`, `cidade`, `latitude`, `longitude`, `residuos`.
3. Telefone no formato `(61) 99999-9999`; 0800 como está (`0800 123 4567`).
4. Horário no formato:
   `Segunda-Feira a Sexta-Feira 08:00-20:00; Sábado 08:00-18:00; Domingo fechado`
5. Sempre preencha `FONTE_URL` quando preencher telefone ou horário.
6. Se o valor de `telefone_atual`/`horario_atual` estiver correto, **repita em CONFIRMADO** — isso vale como confirmação.
7. Se achar dado diferente do atual, use o novo e explique em `OBSERVACAO`.
8. **Confira o endereço da linha antes de copiar o número.** Muitas redes têm várias filiais na mesma
   cidade (ex.: 79 Drogasil, 10 Pão de Açúcar, 12 Carrefour). Não use o telefone da matriz nem de outra loja.

## Onde procurar (ordem de confiança)

1. Site oficial da rede — páginas “nossas lojas”, “encontre uma loja”, “unidades”.
2. Google Maps / ficha do Google Business **do endereço da linha**.
3. Farmácias: ficha CNES/DATASUS
   `http://cnes2.datasus.gov.br/Mod_Conjunto.asp?VCo_Unidade=CODIGO` (tem telefone e horário).
4. Sites oficiais: Sesc/Sesi, Metrô-DF, administrações regionais, shoppings.

## Redes que valem busca dirigida (maior volume de pontos)

Assaí Atacadista · Pão de Açúcar · Carrefour / Carrefour Bairro · Atacadão · Leroy Merlin ·
Casas Bahia · Kalunga · Dona de Casa · BIG BOX · Havan · Makro · Droga Raia · Drogarias Pacheco ·
Sesc · Sesi/Senai · UnB · shoppings (Park Shopping, Taguatinga Shopping, Iguatemi, Conjunto Nacional,
Pátio Brasil, Águas Claras, Terraço Shopping, JK, Venâncio, ID).

## Como devolver

Devolva **o mesmo arquivo** (ou o CSV) com as colunas preenchidas, **mantendo a coluna `id` intacta**.

Se a ferramenta limitar o tamanho da resposta, faça **em lotes de 40 a 50 linhas** (ex.: `id` 1–50,
51–100, …) e me envie cada lote separado. O `id` é o que permite casar tudo de volta na base.

---

### Exemplo de linha preenchida

| id | nome | endereco | TELEFONE_CONFIRMADO | HORARIO_CONFIRMADO | FONTE_URL |
| ---: | --- | --- | --- | --- | --- |
| 2 | Assaí Atacadista (Águas Claras) | Rua 100, Lote 10 – Vila Areal, Arniqueira | (61) 3456-9150 | Segunda-Feira a Sábado 07:00-22:00; Domingo 08:00-20:00 | https://www.assai.com.br/lojas |
