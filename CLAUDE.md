# CLAUDE.md — Regras do projeto App de Faturas Plus Contas

Lê sempre o `PLAN.md` antes de começares. Ele diz o que construir e por que ordem. Este ficheiro diz **como** trabalhar.

## Quem é a dona do projeto
A Berta (contabilista, dona da Plus Contas) tem nível técnico **básico** e 2–5 h por semana.
- Fala com ela em **português de Portugal**, em linguagem simples, sem jargão (ou explica-o numa frase).
- Antes de cada tarefa, mostra em poucas linhas **o que vais fazer e que ficheiros vais mexer**, e espera pela aprovação.
- Quando ela tiver de fazer algo fora do código (painel do Supabase, DNS, Netlify, TOConline), dá **instruções passo a passo, clique a clique**.

## Estilo de trabalho (obrigatório)
1. **Uma tarefa do PLAN.md de cada vez**, pela ordem. Não adiantes trabalho de tarefas seguintes.
2. **Testa antes de avançar**: corre `npm test`, `npm run lint` e `npm run build`, e diz à Berta exatamente o que verificar no ecrã (a linha "Confirmar" da tarefa).
3. **Um commit por tarefa**, depois de ela confirmar. Mensagem em português com o número da tarefa, por exemplo: `1.6 Ecrã de enviar fatura com várias fotos`.
4. No fim da tarefa, marca `[x]` no `PLAN.md` (no mesmo commit).
5. Se algo no plano estiver errado ou for impossível, **para e explica**. Não inventes uma alternativa grande sem aprovação.
6. Não acrescentes funcionalidades que estão na lista **FICA FORA** do `PLAN.md`.

## Git e publicação
- Trabalha no ramo **`dev`**. Commits e pushes vão para `dev`.
- **Só se junta `dev` → `main` no fim de cada fase** (ou quando a Berta pedir). Cada publicação em produção gasta créditos do plano gratuito da Netlify (cerca de 20 por mês no máximo).
- Nunca faças `git push --force` nem reescrevas o histórico.

## Stack e convenções
- **Next.js (App Router) + TypeScript (strict) + Tailwind CSS**.
- **Supabase**: Postgres + Auth + Storage (região UE). Alterações à base de dados **sempre por migração** em `supabase/migrations/`, nunca à mão no painel (exceto a criação da primeira conta admin).
- **Netlify** para alojamento; **Supabase Cron** para a tarefa diária; **Resend** para emails.
- **IA**: API do Claude, modelo `claude-haiku-4-5`, só chamada no servidor.
- **Vitest** para testes.
- Código (nomes de variáveis, funções, tabelas) em **inglês**. Textos da interface em **português de Portugal**. Comentários em português, curtos.
- Interface **pensada primeiro para telemóvel** (a partir de 360 px). Botões grandes, pouco texto.
- Preferir código simples e legível a soluções "espertas". Poucas dependências: pergunta antes de instalar uma biblioteca que não esteja no `PLAN.md`.

## Estrutura de pastas
```
app/
  (auth)/login/            # entrar
  (auth)/definir-senha/    # página do convite
  cliente/enviar/          # enviar fatura
  cliente/faturas/         # as minhas faturas (+ [id] para responder)
  admin/faturas/           # fila de revisão (+ [id])
  admin/sem-correspondencia/
  admin/empresas/          # (+ [id], regras, ligação TOConline)
  admin/pessoas/
  admin/exportar/
  api/toconline/callback/  # retorno do OAuth
  api/cron/diario/         # tarefa diária (protegida por CRON_SECRET)
lib/
  supabase/                # client.ts (browser), server.ts, admin.ts (service role, SÓ servidor)
  toconline/               # auth.ts (OAuth + renovar token), api.ts (pedidos)
  qr/                      # parse-qr-pt.ts, read-qr.ts
  suggestions/             # engine.ts (regra → histórico → IA), ai.ts
  crypto.ts                # AES-256-GCM
  email.ts                 # Resend
supabase/migrations/
tests/                     # testes Vitest
docs/toconline-notas.md    # o que se descobriu sobre a API do TOConline
```

## Como correr e testar
- `npm install`: instalar dependências
- `npm run dev`: correr em `http://localhost:3000`
- `npm test`: testes Vitest
- `npm run lint` e `npm run build`: têm de passar antes de cada commit
- Migrações: `npx supabase db push` (projeto ligado com `npx supabase link`)
- Para testar no telemóvel: usar o endereço da Netlify do ramo `dev` (deploy de ramo, não gasta créditos de produção)

## Variáveis de ambiente (em `.env.local`, NUNCA no Git)
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `RESEND_API_KEY`, `ENCRYPTION_KEY`, `CRON_SECRET`, `APP_URL`, `TOCONLINE_REDIRECT_URL`.
Mantém o `.env.example` atualizado **só com os nomes**, sem valores.

## NUNCA fazer
- ❌ Commitar `.env`, chaves, palavras-passe, tokens ou dados reais de clientes (faturas, NIFs) — nem em testes. Usa exemplos anonimizados.
- ❌ Usar `SUPABASE_SERVICE_ROLE_KEY` ou `ANTHROPIC_API_KEY` em código que corre no browser.
- ❌ Criar uma tabela sem **RLS ativo** e sem regras de acesso.
- ❌ Tornar públicos os ficheiros do Storage. Usar sempre links temporários.
- ❌ **Criar, alterar, finalizar, anular ou apagar documentos no TOConline** (ficam finalizados e não se desfazem). Na empresa real, só pedidos **GET**. A única exceção é o anexo de ficheiros, a partir da tarefa 10.1 e com aprovação explícita da Berta.
- ❌ Guardar credenciais ou tokens do TOConline sem cifra.
- ❌ Escrever tokens, NIFs completos ou conteúdo de faturas nos logs.
- ❌ Chamar a IA quando já há regra ou histórico para a fatura.
- ❌ Apagar dados ou ficheiros de produção sem aprovação explícita.

## Regras de negócio que não se podem esquecer
- Sugestão: **regra da empresa → histórico (mesma empresa + mesmo NIF fornecedor) → IA**. A IA só escolhe categorias que existem nessa empresa.
- Associação: se não encontrar, `pending`; nova tentativa 1×/dia; ao fim de **15 dias** passa a `no_match`.
- Nota do cliente obrigatória (mín. 3 palavras). O cliente vê todas as faturas das suas empresas e só pode apagar enquanto o estado for "Enviada".
- Ficheiros apagados ao fim de **12 meses**, e só se `archived = true`.
- Se a IA falhar ou atingir o limite, a fatura segue sem sugestão. Nunca bloquear o envio.
