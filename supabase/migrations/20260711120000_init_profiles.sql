-- PHAROS — Etapa 1: Fundação
-- Tabela profiles (1 registro por usuário autenticado), RLS, trigger de criação
-- automática e Realtime.

create table if not exists public.profiles (
  id uuid references auth.users (id) on delete cascade primary key,
  nome text,
  email text,
  modo_financeiro text check (modo_financeiro in ('ciclo', 'calendario')),
  onboarding_completo boolean not null default false,
  criado_em timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Sem policy de delete: usuário não pode apagar a própria linha de profile
-- por essa via (fora de escopo desta etapa).

-- Cria automaticamente um profile ao cadastrar um novo usuário no Supabase Auth.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Habilita Supabase Realtime na tabela profiles.
alter publication supabase_realtime add table public.profiles;
