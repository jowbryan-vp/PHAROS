-- PHAROS — Etapa 3: Receitas + Ciclo Financeiro

-- ============================================================
-- receitas
-- ============================================================
create table if not exists public.receitas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  fonte_receita_id uuid references public.fontes_receita(id) not null,
  conta_id uuid references public.contas(id) not null,
  valor numeric(12,2) not null check (valor > 0),
  data_recebimento date not null,
  tributavel boolean not null,
  observacao text,
  criado_em timestamptz default now()
);

alter table public.receitas enable row level security;

create policy "receitas_select_own"
  on public.receitas for select
  using (auth.uid() = user_id);

create policy "receitas_insert_own"
  on public.receitas for insert
  with check (auth.uid() = user_id);

create policy "receitas_update_own"
  on public.receitas for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "receitas_delete_own"
  on public.receitas for delete
  using (auth.uid() = user_id);

-- ============================================================
-- ciclos
-- ============================================================
create table if not exists public.ciclos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  data_inicio date not null,
  data_fim date,
  receita_ancora_id uuid references public.receitas(id) on delete set null,
  criado_em timestamptz default now()
);

alter table public.ciclos enable row level security;

create policy "ciclos_select_own"
  on public.ciclos for select
  using (auth.uid() = user_id);

-- Sem policy de insert/update/delete de uso geral: ciclos são geridos
-- exclusivamente pelos triggers abaixo (que rodam com o privilégio do
-- usuário autenticado, então ainda precisam de policy própria).
create policy "ciclos_insert_own"
  on public.ciclos for insert
  with check (auth.uid() = user_id);

create policy "ciclos_update_own"
  on public.ciclos for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- Trigger: lançamento de receita da fonte principal fecha o ciclo
-- aberto (se houver) e abre um novo — só quando modo_financeiro = 'ciclo'.
-- ============================================================
create or replace function public.handle_receita_principal_ciclo()
returns trigger
language plpgsql
as $$
declare
  v_is_principal boolean;
  v_modo text;
begin
  select is_principal into v_is_principal
  from public.fontes_receita
  where id = new.fonte_receita_id;

  if not coalesce(v_is_principal, false) then
    return new;
  end if;

  select modo_financeiro into v_modo
  from public.profiles
  where id = new.user_id;

  if v_modo is distinct from 'ciclo' then
    return new;
  end if;

  update public.ciclos
  set data_fim = new.data_recebimento - 1
  where user_id = new.user_id and data_fim is null;

  insert into public.ciclos (user_id, data_inicio, receita_ancora_id)
  values (new.user_id, new.data_recebimento, new.id);

  return new;
end;
$$;

drop trigger if exists trg_receita_principal_ciclo on public.receitas;

create trigger trg_receita_principal_ciclo
  after insert on public.receitas
  for each row execute function public.handle_receita_principal_ciclo();

-- ============================================================
-- Trigger: ao mudar modo_financeiro para 'ciclo' pela primeira vez,
-- inicia o primeiro ciclo a partir do lançamento mais recente da fonte
-- principal, se já existir algum. Caso contrário, o ciclo só nasce no
-- próximo lançamento dessa fonte (via trigger acima).
-- ============================================================
create or replace function public.handle_modo_financeiro_ciclo()
returns trigger
language plpgsql
as $$
declare
  v_fonte_principal_id uuid;
  v_ultima_receita_id uuid;
  v_ultima_data date;
  v_ciclo_aberto_existe boolean;
begin
  if new.modo_financeiro = 'ciclo'
     and old.modo_financeiro is distinct from 'ciclo' then

    select exists(
      select 1 from public.ciclos
      where user_id = new.id and data_fim is null
    ) into v_ciclo_aberto_existe;

    if not v_ciclo_aberto_existe then
      select id into v_fonte_principal_id
      from public.fontes_receita
      where user_id = new.id and is_principal = true
      limit 1;

      if v_fonte_principal_id is not null then
        select id, data_recebimento into v_ultima_receita_id, v_ultima_data
        from public.receitas
        where user_id = new.id and fonte_receita_id = v_fonte_principal_id
        order by data_recebimento desc, criado_em desc
        limit 1;

        if v_ultima_receita_id is not null then
          insert into public.ciclos (user_id, data_inicio, receita_ancora_id)
          values (new.id, v_ultima_data, v_ultima_receita_id);
        end if;
      end if;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_modo_financeiro_ciclo on public.profiles;

create trigger trg_modo_financeiro_ciclo
  after update of modo_financeiro on public.profiles
  for each row execute function public.handle_modo_financeiro_ciclo();
