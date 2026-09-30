# PLAN.md — App de Faturas Plus Contas

> Especificação de execução para o Claude Code. Ler juntamente com o `CLAUDE.md`.
> Trabalhar **uma tarefa de cada vez**, testar, fazer commit, e só depois avançar.

---

## 1. Visão geral

A **App de Faturas Plus Contas** é uma aplicação web para telemóvel. Os clientes do escritório de contabilidade Plus Contas usam-na para enviar as suas faturas de compra (foto ou PDF), acompanhadas de uma **nota curta a dizer o que foi comprado e para quê**. As compras já entram no TOConline pela importação do e-Fatura, com fornecedor, valores e IVA. O que falta ao escritório é saber **o quê e para quê**, para classificar a despesa na conta certa e decidir se o IVA é dedutível.

A aplicação:
1. lê o **código QR** da fatura;
2. encontra a **compra correspondente** no TOConline;
3. **sugere a classificação** (categoria de despesa/conta e % de IVA dedutível), a partir de regras do cliente, do histórico de aprovações e de IA;
4. a Berta **aprova, corrige ou devolve ao cliente**;
5. no fim, **exporta um Excel** com as classificações aprovadas, para introduzir no TOConline.

### Critérios de sucesso do v1
Medidos ao fim de **1 mês de uso real** pelo cliente de teste:

1. O cliente envia **todas** as faturas pela aplicação, sem voltar ao email ou ao WhatsApp.
2. **≥ 80% das faturas com QR** ficam associadas automaticamente à compra certa no TOConline, sem associações erradas.
3. **≥ 70% das sugestões** (conta + IVA dedutível) são aprovadas **sem correção** no fim do mês.
4. Rever uma fatura na aplicação demora **menos de 30 segundos**.
5. Custo mensal total **abaixo de 20 €**.

---

## 2. Âmbito

### ENTRA no v1
- Aplicação web para telemóvel, com opção "Adicionar ao ecrã inicial". Não é uma app de lojas.
- Contas criadas **apenas pela administradora**, com convite por email para o cliente definir a palavra-passe e sessão que fica iniciada no telemóvel.
- Várias pessoas por empresa, e uma pessoa pode estar ligada a várias empresas.
- Cliente: enviar fatura (uma ou mais fotos juntas **ou** PDF) com **nota obrigatória** (mín. 3 palavras); ver **todas as faturas da empresa** com o estado; **apagar** uma fatura enquanto não foi revista; responder a pedidos do escritório.
- Leitura automática do **código QR** português (NIF do fornecedor, NIF do adquirente, data, nº, ATCUD, totais e IVA por taxa).
- Ligação ao TOConline **por empresa** (credenciais próprias de cada empresa).
- **Associação automática** à compra já existente no TOConline. Se não encontrar, a fatura fica "por associar" e o sistema volta a tentar **1× por dia**. Ao fim de **15 dias** passa para a lista **"Sem correspondência"**.
- **Sugestão de classificação**, por ordem: 1) **regra da empresa**, 2) **histórico** de aprovações (mesmo fornecedor na mesma empresa), 3) **IA** (Claude Haiku, limite de 5 €/mês). A IA escolhe **só entre as categorias de despesa que existem** nessa empresa no TOConline e também lê os dados das faturas sem QR.
- **Regras por empresa**, geridas pela administradora (ex.: "fornecedor NIF X → categoria Y, 50% IVA dedutível").
- Ecrã de **revisão**: Aprovar / Corrigir e aprovar / Devolver ao cliente com mensagem (o cliente recebe **email**).
- **Exportação Excel** por empresa e período, com as colunas definidas na secção 4. As faturas exportadas ficam marcadas como "exportadas".
- **Arquivo**: anexar a foto/PDF ao documento no TOConline **se a API o permitir** (a testar). Os ficheiros são **apagados da aplicação ao fim de 12 meses**, e só depois de confirmado o arquivo no TOConline.
- Endereço próprio `faturas.pluscontas.com` e emails enviados a partir do domínio do escritório.

### FICA FORA do v1 (não fazer, mesmo que pareça fácil)
- ❌ App nas lojas (Google Play / App Store).
- ❌ Notificações push no telemóvel (o aviso é só por email).
- ❌ **Criar, alterar ou apagar documentos de compra no TOConline.** Os documentos criados pela API ficam finalizados e não se podem desfazer.
- ❌ Escrever a classificação diretamente na contabilidade do TOConline (a API pública não o permite, ver Riscos).
- ❌ Registo livre de utilizadores ("criar conta" pelo próprio cliente).
- ❌ Faturas de venda, recibos, pagamentos, reconciliação bancária.
- ❌ Outros idiomas além de português; moedas além de EUR na interface.
- ❌ Painéis de estatísticas e relatórios além do Excel.
- ⏭️ **Depois do v1 (Fase 12):** contas da equipa (10 pessoas), com cada pessoa a ver só os clientes que lhe estão atribuídos. A base de dados fica preparada desde já.

---

## 3. Stack recomendada

| Peça | Escolha | Porquê |
|---|---|---|
| Aplicação | **Next.js (App Router) + TypeScript** | Uma só base de código para as páginas e para a lógica do servidor. É das stacks que o Claude Code conhece melhor. |
| Estilo | **Tailwind CSS** | Rápido para fazer ecrãs bons no telemóvel, sem ficheiros CSS à parte. |
| Base de dados, login e ficheiros | **Supabase** (plano gratuito, **região UE**) | Junta a base de dados (Postgres), o login (convites por email) e o armazenamento de fotos num só serviço. As regras de segurança (RLS) garantem que cada cliente só vê as faturas da sua empresa. |
| Alojamento | **Netlify** (plano gratuito) | Permite **uso comercial** no plano gratuito, ao contrário do Vercel Hobby. Limite: 300 créditos/mês, e cada publicação em produção gasta 15. Por isso **só se publica em produção no fim de cada fase** (ver CLAUDE.md). |
| Tarefa diária | **Supabase Cron** | Chama o endereço `/api/cron/diario` 1× por dia para repetir as associações, mover para "sem correspondência" e apagar ficheiros antigos. Também mantém o projeto Supabase gratuito ativo. |
| Emails | **Resend** (grátis até 3000/mês) | Envia os convites (ligado ao login do Supabase) e os avisos de "pedido do escritório", a partir de `@pluscontas.com`. |
| Leitura de QR | **zxing-wasm** (ou `jsQR`) no browser + **pdf.js** para PDFs | Grátis e sem enviar nada para fora. Corre no telemóvel do cliente. |
| Compressão de fotos | **browser-image-compression** | Reduz cada foto para cerca de 300 KB antes do envio. Poupa espaço e dados móveis. |
| IA | **API do Claude — Claude Haiku 4.5** | Barata (< 1 cêntimo/fatura) e lê imagens. Por omissão, os dados da API não são usados para treino. Limite de gasto de 5 €/mês definido na Anthropic Console. |
| Excel | **exceljs** | Gera `.xlsx` no servidor. |
| Testes | **Vitest** | Testa as partes lógicas (ler o QR, motor de sugestões, cifra) sem abrir o browser. |
| Código | **GitHub** (conta já existente) | Histórico de alterações. A Netlify publica a partir daqui. |

**Custo mensal estimado no v1 (1 cliente, cerca de 100 faturas/mês):** Supabase 0 € + Netlify 0 € + Resend 0 € + IA ≤ 5 € + domínio (já pago) = **≤ 5 €/mês**.

---

## 4. Modelo de dados (em linguagem simples)

Nomes das tabelas em inglês no código; em português entre parênteses.

- **profiles (pessoas)**: cada pessoa com login. Tem `role`: `admin` (Berta), `staff` (equipa, Fase 12) ou `client` (cliente). Liga-se ao utilizador do Supabase Auth.
- **companies (empresas)**: cada empresa cliente. Nome, NIF, ativa sim/não, e os dados de ligação ao TOConline: `client_id`, `client_secret`, `oauth_url`, `api_url`, `access_token`, `refresh_token`, `token_expires_at`. **Os segredos e os tokens são guardados cifrados.**
- **company_members (membros da empresa)**: liga pessoas-cliente a empresas. Uma pessoa pode ter várias empresas e uma empresa várias pessoas.
- **staff_assignments (atribuições)**: liga pessoas da equipa a empresas. **Criada já, usada só na Fase 12.**
- **invoices (faturas)**: cada fatura enviada.
  - Quem enviou, empresa, **nota do cliente**, data de envio.
  - Dados lidos (do QR, da IA ou manuais) e de onde vieram (`data_source`): NIF fornecedor, nome fornecedor, NIF adquirente, tipo de documento, nº documento, ATCUD, data, total, IVA total, detalhe de IVA por taxa (JSON).
  - **Associação**: `match_status` (`pending` = por associar, `matched` = associada, `no_match` = sem correspondência), `toconline_document_id`, nº de tentativas, data da última tentativa.
  - **Sugestão**: categoria sugerida, % IVA dedutível sugerido, fonte (`rule` / `history` / `ai`) e justificação curta.
  - **Classificação final**: categoria, conta (nº contabilístico), % IVA dedutível, aprovado por, aprovado em, "foi corrigida?" sim/não.
  - **Revisão**: `review_status` (`new`, `in_review`, `returned`, `answered`, `approved`, `exported`).
  - **Arquivo**: arquivado no TOConline sim/não, data em que os ficheiros serão apagados.
- **invoice_files (páginas/ficheiros)**: as fotos ou o PDF de cada fatura, com a ordem das páginas e o caminho no armazenamento privado.
- **messages (mensagens)**: conversa escritório ↔ cliente sobre uma fatura (texto e, opcionalmente, um ficheiro).
- **expense_categories (categorias de despesa)**: cópia, por empresa, das categorias de despesa do TOConline (id, nome, nº de conta). É atualizada a partir da API.
- **rules (regras)**: por empresa. Condição (`supplier_nif` = NIF do fornecedor, **ou** `keyword` = palavra na nota/descrição) → categoria + % IVA dedutível. Tem prioridade.
- **exports (exportações)**: registo de cada Excel gerado (empresa, período, quem, quando, faturas incluídas).

**Estados vistos pelo cliente** (tradução de `review_status`):
- `new` → **Enviada**
- `in_review` / `answered` → **Em análise**
- `returned` → **Pedido do escritório**
- `approved` / `exported` → **Tratada**

**Colunas do Excel:** Data · NIF fornecedor · Fornecedor · Nº documento · Total · IVA · Categoria / conta · % IVA dedutível · Nota do cliente · Link para a fatura na aplicação (exige login).

### O código QR português (Portaria n.º 195/2020)
Campos separados por `*`, cada um no formato `CÓDIGO:valor`. Os mais usados:
- `A` NIF do emitente (fornecedor)
- `B` NIF do adquirente (deve ser o da empresa)
- `D` tipo de documento
- `F` data (AAAAMMDD)
- `G` identificação única do documento
- `H` ATCUD
- `I2`–`I8` bases e IVA por taxa (isento, reduzida, intermédia, normal)
- `N` total de IVA
- `O` total com impostos

---

## 5. Requisitos essenciais de qualidade

### Contas e segurança
- Nenhum registo livre. Só a administradora cria contas (convite por email do Supabase Auth).
- **Segredos só no `.env.local`** (ignorado pelo Git) e nas variáveis de ambiente da Netlify/Supabase. Nunca no código, nunca no Git.
- A chave de serviço do Supabase (`SUPABASE_SERVICE_ROLE_KEY`) e a chave da IA só são usadas **no servidor**. Nunca em código que corre no browser.
- **RLS (Row Level Security) ativo em todas as tabelas:**
  - o cliente só lê e escreve faturas das empresas a que pertence;
  - só o `admin` vê tudo;
  - na Fase 12, a equipa só vê as empresas atribuídas.
- Credenciais e tokens do TOConline **cifrados** (AES-256-GCM) com `ENCRYPTION_KEY`.
- Armazenamento de ficheiros **privado**. Os ficheiros são mostrados com links temporários (5 minutos).
- O endereço `/api/cron/diario` só aceita pedidos com o `CRON_SECRET` certo.

### Privacidade (RGPD)
- Supabase em **região da UE**.
- Ficheiros apagados **12 meses** após o envio, e só se já estiverem arquivados no TOConline.
- Texto curto de privacidade na aplicação, que menciona:
  - que dados se guardam;
  - durante quanto tempo;
  - que as imagens são analisadas pela IA da Anthropic (sem uso para treino);
  - que os emails são enviados via Resend.
- Os logs nunca mostram tokens, NIFs completos nem conteúdo das faturas.

### Telemóvel
- Pensado primeiro para ecrã de telemóvel (a partir de 360 px de largura). Botões grandes.
- Dois botões separados:
  - **"Tirar foto"**: abre a câmara traseira diretamente;
  - **"Escolher ficheiro"**: escolhe PDF ou fotos da galeria.
- Funciona com "Adicionar ao ecrã inicial" (manifest + ícone).

### Rapidez
- As fotos são comprimidas no telemóvel antes do envio (cerca de 300 KB por página).
- Enviar uma fatura de 1 página com 4G normal: **menos de 5 segundos**.
- A leitura do QR, a associação e a IA acontecem **depois** do envio. O cliente não fica à espera.

---

## 6–7. Fases e tarefas

**Ritmo esperado:** com 2–5 h/semana, cada fase leva cerca de 1–2 semanas. O v1 completo (Fases 0–11) leva cerca de **3 a 5 meses**. **A aplicação já é útil a partir do fim da Fase 1.**

Cada tarefa: fazer → testar como indicado → commit → marcar `[x]`.

---

### Fase 0 — Preparar tudo (sem código da aplicação)

- [x] **0.1** Criar o repositório privado `pluscontas-faturas` no GitHub e colocar `PLAN.md` e `CLAUDE.md` na raiz.
  *Confirmar:* os dois ficheiros aparecem no GitHub.
- [x] **0.2** Criar o projeto Next.js + TypeScript + Tailwind + ESLint + Vitest, com `.gitignore` a incluir `.env*` (exceto `.env.example`), e criar o `.env.example` só com nomes de variáveis.
  *Confirmar:* `npm run dev` mostra uma página "Plus Contas — Faturas" em `localhost:3000`; `npm test` corre (0 testes, sem erros); `git status` não mostra nenhum `.env.local`.
- [x] **0.3** Criar o projeto Supabase (plano gratuito, **região UE**) e pôr as chaves no `.env.local`.
  *Confirmar:* uma página de teste consegue ler da base de dados sem erro.
- [x] **0.4** Ligar o repositório à Netlify. Produção = ramo `main`. Pôr as variáveis de ambiente na Netlify.
  *Confirmar:* o endereço `…netlify.app` mostra a página no telemóvel.
- [ ] **0.5** Resend: criar conta e verificar o domínio `pluscontas.com` (registos DNS no sítio onde o domínio foi comprado; o Claude Code dá as linhas exatas). Configurar o **SMTP personalizado** do Supabase Auth com o Resend. Remetente: `faturas@pluscontas.com`.
  *Confirmar:* o Resend mostra o domínio como "Verified", e um email de teste chega à caixa de entrada (não ao spam).
- [ ] **0.6** Anthropic Console: criar conta de API, pôr **limite de gasto de 5 €/mês** e guardar a chave no `.env.local` e na Netlify.
  *Confirmar:* o limite aparece nas definições de faturação da Console.

---

### Fase 1 — Versão mínima publicável: enviar e ver faturas
*No fim desta fase o cliente de teste já pode deixar de usar o email e o WhatsApp.*

- [ ] **1.1** Criar as tabelas `profiles`, `companies`, `company_members`, `staff_assignments`, `invoices`, `invoice_files`, com migrações na pasta `supabase/migrations`. Por agora só os campos básicos da fatura: empresa, quem enviou, nota, data, `review_status`.
  *Confirmar:* as tabelas aparecem no painel do Supabase.
- [ ] **1.2** Ativar o RLS e escrever as regras de acesso (o cliente só vê as suas empresas, o admin vê tudo). Escrever um teste que confirma que o cliente A **não** vê as faturas da empresa B.
  *Confirmar:* o teste passa.
- [ ] **1.3** Criar a conta de admin da Berta (manualmente no Supabase + `role = admin`) e o ecrã de **login** (email + palavra-passe, sessão persistente).
  *Confirmar:* a Berta entra no telemóvel, fecha o browser, volta a abrir, e continua com sessão iniciada.
- [ ] **1.4** Ecrã **Admin › Empresas**: criar e editar empresas (nome, NIF).
  *Confirmar:* criar a empresa do cliente de teste.
- [ ] **1.5** Ecrã **Admin › Pessoas**: convidar uma pessoa por email e ligá-la a uma ou mais empresas. Criar a página **"Definir palavra-passe"** para onde o convite leva.
  *Confirmar:* convidar um email teu → chega o convite → defines a palavra-passe → entras e vês o ecrã de cliente.
- [ ] **1.6** Ecrã do cliente **Enviar fatura**:
  - escolher a empresa (só aparece se tiver mais do que uma);
  - botões "Tirar foto" (várias páginas, com pré-visualização e possibilidade de remover uma) e "Escolher ficheiro" (PDF ou imagens);
  - nota obrigatória com mínimo de 3 palavras;
  - compressão das fotos antes do envio;
  - envio para o armazenamento privado.
  *Confirmar:* no telemóvel, enviar uma fatura de 2 páginas e um PDF; ambos aparecem no Supabase (1 fatura com 2 ficheiros, e 1 fatura com 1 PDF). Tentar enviar sem nota mostra um erro claro.
- [ ] **1.7** Ecrã do cliente **As minhas faturas**: todas as faturas da(s) empresa(s), com data, nota, quem enviou e o estado, em português. Botão **Apagar** só enquanto o estado for "Enviada".
  *Confirmar:* uma segunda pessoa da mesma empresa vê as faturas da primeira; uma pessoa de outra empresa não vê.
- [ ] **1.8** Ecrã **Admin › Faturas**: lista de todas as faturas (filtro por empresa e estado); ao abrir uma, mostra as páginas (link temporário) e a nota; botão provisório **"Marcar como tratada"**.
  *Confirmar:* a Berta vê a fatura enviada no 1.6, abre as fotos e marca-a como tratada; o cliente passa a ver "Tratada".
- [ ] **1.9** Manifest + ícone para "Adicionar ao ecrã inicial", e texto curto de privacidade.
  *Confirmar:* em Android e em iPhone, o ícone fica no ecrã inicial e abre a aplicação sem a barra do browser.
- [ ] **1.10** Publicar em produção (juntar `dev` → `main`) e convidar o cliente de teste.
  *Confirmar:* o cliente de teste envia uma fatura real.

---

### Fase 2 — Ler o código QR

- [ ] **2.1** Função `parseQrPT(texto)` que transforma o texto do QR nos campos da secção 4. Incluir testes Vitest com pelo menos 3 exemplos reais de faturas (anonimizados).
  *Confirmar:* `npm test` passa.
- [ ] **2.2** No ecrã de envio, ler o QR de cada foto e da 1.ª e da última página do PDF, no browser. Guardar o texto do QR juntamente com a fatura.
  *Confirmar:* enviar 5 faturas reais; no Supabase, ≥ 4 têm os campos preenchidos (`data_source = qr`).
- [ ] **2.3** Avisos ao cliente, antes de enviar:
  - o **NIF do adquirente** (campo B) é diferente do NIF da empresa → "Esta fatura não está em nome da empresa X. Enviar mesmo assim?";
  - já existe fatura com o mesmo ATCUD/identificação na empresa → "Esta fatura já foi enviada".
  *Confirmar:* testar com uma fatura em nome de consumidor final e com uma repetida.
- [ ] **2.4** O ecrã de admin mostra fornecedor, data, nº, total e IVA lidos do QR.
  *Confirmar:* os valores batem certo com o papel em 5 faturas.

---

### Fase 3 — Ligar ao TOConline (só leitura)

> ⚠️ Nesta fase **só se fazem pedidos de leitura (GET)**. Nunca criar documentos na empresa real.

- [ ] **3.1** Função de cifra/decifra (`lib/crypto.ts`, AES-256-GCM), com testes.
  *Confirmar:* `npm test` passa, e decifrar o que se cifrou devolve o original.
- [ ] **3.2** Em **Admin › Empresa**: campos para colar `client_id`, `client_secret`, `oauth_url` e `api_url` (obtidos em TOConline › Empresa › Configurações › Dados API, com perfil de Empresário) e botão **"Ligar ao TOConline"**. Esse botão faz o fluxo OAuth (redireciona → `/api/toconline/callback` → troca o código por tokens → guarda-os cifrados). A renovação automática do token (válido 4 h) usa o `refresh_token`.
  *Confirmar:* a empresa de teste mostra "Ligada ✅". Passadas mais de 4 horas, um pedido continua a funcionar.
- [ ] **3.3** Botão **"Atualizar categorias"**: lê `GET /expense_categories` e guarda-as em `expense_categories`.
  *Confirmar:* a lista de categorias aparece e bate certo com o TOConline.
- [ ] **3.4** **Teste exploratório (muito importante):** página de admin só de diagnóstico que lista os documentos de compra de um mês (`GET /api/v1/commercial_purchases_documents`). Registar em `docs/toconline-notas.md`:
  - que filtros funcionam;
  - que campos vêm (NIF fornecedor? nº do documento? ATCUD? total? data?);
  - se as compras importadas do e-Fatura aparecem aqui.
  *Confirmar:* a Berta reconhece na lista as compras que vê em Compras › Faturas › e-Fatura.
- [ ] **3.5** Com base no 3.4, decidir (e registar no mesmo ficheiro) a **regra de associação**. Prioridade: NIF fornecedor + nº documento; senão NIF fornecedor + data + total.
  *Confirmar:* a regra encontra à mão, no diagnóstico, 5 faturas reais.

---

### Fase 4 — Associação automática e tarefa diária

- [ ] **4.1** Depois de cada envio com QR, procurar a compra no TOConline. Se encontrar → `matched` e guardar o id; se não → `pending`.
  *Confirmar:* uma fatura já importada fica "associada" em menos de 1 minuto.
- [ ] **4.2** Endereço `/api/cron/diario` (protegido por `CRON_SECRET`) que volta a procurar as `pending` e passa a `no_match` as que têm **mais de 15 dias**. Agendar no Supabase Cron para as 06:00.
  *Confirmar:* chamar o endereço à mão → as pendentes são reprocessadas; uma fatura de teste com a data de envio alterada para há 16 dias passa a "sem correspondência".
- [ ] **4.3** Ecrã **Admin › Sem correspondência**: lista com os dados lidos, a foto, e um botão para escrever/corrigir os dados à mão e para "Associar manualmente" (colar o id do TOConline) ou "Resolvido fora da aplicação".
  *Confirmar:* resolver uma fatura desta lista.

---

### Fase 5 — Revisão a sério + sugestões pelo histórico

- [ ] **5.1** Novo ecrã de revisão: foto grande + dados + nota + campo **Categoria** (só as categorias da empresa) + **% IVA dedutível** (0, 25, 50, 100 ou outro valor). Botões **Aprovar** e **Corrigir e aprovar**. Retirar o botão provisório "Marcar como tratada". Fila ordenada da mais antiga para a mais recente, e botão "Seguinte" depois de aprovar.
  *Confirmar:* aprovar 10 faturas seguidas; medir o tempo por fatura (objetivo: < 30 s).
- [ ] **5.2** Motor de sugestões v1 (`lib/suggestions/engine.ts`): se já houve uma aprovação da **mesma empresa + mesmo NIF de fornecedor**, sugerir a última classificação aprovada (fonte `history`). Testes Vitest.
  *Confirmar:* aprovar uma fatura do fornecedor X; a próxima do mesmo fornecedor chega com a sugestão preenchida e o selo "Histórico".
- [ ] **5.3** Registar se cada aprovação foi feita **com ou sem correção** (para o critério de sucesso nº 3).
  *Confirmar:* aparece no ecrã de admin a contagem do mês: "X aprovadas sem correção / Y total".

---

### Fase 6 — Regras por empresa

- [ ] **6.1** Tabela `rules` + ecrã **Admin › Empresa › Regras**: criar, editar e apagar regras. Condição (NIF fornecedor **ou** palavra-chave) → categoria + % IVA.
  *Confirmar:* criar a regra "palavra 'gasóleo' → categoria Combustíveis, 50%".
- [ ] **6.2** O motor de sugestões passa a seguir a ordem **regra → histórico** (a IA entra na Fase 7). Testes para a prioridade.
  *Confirmar:* uma fatura com nota "gasóleo da carrinha" chega com a sugestão da regra (selo "Regra"), mesmo que o histórico diga outra coisa.
- [ ] **6.3** No ecrã de revisão, botão **"Criar regra a partir desta"**, que preenche o formulário de regra com os dados da fatura.
  *Confirmar:* criar uma regra em 2 cliques a partir de uma fatura.

---

### Fase 7 — IA (Claude Haiku)

- [ ] **7.1** `lib/suggestions/ai.ts`: envia à IA a(s) imagem(ns), a nota do cliente, os dados do QR (se houver) e a **lista de categorias da empresa**. Recebe uma resposta **JSON validada**:
  - dados da fatura (se não houver QR);
  - descrição curta do que foi comprado;
  - `category_id` (tem de ser um da lista);
  - % IVA dedutível;
  - justificação numa frase;
  - confiança (alta/média/baixa).
  Usar o modelo `claude-haiku-4-5`. Se a IA falhar ou o limite for atingido, a fatura fica sem sugestão e isso **não bloqueia nada**.
  *Confirmar:* testar com 5 faturas reais (2 sem QR); ver as sugestões e a justificação.
- [ ] **7.2** Ordem final do motor: **regra → histórico → IA**. A IA **só é chamada** quando não há regra nem histórico.
  *Confirmar:* uma fatura de um fornecedor com histórico **não** gera pedido à IA (ver os logs).
- [ ] **7.3** Faturas sem QR: os dados lidos pela IA ficam marcados `data_source = ai`, com o selo "Lido por IA — confirmar", e seguem para a associação normal.
  *Confirmar:* uma fatura sem QR aparece com fornecedor e total preenchidos.
- [ ] **7.4** Contador simples no admin: pedidos à IA este mês e custo estimado.
  *Confirmar:* o número bate aproximadamente com a Anthropic Console.

---

### Fase 8 — Devolver ao cliente

- [ ] **8.1** Tabela `messages`. No ecrã de revisão, botão **"Devolver ao cliente"** com mensagem → estado `returned` → email ao(s) membro(s) da empresa, pelo Resend, com link para a fatura.
  *Confirmar:* o cliente de teste recebe o email e vê "Pedido do escritório".
- [ ] **8.2** Ecrã do cliente **Responder**: texto e/ou nova foto → estado `answered` → a fatura volta à fila de revisão, marcada como "Respondida".
  *Confirmar:* ciclo completo: devolver → responder → aprovar.

---

### Fase 9 — Exportação Excel

- [ ] **9.1** Ecrã **Admin › Exportar**: escolher empresa + período → gera o `.xlsx` com as colunas da secção 4, só com faturas `approved`. Depois de gerado, passam a `exported`, e fica registado em `exports`.
  *Confirmar:* abrir o Excel e confirmar 5 linhas contra o ecrã; exportar de novo o mesmo período não repete as faturas já exportadas.
- [ ] **9.2** Opção "Voltar a gerar uma exportação anterior" (a partir do registo), para quando o ficheiro se perde.
  *Confirmar:* o ficheiro gerado de novo é igual ao original.

---

### Fase 10 — Arquivo no TOConline e limpeza

- [ ] **10.1** **Teste controlado** do anexo de ficheiros pela API: anexar **1** PDF de teste a **1** compra já existente da empresa de teste. Registar o resultado em `docs/toconline-notas.md`.
  *Confirmar:* a Berta vê o anexo no TOConline.
- [ ] **10.2a** Se o 10.1 funcionar: ao aprovar, a aplicação junta as páginas num PDF (`pdf-lib`), anexa-o à compra associada e marca `archived = true`.
  *Confirmar:* 5 faturas aprovadas aparecem anexadas no TOConline.
- [ ] **10.2b** Se o 10.1 não funcionar: botão **"Descarregar PDF"** + caixa **"Arquivado no TOConline"** que a Berta marca à mão.
  *Confirmar:* marcar e ver o estado a mudar.
- [ ] **10.3** Na tarefa diária: apagar os ficheiros de faturas com **mais de 12 meses** **e** `archived = true`. Os dados da fatura ficam e os ficheiros saem. As faturas com mais de 12 meses não arquivadas aparecem num aviso ao admin.
  *Confirmar:* com uma fatura de teste com a data alterada, o ficheiro é apagado e a fatura continua na lista, com "Ficheiro arquivado no TOConline".

---

### Fase 11 — Endereço próprio

- [ ] **11.1** Ligar `faturas.pluscontas.com` à Netlify (registo DNS) e atualizar `APP_URL`, os endereços de retorno do Supabase Auth e o redirect do TOConline.
  *Confirmar:* entrar, enviar e receber um convite, tudo pelo novo endereço, com o cadeado HTTPS.
- [ ] **11.2** Revisão final dos critérios de sucesso durante 1 mês com o cliente de teste.
  *Confirmar:* os 5 critérios da secção 1 estão cumpridos → **v1 concluído**.

---

### Fase 12 — Depois do v1: equipa (10 pessoas)

- [ ] **12.1** Convidar pessoas com `role = staff`. Ecrã **Admin › Atribuições** para ligar cada pessoa às suas empresas.
- [ ] **12.2** Ajustar o RLS: `staff` só vê faturas das empresas atribuídas. Teste automático para isso.
- [ ] **12.3** Filtro "As minhas empresas" na fila de revisão.
  *Confirmar:* uma pessoa da equipa só vê as empresas atribuídas; a Berta continua a ver tudo.

---

## 8. Riscos e decisões em aberto

### Riscos
| Risco | Impacto | O que fazer |
|---|---|---|
| A API do TOConline não devolve (ou não deixa filtrar) as compras importadas do e-Fatura | A associação automática não funciona | É descoberto cedo, na **tarefa 3.4**. Plano B: associação manual assistida (a aplicação sugere candidatos por NIF + total). |
| A API pública não tem parte de contabilidade | A classificação não é escrita no TOConline | Já assumido: Excel + introdução manual. Perguntar ao suporte (ver abaixo). |
| As compras são finalizadas e não se podem alterar pela API | Não é possível pôr a categoria na compra | Já assumido no âmbito. **Nunca** criar documentos de compra pela API. |
| O anexo a documentos finalizados pode não ser permitido | Não há arquivo automático | Tarefa 10.1 decide; alternativa 10.2b. |
| QR ilegível em fotos (pouca luz, papel amarrotado) | Mais faturas sem dados | Dica no ecrã ("aproxime do QR, com boa luz"); a IA lê o resto. |
| Fotos HEIC do iPhone escolhidas da galeria | Falha ao processar | Converter/comprimir no browser; testar num iPhone na tarefa 1.6. |
| Plano gratuito da Netlify: 300 créditos/mês, cerca de 20 publicações em produção | A aplicação fica em pausa até ao mês seguinte | Só publicar em produção no fim de cada fase; se não chegar, plano Personal (9 $/mês). |
| Supabase gratuito pausa após 7 dias sem atividade; 1 GB de ficheiros | Aplicação indisponível ou sem espaço | A tarefa diária mantém-no ativo; 100 faturas/mês × cerca de 300 KB ≈ 0,4 GB/ano. |
| **Alargar aos 300 clientes (cerca de 30 000 faturas/mês)** | IA ≈ 60–120 €/mês, armazenamento ≈ 10 GB/mês, Supabase Pro (25 $) | Rever os custos com números reais antes de alargar. O histórico e as regras reduzem muito os pedidos à IA. Provavelmente implica rever o orçamento. |
| Credenciais do TOConline por empresa (300 ligações) | Configuração pesada | Aceitável para o v1; ao alargar, perguntar ao TOConline se há credenciais de gabinete/integrador. |

### Decisões em aberto (a Berta trata fora do código)
1. **Email ao suporte do TOConline** (pode ser enviado já) com três perguntas:
   - Existe **API de contabilidade** (lançamentos/classificação por conta) ou importação de classificações por ficheiro?
   - As compras importadas do e-Fatura são acessíveis por `commercial_purchases_documents`?
   - É possível **anexar ficheiros a compras já finalizadas** pela API? Existem credenciais únicas para um gabinete com muitas empresas?
2. **Prioridade entre regra e histórico:** o plano põe **regra → histórico → IA** (uma regra escrita de propósito ganha ao histórico). Confirmar.
3. **Onde está registado o domínio** `pluscontas.com` (necessário na tarefa 0.5).
4. **Escolher o cliente de teste** e avisá-lo antes da tarefa 1.10.
5. **Texto de privacidade** para os clientes (a aplicação terá um rascunho; rever com quem trata do RGPD no escritório).
