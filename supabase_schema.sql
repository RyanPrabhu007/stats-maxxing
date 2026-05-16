-- Stats Maxxing — Supabase schema
-- Run this once in Supabase dashboard → SQL Editor → New query → Run

-- Table: one row per user, storing the entire HunterState as JSON
create table if not exists public.hunter_states (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  state      jsonb not null,
  updated_at timestamptz not null default now()
);

-- Enable Row-Level Security so users can only touch their own row
alter table public.hunter_states enable row level security;

-- Policy: each authenticated user can read their own row
drop policy if exists "hunter_states_select_own" on public.hunter_states;
create policy "hunter_states_select_own"
  on public.hunter_states for select
  using (auth.uid() = user_id);

-- Policy: each authenticated user can insert their own row
drop policy if exists "hunter_states_insert_own" on public.hunter_states;
create policy "hunter_states_insert_own"
  on public.hunter_states for insert
  with check (auth.uid() = user_id);

-- Policy: each authenticated user can update their own row
drop policy if exists "hunter_states_update_own" on public.hunter_states;
create policy "hunter_states_update_own"
  on public.hunter_states for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Optional: prevent deletes from the client side
-- (no delete policy = deletes are denied by default under RLS)
