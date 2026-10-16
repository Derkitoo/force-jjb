-- Force JJB — schéma initial
-- Toutes les tables utilisateur sont protégées par RLS : chacun ne voit que ses données.

create extension if not exists "pgcrypto";

-- Profil (1 ligne par compte)
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text,
  level text not null default 'intermediaire' check (level in ('debutant','intermediaire','avance')),
  goal text not null default 'hybride' check (goal in ('force','masse','hybride')),
  equipment text not null default 'salle' check (equipment in ('salle','maison')),
  bjj_days smallint[] not null default '{}',        -- 0 = lundi
  open_mat_day smallint,
  strength_days smallint not null default 3 check (strength_days in (2,3)),
  competes boolean not null default false,
  cycle_week smallint not null default 1,
  cycle_length smallint not null default 5,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Charge de travail courante par exercice
create table public.exercise_loads (
  user_id uuid not null references auth.users on delete cascade,
  exercise_id text not null,
  load_kg numeric(6,2) not null default 0,
  stalled_sessions smallint not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, exercise_id)
);

-- Séances de muscu réalisées
create table public.workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  session_key text not null check (session_key in ('A','B','C')),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  deload boolean not null default false,
  adjustments text[] not null default '{}',          -- raisons affichées
  notes text
);
create index on public.workouts (user_id, started_at desc);

-- Séries
create table public.workout_sets (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null references public.workouts on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  exercise_id text not null,
  set_index smallint not null,
  load_kg numeric(6,2) not null default 0,
  reps smallint not null,
  rpe numeric(3,1),
  created_at timestamptz not null default now()
);
create index on public.workout_sets (user_id, exercise_id, created_at desc);

-- Entraînements de jiu-jitsu
create table public.bjj_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  date timestamptz not null default now(),
  kind text not null default 'cours' check (kind in ('cours','openmat','competition','prive')),
  duration_min smallint not null,
  intensity smallint not null check (intensity between 1 and 5),
  sparring_rounds smallint not null default 0,
  techniques text[] not null default '{}',
  notes text
);
create index on public.bjj_sessions (user_id, date desc);

-- Poids de corps (catégorie de compétition)
create table public.body_metrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  date date not null default current_date,
  bodyweight_kg numeric(5,2) not null,
  unique (user_id, date)
);

-- Statut premium, alimenté par le webhook RevenueCat (jamais par le client)
create table public.entitlements (
  user_id uuid primary key references auth.users on delete cascade,
  premium boolean not null default false,
  product_id text,
  expires_at timestamptz,
  updated_at timestamptz not null default now()
);

-- RLS
alter table public.profiles enable row level security;
alter table public.exercise_loads enable row level security;
alter table public.workouts enable row level security;
alter table public.workout_sets enable row level security;
alter table public.bjj_sessions enable row level security;
alter table public.body_metrics enable row level security;
alter table public.entitlements enable row level security;

create policy "own profile" on public.profiles for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "own loads" on public.exercise_loads for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own workouts" on public.workouts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own sets" on public.workout_sets for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own bjj" on public.bjj_sessions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own metrics" on public.body_metrics for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
-- lecture seule côté client
create policy "read own entitlement" on public.entitlements for select using (auth.uid() = user_id);

-- Création automatique du profil à l'inscription
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id) values (new.id);
  insert into public.entitlements (user_id) values (new.id);
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();
