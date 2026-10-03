-- Rode no Supabase: SQL Editor > New query > cole e execute.
create table if not exists public.portal_state (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

-- Bloqueia acesso direto pelo navegador. Só o servidor (service role) lê e grava.
alter table public.portal_state enable row level security;

-- Memória do Lastro. O navegador não lê direto: só o servidor, depois do Tiago confirmar.
create table if not exists public.agent_memory (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  kind text not null check (kind in ('decisao', 'preferencia', 'contexto')),
  "text" text not null
);

alter table public.agent_memory enable row level security;

-- Resumo do sábado e relatório do mês. RLS ligado, sem política: só o servidor lê e grava.
create table if not exists public.briefings (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  data date not null,
  tipo text not null check (tipo in ('sabado', 'mes')),
  titulo text not null,
  linhas jsonb not null default '[]'::jsonb,
  frases text not null default '',
  na_linha boolean not null default false,
  unique (data, tipo)
);

alter table public.briefings enable row level security;

-- Inscrições de aviso no celular. RLS ligado, sem política: só o servidor.
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  endpoint text not null unique,
  p256dh text not null,
  auth text not null
);

alter table public.push_subscriptions enable row level security;

create table if not exists public.push_envios (
  id text primary key,
  em date not null
);

alter table public.push_envios enable row level security;

-- Uso do Lastro: só contagem. Sem pergunta, sem saldo, sem texto da resposta.
create table if not exists public.ai_logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  dia date not null,
  origem text not null check (origem in ('portal', 'noticias', 'comando', 'memoria', 'sabado', 'checkin')),
  ferramentas text not null default '',
  erro boolean not null default false,
  entrada integer not null default 0,
  saida integer not null default 0
);

alter table public.ai_logs enable row level security;

-- Fotos do mural dos sonhos. Bucket privado: o navegador não lê direto.
-- As imagens passam por GET /api/imagem, já com login.
insert into storage.buckets (id, name, public)
select 'sonhos', 'sonhos', false
where not exists (select 1 from storage.buckets where id = 'sonhos');
