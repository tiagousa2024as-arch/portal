# Portal Tiago

Portal pessoal: cascata dos sábados, check-in, caixinhas, carteira ARCA, cotações, assistente com IA, negócios e projeção do futuro. Funciona sozinho, com login, banco de dados e deploy na Vercel.

## O que você precisa (tudo tem plano gratuito, exceto o uso da API do Claude)

| Serviço | Para quê | Onde |
|---|---|---|
| **Supabase** | Guardar os dados do portal | supabase.com |
| **Anthropic (Claude API)** | Assistente IA e notícias | console.anthropic.com |
| **brapi.dev** | Cotações da B3 | brapi.dev |
| **Vercel** | Colocar o portal no ar | vercel.com |
| **GitHub** | Guardar o código e ligar na Vercel | github.com |

## 1. Abrir no Cursor e rodar no computador

1. Descompacte a pasta e abra no Cursor (`File > Open Folder`).
2. No terminal do Cursor:
   ```bash
   npm install
   cp .env.example .env.local
   ```
3. Preencha o `.env.local` (passos 2 a 4 abaixo).
4. Rode:
   ```bash
   npm run dev
   ```
5. Abra http://localhost:3000 e entre com a senha do `PORTAL_PASSWORD`.

## 2. Supabase (banco de dados)

1. Crie um projeto em supabase.com.
2. Em **SQL Editor > New query**, cole o conteúdo de `supabase/schema.sql` e execute.
3. Em **Project Settings > API**, copie:
   - `Project URL` → `SUPABASE_URL`
   - `service_role` (secret) → `SUPABASE_SERVICE_ROLE_KEY`

A tabela fica bloqueada para o navegador (RLS ligado, sem políticas). Só o servidor do portal, com a service role, lê e grava.

O mesmo arquivo cria `agent_memory` (id, created_at, kind, text), também com RLS ligado e sem política. O Lastro propõe até 3 lembretes depois de uma conversa; eles só entram quando o Tiago confirma. Em Ajustes, "Memória do Lastro" lista, edita e apaga. Sem Supabase, esses lembretes ficam em `data/agent-memory.json`. Se o banco já existia, rode o SQL de novo: o arquivo usa `create table if not exists`.

O mesmo SQL cria `briefings` (resumo do sábado e relatório do primeiro sábado do mês), com RLS ligado e sem política. Sem Supabase, ficam em `data/briefings.json`. Também cria `push_subscriptions` e `push_envios`, para o aviso no celular. Sem Supabase, ficam em `data/push-subscriptions.json` e `data/push-envios.json`.

O mesmo SQL cria `ai_logs`. Cada linha é um dia de uso do Lastro: origem, nomes das ferramentas, se houve erro, tokens de entrada e de saída. Não guarda pergunta, resposta, saldo nem memória. Em Ajustes, "Uso do Lastro este mês" soma o mês. Sem Supabase, fica em `data/ai-logs.json`. Se o banco já existia, rode `supabase/schema.sql` de novo.

O mesmo SQL cria o bucket privado `sonhos` no Storage, para as fotos do mural. Ele não é público. O portal envia a foto por `POST /api/upload` e mostra por `GET /api/imagem?path=...`, sempre atrás do login. No estado fica só o caminho (`S.sonhos`). Sem Supabase, as fotos ficam em `data/sonhos/` na máquina local. Na Vercel isso não persiste: o bucket é necessário.

Sem essas variáveis, o portal grava em `data/portal-state.json` na máquina do servidor. Isso basta para usar no computador. Na Vercel o arquivo não fica guardado entre deploys, então o Supabase passa a ser necessário.

## 3. Claude API

1. Em console.anthropic.com, crie uma API key → `ANTHROPIC_API_KEY`.
2. Adicione créditos. Cada pergunta ao assistente custa centavos; o botão de notícias custa um pouco mais por usar busca na internet.
3. `ANTHROPIC_MODEL` já vem preenchido. Se quiser trocar, veja os modelos disponíveis na documentação da API.
4. `AI_DAILY_LIMIT` (padrão 40) limita quantas perguntas o Lastro atende por dia neste servidor. `0` tira o teto. O resumo do sábado também conta, quando o cron chama o Lastro.

## 3.1 Cron de sábado

`CRON_SECRET` protege `GET /api/cron/sabado` e `GET /api/cron/avisos`. A Vercel chama o sábado todo sábado às 11:00 UTC (de manhã no fuso de Nova York) e os avisos todo dia às 13:00 UTC. Manda `Authorization: Bearer` com esse segredo. Sem a variável, a rota recusa. O plano do dia sai do código. O Lastro só acrescenta 2 ou 3 frases. No primeiro sábado do mês, o relatório do mês anterior entra na linha do tempo. Cadastre `CRON_SECRET` na Vercel junto com as outras variáveis. O cron só dispara depois do deploy.

Os avisos do celular usam `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` e `VAPID_SUBJECT` (um `mailto:` ou o endereço do portal). Gere o par com `npx web-push generate-vapid-keys`. `AVISOS_TZ` começa em `America/New_York`. Em Ajustes, cada tipo começa desligado: sábado de manhã, segunda se ARCA – a investir tiver dinheiro, conta que vence amanhã, dois sábados sem check-in, checagem trimestral e do ano. No máximo 3 por semana, nunca de noite, e nunca por cotação. No iPhone, o aviso só funciona depois de Adicionar à tela de início.

Variáveis do `.env.example`, todas no servidor:

| Variável | Para quê |
|---|---|
| `PORTAL_PASSWORD` | Senha do portal |
| `SESSION_SECRET` | Assina o cookie |
| `SUPABASE_URL` | Projeto no Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | O servidor lê e grava. Nunca no navegador |
| `ANTHROPIC_API_KEY` | Lastro |
| `ANTHROPIC_MODEL` | Modelo. O exemplo usa `claude-sonnet-5-5` |
| `AI_DAILY_LIMIT` | Teto diário. Padrão 40. `0` tira o teto |
| `CRON_SECRET` | Autoriza os crons |
| `VAPID_PUBLIC_KEY` | Aviso no celular |
| `VAPID_PRIVATE_KEY` | Aviso no celular. Segredo |
| `VAPID_SUBJECT` | Contato do aviso, `mailto:` ou `https://` |
| `AVISOS_TZ` | Fuso dos avisos. Padrão `America/New_York` |
| `BRAPI_API_KEY` | Cotações |

## 3.2 Avaliar o Lastro

`npm run eval` lê `tests/agent-cases.md` e roda cada caso num estado fictício, sem os dados reais. A rubrica está em `lib/agent/behavior.md`. O próprio modelo dá a nota. Busca fora das notícias, dizer que já gravou, sugerir compra ou venda por preço, valor inventado ou dado sensível na memória fazem o comando terminar com erro. Cada caso gasta crédito da API. O resultado não entra em "Uso do Lastro este mês".

## 4. brapi.dev (cotações)

Crie uma conta, copie a chave → `BRAPI_API_KEY`. Ela fica só no servidor. O portal busca BOVA11, os FIIs e IVVB11 em `/api/v2/stocks/quote`. O Tesouro IPCA+ continua manual (aba Mercado).

## 5. Deploy na Vercel

1. Crie um repositório **privado** no GitHub e suba o código:
   ```bash
   git init
   git add .
   git commit -m "Portal Tiago"
   git branch -M main
   git remote add origin https://github.com/SEU-USUARIO/portal-tiago.git
   git push -u origin main
   ```
2. Em vercel.com: **Add New > Project > Import** o repositório.
3. Em **Environment Variables**, cadastre todas as variáveis do `.env.example` com os valores reais.
4. **Deploy**. Pronto: você recebe um link `https://portal-tiago.vercel.app` (ou parecido).

### Usar o seu domínio (opcional)

Na Vercel, **Settings > Domains**, adicione `portal.tiagowaraha.com.br` e crie no seu DNS o registro CNAME que a Vercel mostrar.

## 6. Instalar como app no celular

Abra o link no navegador do celular e use **Adicionar à tela de início**. Ele abre em tela cheia, como um app.

## Segurança

- Nunca suba o `.env.local` para o GitHub (já está no `.gitignore`).
- Use uma senha forte no `PORTAL_PASSWORD` e um `SESSION_SECRET` longo e aleatório.
- Para gerar um segredo: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.
- Baixe um backup de vez em quando na aba **Ajustes**.

## Estrutura

```
app/
  page.tsx            → carrega o portal
  login/page.tsx      → tela de senha
  api/login|logout    → sessão (cookie assinado)
  api/state           → lê e grava os dados no Supabase
  api/ai              → assistente (Claude API, com busca na internet só no botão de notícias)
  api/uso             → contagem do mês, sem texto pessoal
  api/quotes          → cotações (brapi.dev)
  api/checkin-voz     → organiza o relato falado do check-in
  api/upload|imagem   → fotos privadas do mural dos sonhos
lib/session.ts        → assinatura do cookie
lib/supabase.ts       → cliente do banco (só servidor)
middleware.ts         → exige login em tudo
public/portal.js      → o portal (JavaScript puro)
public/portal.css     → visual
lib/agent/behavior.md → rubrica do Lastro
scripts/eval-agent.mjs → avalia os casos. Gasta crédito da API
supabase/schema.sql   → tabelas do banco (estado, memória, resumos, avisos e uso)
```
