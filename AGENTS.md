# AGENTS.md - Plano de Execução do Projeto

## Instruções para Continuar o Desenvolvimento

### Como Usar Este Arquivo

Sempre que um novo agente (AI) for iniciar a execução deste projeto, ele deve:
1. Ler este arquivo para entender o estado atual
2. Ler o `CHECKPOINT.md` para saber exatamente o que já foi feito
3. Executar o próximo item da lista abaixo na ordem

---

## Estado Atual: Fase 4.4 Completa
## Próximo Item: Nenhum - Projeto Completo ✅

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

#### 4.2 Webhook para Eventos ✅
- Sistema de webhooks configurável ✅
- Eventos: criação de contato, agendamento, envio de mensagem ✅

**Backend:**
- Modelo: `Webhook` (url, events, name, secret, isActive, lastTriggeredAt, lastResponseStatus) ✅
- CRUD: `POST/GET/PUT/DELETE /api/webhooks`, `GET /api/webhooks/events` ✅
- Event dispatcher: `dispatch_webhook_event()` com `asyncio.create_task` ✅
- 8 eventos: contact.created/updated/deleted, message.scheduled/sent/failed, event.created/upcoming ✅
- HMAC signature via `X-Webhook-Signature` header (SHA256) ✅
- Triggers em: sync_contacts, update_contact, delete_contact, create_scheduled_message, send_scheduled_message, create_event, check_birthdays ✅

**Frontend:**
- `app/webhooks.tsx` — criação com URL + secret + seleção de eventos (chips), listagem com status HTTP, toggle, excluir ✅
- Ícone pulse no header do tab navigator → /webhooks ✅
- Rota registrada em `_layout.tsx` ✅

#### 4.3 Plugin WhatsApp Business API ✅
- Integração real com WhatsApp Cloud API ✅
- Envio real de mensagens ✅
- Status de entrega (sent, delivered, read, failed) ✅

**Backend:**
- Modelo `WhatsAppConfigCreate/Update/Response` + `WhatsAppMessageStatus` ✅
- CRUD: `POST/GET/PUT /api/whatsapp/config` ✅
- Status: `GET /api/whatsapp/status` ✅
- Webhook receiver: `GET/POST /whatsapp/webhook` (verificação + callbacks) ✅
- `send_single_whatsapp_message()` — POST `/{phoneNumberId}/messages` na Cloud API ✅
- `send_whatsapp_message()` — envia para todos os contatos de um grupo ✅
- Trackeamento de message ID e atualização de status via webhook ✅
- Link com `scheduled_messages` para atualizar status automaticamente ✅

**Frontend:**
- `app/whatsapp.tsx` — configuração (Phone ID, Token, Business ID, Secret) + status das mensagens ✅
- Ícone WhatsApp verde no header do tab navigator → /whatsapp ✅
- Rota registrada em `_layout.tsx` ✅

#### 4.4 Exportação Completa (CSV/Excel) ✅
- Exportar eventos e agendamentos ✅
- Usar `xlsx` para Excel (openpyxl, 4 abas) ✅

**Backend:**
- `GET /api/export/events` (CSV) ✅
- `GET /api/export/scheduled-messages` (CSV) ✅
- `GET /api/export/all` (XLSX — Excel com 4 sheets: Contacts, Groups, Events, ScheduledMessages) ✅
- Dependência: `openpyxl>=3.1` ✅

**Frontend:**
- `app/export.tsx` — 5 opções de exportação (Contacts CSV, Groups JSON, Events CSV, Messages CSV, All XLSX) ✅
- Ícone download no header do tab navigator → /export-all ✅
- Rota registrada em `_layout.tsx` ✅

---

## VERIFICAÇÕES APÓS CADA IMPLEMENTAÇÃO

Após implementar cada item, verificar:

1. **Backend**: Executar `uvicorn server:app --reload` e testar endpoints
2. **Frontend**: Verificar se compila com `npx expo start`
3. **Funcionalidades**: Testar CRUD completo
4. **Erros**: Verificar logs do servidor e console do React Native
5. **Checkup**: Verificar imports (`useFocusEffect` de `@react-navigation/native`, não de `react-native`), dependências em `package.json`, `server.py` sem `NameError`, arquivos `.env` válidos

## TESTANDO O BACKEND SEM MONGODB

O projeto inclui um **MockDB** (`app/backend/mock_db.py`) que substitui o MongoDB quando ele não está disponível. O MockDB armazena dados em um arquivo JSON (`app/backend/data.json`) e implementa um subconjunto da API do Motor/MongoDB suficiente para rodar todas as rotas.

### Como usar:
1. Certifique-se de que `DB_TYPE=mock` está no `.env` (ou remova a variável — o fallback é automático se `motor` não estiver instalado)
2. Execute: `cd app/backend && python -m uvicorn server:app --reload --host 0.0.0.0 --port 8000`
3. Teste com curl (use arquivos JSON para o body):
   ```bash
   # Registrar usuário (primeiro vira admin)
   echo '{"email":"test@test.com","password":"123","name":"Test"}' > /tmp/body.json
   curl -s -X POST http://localhost:8000/api/auth/register -H "Content-Type: application/json" -d @/tmp/body.json

   # Criar contato (body é array)
   echo '[{"name":"Joao","phone":"5511999999999","tags":["vip"]}]' > /tmp/contact.json
   TOKEN=$(curl -s -X POST http://localhost:8000/api/auth/register -H "Content-Type: application/json" -d @/tmp/body.json | python -c "import sys,json;print(json.load(sys.stdin)['access_token'])")
   curl -s -X POST http://localhost:8000/api/contacts/sync -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d @/tmp/contact.json

   # Ver relatórios
   curl -s http://localhost:8000/api/reports/contacts-summary -H "Authorization: Bearer $TOKEN"

   # Exportar CSV
   curl -s http://localhost:8000/api/export/contacts -H "Authorization: Bearer $TOKEN"
   ```

### Limitações conhecidas:
- `$lookup` (joins) não implementado — não usado no projeto
- `$group` com `$sum` de campo (não constante 1) pode ter comportamento limitado
- Persistência é síncrona (salva em JSON a cada escrita) — não adequado para produção
- Export XLSX (`/api/export/all`) retorna 500 por falha de serialização de bytes — usar CSV para exportação
- Sem índices — performance degrade com muitos documentos
- Dados são preservados entre reinicializações do servidor (em `data.json`)

## COMANDOS ÚTEIS

```bash
# Iniciar backend (com MockDB)
cd app/backend
python -m uvicorn server:app --reload --host 0.0.0.0 --port 8000

# Iniciar backend (com MongoDB)
# Altere DB_TYPE no .env para 'mongo' ou remova
# Certifique-se de que o MongoDB está rodando

# Iniciar frontend
cd app/frontend
npx expo start

# Instalar dependências
pip install -r app/backend/requirements.txt
npm install
```

## VARIÁVEIS DE AMBIENTE

### Backend (.env)
```
MONGO_URL=mongodb://localhost:27017
DB_NAME=whatsapp_organizer
DB_TYPE=mock           # "mock" = MockDB local, "mongo" ou omitir = MongoDB
JWT_SECRET=change-this-secret-in-production
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
| 4.2 | Webhook para Eventos | ✅ Completo | 26/05/2026 |
| 4.3 | Plugin WhatsApp Business API | ✅ Completo | 26/05/2026 |
| 4.4 | Exportação Completa (CSV/Excel) | ✅ Completo | 26/05/2026 |
