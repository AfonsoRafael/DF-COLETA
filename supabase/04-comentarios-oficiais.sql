-- ============================================================================
-- DF Coleta — Migração 04: respostas oficiais da equipe
-- Execute apenas em bancos criados antes desta versão.
-- Bancos novos já recebem a coluna pelo 01-schema.sql.
-- ============================================================================

alter table public.comentarios
  add column if not exists oficial boolean not null default false;

-- Marca como oficial a resposta já existente da equipe, se houver.
update public.comentarios
   set oficial = true
 where nome_autor = 'Equipe DF Coleta'
   and resposta_a is not null
   and oficial = false;

create index if not exists idx_comentarios_oficial
  on public.comentarios (oficial)
  where oficial = true;
