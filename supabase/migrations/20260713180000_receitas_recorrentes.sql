-- PHAROS — Complemento da Etapa 3: Receita Recorrente Esperada

alter table public.fontes_receita
  add column if not exists is_recorrente boolean not null default false,
  add column if not exists valor_esperado numeric(12,2),
  add column if not exists dia_esperado integer check (dia_esperado between 1 and 31);

-- ============================================================
-- receitas_recorrentes_lancamentos
-- ============================================================
create table if not exists public.receitas_recorrentes_lancamentos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  fonte_receita_id uuid references public.fontes_receita(id) not null,
  ciclo_id uuid references public.ciclos(id),
  periodo_referencia date not null,
  valor_esperado numeric(12,2) not null,
  status text not null default 'pendente' check (status in ('pendente', 'recebido')),
  receita_id uuid references public.receitas(id),
  criado_em timestamptz default now()
);

alter table public.receitas_recorrentes_lancamentos enable row level security;

create policy "receitas_recorrentes_select_own"
  on public.receitas_recorrentes_lancamentos for select
  using (auth.uid() = user_id);

create policy "receitas_recorrentes_insert_own"
  on public.receitas_recorrentes_lancamentos for insert
  with check (auth.uid() = user_id);

create policy "receitas_recorrentes_update_own"
  on public.receitas_recorrentes_lancamentos for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Evita gerar mais de um pendente/recebido por fonte no mesmo ciclo
-- (modo ciclo) ou no mesmo período de referência (modo calendário).
create unique index if not exists receitas_recorrentes_ciclo_unique
  on public.receitas_recorrentes_lancamentos (ciclo_id, fonte_receita_id)
  where ciclo_id is not null;

create unique index if not exists receitas_recorrentes_periodo_unique
  on public.receitas_recorrentes_lancamentos (user_id, fonte_receita_id, periodo_referencia)
  where ciclo_id is null;

-- ============================================================
-- Trigger: ao abrir um novo ciclo (modo ciclo), gera um lançamento
-- pendente pra cada fonte de receita recorrente do usuário.
-- Cobre tanto o primeiro ciclo (bootstrap ao trocar pra modo ciclo)
-- quanto os ciclos seguintes (fechados/abertos a cada receita da fonte
-- principal), já que ambos os caminhos inserem em `ciclos`.
-- ============================================================
create or replace function public.handle_ciclo_gera_recorrentes()
returns trigger
language plpgsql
as $$
begin
  insert into public.receitas_recorrentes_lancamentos
    (user_id, fonte_receita_id, ciclo_id, periodo_referencia, valor_esperado, status)
  select
    new.user_id,
    fr.id,
    new.id,
    new.data_inicio,
    fr.valor_esperado,
    'pendente'
  from public.fontes_receita fr
  where fr.user_id = new.user_id
    and fr.is_recorrente = true
    and fr.valor_esperado is not null
  on conflict do nothing;

  return new;
end;
$$;

drop trigger if exists trg_ciclo_gera_recorrentes on public.ciclos;

create trigger trg_ciclo_gera_recorrentes
  after insert on public.ciclos
  for each row execute function public.handle_ciclo_gera_recorrentes();
