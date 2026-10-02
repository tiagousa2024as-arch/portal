-- Rode no Supabase: SQL Editor > New query > cole e execute.
create table if not exists public.portal_state (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

-- Bloqueia acesso direto pelo navegador. Só o servidor (service role) lê e grava.
alter table public.portal_state enable row level security;

-- Fotos do mural dos sonhos. Bucket privado: o navegador não lê direto.
-- As imagens passam por GET /api/imagem, já com login.
insert into storage.buckets (id, name, public)
select 'sonhos', 'sonhos', false
where not exists (select 1 from storage.buckets where id = 'sonhos');
