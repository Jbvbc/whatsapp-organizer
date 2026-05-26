# AGENTS.md - Plano de Execução do Projeto

## Instruções para Continuar o Desenvolvimento

### Como Usar Este Arquivo

Sempre que um novo agente (AI) for iniciar a execução deste projeto, ele deve:
1. Ler este arquivo para entender o estado atual
2. Ler o `CHECKPOINT.md` para saber exatamente o que já foi feito
3. Executar o próximo item da lista abaixo na ordem

---

## Estado Atual: Fase 4.1 Completa
## Próximo Item: Fase 4.2 - Webhook para Eventos

---

## ORDEM DE EXECUÇÃO

### FASE 1 - Funcionalidades Críticas

#### 1.4 Importação em Massa de Grupos do WhatsApp ✅
**Backend:**
```python
# Em server.py, adicionar:
@api_router.post("/groups/import")
async def import_device_groups(groups: List[dict]):
    """Import device WhatsApp groups"""
```

- Criar endpoint para importar grupos do dispositivo ✅
- Verificar duplicatas pelo nome ✅
- Criar grupos com contatos associados ✅

**Frontend:**
- `app/frontend/app/import-groups.tsx` ✅
- Scanner de grupos do dispositivo ✅
- Botão na tela de grupos ✅

---

### FASE 2 - Melhorias UX

#### 2.1 Design Responsivo ✅
- Criar hook `useResponsive` para detectar tamanho de tela ✅
- Ajustar layouts para tablets e diferentes densidades ✅
- Implementar `SafeAreaView` em todas as telas ✅

**Arquivos:**
- `app/frontend/hooks/useResponsive.ts` ✅
- Atualizar todos os `StyleSheet` para usar valores responsivos ✅

#### 2.2 Dark Mode Completo ✅
- Criar `ThemeContext` com suporte light/dark e `useColorScheme()` auto-detect
- Todos os 13 arquivos `.tsx` atualizados para usar `useTheme()` + `createStyles(theme)`
- `Theme` interface com 20+ tokens de cor (background, surface, text, border, etc.)
- Light: `#f5f5f5` bg / `#fff` surface / `#1a1a1a` text
- Dark: `#0c0c0c` bg / `#1a1a1a` surface / `#fff` text (preservado do original)
- `StatusBar` alterna entre `light`/`dark` conforme o tema
- Modal headers, tab bars e navegação adaptados dinamicamente

**Arquivos:**
- `app/frontend/contexts/ThemeContext.tsx` (novo)
- `app/frontend/app/_layout.tsx` (RootLayoutInner com ThemeProvider)
- `app/frontend/app/(tabs)/_layout.tsx`
- Todos os 12 screens `.tsx` convertidos para `createStyles(theme)`

#### 2.3 Modo Offline com Cache Local ✅
- Usar `AsyncStorage` para cache de dados (TTL configurável)
- Implementar `OfflineContext` via fetch HEAD periódico + AppState listener
- Fila de mutações offline com `services/sync.ts` — replay automático ao voltar online
- `services/api.ts`: camada unificada GET/POST/PUT/DELETE com cache + queue
- Banner laranja "Modo offline" no topo de todas as telas
- Banner azul "Dados offline" em cada tela ao exibir dados do cache
- Todas as 12 telas atualizadas para usar `api.get`/`api.post`/`api.put`/`api.del`

**Arquivos:**
- `app/frontend/services/cache.ts` (novo)
- `app/frontend/services/sync.ts` (novo)
- `app/frontend/services/api.ts` (novo)
- `app/frontend/contexts/OfflineContext.tsx` (novo)
- `app/frontend/hooks/useCachedData.ts` (novo)
- `app/frontend/app/_layout.tsx` (OfflineProvider + OfflineBanner)
- Todas as 12 telas `.tsx` convertidas para usar `services/api.ts`

#### 2.4 Busca Avançada com Filtros ✅
- Adicionar filtros por: tag, favorito, data de criação, grupo ✅
- Criar tela de busca avançada ✅
- Botão na tela de contatos para acessar busca avançada ✅

**Arquivos:**
- `app/frontend/app/search.tsx` (novo)
- `app/backend/server.py` (endpoint GET /api/contacts com filtros groupId, createdAfter, createdBefore)
- `app/frontend/app/_layout.tsx` (rota search como modal)
- `app/frontend/app/(tabs)/contacts.tsx` (botão "options" no header)

---

### FASE 3 - Funcionalidades Empresariais

#### 3.1 Múltiplas Organizações ✅
- Adicionar campo `organizationId` em todos os modelos ✅
- Criar modelo `Organization` ✅
- Criar endpoints para gerenciar organizações ✅

**Backend:**
- Novo modelo: `Organization` ✅
- Atualizar: `Contact`, `Group`, `ScheduledMessage`, `Event` ✅
- Novas rotas: `POST/GET/PUT/DELETE /api/organizations` ✅
- Filtro `organizationId` adicionado em: GET /api/contacts, /api/groups, /api/events, /api/events/upcoming, /api/scheduled-messages, /api/tags ✅

**Frontend:**
- `contexts/OrganizationContext.tsx` (novo) — provider + CRUD helpers ✅
- `app/organizations.tsx` (nova) — tela de listagem + criação + edição + exclusão ✅
- `app/_layout.tsx` — OrganizationProvider + rota organizations ✅
- `app/(tabs)/_layout.tsx` — header com badge da org ativa + navegação para gerenciamento ✅
- Todas as telas atualizadas para passar `organizationId` nas requisições: contacts, events, groups, tags, search, create-group, schedule-message, import-groups ✅

#### 3.2 Permissões de Usuário
- Criar modelo `User` com roles (admin, editor, viewer)
- Implementar autenticação JWT
- Middleware de autorização

**Backend:**
- Modelos: `User`, `Role`
- Autenticação: JWT com `python-jose`
- Middleware: `get_current_user()`

#### 3.3 Relatórios de Atividade ✅
- Dashboard com métricas ✅
- Gráficos de atividade (PieChart, BarChart, LineChart) ✅

**Backend:**
- `GET /api/reports/contacts-summary` (totalContacts, totalFavorites, totalGroups, totalEvents, pendingMessages, totalScheduledMessages, newContactsThisWeek, tagsBreakdown) ✅
- `GET /api/reports/activity?days=N` (daily contact/event counts com periodDays) ✅

**Frontend:**
- `app/(tabs)/reports.tsx` — dashboard com cards de resumo, PieChart por tag, BarChart últimos 7 dias, LineChart 30 dias ✅
- Aba Reports em `app/(tabs)/_layout.tsx` (ícone bar-chart) ✅
- Filtro `organizationId` em ambas as queries ✅
- Dependência: `react-native-chart-kit`, `react-native-svg` ✅

#### 3.4 API Externa ✅
- Documentação OpenAPI aprimorada (tags, summaries, title, description, contact) ✅
- Rate limiting (120 req/min por cliente, middleware Starlette) ✅
- API Keys para integrações (modelo + CRUD + toggle + auth via X-API-Key) ✅

**Backend:**
- Modelo `ApiKeyCreate`, `ApiKeyResponse` (Pydantic) ✅
- Geração de chave: `wco_` prefix + 32 bytes `secrets.token_urlsafe` ✅
- Hash SHA256 armazenado (chave mostrada 1x na criação) ✅
- CRUD: `POST/GET/DELETE /api/api-keys`, `POST /api/api-keys/{id}/toggle` ✅
- Autenticação alternativa via `X-API-Key` header (dependência `get_api_key_user`) ✅
- `RateLimiter` class com sliding window + `RateLimitMiddleware` via `BaseHTTPMiddleware` ✅
- OpenAPI tags em todas as 30+ rotas + metadata do app ✅

**Frontend:**
- `app/api-keys.tsx` — CRUD visual de API Keys ✅
- Rota api-keys registrada em `_layout.tsx` ✅
- Criação com nome + escopos, exibição única da chave, ativar/desativar, excluir ✅

---

### FASE 4 - Integrações Avançadas

#### 4.1 Integração com CRM ✅
- Conectar com CRM externo (HubSpot, Salesforce) ✅
- Sincronização bidirecional de contatos ✅

**Backend:**
- Modelo `CrmIntegration` + helpers ✅
- CRUD: `GET /api/crm/providers`, `POST/GET/PUT/DELETE /api/crm/integrations` ✅
- Sync: `POST /api/crm/integrations/{id}/sync` (async httpx) ✅
- `hubspot_sync_contacts()` — pull paginado + push por telefone (cria ou atualiza) ✅
- `salesforce_sync_contacts()` — SOQL query + push REST ✅
- Dependência: `httpx>=0.27` ✅

**Frontend:**
- `app/crm.tsx` — seletor de provedor, config de API Key + URL, botão de sincronizar, status ✅
- Ícone cloud no header do tab navigator → /crm ✅
- Rota registrada em `_layout.tsx` ✅

#### 4.2 Webhook para Eventos
- Sistema de webhooks configurável
- Eventos: criação de contato, agendamento, envio de mensagem

**Backend:**
- Modelo: `Webhook`
- Endpoint: `POST /api/webhooks`
- Event dispatcher

#### 4.3 Plugin WhatsApp Business API
- Integração real com WhatsApp Business API
- Envio real de mensagens
- Status de entrega

#### 4.4 Exportação Completa (CSV/Excel)
- Exportar eventos e agendamentos
- Usar `xlsx` para Excel

---

## VERIFICAÇÕES APÓS CADA IMPLEMENTAÇÃO

Após implementar cada item, verificar:

1. **Backend**: Executar `uvicorn server:app --reload` e testar endpoints
2. **Frontend**: Verificar se compila com `npx expo start`
3. **Funcionalidades**: Testar CRUD completo
4. **Erros**: Verificar logs do servidor e console do React Native
5. **Checkup**: Verificar imports (`useFocusEffect` de `@react-navigation/native`, não de `react-native`), dependências em `package.json`, `server.py` sem `NameError`, arquivos `.env` válidos

## COMANDOS ÚTEIS

```bash
# Iniciar backend
cd app/backend
uvicorn server:app --reload --host 0.0.0.0 --port 8000

# Iniciar frontend
cd app/frontend
npx expo start

# Instalar dependências
pip install -r app/backend/requirements.txt
npm install

# Testar backend
curl http://localhost:8000/api/contacts
curl http://localhost:8000/api/groups
curl http://localhost:8000/api/events/upcoming?days_ahead=30
```

## VARIÁVEIS DE AMBIENTE

### Backend (.env)
```
MONGO_URL=mongodb://localhost:27017
DB_NAME=whatsapp_organizer
```

### Frontend (.env)
```
EXPO_PUBLIC_BACKEND_URL=http://localhost:8000
```

---

## HISTÓRICO DE IMPLEMENTAÇÃO

| Fase | Item | Status | Data |
|------|------|--------|------|
| 1.1 | Agendamento de Mensagens | ✅ Completo | 25/05/2026 |
| 1.2 | Backup e Restauração | ✅ Completo | 25/05/2026 |
| 1.3 | Notificações e Eventos | ✅ Completo | 25/05/2026 |
| 1.4 | Importação de Grupos | ✅ Completo | 25/05/2026 |
| 2.1 | Design Responsivo | ✅ Completo | 25/05/2026 |
| 2.2 | Dark Mode Completo | ✅ Completo | 25/05/2026 |
| 2.3 | Modo Offline | ✅ Completo | 25/05/2026 |
| 2.4 | Busca Avançada | ✅ Completo | 25/05/2026 |
| 3.1 | Múltiplas Organizações | ✅ Completo | 25/05/2026 |
| 3.2 | Permissões de Usuário | ✅ Completo | 25/05/2026 |
| 3.3 | Relatórios de Atividade | ✅ Completo | 26/05/2026 |
| 3.4 | API Externa | ✅ Completo | 26/05/2026 |
| 4.1 | Integração com CRM | ✅ Completo | 26/05/2026 |
| 4.2 | Webhook para Eventos | ❌ Pendente | - |
| 4.3 | Plugin WhatsApp Business API | ❌ Pendente | - |
| 4.4 | Exportação Completa (CSV/Excel) | ❌ Pendente | - |
