# STATUS

| Etapa | Status | Data |
| --- | --- | --- |
| 1 — Fundação | Concluída | 2026-07-11 |
| 2 — Cadastros-base (Fontes de Receita, Contas, Categorias/Subcategorias) | Concluída | 2026-07-13 |
| 3 — Receitas + Ciclo Financeiro (+ complementos: Receita Recorrente Esperada, Navegação entre Períodos) | Concluída | 2026-07-14 |
| 4 — Cartões + Faturas | Concluída | 2026-07-13 |
| 5 | Não iniciada | — |
| 6 | Não iniciada | — |
| 7 | Não iniciada | — |
| 8 | Não iniciada | — |
| 9 | Não iniciada | — |
| 10 | Não iniciada | — |

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
