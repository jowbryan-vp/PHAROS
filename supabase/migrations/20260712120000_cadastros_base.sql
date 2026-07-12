-- PHAROS — Etapa 2: Cadastros-base
-- Fontes de receita, contas bancárias, categorias e subcategorias.
-- Nenhum lançamento financeiro real ainda (Etapa 3+).

-- ============================================================
-- fontes_receita
-- ============================================================
create table if not exists public.fontes_receita (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  nome text not null,
  is_principal boolean not null default false,
  tributavel_padrao boolean not null default true,
  criado_em timestamptz default now()
);

alter table public.fontes_receita enable row level security;

create policy "fontes_receita_select_own"
  on public.fontes_receita for select
  using (auth.uid() = user_id);

create policy "fontes_receita_insert_own"
  on public.fontes_receita for insert
  with check (auth.uid() = user_id);

create policy "fontes_receita_update_own"
  on public.fontes_receita for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "fontes_receita_delete_own"
  on public.fontes_receita for delete
  using (auth.uid() = user_id);

-- Garante que apenas uma fonte por usuário fique marcada como principal:
-- ao marcar uma nova, desmarca a anterior na mesma transação.
create or replace function public.enforce_single_principal_fonte()
returns trigger
language plpgsql
as $$
begin
  if new.is_principal then
    update public.fontes_receita
    set is_principal = false
    where user_id = new.user_id
      and id <> new.id
      and is_principal = true;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_single_principal_fonte on public.fontes_receita;

create trigger trg_single_principal_fonte
  before insert or update of is_principal on public.fontes_receita
  for each row execute function public.enforce_single_principal_fonte();

-- ============================================================
-- contas
-- ============================================================
create table if not exists public.contas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  nome text not null,
  criado_em timestamptz default now()
);

alter table public.contas enable row level security;

create policy "contas_select_own"
  on public.contas for select
  using (auth.uid() = user_id);

create policy "contas_insert_own"
  on public.contas for insert
  with check (auth.uid() = user_id);

create policy "contas_update_own"
  on public.contas for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "contas_delete_own"
  on public.contas for delete
  using (auth.uid() = user_id);

-- ============================================================
-- categorias
-- ============================================================
create table if not exists public.categorias (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  nome text not null,
  is_recorrente boolean not null default false,
  criado_em timestamptz default now()
);

alter table public.categorias enable row level security;

create policy "categorias_select_own"
  on public.categorias for select
  using (auth.uid() = user_id);

create policy "categorias_insert_own"
  on public.categorias for insert
  with check (auth.uid() = user_id);

create policy "categorias_update_own"
  on public.categorias for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "categorias_delete_own"
  on public.categorias for delete
  using (auth.uid() = user_id);

-- ============================================================
-- subcategorias (protegidas via join com a categoria pai)
-- ============================================================
create table if not exists public.subcategorias (
  id uuid primary key default gen_random_uuid(),
  categoria_id uuid references public.categorias(id) on delete cascade not null,
  nome text not null,
  criado_em timestamptz default now()
);

alter table public.subcategorias enable row level security;

create policy "subcategorias_select_own"
  on public.subcategorias for select
  using (
    exists (
      select 1 from public.categorias c
      where c.id = categoria_id and c.user_id = auth.uid()
    )
  );

create policy "subcategorias_insert_own"
  on public.subcategorias for insert
  with check (
    exists (
      select 1 from public.categorias c
      where c.id = categoria_id and c.user_id = auth.uid()
    )
  );

create policy "subcategorias_update_own"
  on public.subcategorias for update
  using (
    exists (
      select 1 from public.categorias c
      where c.id = categoria_id and c.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.categorias c
      where c.id = categoria_id and c.user_id = auth.uid()
    )
  );

create policy "subcategorias_delete_own"
  on public.subcategorias for delete
  using (
    exists (
      select 1 from public.categorias c
      where c.id = categoria_id and c.user_id = auth.uid()
    )
  );
