-- PHAROS — Correções apontadas pelo advisor de segurança do Supabase

-- search_path mutável nas funções de trigger da Etapa 2/3.
alter function public.enforce_single_principal_fonte() set search_path = public;
alter function public.handle_receita_principal_ciclo() set search_path = public;
alter function public.handle_modo_financeiro_ciclo() set search_path = public;
alter function public.handle_ciclo_gera_recorrentes() set search_path = public;

-- handle_new_user é SECURITY DEFINER e só deve ser chamada pelo trigger
-- on_auth_user_created, nunca diretamente via RPC pública. A permissão de
-- EXECUTE de uma function recém-criada vai pra PUBLIC por padrão no
-- Postgres, então é preciso revogar de PUBLIC (revogar só de anon/
-- authenticated não é suficiente).
revoke execute on function public.handle_new_user() from public;
