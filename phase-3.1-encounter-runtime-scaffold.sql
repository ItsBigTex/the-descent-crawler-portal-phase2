-- DESIGN SCAFFOLD ONLY. Review before applying.
create table if not exists public.content_encounters (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  floor_min integer,
  data jsonb not null default '{}'::jsonb,
  source_authority text not null default 'THE_DESCENT',
  created_at timestamptz not null default now()
);
create table if not exists public.active_encounters (
  id uuid primary key default gen_random_uuid(),
  definition_id uuid references public.content_encounters(id) on delete set null,
  status text not null default 'staged',
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.encounter_participants (
  id uuid primary key default gen_random_uuid(),
  encounter_id uuid not null references public.active_encounters(id) on delete cascade,
  participant_key text not null,
  data jsonb not null default '{}'::jsonb,
  unique(encounter_id, participant_key)
);
