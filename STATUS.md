# STATUS

| Etapa | Status | Data |
| --- | --- | --- |
| 1 — Fundação | Concluída | 2026-07-11 |
| 2 — Cadastros-base (Fontes de Receita, Contas, Categorias/Subcategorias) | Concluída | 2026-07-13 |
| 3 — Receitas + Ciclo Financeiro (+ complementos: Receita Recorrente Esperada, Navegação entre Períodos) | Concluída | 2026-07-14 |
| 4 — Cartões + Faturas | Concluída | 2026-07-13 |
| 5 — Gastos Fixos Recorrentes | Concluída | 2026-07-13 |
| Complemento — Reestruturação do Dashboard | Concluída (aguardando revisão/merge do PR) | 2026-07-13 |
| 6 | Não iniciada | — |
| 7 | Não iniciada | — |
| 8 | Não iniciada | — |
| 9 | Não iniciada | — |
| 10 | Não iniciada | — |

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
