-- À coller dans Supabase : SQL Editor → New query → Run

create table if not exists sites (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null,
  updated_at timestamp with time zone default now()
);

alter table sites enable row level security;

create policy "Chacun gère uniquement son propre site"
  on sites for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
