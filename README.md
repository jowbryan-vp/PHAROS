# PHAROS

Substituto do antigo FinFlow. Reconstrução do zero, em etapas fechadas.
Esta é a **Etapa 1 — Fundação**: setup técnico, autenticação, schema mínimo
com RLS, onboarding guiado (navegação apenas) e layout base. Nenhuma
funcionalidade financeira ainda — isso começa na Etapa 2.

## Stack

- Next.js 16 (App Router), TypeScript
- Supabase (Postgres + Auth + Realtime)
- Tailwind CSS v4
- Deploy: Vercel

> Next.js 16 renomeou `middleware.ts` para `proxy.ts` (mesma função,
> convenção nova). A proteção de rotas deste projeto está em `proxy.ts`
> na raiz.

## Setup local

### 1. Instalar dependências

```bash
npm install
```

> `package-lock.json` não está versionado neste commit inicial (ambiente
> de push com restrição de tamanho de payload); `npm install` gera o
> lockfile normalmente. Recomenda-se commitá-lo no próximo push feito via
> `git` local.

### 2. Variáveis de ambiente

Crie um arquivo `.env.local` na raiz (não é commitado — já está no
`.gitignore`) com:

```bash
NEXT_PUBLIC_SUPABASE_URL=<url do seu projeto Supabase>
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable key do seu projeto Supabase>
```

Use a nomenclatura atual do Supabase (`PUBLISHABLE_KEY`, não `ANON_KEY`).
Ambos os valores ficam em **Project Settings → API** no painel do
Supabase.

### 3. Rodar as migrations no Supabase

O schema desta etapa está em `supabase/migrations/`. Aplique-o no seu
projeto Supabase (SQL Editor do painel, ou `supabase db push` via CLI
com o projeto linkado). A migration cria:

- a tabela `profiles`, com RLS ativo desde o início (cada usuário só
  lê/escreve a própria linha);
- um trigger que cria o `profile` automaticamente quando um usuário se
  cadastra no Supabase Auth;
- a tabela `profiles` habilitada na publicação `supabase_realtime`.

### 4. Configurar o Auth no Supabase

No painel do Supabase, em **Authentication → URL Configuration**,
adicione a URL do seu ambiente (local e de produção) em *Site URL* e
*Redirect URLs*, incluindo `/auth/callback` — é a rota que troca o
código de confirmação de e-mail / recuperação de senha por uma sessão.
Cadastro é aberto (qualquer pessoa pode criar conta), com confirmação
por e-mail obrigatória — confirme que essa opção está habilitada em
**Authentication → Providers → Email**.

### 5. Rodar o projeto

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

## Deploy na Vercel

1. Conecte o repositório `pharos` a um projeto na Vercel.
2. Em **Project Settings → Environment Variables**, cadastre manualmente
   as duas variáveis abaixo (mesmos valores do `.env.local`):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
3. Faça o deploy normalmente — build command e output são detectados
   automaticamente pela Vercel para projetos Next.js.

## Estrutura de pastas

```
app/(auth)/login
app/(auth)/cadastro
app/(auth)/recuperar-senha
app/onboarding/           → fluxo guiado obrigatório pós-cadastro
app/(dashboard)/          → rota protegida, placeholder "Em construção"
app/auth/callback/        → troca de código (confirmação de e-mail / recuperação de senha) por sessão
app/actions/               → Server Actions de auth e onboarding
components/ui/
components/features/
components/layout/
lib/supabase/              → client.ts (browser), server.ts (server), middleware.ts (proxy)
types/
supabase/migrations/
```

## Escopo desta etapa

Cobre apenas a fundação técnica: setup do projeto, autenticação
(cadastro/login/logout/recuperação de senha), schema mínimo (`profiles`)
com RLS, trigger de criação automática de profile, onboarding guiado
(somente navegação — sem formulários financeiros reais), layout base,
tokens de design e Realtime habilitado em `profiles`. Nenhuma lógica
financeira (fontes de receita, contas, cartões, cofrinhos, categorias)
faz parte desta etapa — isso começa na Etapa 2.

Ver `STATUS.md` para o andamento das etapas do projeto.
