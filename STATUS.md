# STATUS

| Etapa | Status | Data |
| --- | --- | --- |
| 1 — Fundação | Concluída | 2026-07-11 |
| 2 — Cadastros-base (Fontes de Receita, Contas, Categorias/Subcategorias) | Concluída | 2026-07-13 |
| 3 — Receitas + Ciclo Financeiro (+ complementos: Receita Recorrente Esperada, Navegação entre Períodos) | Concluída | 2026-07-14 |
| 4 — Cartões + Faturas | Concluída | 2026-07-13 |
| 5 — Gastos Fixos Recorrentes | Concluída | 2026-07-13 |
| Complemento — Reestruturação do Dashboard | Concluída | 2026-07-13 |
| Correção — Pipeline de Deploy (Produção não seguia a `main`) | Concluída | 2026-07-13 |
| 6 — Contribuição | Concluída | 2026-07-13 |
| Correções — Bugs encontrados em teste (Etapas 5/6) | Concluída (aguardando revisão/merge do PR) | 2026-07-13 |
| 7 | Não iniciada | — |
| 8 | Não iniciada | — |
| 9 | Não iniciada | — |
| 10 | Não iniciada | — |

## Correções — Bugs encontrados em teste (depois das Etapas 5/6)

**Bug 1 — Navegação de período resetava ao trocar de tela.** Os links da
sidebar apontavam pra rotas puras (`/receitas`, `/dashboard`, ...) sem
carregar o `?p=` atual, e não havia nenhum estado compartilhado entre telas
que não usam período (ex: Cartões) — então atravessar uma dessas telas
também perdia a referência. Corrigido com `lib/periodo-storage.ts`
(localStorage + pub/sub) e um componente invisível `PeriodoSync`, montado
nas 4 telas com navegação de período (Dashboard, Receitas, Gastos Fixos,
Contribuições), que grava o `p` atual a cada mudança. A Sidebar lê esse
valor via `useSyncExternalStore` (reativo a mudanças de qualquer
componente na mesma aba, sem `setState` em efeito) e anexa `?p=` só nos
links de telas period-aware.

**Bug 2 — Campo de data não aceitava o valor no formulário de Nova
Receita.** O input de data era não controlado (`defaultValue`); trocado
para controlado (`value`/`onChange` com estado próprio), o que também
serviu de base pra validação de data futura do Bug 3. De quebra, a função
`todayISO()` local ao formulário usava `toISOString()` (UTC), que pode
voltar/adiantar um dia dependendo do fuso e horário do usuário — trocada
por uma versão baseada em `getFullYear/getMonth/getDate` (fuso local).

**Bug 3 — Receita futura fechava o ciclo indevidamente + corrupção de
dado.**
- *Prevenção*: `data_recebimento` no formulário de Nova Receita agora tem
  `max` = hoje, aviso inline e bloqueio de envio (client) **e** validação
  espelhada em `saveReceita` (server, `app/actions/receitas.ts` — a
  autoridade real, já que o `max` do input é só UX).
- *Determinação de "ciclo atual"*: `getPeriodoAtual` (`lib/periodo.ts`) e
  `getCicloAberto` (`lib/periodo-navegacao.ts`) agora exigem
  `data_inicio <= hoje` — nunca mais tratam um ciclo ancorado no futuro
  como atual, independente de como ele foi parar lá.
- *Integridade ao excluir*: `deleteReceita` agora verifica se a receita é
  âncora de algum ciclo. Se for o ciclo **aberto** (`data_fim` null) e não
  houver nenhum outro lançamento dependente dentro dele (outras receitas
  no intervalo, `receitas_recorrentes_lancamentos` ou
  `gastos_fixos_lancamentos` com esse `ciclo_id`), o ciclo órfão é
  removido e o ciclo anterior é reaberto (`data_fim = null`) — restaurando
  o "em andamento". Se o ciclo já tiver dependentes, ou já estiver fechado
  por um lançamento mais recente, a receita é excluída normalmente mas o
  ciclo não é tocado, e o usuário recebe um aviso (via `window.alert`,
  `DeleteButton` agora aceita ações que retornam `{ warning?: string }`)
  pra revisar manualmente.
- *Conserto do dado já corrompido em produção*: **não aplicado nesta
  sessão** — o conector MCP do Supabase não estava disponível. Script de
  diagnóstico e correção (repassado ao usuário para rodar manualmente no
  SQL Editor, ou para aplicar assim que o conector estiver disponível):

  ```sql
  -- 1. Diagnóstico
  select id, user_id, data_inicio, data_fim, receita_ancora_id, criado_em
  from public.ciclos
  where user_id = '<USER_ID>'
  order by data_inicio desc;

  -- O ciclo órfão deve aparecer com data_fim IS NULL, receita_ancora_id IS
  -- NULL (a FK é "on delete set null") e data_inicio no futuro. O ciclo
  -- legítimo é o de data_inicio = '2026-06-26', hoje fechado indevidamente.

  -- 2. Remover o ciclo órfão
  delete from public.ciclos
  where id = '<CICLO_ORFAO_ID>' and user_id = '<USER_ID>';

  -- 3. Reabrir o ciclo legítimo
  update public.ciclos
  set data_fim = null
  where user_id = '<USER_ID>' and data_inicio = '2026-06-26';
  ```

**Bug 4 — Card de Contribuição "sumido" do Dashboard** e **Bug 5 — Acesso
a Perfil "sumido" do header**: investigados e **não eram bugs de
código** — `dashboard/page.tsx` já tem a `DashboardSection title=
"Contribuição"` (adicionada na Etapa 6) e `components/layout/header.tsx`
já renderiza `<UserMenu email={...} />` incondicionalmente, com o dropdown
"Perfil"/"Sair" intacto. O mais provável é o teste ter batido numa
implantação desatualizada ou num cache de navegador antes do merge da
Etapa 6 ir ao ar — vale reconferir depois de um hard refresh / novo deploy
de produção antes de reabrir como bug.

## Etapa 6 — Contribuição

Toda receita lançada com `tributavel = true` gera automaticamente uma
contribuição `comprometida` via trigger `trg_receita_gera_contribuicao`
(`AFTER INSERT on receitas`) — mesmo padrão de trigger reativo já usado nas
etapas anteriores (ciclo, receitas recorrentes, gastos fixos). O trigger lê
`profiles.percentual_contribuicao` **no momento do insert** e grava
`valor_sugerido = round(valor da receita × percentual / 100, 2)`;
`valor_final` nasce igual ao sugerido. Como o percentual é lido e congelado
nesse instante (não há referência viva ao perfil depois disso), mudar o
percentual no `/perfil` não recalcula contribuições já existentes — vale só
para receitas lançadas a partir da mudança, exatamente como pedido no
escopo.

`valor_final` só pode ser editado enquanto `status = 'comprometido'` — a
trava é reforçada tanto na action (`editarValorFinal`, com `.eq("status",
"comprometido")` na query) quanto na UI (a ação "Editar valor" some assim
que a contribuição aparece como paga). "Marcar como paga" pede conta e data
sem nenhuma pré-seleção de conta (diferente de Gastos Fixos e Faturas, que
têm conta padrão) — reflete o fato de a contribuição não estar amarrada a
uma conta fixa.

Diferente de `receitas_recorrentes_lancamentos` e
`gastos_fixos_lancamentos`, `contribuicoes` não tem `periodo_referencia`
nem `ciclo_id` próprios — ela nasce sempre atrelada a uma receita já
lançada (nunca projetada), então a navegação por período em
`/contribuicoes` e no card do Dashboard filtra pela `data_recebimento` da
receita de origem (`lib/contribuicoes.ts`, mesma técnica de filtro por data
via join usada em `getResumoFaturasDoPeriodo` na Etapa 4/complemento do
Dashboard). Por isso também não há projeção para períodos futuros aqui —
contribuição é sempre dado real, nunca estimativa.

**Pendência desta etapa:** o conector MCP do Supabase não estava disponível
nesta sessão, então a migration (`20260716120000_contribuicao.sql`) foi
escrita e revisada manualmente, seguindo a mesma estrutura de RLS/trigger
já testada ao vivo nas Etapas 3-4 (mesmo assim, **não foi aplicada nem
testada em produção** desta vez). A fórmula de arredondamento do
`valor_sugerido` foi validada localmente em Node contra alguns casos de
borda (percentuais fracionários, valores que caem exatamente em .5
centavos). Build e lint passam localmente. Recomendo aplicar a migration e
validar RLS/trigger antes ou logo depois do merge do PR.

## Correção — Pipeline de Deploy (Produção não seguia a `main`)

Depois de renomear a branch padrão do repositório para `main` e adotar o
fluxo de branch + PR, os merges dos PR #1 (Etapa 5) e #2 (Reestruturação do
Dashboard) geravam deploys marcados como **Preview** na Vercel, não
Production — a Produção real continuava presa num commit antigo, exigindo
"Promote to Production" manual no painel.

**Causa raiz:** a configuração de Production Branch do projeto `pharos` na
Vercel estava presa em `claude/pharos-stage-1-foundation-vdhaux` (a branch
usada antes da migração pra `main`), e não sincronizou sozinha quando o
default branch do repositório foi renomeado no GitHub — confirmado tanto
pela API do GitHub (`default_branch: "main"`) quanto pelo aviso no painel
da Vercel ("To update your Production Deployment, push to the
`claude/pharos-stage-1-foundation-vdhaux` branch").

**Correção aplicada** (manual, pelo usuário, no painel da Vercel — o campo
de Production Branch não está mais exposto como um campo de texto separado
em Settings → Git nesta versão da UI): em **Settings → Git**, no card
"Connected Git Repository", **Disconnect** seguido de **reconectar** o
mesmo repositório (`jowbryan-vp/PHAROS`). Isso força a Vercel a reler o
repositório do zero e reconhecer `main` como Production Branch atual — sem
apagar variáveis de ambiente ou deployments anteriores. Confirmado
corrigido: o aviso no painel passou a dizer "push to the `main` branch", e
`main` saiu da lista de "Active Branches" (que só lista branches que geram
Preview).

**Fluxo correto a partir de agora:** merge de PR na `main` → deploy de
Produção automático na Vercel, sem necessidade de promoção manual.

## Complemento — Reestruturação do Dashboard

O card "Seu perfil" (resquício de teste de Realtime da Etapa 1) saiu do
Dashboard e virou a página própria `/perfil`, acessível por um dropdown no
header (clique no e-mail do usuário → "Perfil" / "Sair", em
`components/layout/user-menu.tsx`). O `ProfileRealtimeCard` em si não
mudou, só de lugar.

O Dashboard agora é só dados financeiros, organizados em `DashboardSection`s
(um título + grade de `DashboardCard`s — ambos em
`components/features/dashboard-card.tsx`), com um único
`DashboardPeriodoNav` no topo controlando o período de todas as seções ao
mesmo tempo (reaproveita o mesmo `resolvePeriodoView`/`?p=` já usado em
Receitas e Gastos Fixos — não há navegação por card):

- **Receitas**: Recebido no período / Esperado (pendente) — mesmos dados de
  antes, só que agora como dois `DashboardCard`s em vez do
  `ReceitasResumoCard` dedicado (removido, virou redundante).
- **Cartões**: Faturas em aberto / a pagar / pagas no período — novo,
  calculado por `getResumoFaturasDoPeriodo` (`lib/faturas.ts`), que soma os
  lançamentos de fatura por status filtrando pela `data_vencimento` dentro
  do período navegado (não é a mesma noção de "fatura corrente" de
  `ensureFaturasAtualizadas` — é um corte por vencimento).
- **Gastos Fixos**: Fixos pendentes / pagos — mesmos dados de antes, também
  migrados do `GastosFixosResumoCard` dedicado (removido) para
  `DashboardCard`s.

`DashboardSection`/`DashboardCard` existem justamente para que Contribuição
(Etapa 6), Cofrinhos (Etapa 7) e Saldo Projetado (Etapa 9) só precisem
adicionar uma seção nova na grade — os pontos de entrada estão comentados
no fim de `app/(dashboard)/dashboard/page.tsx`. Nenhum saldo consolidado ou
projetado foi implementado aqui (fica pra Etapa 9, como no escopo original).

## Etapa 4 — decisão de arquitetura: fechamento automático de faturas

Sem `pg_cron` disponível, não há como o banco "acordar sozinho" no dia do
fechamento de cada cartão para fechar a fatura corrente e abrir a próxima.
A abordagem escolhida foi a mesma já usada na Etapa 3 (complemento de
Receita Recorrente Esperada) para o mesmo problema: uma rotina **preguiçosa**
(`ensureFaturasAtualizadas`, em `lib/faturas.ts`), chamada no carregamento
das páginas que dependem de faturas (`/cartoes` e `/cartoes/[id]`).

A cada chamada, para cada cartão do usuário, ela busca a fatura de status
`aberta` com o **menor `periodo_fim`** (não a mais recente — um cartão pode
ter várias faturas `aberta` simultâneas por causa de compras parceladas,
que pré-criam faturas futuras). Se o `periodo_fim` dessa fatura já passou,
ela é marcada como `fechada` e a próxima é aberta (reaproveitando uma já
pré-criada por parcelamento, se existir, ou criando uma nova). O processo
repete em loop até a fatura mais antiga `aberta` cobrir a data atual —
cobrindo o caso de um usuário que fica vários meses sem abrir o app.

Alternativas descartadas:
- **`pg_cron`**: não disponível no plano/projeto atual.
- **Edge Function agendada**: adicionaria infraestrutura (deploy, agendamento
  externo) desproporcional ao estágio atual do projeto.
- **Calcular a fatura corrente sempre em memória, sem persistir `fechada`**:
  não funciona porque faturas fechadas precisam existir como registros
  concretos para o fluxo de pagamento (marcar como paga, escolher conta).

Testado diretamente na base de produção via MCP do Supabase: criação de
cartão, fechamento em cadeia simulando 3 meses de atraso (3 faturas fechadas
em sequência até alcançar o período atual), trigger `enforce_fatura_aberta`
bloqueando lançamento em fatura fechada, distribuição de parcelas em
centavos sem perda de arredondamento (3 parcelas de uma compra de R$100,00
somam exatamente R$100,00) e `on delete cascade` removendo todas as parcelas
ao excluir a parcela original. Todos os dados de teste foram removidos ao
final.

## Etapa 5 — Gastos Fixos Recorrentes

Reutiliza integralmente a mecânica de Receita Recorrente Esperada
(Complemento da Etapa 3): tabela de cadastro base (`gastos_fixos`) +
tabela de lançamentos por período (`gastos_fixos_lancamentos`), trigger
`trg_ciclo_gera_gastos_fixos` (em `AFTER INSERT on ciclos`, espelhando
`trg_ciclo_gera_recorrentes` num trigger próprio pra não mexer na função já
existente) cobrindo o modo ciclo, e `ensureGastosFixosDoPeriodo` (em
`lib/gastos-fixos.ts`, mesmo formato de `ensureRecorrentesDoPeriodo`)
cobrindo o modo calendário e a ativação/criação de gasto fixo no meio de um
período já aberto. Índices únicos parciais evitam duplicar lançamento por
ciclo/período, exatamente como em `receitas_recorrentes_lancamentos`.

`ativo = false` só impede a geração de novos lançamentos (o `where gf.ativo
= true` no trigger e no `ensureGastosFixosDoPeriodo` cobre isso) — o
histórico de lançamentos já gerados não é tocado. Editar o `valor` de um
lançamento específico atualiza só aquele registro, nunca o cadastro base.

Tela `/gastos-fixos` reutiliza `resolvePeriodoView` (mesmo `?p=` da tela de
Receitas) para a navegação ◀▶ entre períodos passado/atual/futuro, com
projeção em memória (`getProjecaoGastosFixos`) para períodos futuros sem
lançamento real ainda gerado — mesmo padrão da projeção de receitas
recorrentes.

**Pendência desta etapa:** o conector MCP do Supabase não estava disponível
nesta sessão, então a migration (`20260715120000_gastos_fixos.sql`) foi
escrita e revisada manualmente (mesma estrutura de RLS e trigger já testada
ao vivo nas Etapas 3 e 4), mas **não foi aplicada nem testada em produção**
como nas etapas anteriores. Build e lint passam localmente. Recomendo
aplicar a migration e validar RLS/trigger antes ou logo depois do merge do
PR.
