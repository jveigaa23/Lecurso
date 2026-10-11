# LeCurso — site e painel para barbeiro educador

Site comercial para apresentar um barbeiro educador, divulgar seus cursos e direcionar visitantes para a compra, com **painel administrativo próprio** para o proprietário editar tudo sem mexer no código.

> **LeCurso** é uma marca provisória. Nome, logotipo, textos e fotos são trocados pelo painel (`/admin`).

---

## Sumário

1. [Funcionalidades](#funcionalidades)
2. [Stack](#stack)
3. [Arquitetura](#arquitetura)
4. [Requisitos](#requisitos)
5. [Instalação e desenvolvimento local](#instalação-e-desenvolvimento-local)
6. [Comandos](#comandos)
7. [Variáveis de ambiente](#variáveis-de-ambiente)
8. [Banco de dados (Neon + Drizzle)](#banco-de-dados-neon--drizzle)
9. [Autenticação e primeiro administrador](#autenticação-e-primeiro-administrador)
10. [Usando o painel](#usando-o-painel)
11. [Imagens](#imagens)
12. [Links de compra](#links-de-compra)
13. [Deploy na Vercel](#deploy-na-vercel)
14. [Domínio próprio](#domínio-próprio)
15. [Testes](#testes)
16. [Segurança](#segurança)
17. [Custos recorrentes](#custos-recorrentes)
18. [Solução de problemas](#solução-de-problemas)
19. [Limitações conhecidas](#limitações-conhecidas)
20. [Atualizações e manutenção](#atualizações-e-manutenção)

---

## Funcionalidades

**Site público**

| Rota | Conteúdo |
| --- | --- |
| `/` | Hero, apresentação do instrutor, cursos em destaque, método, galeria, depoimentos, FAQ e CTA final. Seções sem conteúdo ficam ocultas — nada é inventado. |
| `/cursos` | Catálogo com busca (ignora acentos), filtro por categoria e nível, ordenação, estados de carregamento, vazio e erro. Funciona sem JavaScript. |
| `/cursos/[slug]` | Página do curso: objetivos, conteúdo programático, público-alvo, FAQ, instrutor, preço, condições comerciais, cursos relacionados, barra de compra fixa no celular e dados estruturados (`Course`). |
| `/sobre` | Trajetória, experiência, filosofia, especialidades, certificações e fotos. |
| `/contato` | WhatsApp, Instagram, e-mail e outras redes cadastradas (sem formulário falso). |
| `/privacidade`, `/termos`, `/cookies` | Textos-base revisáveis, com dados do responsável vindos do painel. |
| `/sitemap.xml`, `/robots.txt` | Gerados a partir dos cursos publicados. |

**Painel (`/admin`)**

- Login/logout seguros; papéis **proprietário** (pode excluir) e **editor**.
- Visão geral com números reais e **checklist de publicação**.
- Cursos: criar, editar, publicar/despublicar, destacar, ordenar, excluir (com confirmação digitada).
- Categorias e depoimentos (depoimento só é publicado com autorização registrada).
- Página inicial, profissional/sobre, marca e contato, SEO padrão e dados legais.
- Toda alteração aparece no site **imediatamente** (invalidação de cache por tag).

## Stack

| Camada | Tecnologia |
| --- | --- |
| Framework | Next.js 16.4 (App Router, Cache Components, Turbopack) |
| UI | React 19.3, Tailwind CSS 4, lucide-react |
| Linguagem | TypeScript 5.9 (`strict`) |
| Banco | Neon PostgreSQL via `@neondatabase/serverless` (HTTP) |
| ORM / migrações | Drizzle ORM 0.45 + drizzle-kit |
| Autenticação | Better Auth 1.7 (e-mail e senha, sessões no banco, rate limit) |
| Validação | Zod 4 (sempre no servidor) |
| Testes | Vitest (unitário + integração com Postgres), Playwright + axe-core (E2E e acessibilidade) |
| Hospedagem | Vercel |

## Arquitetura

```
src/
├── app/
│   ├── (site)/              # páginas públicas (header/footer compartilhados)
│   ├── admin/
│   │   ├── login/           # tela de login (pública)
│   │   └── (panel)/         # páginas protegidas do painel
│   ├── api/auth/[...all]/   # endpoints do Better Auth
│   ├── sitemap.ts, robots.ts, not-found.tsx, error.tsx, layout.tsx
├── components/
│   ├── ui/                  # botões, container, imagens, ícones
│   ├── site/                # componentes do site público
│   └── admin/               # formulários e componentes do painel (client)
├── db/
│   ├── schema.ts            # schema Drizzle (fonte da verdade do banco)
│   ├── client.ts            # escolhe o driver: Neon (HTTP) ou node-postgres (local/testes)
│   └── index.ts             # getDb() — somente servidor
├── lib/
│   ├── validation/          # schemas Zod (curso, conteúdo, utilitários)
│   ├── auth.ts, session.ts  # Better Auth e requireAdmin()
│   ├── catalog.ts           # busca/filtros/ordenação (função pura, testada)
│   └── env.ts, format.ts, images.ts, constants.ts …
├── server/
│   ├── data/public.ts       # leituras públicas com `use cache` + tags
│   ├── services/content.ts  # regras de escrita e leituras do painel
│   └── actions/admin.ts     # server actions (todas exigem sessão)
└── proxy.ts                 # redireciona /admin sem cookie (checagem otimista)
drizzle/                     # migrações SQL versionadas
scripts/                     # migrate, seed (só local), create-admin
tests/                       # unit, integration, e2e
```

**Decisões principais**

- **Server Components por padrão.** Client Components só onde há interação (menu móvel, formulários do painel, login).
- **Cache com invalidação imediata.** Leituras públicas usam `"use cache"` + `cacheTag`; cada server action chama `updateTag`. O site é servido como HTML estático e o banco só é consultado quando algo muda (ou a cada hora).
- **Autorização no servidor, sempre.** `proxy.ts` apenas redireciona quem não tem cookie; cada página do painel e cada action chamam `requireAdmin()`, que valida a sessão no banco.
- **Driver duplo.** Em produção o Neon é acessado via HTTP (ideal para funções serverless). Em desenvolvimento/testes, `node-postgres` contra um Postgres local. O código da aplicação não usa transações interativas para manter compatibilidade com o driver HTTP.
- **Dinheiro em centavos** (`price_cents` inteiro) e moeda ISO (`BRL`).
- **Sem conteúdo fictício em produção.** Seções sem dados ficam ocultas; o seed de demonstração recusa bancos remotos.

### Estrutura do banco

| Tabela | Uso |
| --- | --- |
| `courses` | Cursos. `slug` único e validado por CHECK; preço ≥ 0; link de compra obrigatoriamente `https://`; JSON para objetivos, módulos e FAQ. Índices em publicação, destaque e categoria. |
| `categories` | Categorias do catálogo (nome e slug únicos). Excluir categoria deixa cursos “sem categoria”. |
| `testimonials` | Depoimentos. CHECK impede publicar sem `consent_confirmed`. |
| `site_settings` | Linha única (`id = 1`) com marca, contato, hero, sobre, galeria, FAQ, SEO e dados legais. |
| `orders` | **Preparada para a fase 2** (pagamentos). Única por `(payment_provider, provider_reference)` para evitar processar eventos duplicados. Nenhum fluxo atual grava nela. |
| `admin_users` | Administradores (e-mail único, papel `owner`/`editor`). |
| `auth_sessions`, `auth_accounts`, `auth_verifications`, `auth_rate_limits` | Tabelas do Better Auth. A senha fica **somente** em `auth_accounts.password`, com hash scrypt. |

## Requisitos

- Node.js **20.9+** (testado com 22).
- npm 10+.
- PostgreSQL 16 local **ou** um banco Neon de desenvolvimento.

## Instalação e desenvolvimento local

```bash
git clone https://github.com/jveigaa23/Lecurso.git
cd Lecurso
npm install
cp .env.example .env          # ajuste DATABASE_URL e BETTER_AUTH_SECRET

# Postgres local (exemplo com Docker):
docker run -d --name lecurso-pg -e POSTGRES_USER=lecurso -e POSTGRES_PASSWORD=lecurso \
  -e POSTGRES_DB=lecurso_dev -p 5432:5432 postgres:16

npm run db:migrate            # cria as tabelas
npm run db:seed               # (opcional) cursos de demonstração — só em banco local
npm run admin:create -- --email voce@exemplo.com --name "Seu Nome" --role owner
npm run dev                   # http://localhost:3000  •  painel: /admin
```

## Comandos

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento. |
| `npm run build` / `npm start` | Build e servidor de produção. **O build consulta o banco** (páginas são prerenderizadas). |
| `npm run lint` | ESLint. |
| `npm run typecheck` | Tipos de rotas + `tsc --noEmit`. |
| `npm test` | Vitest: unitários e integração (Postgres local, banco `lecurso_test`). |
| `npm run test:e2e` | Playwright: build de produção + testes de navegador (banco `lecurso_e2e`). |
| `npm run db:generate` | Gera uma nova migração a partir de mudanças em `src/db/schema.ts`. |
| `npm run db:migrate` | Aplica migrações. Em banco remoto exige `-- --yes`. |
| `npm run db:seed` | Dados de demonstração (bloqueado fora de bancos locais). |
| `npm run db:studio` | Drizzle Studio para inspecionar o banco. |
| `npm run admin:create` | Cria administrador ou redefine senha (`--reset-password`). |

## Variáveis de ambiente

Todas ficam **somente no servidor** (nenhuma usa `NEXT_PUBLIC_`). Veja `.env.example`.

| Variável | Obrigatória | Descrição |
| --- | --- | --- |
| `DATABASE_URL` | Sim | Connection string do Postgres/Neon (com `sslmode=require` no Neon). |
| `BETTER_AUTH_SECRET` | Sim | Segredo das sessões, **mínimo 32 caracteres**. Gere com `openssl rand -base64 32`. Em produção, a aplicação se recusa a autenticar sem ele. |
| `SITE_URL` | Sim (produção) | URL pública, ex.: `https://seudominio.com.br`. Usada em canonical, sitemap, Open Graph e na verificação de origem do login. |
| `PURCHASE_ALLOWED_HOSTS` | Não | Domínios aceitos nos links de compra (padrão: Hotmart, Kiwify, Mercado Pago, Eduzz, WhatsApp). |
| `IMAGE_OPTIMIZED_HOSTS` | Não | Hosts de imagem otimizados pelo Next (padrão: Cloudinary e Vercel Blob). Exige novo deploy ao mudar. |

Use valores diferentes para *Preview* e *Production* na Vercel (ideal: um branch do Neon para preview).

## Banco de dados (Neon + Drizzle)

### Criar o banco no Neon

1. Crie uma conta em [neon.tech](https://neon.tech) e um projeto (região sugerida: **AWS São Paulo – sa-east-1**, a mesma da função na Vercel).
2. Em **Connection Details**, copie a connection string (role padrão, banco `neondb`).
3. (Recomendado) Crie um **branch** `dev`/`preview` para testes e use a string dele no ambiente Preview da Vercel.

### Migrações

- O schema vive em `src/db/schema.ts`. Ao alterá-lo: `npm run db:generate -- --name descricao` e **revise o SQL** gerado em `drizzle/`.
- Aplicar no Neon (manual, consciente):

  ```bash
  DATABASE_URL="postgresql://...neon.tech/neondb?sslmode=require" npm run db:migrate -- --yes
  ```

- As migrações **não** rodam no build da Vercel, de propósito: nenhuma alteração de banco acontece sem uma ação explícita.
- Antes de migrar produção, crie um **branch/snapshot** no Neon (ponto de restauração instantâneo).

## Autenticação e primeiro administrador

Não existe cadastro público. Administradores são criados pelo terminal, apontando para o banco desejado:

```bash
DATABASE_URL="postgresql://...neon.tech/neondb?sslmode=require" \
  npm run admin:create -- --email dono@seudominio.com.br --name "Nome do Barbeiro" --role owner
```

- A senha é pedida de forma oculta (mínimo 12 caracteres, letras e números) e armazenada apenas como hash.
- `--role editor` cria um usuário que edita, mas não exclui conteúdo.
- Esqueceu a senha? Rode o mesmo comando com `--reset-password` (encerra as sessões abertas).
- Sessões duram 7 dias (renovadas com o uso). Cookies `HttpOnly`, `Secure` (em produção) e `SameSite=Lax`.
- Login limitado a **5 tentativas a cada 5 minutos por IP**.

## Usando o painel

Acesse `https://seudominio/admin`.

1. **Marca e contato** — nome, logotipo, WhatsApp (com DDI+DDD), e-mail, Instagram, redes, SEO padrão.
2. **Profissional** — nome, título, resumo, retrato, trajetória, filosofia, especialidades e certificações (somente reais).
3. **Página inicial** — título do hero (use `*asteriscos*` para destacar uma palavra), subtítulo, foto principal, diferenciais, galeria e FAQ.
4. **Categorias** — crie antes de cadastrar cursos (opcional).
5. **Cursos** → *Novo curso* — preencha, marque **Publicado** e salve. Só cursos publicados aparecem no site.
6. **Depoimentos** — apenas com autorização do aluno (o sistema exige a confirmação para publicar).
7. **Dados legais** — responsável exibido nas páginas de privacidade/termos/cookies.

O **checklist** da Visão geral mostra o que falta para o site ficar completo.

## Imagens

O banco guarda apenas **URLs** (nunca arquivos). Recomendado:

- **Cloudinary** (plano gratuito) ou **Vercel Blob**: suba a foto, copie a URL `https://` e cole no painel. Esses hosts são otimizados automaticamente (AVIF/WebP, tamanhos responsivos).
- Outros hosts `https://` funcionam, porém sem otimização.
- Arquivos fixos podem ir em `public/images/` e ser referenciados como `/images/arquivo.jpg`.
- Sempre preencha a **descrição da imagem** (acessibilidade e SEO).
- Proporções sugeridas: hero 4:5 (≥ 1200 px de altura), capas de curso 4:3, galeria 1:1, imagem de compartilhamento 1200×630.
- Nunca use fotos de banco de imagens como se fossem do profissional. Sem foto, o site exibe um painel tipográfico elegante.

## Links de compra

- Cada curso tem seu próprio link (Hotmart, Kiwify, Mercado Pago, Eduzz…).
- O link precisa ser `https://` e pertencer a um domínio da lista `PURCHASE_ALLOWED_HOSTS`; links fora da lista são recusados ao salvar **e** ocultados na exibição.
- Sem link: o botão vira “Quero me inscrever” no WhatsApp (com o nome do curso na mensagem). Sem WhatsApp: aparece “Inscrições ainda não abertas” — nunca um botão falso.
- O clique **não** é registrado como venda; a confirmação de pagamento é da plataforma.

**Fase 2 (pagamentos integrados):** a tabela `orders` já existe. Uma integração futura deve validar a assinatura dos webhooks, ignorar eventos duplicados (índice único por provedor + referência) e confirmar o status da transação consultando a API do provedor antes de liberar qualquer acesso.

## Deploy na Vercel

1. **Repositório:** envie o código para o GitHub.
2. **Projeto:** na Vercel, *Add New → Project* e importe o repositório (framework detectado: Next.js; comandos padrão).
3. **Variáveis** (*Settings → Environment Variables*): `DATABASE_URL`, `BETTER_AUTH_SECRET`, `SITE_URL` (Production); repita para Preview com o banco de preview.
4. **Região da função:** *Settings → Functions → Region* = `gru1` (São Paulo), próxima ao Neon `sa-east-1`.
5. **Banco:** aplique as migrações no Neon e crie o primeiro administrador (comandos acima) **antes** do primeiro deploy — o build prerenderiza páginas consultando o banco.
6. **Deploy:** cada push na branch principal publica em produção; outras branches geram *Preview* (com `noindex` automático).
7. **Logs e monitoramento:** *Project → Logs* (erros de runtime), *Observability*. Para alertas de erro, Sentry pode ser adicionado depois (plano gratuito).
8. **Rollback:** *Deployments* → deploy anterior → **Promote to Production** (instantâneo). Para o banco, use um branch/snapshot do Neon criado antes da migração.

> ⚠️ O plano **Hobby** da Vercel é restrito a uso **não comercial**. Para o site de um cliente, use o plano **Pro**.

## Domínio próprio

1. Registre o domínio (ex.: registro.br para `.com.br`).
2. Vercel → *Settings → Domains* → adicione `seudominio.com.br` e `www.seudominio.com.br`.
3. No registrador, configure os registros DNS indicados pela Vercel (A/CNAME) ou delegue os nameservers.
4. Atualize `SITE_URL` para o domínio final e faça um novo deploy. HTTPS é automático.
5. Envie `https://seudominio.com.br/sitemap.xml` no Google Search Console.

## Testes

```bash
npm test            # 45 testes: validações, busca/filtros, serviços no banco, autenticação, autorização
npm run test:e2e    # 24 testes Playwright: fluxos públicos, painel, responsividade, acessibilidade (axe)
```

- Os testes usam **apenas Postgres local** (`lecurso_test` e `lecurso_e2e`) e recusam bancos remotos.
- `TEST_DATABASE_URL` / `E2E_DATABASE_URL` permitem apontar para outro Postgres local.
- Cobertura E2E: catálogo (busca, categoria, ordenação), página do curso (link de compra, JSON-LD, canonical), fallback WhatsApp, 404 para rascunhos/inexistentes, sitemap/robots, cabeçalhos de segurança, sem rolagem horizontal em 360/390/768/1024/1440 px, menu móvel, alvos de toque ≥ 44 px, navegação por teclado, axe WCAG 2.1 AA em 7 páginas, e o fluxo completo do painel (login, validação, criação, publicação refletida no site, despublicação, logout, permissões do editor).

## Segurança

- Sessões validadas no banco em **toda** página do painel e **toda** server action (`requireAdmin`); `proxy.ts` é só uma camada extra.
- Exclusões restritas ao papel `owner`.
- Verificação de origem (CSRF) do Better Auth ativa em todos os ambientes; server actions também verificam origem.
- Rate limit de login persistido no banco (funciona entre instâncias serverless).
- Mensagem de erro de login genérica (não revela se o e-mail existe).
- Validação Zod no servidor + restrições `CHECK`/`UNIQUE`/FK no banco.
- Consultas parametrizadas (Drizzle); textos do painel renderizados como texto, nunca HTML.
- Cabeçalhos: CSP, `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`; `/admin` com `noindex` e `no-store`.
- Links externos com `rel="noopener noreferrer"`.

## Custos recorrentes

Valores aproximados; confira as páginas de preço de cada serviço.

| Item | Opção | Custo estimado |
| --- | --- | --- |
| Hospedagem | Vercel Pro (uso comercial) | US$ 20/mês por membro |
| Banco | Neon Free → Launch quando crescer | US$ 0 → a partir de ~US$ 5–19/mês conforme uso |
| Domínio `.com.br` | registro.br | ~R$ 40/ano |
| Imagens | Cloudinary Free ou Vercel Blob | US$ 0 no volume típico de um site pessoal |
| E-mail profissional (opcional) | Google Workspace / Zoho | variável |

## Solução de problemas

| Sintoma | Causa provável / solução |
| --- | --- |
| Build falha com erro de conexão | `DATABASE_URL` ausente/errada no ambiente do build ou migrações não aplicadas. |
| “BETTER_AUTH_SECRET ausente ou fraco” | Defina um segredo com 32+ caracteres na Vercel. |
| Login retorna “Muitas tentativas” | Rate limit (5 em 5 min por IP). Aguarde. |
| Login falha com 403 em produção | `SITE_URL` diferente do domínio acessado. Ajuste e faça redeploy. |
| Link de compra recusado | Domínio fora de `PURCHASE_ALLOWED_HOSTS` ou sem `https://`. |
| Imagem não aparece | URL sem `https://`, privada ou com bloqueio de hotlink. Teste a URL no navegador. |
| Alteração não aparece no site | Recarregue a página (o navegador pode manter a página anterior por alguns minutos). Alterações invalidam o cache do servidor na hora. |

## Limitações conhecidas

- Imagens são cadastradas por URL (sem upload direto no painel).
- Sem recuperação de senha por e-mail: a redefinição é feita pelo script `admin:create --reset-password` (evita um fluxo de e-mail inseguro ou incompleto).
- Sem checkout próprio, área do aluno ou liberação automática de acesso (planejado para a fase 2).
- Textos legais são modelos e **devem ser revisados por um profissional** antes da publicação.
- Busca do catálogo é feita em memória sobre os cursos publicados (adequada até algumas centenas de cursos).

## Atualizações e manutenção

```bash
npm outdated                 # ver atualizações
npm update                   # atualizações compatíveis
npm run lint && npm run typecheck && npm test && npm run test:e2e
```

- Atualize uma dependência principal por vez (Next, Better Auth, Drizzle) e leia as notas de versão.
- Mudanças de banco: altere `schema.ts` → `db:generate` → revise SQL → teste local → snapshot no Neon → `db:migrate -- --yes`.
- Faça deploy em *Preview* antes de promover para produção.
