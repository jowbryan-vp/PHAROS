-- PHAROS — Etapa 5: Gastos Fixos Recorrentes

-- ============================================================
-- gastos_fixos (cadastro base)
-- ============================================================
create table if not exists public.gastos_fixos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  nome text not null,
  valor numeric(12,2) not null check (valor > 0),
  dia_vencimento integer not null check (dia_vencimento between 1 and 31),
  conta_pagamento_padrao_id uuid references public.contas(id) on delete set null,
  categoria_id uuid references public.categorias(id) not null,
  ativo boolean not null default true,
  criado_em timestamptz default now()
);

alter table public.gastos_fixos enable row level security;

create policy "gastos_fixos_select_own"
  on public.gastos_fixos for select
  using (auth.uid() = user_id);

create policy "gastos_fixos_insert_own"
  on public.gastos_fixos for insert
  with check (auth.uid() = user_id);

create policy "gastos_fixos_update_own"
  on public.gastos_fixos for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "gastos_fixos_delete_own"
  on public.gastos_fixos for delete
  using (auth.uid() = user_id);

-- ============================================================
-- gastos_fixos_lancamentos — mesmo padrão de
-- receitas_recorrentes_lancamentos (Complemento da Etapa 3).
-- ============================================================
create table if not exists public.gastos_fixos_lancamentos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  gasto_fixo_id uuid references public.gastos_fixos(id) not null,
  ciclo_id uuid references public.ciclos(id),
  periodo_referencia date not null,
  valor numeric(12,2) not null,
  status text not null default 'pendente' check (status in ('pendente', 'pago')),
  conta_pagamento_id uuid references public.contas(id) on delete set null,
  data_pagamento date,
  criado_em timestamptz default now()
);

alter table public.gastos_fixos_lancamentos enable row level security;

create policy "gastos_fixos_lancamentos_select_own"
  on public.gastos_fixos_lancamentos for select
  using (auth.uid() = user_id);

create policy "gastos_fixos_lancamentos_insert_own"
  on public.gastos_fixos_lancamentos for insert
  with check (auth.uid() = user_id);

create policy "gastos_fixos_lancamentos_update_own"
  on public.gastos_fixos_lancamentos for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Evita gerar mais de um lançamento por gasto fixo no mesmo ciclo (modo
-- ciclo) ou no mesmo período de referência (modo calendário).
create unique index if not exists gastos_fixos_lancamentos_ciclo_unique
  on public.gastos_fixos_lancamentos (ciclo_id, gasto_fixo_id)
  where ciclo_id is not null;

create unique index if not exists gastos_fixos_lancamentos_periodo_unique
  on public.gastos_fixos_lancamentos (user_id, gasto_fixo_id, periodo_referencia)
  where ciclo_id is null;

-- ============================================================
-- Trigger: ao abrir um novo ciclo (modo ciclo), gera um lançamento
-- pendente pra cada gasto fixo ativo do usuário — mesma mecânica de
-- trg_ciclo_gera_recorrentes (Complemento da Etapa 3), em trigger
-- separado pra não mexer na função já existente.
-- ============================================================
create or replace function public.handle_ciclo_gera_gastos_fixos()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  insert into public.gastos_fixos_lancamentos
    (user_id, gasto_fixo_id, ciclo_id, periodo_referencia, valor, status)
  select
    new.user_id,
    gf.id,
    new.id,
    new.data_inicio,
    gf.valor,
    'pendente'
  from public.gastos_fixos gf
  where gf.user_id = new.user_id
    and gf.ativo = true
  on conflict do nothing;

  return new;
end;
$$;

drop trigger if exists trg_ciclo_gera_gastos_fixos on public.ciclos;

create trigger trg_ciclo_gera_gastos_fixos
  after insert on public.ciclos
  for each row execute function public.handle_ciclo_gera_gastos_fixos();
