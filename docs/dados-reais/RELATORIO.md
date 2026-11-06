# Pontos de coleta reais do DF — base para aprovação

**Gerado em:** 02/11/2026  
**Total de pontos:** 409  
**Nenhum dado foi gravado no Supabase.** Esta base serve para revisão antes da importação.

## 1. Fontes oficiais usadas

| Fonte | O que forneceu | Pontos |
| --- | --- | ---: |
| [SLU/DF — Papa-Entulho](https://www.slu.df.gov.br/papa-entulho) | Lista oficial dos 28 Papa-Entulhos, com endereço e link de mapa | 28 |
| [SEMA/SLU — Mapa de PEVs da Logística Reversa](https://www.google.com/maps/d/viewer?mid=1kyt47dSgutKywHwN5mET_25xH6sjnfmP) | 482 placemarks em 10 camadas (lâmpadas, pilhas, remédios, óleo, vidro, eletrônicos) | 368 pontos únicos após deduplicação |
| [Catálogo IPE/DF — Cooperativas de Catadores](https://catalogo.ipe.df.gov.br/geoserver/wfs) | Camada `geonode:slu_cooperativas_associacoes_catadores` (WFS/GeoJSON) | 24 cooperativas após fusão com o mapa de PEVs |
| [Catálogo IPE/DF — Regiões Administrativas](https://catalogo.ipe.df.gov.br/geoserver/wfs) | Camada `geonode:regioes_administrativas` (EPSG:31983), usada para atribuir a região de cada ponto | — |

> Observação técnica: a camada de regiões administrativas vem em **EPSG:31983 (UTM 23S)**. O script converte as coordenadas para latitude/longitude (WGS84) antes de calcular em qual região cada ponto está.

## 2. Telefone e horário de funcionamento

Telefone e horário **não existem** nas bases do GDF usadas para nome, coordenada e resíduos. Para preencher o máximo possível sem inventar nada, partimos de uma **planilha de confirmação** preenchida a partir dos sites oficiais de cada rede e, para o que ficou em branco, usamos duas bases públicas — sempre exigindo **correspondência de nome e de localização**:

| Fonte | O que forneceu | Como foi casado |
| --- | --- | --- |
| Planilha de confirmação (pesquisa nos sites oficiais e centrais de atendimento das redes) | Telefone, horário e URL da fonte de 333 pontos | Coordenada **e** nome exatos; números de central foram marcados como compartilháveis e podem se repetir entre lojas da mesma rede |
| [CNES/DATASUS — API de Dados Abertos](https://apidadosabertos.saude.gov.br/cnes/estabelecimentos) | Telefone das farmácias do DF (266 estabelecimentos do tipo *farmácia*) | Nome/marca em comum **e** distância máxima de 600 m; cada farmácia do CNES foi usada uma única vez |
| [CNES/DATASUS — Ficha do estabelecimento](http://cnes2.datasus.gov.br/Mod_Conjunto.asp) | Horário de funcionamento por dia da semana | Lido da tabela “Horário de Funcionamento” da ficha do mesmo CNES |
| [OpenStreetMap / Overpass API](https://overpass-api.de/) | Telefone e horário dos demais estabelecimentos (mercados, farmácias, shoppings, metrô, Sesc etc.) | Nome/marca em comum **e** distância máxima de 150 m (50 m para correspondência parcial) |

**Cobertura obtida:**

| Situação | Pontos | % |
| --- | ---: | ---: |
| Com telefone | 289 | 71% |
| Com horário | 337 | 82% |
| Com telefone **e/ou** horário | 339 | 83% |

| Tipo | Total | Com telefone | Com horário |
| --- | ---: | ---: | ---: |
| COMERCIO | 229 | 157 | 181 |
| FARMACIA | 112 | 111 | 112 |
| COOPERATIVA | 35 | 17 | 18 |
| ECOPONTO | 28 | 0 | 23 |
| ESCOLA | 5 | 4 | 3 |

**Por que não são 100%:** a planilha de confirmação cobriu a maior parte dos pontos, mas as redes varejistas não publicam telefone/horário de todas as filiais e bloqueiam coleta automatizada dos seus sites (HTTP 403); os pontos pequenos, as cooperativas e os ecopontos também não têm esses dados em nenhuma base pública. **Nenhum telefone ou horário foi estimado** — o que não foi encontrado ficou em branco, e a interface já trata esses campos como opcionais.

## 3. Totais por tipo

| Tipo | Pontos |
| --- | ---: |
| COMERCIO | 229 |
| FARMACIA | 112 |
| COOPERATIVA | 35 |
| ECOPONTO | 28 |
| ESCOLA | 5 |

Tipos do sistema: `ECOPONTO`, `COOPERATIVA`, `FARMACIA`, `COMERCIO`, `ESCOLA` (o tipo `COMUNITARIO` existe no banco, mas nenhuma fonte oficial o utiliza).

## 4. Totais por resíduo

| Resíduo | Pontos |
| --- | ---: |
| Pilhas e Baterias | 188 |
| Vidro | 107 |
| Papel e Papelão | 59 |
| Plástico | 59 |
| Metal | 59 |
| Eletrônicos | 53 |
| TVs Analógicas | 53 |
| Lâmpadas | 46 |
| Óleo de Cozinha | 37 |
| Medicamentos | 28 |

Os dez resíduos acima já existem na tabela `residuos` do banco, com os mesmos nomes — **não é necessário criar nenhum resíduo novo** para esta carga.

## 5. Totais por região administrativa

| Região | Pontos |
| --- | ---: |
| Plano Piloto | 123 |
| Taguatinga | 33 |
| Ceilândia | 31 |
| Águas Claras | 25 |
| SIA | 21 |
| Guará | 20 |
| Gama | 17 |
| Lago Norte | 15 |
| Samambaia | 13 |
| Lago Sul | 13 |
| Sobradinho | 11 |
| Sudoeste/Octogonal | 11 |
| Planaltina | 8 |
| Santa Maria | 8 |
| Recanto das Emas | 7 |
| Sol Nascente/Por do Sol | 6 |
| São Sebastião | 6 |
| Brazlândia | 5 |
| Núcleo Bandeirante | 5 |
| Vicente Pires | 4 |
| Arniqueira | 4 |
| Riacho Fundo | 4 |
| Paranoá | 4 |
| SCIA | 4 |
| Jardim Botânico | 3 |
| Sobradinho II | 3 |
| Candangolândia | 2 |
| Cruzeiro | 1 |
| Varjão | 1 |
| Riacho Fundo II | 1 |

A região foi calculada pelo polígono oficial da região administrativa. Quando o ponto fica exatamente na divisa, vale o polígono (fonte oficial), mesmo que o nome do estabelecimento cite a região vizinha.

## 6. O que está completo e o que falta

### Completo
- **Nome:** todos os 409 pontos.
- **Coordenadas:** 404 oficiais e 5 aproximadas (centro do bairro, sinalizadas). Outras 29 coordenadas da camada oficial estavam em outra região e foram corrigidas pelo endereço/shopping do próprio registro.
- **Região administrativa:** todos os 409 pontos.
- **Resíduos aceitos:** todos os pontos têm ao menos um resíduo mapeado.
- **Endereço:** 119 pontos (29%) com endereço vindo da fonte oficial e 290 (71%) com endereço aproximado por geocodificação.
- **Telefone e horário:** 339 pontos (83%) com pelo menos um dos dois, sempre com fonte identificada (detalhes na seção 2).

### Ainda faltando
- **Telefone/horário de 70 pontos (17%):** não constam em nenhuma base pública consultada. Ficam vazios; a interface trata os campos como opcionais.
- **Endereço de 0 pontos (0%):** a geocodificação não encontrou um logradouro para esses pontos.

| Tipo | Total | Endereço oficial | Endereço aproximado | Sem endereço |
| --- | ---: | ---: | ---: | ---: |
| COMERCIO | 229 | 59 | 170 | 0 |
| FARMACIA | 112 | 0 | 112 | 0 |
| ESCOLA | 5 | 0 | 5 | 0 |
| COOPERATIVA | 35 | 32 | 3 | 0 |
| ECOPONTO | 28 | 28 | 0 | 0 |

**Como os endereços ausentes foram tratados:**
1. A coordenada de cada ponto foi consultada no **OpenStreetMap (Nominatim, geocodificação reversa)**.
2. O endereço devolvido foi gravado com o sufixo **“(aprox.)”**, porque representa o logradouro/quadra do ponto e não necessariamente o número oficial do estabelecimento.
3. Quando o serviço não devolveu um logradouro, o campo ficou vazio e o ponto aparece como **“sem endereço”** na prévia.

## 7. Tratamentos aplicados na base

- **Conversão UTM 23S → lat/lng** dos polígonos das regiões administrativas.
- **Correção de acentos** corrompidos no WFS das cooperativas (ex.: `Ceil?ndia` → `Ceilândia`).
- **Marca Extra → Assaí:** o GPA vendeu o Extra Hiper ao Assaí em 2021 e as lojas do DF passaram a operar como **Assaí Atacadista**. Todos os registros “Extra” foram renomeados e as lojas do mesmo endereço foram fundidas.
- **Deduplicação:** 32 registros repetidos foram fundidos (o mesmo local aparecia em camadas diferentes, ex.: `Drogasil` e `Drogasil (Asa Norte)`, ou a mesma loja com rótulos “Guará” e “SIA”). Os resíduos das entradas foram unidos.
- **Coordenadas corrigidas:** 29 registros da camada oficial apontavam para outra região administrativa (ex.: lojas Vivo do Brasília Shopping e do Conjunto Nacional em Brazlândia, Taguatinga Shopping em Santa Maria). A posição foi corrigida pelo endereço/shopping informado, com apoio do OpenStreetMap, e a região foi recalculada pelo polígono oficial.
- **Descarte de 5 registros** com coordenadas fora do Distrito Federal (erro na fonte):
  - Cooperativa Brasil Ambiental (-15.7423, -48.3439)
  - Sabrila Reciclagem (-16.1560, -47.9577)
  - Reciclagem do Edilson (-16.0952, -48.0340)
  - JUKAF Fábrica - Guará II (-18.9245, -48.2125)
  - Secretaria de Estado do Meio Ambiente (-19.0441, -40.5408)
- **2 coordenadas aproximadas:** Papa-Entulho 12 (Granja do Torto) e 13 (Núcleo Bandeirante), que não têm link de mapa na página do SLU. Foram posicionados no centro do bairro e marcados como `aproximada`.
- **Registros com endereço textual citando outra região:** em alguns casos o texto do endereço é o endereço cadastral da rede (não do ponto) ou o ponto está na divisa. Nesses casos **prevalecem a coordenada e o polígono oficial** para definir a região; o endereço é mantido como veio da fonte e pode ser corrigido manualmente na revisão.

## 8. Escopo sugerido de importação

- Substituir os **12 pontos fictícios** pelos **409 pontos reais**.
- Manter os **10 resíduos** já cadastrados.
- Limpar comentários, curtidas, problemas e sugestões ligados aos pontos fictícios (ou manter apenas os que não referenciam ponto).
- Importar **telefone e horários** já preenchidos (289 telefones e 337 pontos com horário); os campos restantes ficam nulos.
- Gravar os 290 endereços geocodificados com o sufixo **“(aprox.)”** e deixar vazios os 0 pontos sem logradouro.

## 9. Fora do escopo atual (pode ser incluído depois)

O mapa oficial da SEMA tem quatro camadas que não têm resíduo correspondente no catálogo atual do sistema:

| Camada | Pontos | Resíduo sugerido |
| --- | ---: | --- |
| Pneus | 2 | Pneus |
| Embalagem de Agrotóxicos | 2 | Agrotóxicos |
| Raio-x | 24 | Radiografias |
| Embalagens de Óleo Lubrificante | 57 | Óleo Lubrificante |

Incluí-las exigiria cadastrar 4 novos resíduos (nome, ícone e descrição) e mapear os pontos. Não foram incluídas para não alterar o catálogo sem sua aprovação.

## 10. Arquivos

| Arquivo | Conteúdo |
| --- | --- |
| `previa-pontos.html` | Prévia navegável com busca e filtros (abrir no navegador) |
| `pontos-reais.csv` | Base completa em CSV (separador `;`, UTF-8 com BOM) |
| `dados.json` | Base completa em JSON, usada pela prévia |

## 11. Como a base foi montada

Script: `C:\Users\Ruan\AppData\Local\Temp\df-supabase\montar-base.mjs`

1. Lê o KML oficial dos PEVs (Google My Maps) e extrai nome, endereço, coordenadas e camada.
2. Lê a lista dos 28 Papa-Entulhos da página do SLU e as coordenadas dos links do Google Maps.
3. Baixa as 32 cooperativas via WFS do Catálogo IPE e corrige os acentos corrompidos.
4. Converte os polígonos das regiões administrativas de UTM 23S para lat/lng.
5. Faz o point-in-polygon para definir a região de cada ponto.
6. Renomeia as lojas Extra para Assaí e deduplica registros do mesmo local.
7. Descarta coordenadas fora do DF e corrige coordenadas cadastrais que apontavam para outra região (lojas Vivo e postos).
8. Consulta a geocodificação reversa (OpenStreetMap) para os pontos sem endereço e grava o resultado com “(aprox.)”.
9. Aplica a **planilha de confirmação** (333 pontos) e, no que ficou em branco, casa telefone e horário com o **CNES/DATASUS** (farmácias, até 600 m) e com o **OpenStreetMap** (demais estabelecimentos, até 150 m), sempre por nome/marca em comum.
10. Gera CSV, JSON, prévia HTML, estatísticas e o SQL de importação.
