# CHECKPOINT - WhatsApp Contact Organizer

## Data: 26/05/2026
## Última ação concluída: API Externa (Fase 3.4)
## Status: ✅ FASE 3.4 COMPLETA

---

## ✅ FASE 1 - COMPLETO (Funcionalidades Críticas)

### 1.1 Agendamento de Mensagens para Grupos ✅
**Backend (`server.py`):**
- Modelo: `ScheduledMessage` com campos (groupId, message, scheduledTime, isRecurring, recurringPattern, status)
- Rotas CRUD: `POST/GET/PUT/DELETE /api/scheduled-messages`
- Envio manual: `POST /api/scheduled-messages/send`
- Scheduler automático: `check_and_send_scheduled_messages()` a cada 1 minuto
- Suporte a mensagens recorrentes (daily, weekly, monthly) com `schedule_next_recurring_message()`

**Frontend:**
- Arquivo: `app/frontend/app/schedule-message.tsx`
- Rota registrada em: `app/frontend/app/_layout.tsx`
- Botão de agendamento no header de: `app/frontend/app/(tabs)/groups.tsx`
- Dependência: `@react-native-community/datetimepicker`

### 1.2 Sistema de Backup e Restauração ✅
**Backend (`server.py`):**
- Backup completo: `GET /api/backup` (exporta contatos, grupos, mensagens agendadas em ZIP)
- Restauração: `POST /api/restore`
- Exportar contatos CSV: `GET /api/export/contacts`
- Exportar grupos JSON: `GET /api/export/groups`
- Download do backup: `GET /download/backup`

**Frontend:**
- Arquivo: `app/frontend/app/backup.tsx`
- Rota registrada em: `app/frontend/app/_layout.tsx`
- Botão "Backup" na tela principal (`app/frontend/app/(tabs)/contacts.tsx`)
- Funcionalidades: Criar backup, exportar CSV/JSON, restaurar, baixar do servidor

### 1.3 Notificações para Aniversários e Eventos ✅
**Backend (`server.py`):**
- Modelo: `Event` com campos (title, description, date, type, contactId, isRecurring, recurringPattern)
- Modelo: Campo `birthday` adicionado ao `ContactUpdate`
- Rotas CRUD: `POST/GET/PUT/DELETE /api/events`
- Eventos próximos: `GET /api/events/upcoming`
- Verificação de aniversários: `POST /api/events/birthday-check` (cria eventos automaticamente)
- Notificações: `POST /api/events/notification`
- Scheduler: `check_and_send_event_notifications()` a cada 1 hora
- Scheduler diário à meia-noite: `check_birthdays()` via APScheduler cron

**Frontend:**
- Tela: `app/frontend/app/(tabs)/events.tsx` (aba própria na navegação)
- Filtros: Todos, Próximos, Aniversários, Casamento, Personalizado
- Exclusão de eventos com confirmação

### 1.4 Importação em Massa de Grupos do WhatsApp ✅
**Backend (`server.py`):**
- Endpoint: `POST /api/groups/import` - Importa múltiplos grupos
- Verificação de duplicatas pelo nome do grupo
- Resolução de contatos pelo telefone
- Retorno: `{imported, skipped, total}`

**Frontend:**
- Arquivo: `app/frontend/app/import-groups.tsx`
- Rota registrada em: `app/frontend/app/_layout.tsx`
- Scanner de grupos do dispositivo (mock inicial)
- Seleção múltipla com checkbox
- Botão "Importar" com contagem

---

## ✅ FASE 2.1 - COMPLETO (Design Responsivo)

### 2.1 Design Responsivo ✅

**Hook criado:**
- `app/frontend/hooks/useResponsive.ts` - Hook `useResponsive` com:
  - Escala linear pura baseada em 360px de referência (limitada a 2x)
  - `rs(n)` para valores responsivos (fontes, paddings, dimensões)
  - `numColumns` para grid adaptativo (1 coluna phone, 3 tablet, 4 desktop)
  - `horizontalPadding` calculado dinamicamente

**Layout:**
- `app/frontend/app/_layout.tsx` - Root envolto com `<SafeAreaProvider>`
- Todas as 12 telas convertidas para `<SafeAreaView>` (de `react-native-safe-area-context`)
- Valores hardcoded substituídos por `rs()` inline
- Avatares, ícones e elementos circulares com `borderRadius` proporcional
- Fontes (títulos, corpo, labels) escalam linearmente

**Telas com grid adaptativo (numColumns):**
- `contacts.tsx` - FlatList com `numColumns` (1/3/4 colunas)
- `groups.tsx` - FlatList com `numColumns`
- `events.tsx` - Mantido lista simples (cards muito largos para grid)

**Dependência:** `react-native-safe-area-context` (já instalada)

---

## ✅ FASE 2 - COMPLETO (Melhorias UX)

### 2.1 Design Responsivo ✅
### 2.2 Dark Mode Completo ✅
### 2.3 Modo Offline com Cache Local ✅
### 2.4 Busca Avançada com Filtros ✅

---

## 🔄 FASE 3 - EM ANDAMENTO (Funcionalidades Empresariais)

### 3.1 Múltiplas Organizações ✅
### 3.2 Permissões de Usuário ✅
### 3.3 Relatórios de Atividade ✅
### 3.4 API Externa para Integrações ✅

---

## 🔄 FASE 4 - PENDENTE (Integrações Avançadas)

### 4.1 Integração com CRM ❌
### 4.2 Webhook para Eventos ❌
### 4.3 Plugin para WhatsApp Business API ❌
### 4.4 Exportação para CSV/Excel (parcial - contatos OK, grupos OK) ❌

---

## 📁 Estrutura Atual do Projeto

```
APP WHATS/
├── app/
│   ├── backend/
│   │   ├── server.py              # FastAPI completo (840+ linhas)
│   │   └── requirements.txt       # Dependências Python
│   └── frontend/
│       ├── package.json           # Dependências React Native
│       ├── app.json               # Configurações Expo
│       ├── .env                   # EXPO_PUBLIC_BACKEND_URL
│       └── app/
│           ├── _layout.tsx        # Stack navigator (rotas atualizadas)
│           ├── index.tsx          # Boas-vindas + importação contatos
│           ├── contact-details.tsx
│           ├── create-group.tsx
│           ├── group-details.tsx
│           ├── schedule-message.tsx   # Agendamento de mensagens
│           ├── backup.tsx            # Backup e restauração
│           ├── import-groups.tsx     # Importação de grupos
│           ├── search.tsx         # Busca avançada com filtros ✅
│           ├── organizations.tsx  # Gerenciamento de organizações ✅
│           └── (tabs)/
│               ├── _layout.tsx    # Tab navigator (5 abas)
│               ├── contacts.tsx     # Contatos + backup
│               ├── events.tsx       # Eventos e aniversários
│               ├── groups.tsx       # Grupos + agendar + importar
│               └── tags.tsx         # Tags
├── package.json
├── AGENTS.md                       # Plano de execução
└── CHECKPOINT.md                   # ESTE ARQUIVO
```

## 🚀 Próximos Passos

Para continuar, execute na ordem:

1. **Fase 4.1** - Integração com CRM (HubSpot/Salesforce sync)
2. **Fase 4.2** - Webhook para Eventos
3. **Fase 4.3** - Plugin WhatsApp Business API
4. **Fase 4.4** - Exportação Completa (CSV/Excel)

## ✅ Fase 2.3 — Modo Offline com Cache Local (25/05/2026)

### O que foi feito

1. **`services/cache.ts`** — Cache genérico via AsyncStorage com TTL configurável (30 min default)
2. **`services/sync.ts`** — Fila de mutações offline com retry automático (máx 5 tentativas)
3. **`services/api.ts`** — Camada unificada (`get`/`post`/`put`/`del`) que:
   - Cacheia respostas GET automaticamente
   - Serve dados do cache quando offline
   - Enfileira POST/PUT/DELETE quando offline
4. **`contexts/OfflineContext.tsx`** — Detecta conectividade via:
   - HEAD request periódico (30s) ao backend
   - Listener `AppState` (dispara ao reabrir o app)
   - Sincronização automática ao voltar online
5. **`_layout.tsx`** — Banner laranja "Modo offline" no topo
6. **Todas as 12 telas** convertidas para `api.get`/`api.post`/`api.put`/`api.del`
7. **Banner azul "Dados offline"** nas telas de listagem (contacts, events, groups, tags)
8. **`hooks/useCachedData.ts`** — Hook pronto para novos componentes

## ✅ Fase 3.1 — Múltiplas Organizações (25/05/2026)

### O que foi feito

**Backend (`server.py`):**

1. **Modelo `Organization`** — Pydantic + MongoDB, campos: name, color, description
2. **Modelo `OrganizationUpdate`** — partial update
3. **Helpers** — `organization_helper()` adicionado
4. **CRUD endpoints** — `POST/GET/PUT/DELETE /api/organizations` (rota completa)
5. **`organizationId` adicionado em:** `Contact`, `Group`, `ScheduledMessage`, `Event` (optional, backward compatible)
6. **Filtro `organizationId`** adicionado em todos os GET lists:
   - `GET /api/contacts`
   - `GET /api/groups`
   - `GET /api/tags`
   - `GET /api/events`
   - `GET /api/events/upcoming`
   - `GET /api/scheduled-messages`

**Frontend:**

1. **`contexts/OrganizationContext.tsx`** — Provider com:
   - Lista de organizações (fetch automático)
   - `selectedOrg` ativo (estado global)
   - CRUD helpers: `createOrg`, `updateOrg`, `deleteOrg`, `refreshOrgs`
2. **`app/organizations.tsx`** — Tela de gerenciamento:
   - Listagem com indicador de org ativa
   - Formulário inline para criar/editar (nome, descrição, cor)
   - Exclusão com confirmação
   - Toque curto = selecionar, toque longo = editar
3. **`app/_layout.tsx`** — `OrganizationProvider` envolvendo a árvore + rota organizations como modal
4. **`app/(tabs)/_layout.tsx`** — Header com badge colorido + nome da org ativa + seta, navega para `/organizations`
5. **Todas as telas atualizadas** para passar `selectedOrg.id` como `organizationId`:
   - `contacts.tsx`, `events.tsx`, `groups.tsx`, `tags.tsx`
   - `search.tsx`, `create-group.tsx`, `schedule-message.tsx`, `import-groups.tsx`

### Arquivos criados/modificados

| Arquivo | Mudança |
|---------|---------|
| `app/backend/server.py` | Modelos + helpers + CRUD orgs + filtros em 6 endpoints |
| `app/frontend/contexts/OrganizationContext.tsx` | **Novo** — Provider + CRUD |
| `app/frontend/app/organizations.tsx` | **Novo** — Tela de gerenciamento |
| `app/frontend/app/_layout.tsx` | OrganizationProvider + rota |
| `app/frontend/app/(tabs)/_layout.tsx` | Header com badge da org ativa |
| `app/frontend/app/(tabs)/contacts.tsx` | passa organizationId |
| `app/frontend/app/(tabs)/events.tsx` | passa organizationId |
| `app/frontend/app/(tabs)/groups.tsx` | passa organizationId |
| `app/frontend/app/(tabs)/tags.tsx` | passa organizationId |
| `app/frontend/app/search.tsx` | passa organizationId |
| `app/frontend/app/create-group.tsx` | passa organizationId |
| `app/frontend/app/schedule-message.tsx` | passa organizationId |
| `app/frontend/app/import-groups.tsx` | passa organizationId |

## ✅ Fase 3.2 — Permissões de Usuário (25/05/2026)

### O que foi feito

**Backend (`server.py`):**

1. **Dependências adicionadas:** `python-jose[cryptography]`, `passlib[bcrypt]`, `bcrypt`
2. **Modelos:**
   - `UserCreate` (email, password, name)
   - `UserLogin` (email, password)
   - `UserResponse` (id, email, name, role)
   - `TokenResponse` (access_token, token_type, user)
3. **Autenticação JWT:**
   - `create_access_token()` — gera token HS256 com expiração de 30 dias
   - `verify_password()` / `get_password_hash()` — bcrypt via passlib
   - `get_current_user()` — dependency que extrai e valida JWT do header `Authorization: Bearer <token>`
   - `require_role(*roles)` — dependency factory para autorização por papel
4. **Endpoints de autenticação:**
   - `POST /api/auth/register` — cria usuário (primeiro = admin, demais = viewer)
   - `POST /api/auth/login` — retorna JWT + dados do usuário
   - `GET /api/auth/me` — dados do usuário atual
5. **Proteção de rotas:**
   - Rotas de gerenciamento de organização protegidas com `require_role("admin")`

**Frontend:**

1. **`contexts/AuthContext.tsx`** — Provider com:
   - Token persistido em AsyncStorage
   - `login`, `register`, `logout`
   - `isAdmin` / `isEditor` computed properties
   - Restaura sessão ao iniciar
2. **`app/auth.tsx`** — Tela de login/registro:
   - Alternância entre Entrar / Criar Conta
   - Campos: email, senha (e nome para registro)
   - Feedback com loading e erros
3. **`services/api.ts`** — `setAuthToken()`/`getAuthToken()` + token automático no header `Authorization`
4. **`app/_layout.tsx`** — `AuthProvider` na árvore + rota `auth` sem header
5. **`app/index.tsx`** — Redireciona para `/auth` se usuário não estiver logado

### Arquivos criados/modificados

| Arquivo | Mudança |
|---------|---------|
| `app/backend/requirements.txt` | +python-jose, passlib, bcrypt |
| `app/backend/server.py` | Modelos + auth routes + JWT + proteção |
| `app/frontend/contexts/AuthContext.tsx` | **Novo** |
| `app/frontend/app/auth.tsx` | **Novo** — tela de login/registro |
| `app/frontend/services/api.ts` | +setAuthToken/getAuthToken |
| `app/frontend/app/_layout.tsx` | AuthProvider + rota auth |
| `app/frontend/app/index.tsx` | Redireciona para /auth se não logado |

## ✅ Fase 3.3 — Relatórios de Atividade (26/05/2026)

### O que foi feito

**Backend (`server.py`):**

1. **`GET /api/reports/contacts-summary`** — Retorna:
   - `totalContacts` — contagem total de contatos
   - `totalFavorites` — contatos favoritados
   - `totalGroups` — total de grupos
   - `totalEvents` — total de eventos
   - `pendingMessages` — mensagens agendadas pendentes
   - `totalScheduledMessages` — total de mensagens agendadas
   - `newContactsThisWeek` — contatos criados nos últimos 7 dias
   - `tagsBreakdown` — array de `{tag, count}` com distribuição de tags
   - Filtro opcional: `organizationId`

2. **`GET /api/reports/activity?days=30`** — Retorna:
   - `daily` — array de `{date, count}` com agregação de contatos por dia
   - `events` — array de `{date, count}` com agregação de eventos por dia
   - `periodDays` — número de dias consultados
   - Filtro opcional: `organizationId`

**Frontend — `app/(tabs)/reports.tsx`:**

1. **Cards de resumo** — grid 3 colunas com ícone + valor + label (Contatos, Favoritos, Grupos, Eventos, Novos/7d, Pendentes)
2. **PieChart** (Contatos por Tag) — gráfico de pizza com distribuição de tags (top 7)
3. **BarChart** (Contatos por Dia) — últimos 7 dias em barras verticais
4. **LineChart** (Atividade 30 dias) — linha suave (bezier) com evolução diária
5. **Estado vazio** — mensagem "Nenhum dado disponível" quando não há contatos
6. **Banner offline** — azul "Dados offline" quando dados vêm do cache
7. **Filtro `organizationId`** — passado automaticamente via `useOrganization`
8. **Loading** — spinner centralizado durante o fetch

**Arquivos criados/modificados:**

| Arquivo | Mudança |
|---------|---------|
| `app/backend/server.py` | +2 endpoints de relatórios |
| `app/frontend/app/(tabs)/reports.tsx` | **Novo** — tela completa com 4 gráficos |
| `app/frontend/app/(tabs)/_layout.tsx` | +aba Reports (ícone bar-chart) |
| `app/frontend/package.json` | +react-native-chart-kit, react-native-svg |

## ✅ Fase 3.4 — API Externa (26/05/2026)

### O que foi feito

**Backend (`server.py`):**

1. **Documentação OpenAPI aprimorada:**
   - `title`, `description`, `version`, `contact` no `FastAPI()` constructor
   - `openapi_tags` com 9 grupos (Auth, Contacts, Groups, Events, Scheduled Messages, Organizations, API Keys, Reports, Backup & Export)
   - `tags` e `summary` em todas as 30+ rotas
   - Descrições detalhadas em cada endpoint

2. **Rate limiting (120 req/min por cliente):**
   - `RateLimiter` class com sliding window time-based (`collections.deque`)
   - `RateLimitMiddleware` via `BaseHTTPMiddleware` da Starlette
   - Diferenciação por IP, API Key prefix, ou JWT
   - Exceção HTTP 429 quando limite excedido
   - Isenta `/docs`, `/openapi.json`, `/redoc` do rate limit

3. **API Keys para integrações:**
   - Geração: `wco_` + 32 bytes `secrets.token_urlsafe()` (URL-safe base64)
   - Armazenamento: hash SHA256 da chave (nunca a chave bruta)
   - Modelos: `ApiKeyCreate` (name, scopes), `ApiKeyResponse` (id, name, key 1x, scopes, isActive)
   - `api_key_helper()` — formata documento MongoDB para resposta
   - CRUD endpoints (admin only):
     - `POST /api/api-keys` — cria chave, retorna a chave 1 única vez
     - `GET /api/api-keys` — lista chaves (sem os valores)
     - `DELETE /api/api-keys/{id}` — remove chave
     - `POST /api/api-keys/{id}/toggle` — ativa/desativa sem excluir
   - Autenticação alternativa: `get_api_key_user()` dependency via `X-API-Key` header
   - `get_current_user_or_api_key()` — aceita JWT ou API Key
   - `lastUsedAt` atualizado automaticamente a cada uso

**Frontend — `app/api-keys.tsx`:**

1. **Listagem de chaves** — cards com nome, status (ativa/inativa), escopos, datas
2. **Criação** — formulário com nome e escopos (separados por vírgula)
3. **Exibição única** — banner amarelo com a chave em monospace após criação, instrução para copiar
4. **Ativar/Desativar** — toggle sem excluir
5. **Excluir** — confirmação antes de remover
6. **Estado vazio** — mensagem "Nenhuma API Key" com ícone

**Arquivos criados/modificados:**

| Arquivo | Mudança |
|---------|---------|
| `app/backend/server.py` | +imports (secrets, hashlib, time, deque, defaultdict, APIKeyHeader, BaseHTTPMiddleware) + RateLimiter + RateLimitMiddleware + APIKey models + api_key_helper + hash_api_key/generate_api_key + get_api_key_user + CRUD API keys + tags/summaries em 30+ rotas + OpenAPI metadata |
| `app/frontend/app/api-keys.tsx` | **Novo** — tela de gerenciamento de API Keys |
| `app/frontend/app/_layout.tsx` | +rota `api-keys` como modal |

## ✅ Fase 2.4 — Busca Avançada com Filtros (25/05/2026)

### O que foi feito

1. **Backend** — endpoint `GET /api/contacts` melhorado com filtros:
   - `groupId`: filtra contatos pertencentes a um grupo específico
   - `createdAfter`: filtra por data de criação (ISO datetime)
   - `createdBefore`: filtra até data de criação
   - Mantidos filtros existentes: `search`, `tag`, `favorite`

2. **Frontend — tela `app/search.tsx`** (modal):
   - Text input para busca por nome, telefone, notas
   - Chips de tags (fetch de `/api/tags`) — seleção múltipla
   - Seletor de grupos (fetch de `/api/groups`) — toggle único
   - Toggle favoritos (apenas favoritos / todos)
   - Botão "Buscar" com contagem de filtros ativos
   - Resultados em cards com avatar, nome, telefone, tags, favorito
   - Botão "Limpar" reseta todos os filtros

3. **`contacts.tsx`** — botão `options` (ícone filtro) no header que navega para `/search`

4. **`_layout.tsx`** — rota `search` registrada como modal com header dinâmico

### Arquivos criados/modificados

| Arquivo | Mudança |
|---------|---------|
| `app/backend/server.py:173-213` | GET /api/contacts com groupId, createdAfter, createdBefore |
| `app/frontend/app/search.tsx` | **Novo** — tela de busca avançada |
| `app/frontend/app/_layout.tsx` | Rota `search` adicionada como modal |
| `app/frontend/app/(tabs)/contacts.tsx` | Botão `options` no header → /search |

## ✅ Fase 2.2 — Dark Mode Completo (25/05/2026)

### O que foi feito

1. **Criado `contexts/ThemeContext.tsx`** com:
   - `Theme` interface com 21 tokens de cor
   - `lightTheme` e `darkTheme` completos
   - `useColorScheme()` do React Native para auto-detect do sistema
   - `ThemeProvider` e hook `useTheme()`

2. **Atualizado `_layout.tsx`**:
   - `ThemeProvider` envolvendo toda a árvore
   - `RootLayoutInner` acessa tema para `StatusBar` + header modais dinâmicos

3. **Atualizado `(tabs)/_layout.tsx`**:
   - Tab bar, header, tint colors todos dinâmicos via `useTheme()`

4. **12 telas convertidas** para:
   - `useTheme()` + `useMemo(() => createStyles(theme), [theme])`
   - Todas as cores hardcoded substituídas por `theme.colors.xxx`
   - `createStyles(theme: Theme)` em vez de `StyleSheet.create({...})` estático

### Paletas

| Token | Light | Dark |
|-------|-------|------|
| `background` | `#f5f5f5` | `#0c0c0c` |
| `surface` | `#ffffff` | `#1a1a1a` |
| `text` | `#1a1a1a` | `#ffffff` |
| `textSecondary` | `#666666` | `#888888` |
| `primary` | `#4A90E2` | `#4A90E2` |
| `border` | `#e0e0e0` | `#333333` |

## 🔧 Fixes Ambientais (25/05/2026)

| # | Arquivo | Problema | Correção |
|---|---------|----------|----------|
| 1 | `requirements.txt` | `uvloop==0.19.0` — quebra no Windows (Unix-only) | Removido; versões trocadas de `==` para `>=` |
| 2 | `server.py:745` | `scheduler.start()` em module-level — crash ao importar sem event loop | Movido para `@app.on_event("startup")` |

## 🐛 Bugs Corrigidos no Checkup (25/05/2026)

| # | Arquivo | Problema | Correção |
|---|---------|----------|----------|
| 1 | `groups.tsx` | `useFocusEffect` importado de `react-native` (inexistente lá) | Alterado para `@react-navigation/native` |
| 2 | `events.tsx` | `useFocusEffect` importado de `react-native` (inexistente lá) | Alterado para `@react-navigation/native` |
| 3 | `contacts.tsx` | `renderContact` quebrado — mostrava botões Backup/Grupos em vez do card de contato | Reescrevido com avatar, nome, telefone, tags, favorito, WhatsApp |
| 4 | `app/frontend/.env` | Arquivo corrompido com texto de chat misturado às variáveis | Reescrito com `EXPO_PUBLIC_BACKEND_URL=http://localhost:8000` |
| 5 | `app/backend/.env` | Arquivo inexistente (server.py tenta carregá-lo) | Criado com `MONGO_URL` e `DB_NAME` |
| 6 | `server.py` | `timedelta` usado em `check_and_send_event_notifications()` sem import global | Adicionado `timedelta` ao import global |
| 7 | `server.py` | `from datetime import datetime` duplicado (linha 10 e linha 742) | Removida duplicata da linha 10 |
| 8 | `package.json` | Dependências `expo-contacts`, `expo-image-picker`, `expo-file-system` ausentes | Adicionadas ao `dependencies` |

## 📁 Estrutura Atual do Projeto

```
APP WHATS/
├── app/
│   ├── backend/
│   │   ├── server.py              # FastAPI (840+ linhas)
│   │   ├── requirements.txt       # Dependências Python
│   │   └── .env                   # MONGO_URL + DB_NAME ✅
│   └── frontend/
│       ├── package.json           # Dependências (AsyncStorage adicionado ✅)
│       ├── app.json               # Configurações Expo
│       ├── .env                   # EXPO_PUBLIC_BACKEND_URL ✅
│       ├── services/
│       │   ├── cache.ts           # Cache offline AsyncStorage com TTL ✅
│       │   ├── sync.ts            # Fila de mutações offline ✅
│       │   └── api.ts             # API unificada (get/post/put/del) com cache ✅
│       ├── contexts/
│       │   ├── ThemeContext.tsx        # Tema light/dark com auto-detect ✅
│       │   ├── OfflineContext.tsx      # Conectividade + sync automático ✅
│       │   └── OrganizationContext.tsx # Organizações + CRUD ✅
│       ├── hooks/
│       │   ├── useResponsive.ts   # Hook responsivo ✅
│       │   └── useCachedData.ts   # Hook fetch com fallback offline ✅
│       └── app/
│           ├── _layout.tsx        # SafeAreaProvider + ThemeProvider + OfflineProvider + Stack ✅
│           ├── index.tsx          # Boas-vindas (offline-aware ✅)
│           ├── contact-details.tsx # (offline-aware ✅)
│           ├── create-group.tsx   # (offline-aware ✅)
│           ├── group-details.tsx  # (offline-aware ✅)
│           ├── schedule-message.tsx # (offline-aware ✅)
│           ├── backup.tsx         # (offline-aware ✅)
│           ├── import-groups.tsx  # (offline-aware ✅)
│           ├── search.tsx         # Busca avançada com filtros ✅
│           ├── organizations.tsx  # Gerenciamento de organizações ✅
│           └── (tabs)/
│               ├── _layout.tsx    # Tema dinâmico ✅
│               ├── contacts.tsx   # + cache offline ✅
│               ├── events.tsx     # + cache offline ✅
│               ├── groups.tsx     # + cache offline ✅
│               ├── tags.tsx       # + cache offline ✅
│               └── reports.tsx    # Dashboard com gráficos ✅
├── package.json
├── AGENTS.md
└── CHECKPOINT.md
```

## 🛠 Comandos para Testar

```bash
# Backend
cd app/backend
uvicorn server:app --reload --host 0.0.0.0 --port 8000

# Frontend
cd app/frontend
npx expo start

# Testar endpoints
curl http://localhost:8000/api/contacts
curl http://localhost:8000/api/groups
curl http://localhost:8000/api/events/upcoming?days_ahead=30
curl http://localhost:8000/api/scheduled-messages
curl -X POST http://localhost:8000/api/groups/import -H "Content-Type: application/json" -d '[{"name":"Teste","contactPhones":["5511999999999"]}]'
```
