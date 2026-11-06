-- ============================================================================
-- DF Coleta — Migração 03: curtidas e respostas em comentários
-- Execute apenas em bancos criados antes desta versão.
-- Bancos novos já recebem as colunas pelo 01-schema.sql.
-- ============================================================================

alter table public.comentarios
  add column if not exists curtidas integer not null default 0;

alter table public.comentarios
  add column if not exists resposta_a bigint;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'comentarios_resposta_a_fkey'
      and conrelid = 'public.comentarios'::regclass
  ) then
    alter table public.comentarios
      add constraint comentarios_resposta_a_fkey
      foreign key (resposta_a) references public.comentarios(id) on delete cascade;
  end if;
end $$;

create index if not exists idx_comentarios_resposta
  on public.comentarios (resposta_a);
