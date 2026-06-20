-- ============================================================
-- Buzzer Quiz System — Supabase schema
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- Teams
create table if not exists teams (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  score int not null default 0,
  created_at timestamptz not null default now()
);

-- Questions (preloaded by admin)
create table if not exists questions (
  id uuid primary key default gen_random_uuid(),
  position int not null,           -- order in the quiz
  question_text text not null,
  answer_text text,                -- optional, shown after reveal
  points int not null default 10,
  created_at timestamptz not null default now()
);

-- Single-row table holding the live state of the quiz
-- (current question, whether buzzers are open, etc.)
create table if not exists quiz_state (
  id int primary key default 1,
  current_question_id uuid references questions(id),
  buzzers_open boolean not null default false,
  answer_revealed boolean not null default false,
  round_token uuid not null default gen_random_uuid(), -- changes every "reset", buzzes from old round are ignored
  updated_at timestamptz not null default now(),
  constraint single_row check (id = 1)
);

insert into quiz_state (id) values (1)
  on conflict (id) do nothing;

-- Buzz log — every buzz press for the CURRENT round_token
create table if not exists buzzes (
  id uuid primary key default gen_random_uuid(),
  round_token uuid not null,
  team_id uuid not null references teams(id) on delete cascade,
  buzzed_at timestamptz not null default now()
);

create index if not exists buzzes_round_idx on buzzes(round_token, buzzed_at);

-- ============================================================
-- Realtime: enable replication for the tables the app subscribes to
-- ============================================================
alter publication supabase_realtime add table buzzes;
alter publication supabase_realtime add table quiz_state;
alter publication supabase_realtime add table teams;
alter publication supabase_realtime add table questions;

-- ============================================================
-- Row Level Security
-- This is a trusted-room party app (no login system), so we allow
-- public read/write via the anon key. Do not expose service-role key.
-- ============================================================
alter table teams enable row level security;
alter table questions enable row level security;
alter table quiz_state enable row level security;
alter table buzzes enable row level security;

create policy "public read teams" on teams for select using (true);
create policy "public write teams" on teams for insert with check (true);
create policy "public update teams" on teams for update using (true);
create policy "public delete teams" on teams for delete using (true);

create policy "public read questions" on questions for select using (true);
create policy "public write questions" on questions for insert with check (true);
create policy "public update questions" on questions for update using (true);
create policy "public delete questions" on questions for delete using (true);

create policy "public read quiz_state" on quiz_state for select using (true);
create policy "public update quiz_state" on quiz_state for update using (true);

create policy "public read buzzes" on buzzes for select using (true);
create policy "public write buzzes" on buzzes for insert with check (true);
create policy "public delete buzzes" on buzzes for delete using (true);
