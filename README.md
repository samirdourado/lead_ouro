# Lead Ouro

CRM local de prospecção da **Dourado Comunicação**. Busca empresas no Google Meu Negócio, organiza os resultados, mostra o que cada empresa já tem na internet e permite chamar o contato no WhatsApp com uma mensagem pronta.

## Para que serve

A prospecção de clientes locais (advogados, restaurantes, clínicas etc.) exige muito trabalho manual: buscar as empresas, abrir cada perfil, verificar se elas têm site, copiar o número, abrir o WhatsApp e colar a mensagem com o nome do estabelecimento.

O Lead Ouro faz esse trabalho:

1. Busca as empresas por **categoria + cidade** diretamente no Google Maps, usando o ator do Apify.
2. Classifica o campo de site de cada empresa, separando quem **não tem site**, quem usa **só rede social** ou **link de WhatsApp**, quem usa um **site gratuito** (Wix, Lovable, Google Sites etc.) e quem tem **domínio próprio**.
3. Monta uma **mensagem pronta** para cada lead, de acordo com o tipo de site que ele tem, já com o nome do estabelecimento.
4. Abre o WhatsApp do lead com a mensagem preenchida. **Você só aperta enviar.**
5. Registra o status de cada lead (novo, contatado, respondeu, fechado, descartado, negado) para não repetir abordagem.

O objetivo é reduzir o tempo de prospecção de horas para minutos, sem automatizar envios. O envio continua manual de propósito: a API oficial do WhatsApp exige templates aprovados e tem custo, e automações não oficiais podem bloquear o número.

## Como funciona

```
Busca (categoria + cidade)
        │
        ▼
Apify (compass/crawler-google-places) ──► lib/search/apify.ts
        │
        ▼
Normalização: telefone → formato wa.me, nome, URL      lib/normalize.ts
Classificação do site                                   lib/website-classifier.ts
        │
        ▼
SQLite local (data/lead_ouro.db)                        lib/db.ts, lib/leads.ts
        │
        ▼
Telas: lista com filtros → perfil do lead → WhatsApp   app/
```

### Classificação do site

O campo "site" do Google Meu Negócio nem sempre é um site de verdade. A classificação separa os casos pelo domínio:

| Tipo | Exemplo | Abordagem sugerida |
|---|---|---|
| Sem site | campo vazio | oferecer criação de site |
| Só rede social | instagram.com, facebook.com | oferecer site próprio |
| Link de WhatsApp | wa.me, api.whatsapp.com | oferecer site próprio |
| Página de links | linktr.ee, keepo.bio | oferecer site próprio |
| Site gratuito | *.wixsite.com, *.lovable.app, *.netlify.app | oferecer site com domínio profissional |
| Domínio próprio | advogadoexemplo.com.br | oferecer otimização do Google Meu Negócio |

Os domínios reconhecidos ficam em `lib/website-classifier.ts`, em listas fáceis de ampliar. Domínios incomuns vêm marcados como "verificar site".

### Mensagens

Cada tipo de site tem um modelo de mensagem em `lib/messages.ts`. Na página do lead, a mensagem pode ser editada e salva. Para voltar ao modelo padrão, use "Restaurar mensagem padrão".

### Status

- **novo**: ainda não foi contatado (status padrão da lista)
- **contatado**: já enviou a primeira mensagem
- **respondeu**: o lead respondeu
- **fechado**: virou cliente
- **descartado**: sem interesse ou fora do perfil
- **negado**: não quer os serviços

## Como rodar

Pré-requisitos: **Node.js 22.15 ou superior** (testado com Node 24) e uma conta no [Apify](https://apify.com).

```bash
# 1. Instalar as dependências
npm install

# 2. Criar o arquivo de configuração e preencher
cp .env.example .env.local     # no Windows: copy .env.example .env.local

# 3. Rodar o servidor de desenvolvimento
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

### Variáveis de ambiente (`.env.local`)

| Variável | Para que serve |
|---|---|
| `APIFY_TOKEN` | Token da sua conta Apify (Settings → Integrations). Necessário para buscar. |
| `SENDER_NAME` | Seu nome, usado na mensagem ("Aqui é ___, da Dourado Comunicação"). Sem ele, a mensagem usa "a equipe". |
| `PORTFOLIO_URL` | Link do seu portfólio, colocado no fim da mensagem. Se estiver vazio, a mensagem sai sem link. |

**Nunca** commite o `.env.local`: ele contém o seu token. O `.gitignore` já impede isso.

### Observação sobre certificados (Windows)

Em redes com antivírus ou proxy corporativo, a conexão com a API do Apify pode falhar com `self-signed certificate in certificate chain`. O script `npm run dev` já usa `--use-system-ca` para resolver isso, pois faz o Node usar os certificados do Windows. Não desligue a verificação de TLS.

## Uso

1. **Buscar**: na aba *Buscar*, informe a categoria (ex.: `advogado`), a cidade (ex.: `São Paulo SP`) e a quantidade. Cada resultado tem custo no Apify (cerca de US$ 1,50 por 1.000 lugares). Repetir a mesma busca atualiza os dados existentes e não duplica leads.
2. **Filtrar**: na lista, filtre por categoria, cidade, status, tipo de site ou nome. A lista mostra por padrão só os leads **novos**, em ordem alfabética.
3. **Contatar**: abra o perfil do lead, confira a mensagem, clique em *Chamar no WhatsApp* e envie. Use *Copiar mensagem* se preferir colar manualmente.
4. **Acompanhar**: troque o status do lead no próprio perfil. A cor na lateral do card mostra o status.

## Estrutura

```
app/
  page.tsx                  lista de leads com filtros
  search/                   tela de busca
  leads/[id]/               perfil do lead, mensagem e status
  api/search/               busca no Apify e gravação
  api/leads/[id]/           atualização de status e mensagem
  api/leads/[id]/contact/   registro de contato (abriu / copiou)
lib/
  search/                   provedor de busca (Apify) e interface
  db.ts                     banco SQLite (node:sqlite)
  leads.ts                  regras de leads: importação, filtros, mensagens
  messages.ts               modelos de mensagem por tipo de site
  website-classifier.ts     classificação do campo de site
  normalize.ts              telefone (wa.me), nomes
data/                       banco local (não versionado)
```

## Dados e privacidade

Os leads são dados pessoais de empresas e de seus responsáveis. Por isso:

- O banco fica em `data/lead_ouro.db`, na sua máquina, e **não é versionado**.
- O `.gitignore` também bloqueia CSVs, planilhas, logs e outros arquivos de dados.
- Antes de compartilhar o repositório, confira com `git status` que nenhum arquivo de dados está na lista.

## Limitações atuais

- **Sem login**: quem acessar o endereço vê os leads. Por isso o app está pensado para rodar localmente.
- **Banco local**: SQLite em arquivo. Para publicar online (ex.: Vercel), o banco precisa ser hospedado, por exemplo no Turso ou em um Postgres.
- **Custo da busca**: depende do plano do Apify e do número de resultados.
- **Classificação heurística**: sites com domínio incomum podem ser classificados como domínio próprio. Os casos duvidosos aparecem marcados.

## Próximos passos

- Login e proteção por senha antes de publicar.
- Banco online, se a ferramenta for publicada.
- Mais modelos de mensagem e acompanhamento de retorno.

## Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | servidor de desenvolvimento em `localhost:3000` |
| `npm run build` | build de produção |
| `npm run start` | roda o build de produção |
| `npm run lint` | verificação de código |
