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

O mesmo SQL cria o bucket privado `sonhos` no Storage, para as fotos do mural. Ele não é público. O portal envia a foto por `POST /api/upload` e mostra por `GET /api/imagem?path=...`, sempre atrás do login. No estado fica só o caminho (`S.sonhos`). Sem Supabase, as fotos ficam em `data/sonhos/` na máquina local. Na Vercel isso não persiste: o bucket é necessário.

Sem essas variáveis, o portal grava em `data/portal-state.json` na máquina do servidor. Isso basta para usar no computador. Na Vercel o arquivo não fica guardado entre deploys, então o Supabase passa a ser necessário.

## 3. Claude API

1. Em console.anthropic.com, crie uma API key → `ANTHROPIC_API_KEY`.
2. Adicione créditos. Cada pergunta ao assistente custa centavos; o botão de notícias custa um pouco mais por usar busca na internet.
3. `ANTHROPIC_MODEL` já vem preenchido. Se quiser trocar, veja os modelos disponíveis na documentação da API.

## 4. brapi.dev (cotações)

Crie uma conta, copie o token → `BRAPI_TOKEN`. O portal busca BOVA11, os FIIs e IVVB11. O Tesouro IPCA+ continua manual (aba Mercado).

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
  api/quotes          → cotações (brapi.dev)
  api/checkin-voz     → organiza o relato falado do check-in
  api/upload|imagem   → fotos privadas do mural dos sonhos
lib/session.ts        → assinatura do cookie
lib/supabase.ts       → cliente do banco (só servidor)
middleware.ts         → exige login em tudo
public/portal.js      → o portal (JavaScript puro)
public/portal.css     → visual
supabase/schema.sql   → tabela do banco
```
