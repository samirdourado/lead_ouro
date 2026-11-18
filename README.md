# Lead Ouro

CRM de prospecção da **Dourado Comunicação**. Busca empresas no Google Meu Negócio, organiza os resultados, mostra o que cada empresa já tem na internet e permite chamar o contato no WhatsApp com uma mensagem pronta.

> **Projeto feito 100% por vibecoding.** Todo o código foi escrito em conversa com um assistente de IA (Claude Code), a partir das descrições do dono do projeto, sem programação manual tradicional. Por isso, revise com cuidado antes de expor dados reais em produção.

## Para que serve

A prospecção de clientes locais (advogados, restaurantes, clínicas etc.) exige muito trabalho manual: buscar as empresas, abrir cada perfil, verificar se elas têm site, copiar o número, abrir o WhatsApp e colar a mensagem com o nome do estabelecimento.

O Lead Ouro faz esse trabalho:

1. Busca as empresas por **categoria + cidade** diretamente no Google Maps, usando o ator do Apify.
2. Classifica o campo de site de cada empresa: **sem site**, **só rede social**, **link de WhatsApp**, **página de links**, **site gratuito** (Wix, Lovable, Google Sites etc.) ou **domínio próprio**.
3. Monta uma **mensagem pronta** para cada lead, de acordo com o tipo de site, com o nome do estabelecimento. A mensagem pode ser editada e salva no próprio lead.
4. Abre o WhatsApp do lead com a mensagem preenchida. **Você só aperta enviar.**
5. Registra o status de cada lead (novo, contatado, respondeu, fechado, descartado, negado) para não repetir abordagem.

O envio é sempre manual de propósito: a API oficial do WhatsApp exige templates aprovados e tem custo, e automações não oficiais podem bloquear o número.

## Como funciona

```
Login (senha + código do app, ou Google)
        │
        ▼
Busca (categoria + cidade) ──► Apify (compass/crawler-google-places)  lib/search/apify.ts
        │
        ▼
Normalização: telefone → wa.me, nome, URL              lib/normalize.ts
Classificação do site                                  lib/website-classifier.ts
        │
        ▼
Banco: Turso (online) ou arquivo local data/           lib/db.ts, lib/leads.ts
        │
        ▼
Telas: lista com filtros → perfil → WhatsApp           app/
```

### Classificação do site

| Tipo | Exemplo | Abordagem sugerida |
|---|---|---|
| Sem site | campo vazio | oferecer criação de site |
| Só rede social | instagram.com, facebook.com | oferecer site próprio |
| Link de WhatsApp | wa.me, api.whatsapp.com | oferecer site próprio |
| Página de links | linktr.ee, keepo.bio | oferecer site próprio |
| Site gratuito | *.wixsite.com, *.lovable.app, *.netlify.app | oferecer site com domínio profissional |
| Domínio próprio | advogadoexemplo.com.br | oferecer otimização do Google Meu Negócio |

Os domínios reconhecidos ficam em `lib/website-classifier.ts`. Domínios incomuns aparecem marcados como "verificar site".

### Mensagens

Cada tipo de site tem um modelo em `lib/messages.ts`. Na página do lead, o botão **Editar mensagem** permite alterar o texto. **Restaurar mensagem padrão** volta ao modelo.

### Status

- **novo**: ainda não foi contatado (padrão da lista)
- **contatado**: primeira mensagem enviada
- **respondeu**: o lead respondeu
- **fechado**: virou cliente
- **descartado**: sem interesse ou fora do perfil
- **negado**: não quer os serviços

## Acesso e segurança

- **Acesso restrito.** Só os e-mails listados em `ALLOWED_EMAILS` conseguem entrar ou se cadastrar.
- **Login com senha + 2 fatores.** Senha (mínimo 10 caracteres, guardada com scrypt) e código de 6 dígitos de um app autenticador (Google Authenticator, Microsoft Authenticator etc.), configurado no cadastro via QR code.
- **Login com Google** (opcional), se as credenciais OAuth estiverem configuradas.
- **Sessão de 90 dias.** O cookie persiste mesmo fechando o navegador e é renovado a cada uso.
- **Rotas protegidas.** Todas as páginas e a API exigem login (`proxy.ts`). Sem sessão, páginas redirecionam para `/login` e a API responde 401.

## Como rodar localmente

Pré-requisitos: **Node.js 22.15 ou superior** (testado com Node 24) e uma conta no [Apify](https://apify.com).

```bash
# 1. Instalar dependências
npm install

# 2. Criar o arquivo de configuração e preencher (ver tabela abaixo)
cp .env.example .env.local     # no Windows: copy .env.example .env.local

# 3. Subir o servidor de desenvolvimento
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000). No primeiro acesso, crie a conta em `/cadastro`.

### Variáveis de ambiente (`.env.local`)

| Variável | Para que serve |
|---|---|
| `APIFY_TOKEN` | Token da conta Apify (Settings → Integrations). Necessário para buscar. |
| `SENDER_NAME` | Seu nome na mensagem ("Aqui é ___, da Dourado Comunicação"). Sem ele, usa "a equipe". |
| `PORTFOLIO_URL` | Link do portfólio, no fim da mensagem. Se vazio, a mensagem sai sem link. |
| `TURSO_DATABASE_URL` | URL do banco no Turso. Se vazio, usa o arquivo local `data/lead_ouro.db`. |
| `TURSO_AUTH_TOKEN` | Token de acesso ao banco Turso. |
| `AUTH_SECRET` | Segredo de assinatura das sessões. Gere com `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`. |
| `AUTH_TRUST_HOST` | Use `true`. |
| `ALLOWED_EMAILS` | E-mails autorizados a entrar, separados por vírgula. |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | Credenciais OAuth do Google (opcional). |

**Nunca** commite o `.env.local`. Ele contém tokens e segredos, e o `.gitignore` já impede isso.

### Configurando o login com Google (opcional)

1. No [Google Cloud Console](https://console.cloud.google.com), crie um projeto.
2. Configure a tela de consentimento OAuth: público **Externo** e seu e-mail em **Usuários de teste**.
3. Em **Credenciais → Criar credenciais → ID do cliente OAuth**, tipo **Aplicativo da Web**, adicione as URIs de redirecionamento:
   - `http://localhost:3000/api/auth/callback/google` (desenvolvimento)
   - `https://SEU-PROJETO.vercel.app/api/auth/callback/google` (produção, quando publicar)
4. Copie o ID e a chave secreta para `AUTH_GOOGLE_ID` e `AUTH_GOOGLE_SECRET`.

### Observação sobre certificados (Windows)

Em redes com antivírus ou proxy corporativo, a conexão com o Apify pode falhar com `self-signed certificate in certificate chain`. Por isso o `npm run dev` usa `--use-system-ca`, que faz o Node usar os certificados do Windows. Não desligue a verificação de TLS.

## Uso

1. **Buscar**: na aba *Buscar*, informe categoria (ex.: `advogado`), cidade (ex.: `São Paulo SP`) e quantidade. Cada resultado tem custo no Apify (cerca de US$ 1,50 por 1.000 lugares). Repetir a busca atualiza os leads existentes sem duplicar.
2. **Filtrar**: a lista mostra por padrão só os leads **novos**, em ordem alfabética. Filtre por categoria, cidade, status, tipo de site ou nome.
3. **Contatar**: abra o perfil, confira a mensagem e clique em *Chamar no WhatsApp*. Use *Copiar mensagem* se preferir.
4. **Acompanhar**: troque o status no perfil. A faixa colorida na lateral do card mostra o status.

## Estrutura

```
app/
  page.tsx                    lista de leads com filtros
  search/                     tela de busca
  leads/[id]/                 perfil, mensagem e status
  login/                      tela de login (senha + código, Google)
  cadastro/                   cadastro e configuração do 2FA
  api/search/                 busca no Apify e gravação
  api/leads/[id]/             status e mensagem do lead
  api/leads/[id]/contact/     registro de contato (abriu / copiou)
  api/auth/[...nextauth]/     rotas do Auth.js
auth.ts                       configuração de login e sessão
proxy.ts                      proteção de rotas (exige login)
lib/
  auth/                       senha (scrypt), TOTP, lista de permitidos, usuários
  search/                     provedor de busca (Apify) e interface
  db.ts                       conexão com Turso ou arquivo local (libSQL)
  leads.ts                    regras de leads: importação, filtros, mensagens
  messages.ts                 modelos de mensagem por tipo de site
  website-classifier.ts       classificação do campo de site
  normalize.ts                telefone (wa.me), nomes
data/                         banco local (não versionado)
```

## Dados e privacidade

Os leads são dados pessoais de empresas e de seus responsáveis:

- Os dados ficam no Turso (ou no arquivo local `data/`), **nunca no repositório**.
- O `.gitignore` bloqueia `.env*` (exceto `.env.example`), bancos, CSVs, planilhas e logs.
- Antes de cada commit, confira com `git status` que nenhum arquivo de dados está na lista.

## Publicação (Vercel)

Configure no painel da Vercel as mesmas variáveis do `.env.local`, com `AUTH_GOOGLE_*` apontando para a URL de produção. Não faça deploy com dados reais antes de testar o login.

## Limitações

- **Custo da busca**: depende do plano do Apify e do número de resultados.
- **Classificação heurística**: domínios incomuns podem ser classificados como domínio próprio. Os casos duvidosos aparecem marcados.
- **Login do Google** não pede o código do app. Ele fica protegido pela segurança da conta Google.
- **Usuário único na prática**: o sistema foi pensado para uma equipe pequena, com o acesso controlado por `ALLOWED_EMAILS`.

## Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | servidor de desenvolvimento em `localhost:3000` |
| `npm run build` | build de produção |
| `npm run start` | roda o build de produção |
| `npm run lint` | verificação de código |
