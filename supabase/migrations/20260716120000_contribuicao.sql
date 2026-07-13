-- PHAROS — Etapa 6: Contribuição

-- ============================================================
-- profiles.percentual_contribuicao
-- ============================================================
alter table public.profiles
  add column if not exists percentual_contribuicao numeric(5,2) not null default 10.00;

-- ============================================================
-- contribuicoes
-- ============================================================
create table if not exists public.contribuicoes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  receita_id uuid references public.receitas(id) not null,
  valor_sugerido numeric(12,2) not null,
  valor_final numeric(12,2) not null,
  status text not null default 'comprometido' check (status in ('comprometido', 'pago')),
  data_pagamento date,
  conta_pagamento_id uuid references public.contas(id),
  criado_em timestamptz default now()
);

alter table public.contribuicoes enable row level security;

create policy "contribuicoes_select_own"
  on public.contribuicoes for select
  using (auth.uid() = user_id);

-- Sem policy de insert de uso geral: contribuições são geradas
-- exclusivamente pelo trigger abaixo (que roda com o privilégio do usuário
-- autenticado, então ainda precisa de policy própria).
create policy "contribuicoes_insert_own"
  on public.contribuicoes for insert
  with check (auth.uid() = user_id);

create policy "contribuicoes_update_own"
  on public.contribuicoes for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- Trigger: toda receita lançada com tributavel = true gera uma
-- contribuição comprometida, usando o percentual configurado no perfil no
-- momento do lançamento (mudanças futuras no percentual não recalculam
-- contribuições já geradas).
-- ============================================================
create or replace function public.handle_receita_gera_contribuicao()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_percentual numeric(5,2);
  v_valor_sugerido numeric(12,2);
begin
  if not new.tributavel then
    return new;
  end if;

  select percentual_contribuicao into v_percentual
  from public.profiles
  where id = new.user_id;

  v_valor_sugerido := round(new.valor * coalesce(v_percentual, 10.00) / 100, 2);

  insert into public.contribuicoes
    (user_id, receita_id, valor_sugerido, valor_final, status)
  values
    (new.user_id, new.id, v_valor_sugerido, v_valor_sugerido, 'comprometido');

  return new;
end;
$$;

drop trigger if exists trg_receita_gera_contribuicao on public.receitas;

create trigger trg_receita_gera_contribuicao
  after insert on public.receitas
  for each row execute function public.handle_receita_gera_contribuicao();
