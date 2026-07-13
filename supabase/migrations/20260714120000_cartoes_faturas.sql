-- PHAROS — Etapa 4: Cartões + Faturas

-- ============================================================
-- cartoes
-- ============================================================
create table if not exists public.cartoes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  nome text not null,
  dia_fechamento integer not null check (dia_fechamento between 1 and 31),
  dia_vencimento integer not null check (dia_vencimento between 1 and 31),
  conta_pagamento_padrao_id uuid references public.contas(id) on delete set null,
  criado_em timestamptz default now()
);

alter table public.cartoes enable row level security;

create policy "cartoes_select_own"
  on public.cartoes for select
  using (auth.uid() = user_id);

create policy "cartoes_insert_own"
  on public.cartoes for insert
  with check (auth.uid() = user_id);

create policy "cartoes_update_own"
  on public.cartoes for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "cartoes_delete_own"
  on public.cartoes for delete
  using (auth.uid() = user_id);

-- ============================================================
-- faturas (geradas automaticamente pela aplicação, nunca cadastradas
-- manualmente pelo usuário)
-- ============================================================
create table if not exists public.faturas (
  id uuid primary key default gen_random_uuid(),
  cartao_id uuid references public.cartoes(id) on delete cascade not null,
  periodo_inicio date not null,
  periodo_fim date not null,
  data_vencimento date not null,
  status text not null default 'aberta' check (status in ('aberta', 'fechada', 'paga')),
  conta_pagamento_id uuid references public.contas(id) on delete set null,
  criado_em timestamptz default now()
);

alter table public.faturas enable row level security;

create policy "faturas_select_own"
  on public.faturas for select
  using (
    exists (
      select 1 from public.cartoes c
      where c.id = cartao_id and c.user_id = auth.uid()
    )
  );

create policy "faturas_insert_own"
  on public.faturas for insert
  with check (
    exists (
      select 1 from public.cartoes c
      where c.id = cartao_id and c.user_id = auth.uid()
    )
  );

create policy "faturas_update_own"
  on public.faturas for update
  using (
    exists (
      select 1 from public.cartoes c
      where c.id = cartao_id and c.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.cartoes c
      where c.id = cartao_id and c.user_id = auth.uid()
    )
  );

-- ============================================================
-- lancamentos_fatura
-- ============================================================
create table if not exists public.lancamentos_fatura (
  id uuid primary key default gen_random_uuid(),
  fatura_id uuid references public.faturas(id) on delete cascade not null,
  descricao text not null,
  valor numeric(12,2) not null check (valor > 0),
  categoria_id uuid references public.categorias(id) not null,
  subcategoria_id uuid references public.subcategorias(id),
  eh_parcelado boolean not null default false,
  parcela_atual integer,
  total_parcelas integer,
  compra_original_id uuid references public.lancamentos_fatura(id) on delete cascade,
  criado_em timestamptz default now()
);

alter table public.lancamentos_fatura enable row level security;

create policy "lancamentos_fatura_select_own"
  on public.lancamentos_fatura for select
  using (
    exists (
      select 1 from public.faturas f
      join public.cartoes c on c.id = f.cartao_id
      where f.id = fatura_id and c.user_id = auth.uid()
    )
  );

create policy "lancamentos_fatura_insert_own"
  on public.lancamentos_fatura for insert
  with check (
    exists (
      select 1 from public.faturas f
      join public.cartoes c on c.id = f.cartao_id
      where f.id = fatura_id and c.user_id = auth.uid()
    )
  );

create policy "lancamentos_fatura_update_own"
  on public.lancamentos_fatura for update
  using (
    exists (
      select 1 from public.faturas f
      join public.cartoes c on c.id = f.cartao_id
      where f.id = fatura_id and c.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.faturas f
      join public.cartoes c on c.id = f.cartao_id
      where f.id = fatura_id and c.user_id = auth.uid()
    )
  );

create policy "lancamentos_fatura_delete_own"
  on public.lancamentos_fatura for delete
  using (
    exists (
      select 1 from public.faturas f
      join public.cartoes c on c.id = f.cartao_id
      where f.id = fatura_id and c.user_id = auth.uid()
    )
  );

-- Só é possível lançar em faturas com status = 'aberta'.
create or replace function public.enforce_fatura_aberta()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_status text;
begin
  select status into v_status from public.faturas where id = new.fatura_id;

  if v_status is distinct from 'aberta' then
    raise exception 'Só é possível lançar em faturas abertas.';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_fatura_aberta on public.lancamentos_fatura;

create trigger trg_enforce_fatura_aberta
  before insert on public.lancamentos_fatura
  for each row execute function public.enforce_fatura_aberta();
