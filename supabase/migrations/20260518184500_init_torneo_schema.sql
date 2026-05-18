create extension if not exists pgcrypto;

create table if not exists public.tournaments (
  id text primary key,
  name text not null,
  created_at timestamptz not null default now(),
  team_count integer not null default 4 check (team_count in (2, 4))
);

create table if not exists public.player_profiles (
  id text primary key,
  display_name text not null,
  nationality text,
  age integer,
  tec integer not null default 50,
  fis integer not null default 50,
  tech_details_json jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.tournament_players (
  id text primary key,
  tournament_id text not null references public.tournaments(id) on delete cascade,
  profile_id text not null references public.player_profiles(id) on delete cascade,
  display_name_snapshot text not null,
  role_primary text,
  roles_json jsonb not null default '[]'::jsonb,
  tec integer not null default 50,
  fis integer not null default 50,
  age integer,
  nationality text,
  tech_details_json jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_tournament_players_tournament_created
  on public.tournament_players (tournament_id, created_at asc);

create index if not exists idx_tournament_players_profile
  on public.tournament_players (profile_id);

create table if not exists public.player_stats (
  tournament_player_id text primary key references public.tournament_players(id) on delete cascade,
  goals integer not null default 0,
  assists integer not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.matches (
  id text primary key,
  tournament_id text not null references public.tournaments(id) on delete cascade,
  stage text not null check (stage in ('semi', 'third_place', 'final')),
  slot integer not null,
  team_a text,
  team_b text,
  score_a integer not null default 0,
  score_b integer not null default 0,
  winner text,
  status text not null default 'scheduled' check (status in ('scheduled', 'completed')),
  lineup_a_json jsonb,
  lineup_b_json jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_matches_tournament_stage_slot
  on public.matches (tournament_id, stage, slot);

create table if not exists public.tournament_snapshots (
  id text primary key,
  tournament_id text not null references public.tournaments(id) on delete cascade,
  version integer not null,
  created_at timestamptz not null default now(),
  payload_json jsonb not null,
  final_match_id text references public.matches(id) on delete set null,
  winner_team text,
  runner_up_team text
);

create unique index if not exists idx_tournament_snapshots_tournament_version
  on public.tournament_snapshots (tournament_id, version);

create index if not exists idx_tournament_snapshots_tournament_created
  on public.tournament_snapshots (tournament_id, created_at desc);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_matches_touch_updated_at on public.matches;
create trigger trg_matches_touch_updated_at
before update on public.matches
for each row execute function public.touch_updated_at();

alter table public.tournaments enable row level security;
alter table public.player_profiles enable row level security;
alter table public.tournament_players enable row level security;
alter table public.player_stats enable row level security;
alter table public.matches enable row level security;
alter table public.tournament_snapshots enable row level security;

comment on table public.tournaments is 'Accesso applicativo via Edge Functions service role.';
comment on table public.player_profiles is 'Accesso applicativo via Edge Functions service role.';
comment on table public.tournament_players is 'Accesso applicativo via Edge Functions service role.';
comment on table public.player_stats is 'Accesso applicativo via Edge Functions service role.';
comment on table public.matches is 'Accesso applicativo via Edge Functions service role.';
comment on table public.tournament_snapshots is 'Accesso applicativo via Edge Functions service role.';
