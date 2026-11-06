-- ============================================================================
-- DF Coleta — Dados iniciais
-- Execute depois do 01-schema.sql. Pode ser executado novamente sem duplicar.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Resíduos
-- ---------------------------------------------------------------------------
insert into public.residuos (id, nome, icone, descricao) values
  (1,  'Eletrônicos',       'monitor',          'Celulares, computadores, TVs, eletrodomésticos'),
  (2,  'Pilhas e Baterias', 'battery-charging', 'Pilhas, baterias de celular, acumuladores'),
  (3,  'Óleo de Cozinha',   'droplets',         'Óleo vegetal usado (fritar, refogar)'),
  (4,  'Papel e Papelão',   'package',          'Jornais, caixas, embalagens de papel'),
  (5,  'Plástico',          'recycle',          'Garrafas PET, embalagens plásticas'),
  (6,  'Vidro',             'wine',             'Garrafas, potes de vidro'),
  (7,  'Metal',             'wrench',           'Latas, alumínio, sucata'),
  (8,  'Medicamentos',      'pill',             'Remédios vencidos ou não utilizados'),
  (9,  'Lâmpadas',          'lightbulb',        'Lâmpadas fluorescentes, LED, incandescentes'),
  (10, 'TVs Analógicas',    'tv',               'Aparelhos de televisão antigos')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Pontos de coleta
-- ---------------------------------------------------------------------------
insert into public.pontos_coleta (id, nome, tipo, endereco, cidade, latitude, longitude, telefone, status) values
  (1,  'Ecoponto Asa Norte',                              'ECOPONTO',    'SCLN 407, Bloco A',                    'Plano Piloto',  -15.7442, -47.8825, '(61) 3321-1000', 'ATIVO'),
  (2,  'Ecoponto Asa Sul',                                'ECOPONTO',    'SCLS 314, Bloco D',                    'Plano Piloto',  -15.8280, -47.9230, '(61) 3321-2200', 'ATIVO'),
  (3,  'Ecoponto Taguatinga',                             'ECOPONTO',    'QNL 7, Conjunto K',                    'Taguatinga',    -15.8322, -48.0564, '(61) 3352-2200', 'ATIVO'),
  (4,  'Ponto de Coleta Gama',                            'COMUNITARIO', 'Setor Central, Área Especial 1',       'Gama',          -16.0178, -48.0621, null,             'ATIVO'),
  (5,  'Farmácia Popular – Coleta de Medicamentos',       'FARMACIA',    'CLN 213, Bloco A, Loja 10',            'Plano Piloto',  -15.7565, -47.8778, '(61) 3274-5500', 'ATIVO'),
  (6,  'Ponto de Reciclagem Ceilândia',                   'COOPERATIVA', 'QNN 26, Conjunto B',                   'Ceilândia',     -15.8117, -48.1039, '(61) 3373-0055', 'ATIVO'),
  (7,  'Ecoponto Samambaia',                              'ECOPONTO',    'QS 308, Conjunto 3',                   'Samambaia',     -15.8764, -48.0803, '(61) 3358-1100', 'ATIVO'),
  (8,  'Ponto Verde Guará',                               'COMUNITARIO', 'QE 40, Área Especial',                 'Guará',         -15.8189, -47.9801, '(61) 3381-4400', 'ATIVO'),
  (9,  'Ecoponto Sobradinho',                             'ECOPONTO',    'Quadra 09, Área Especial',             'Sobradinho',    -15.6544, -47.7913, null,             'ATIVO'),
  (10, 'Ponto de Coleta Brazlândia',                      'COMUNITARIO', 'Setor Tradicional, Quadra 5',          'Brazlândia',    -15.6733, -48.1930, null,             'ATIVO'),
  (11, 'Supermercado Extra – Coleta de Óleo',             'COMERCIO',    'Av. das Nações, 1500 – Lago Norte',    'Lago Norte',    -15.7268, -47.8533, '(61) 3469-8800', 'ATIVO'),
  (12, 'Ecoponto Sobradinho II (inativo)',                'ECOPONTO',    'Quadra 16, Área 3',                    'Sobradinho II', -15.6210, -47.7680, null,             'INATIVO')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Resíduos aceitos por ponto
-- ---------------------------------------------------------------------------
insert into public.ponto_residuos (ponto_id, residuo_id) values
  (1, 1), (1, 2), (1, 9), (1, 10),
  (2, 1), (2, 4), (2, 5), (2, 6),
  (3, 3), (3, 5), (3, 6),
  (4, 1), (4, 7),
  (5, 8),
  (6, 4), (6, 5), (6, 6), (6, 7),
  (7, 1), (7, 2), (7, 4),
  (8, 3), (8, 6), (8, 7), (8, 9),
  (9, 1), (9, 2), (9, 5),
  (10, 4), (10, 5), (10, 8),
  (11, 3), (11, 5),
  (12, 1), (12, 2)
on conflict (ponto_id, residuo_id) do nothing;

-- ---------------------------------------------------------------------------
-- Horários de funcionamento
-- ---------------------------------------------------------------------------
insert into public.horarios_funcionamento (ponto_id, dia_semana, hora_abertura, hora_fechamento, ordem)
select v.ponto_id, v.dia_semana, v.abertura::time, v.fechamento::time, v.ordem
from (values
  (1,  'Segunda a Sexta',   '08:00', '17:00', 1),
  (1,  'Sábado',            '08:00', '12:00', 2),
  (2,  'Segunda a Sexta',   '08:00', '17:00', 1),
  (3,  'Segunda a Sexta',   '09:00', '18:00', 1),
  (5,  'Segunda a Sábado',  '08:00', '20:00', 1),
  (6,  'Segunda a Sexta',   '07:30', '16:30', 1),
  (7,  'Segunda a Sexta',   '08:00', '17:00', 1),
  (8,  'Segunda a Sábado',  '09:00', '18:00', 1),
  (9,  'Segunda a Sexta',   '08:00', '17:00', 1),
  (11, 'Todos os dias',     '07:00', '22:00', 1)
) as v(ponto_id, dia_semana, abertura, fechamento, ordem)
where not exists (
  select 1 from public.horarios_funcionamento h
  where h.ponto_id = v.ponto_id
    and h.dia_semana = v.dia_semana
    and h.hora_abertura = v.abertura::time
    and h.hora_fechamento = v.fechamento::time
);

-- ---------------------------------------------------------------------------
-- Comentários
-- ---------------------------------------------------------------------------
insert into public.comentarios (id, ponto_coleta_id, nome_autor, email_autor, texto_comentario, curtidas, resposta_a, data) values
  (1, 1, 'Maria Silva', 'maria@email.com', 'Ótimo ponto de coleta, sempre limpo e organizado!', 3, null, '2026-08-15T10:00:00Z'),
  (2, 1, 'João Santos', 'joao@email.com', 'Atendimento muito bom. Aceitam eletrônicos de todos os tipos.', 1, null, '2026-09-01T14:30:00Z'),
  (3, 3, 'Ana Lima', 'ana@email.com', 'Fácil de achar, fica perto do shopping.', 2, null, '2026-09-10T09:00:00Z'),
  (4, 1, 'Equipe DF Coleta', 'contato@dfcoleta.com', 'Obrigado pelo retorno, Maria! O ecoponto é revisado toda semana pela equipe do SLU.', 0, 1, '2026-08-16T09:00:00Z')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Problemas relatados
-- ---------------------------------------------------------------------------
insert into public.problemas (id, ponto_coleta_id, nome_autor, email_autor, tipo_problema, severidade, texto_problema, status, data) values
  (1, 1, 'Carlos Eduardo', 'carlos.edu@email.com', 'Estrutura danificada', 'ALTA',
      'O coletor de eletrônicos está com a tampa travada e danificada.', 'PENDENTE', '2026-10-10T11:20:00Z'),
  (2, 3, 'Juliana Costa', 'juliana.costa@email.com', 'Outro', 'MEDIA',
      'Compartimento de descarte de óleo vegetal quase cheio.', 'EM_ANALISE', '2026-10-12T15:45:00Z')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Sugestões
-- ---------------------------------------------------------------------------
insert into public.sugestoes (id, nome_local, endereco, cidade, nome_autor, email_autor, texto_sugestao, residuos_sugeridos, data) values
  (1, 'Parque Ecológico de Águas Claras', 'Avenida Parque Águas Claras, s/n', 'Águas Claras', 'Mariana Fernandes', 'mariana.f@email.com',
      'Grande fluxo de pedestres no parque aos fins de semana, seria excelente um ponto para latinhas e garrafas plásticas.',
      'Plástico, Metal, Vidro', '2026-10-11T09:15:00Z'),
  (2, 'Centro Comunitário Vila Planalto', 'Rua das Palmeiras, Lote 12', 'Plano Piloto', 'Roberto Mendonça', 'roberto.m@email.com',
      'Bairro com muitos moradores idosos que precisam de ponto próximo para descarte de remédios vencidos.',
      'Medicamentos, Pilhas e Baterias', '2026-10-13T16:00:00Z')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Ajuste das sequências após inserir ids explícitos
-- ---------------------------------------------------------------------------
select setval(pg_get_serial_sequence('public.residuos', 'id'),               coalesce((select max(id) from public.residuos), 1), true);
select setval(pg_get_serial_sequence('public.pontos_coleta', 'id'),          coalesce((select max(id) from public.pontos_coleta), 1), true);
select setval(pg_get_serial_sequence('public.horarios_funcionamento', 'id'), coalesce((select max(id) from public.horarios_funcionamento), 1), true);
select setval(pg_get_serial_sequence('public.comentarios', 'id'),            coalesce((select max(id) from public.comentarios), 1), true);
select setval(pg_get_serial_sequence('public.problemas', 'id'),              coalesce((select max(id) from public.problemas), 1), true);
select setval(pg_get_serial_sequence('public.sugestoes', 'id'),              coalesce((select max(id) from public.sugestoes), 1), true);
