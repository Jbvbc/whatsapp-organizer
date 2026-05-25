Perfeito! Agora tenho todos os detalhes necessários. Vou criar um app completo de organização de contatos do WhatsApp.
Action: 
## Plano de Implementação - WhatsApp Contact Organizer

**Funcionalidades Principais:**
1. Importar contatos do dispositivo (incluindo WhatsApp)
2. Busca livre + Tags/categorias personalizadas
3. Favoritar contatos
4. Adicionar notas e fotos aos contatos
5. Criar grupos e organizar contatos
6. Enviar mensagens WhatsApp para grupos
7. Sem autenticação (dados locais + sincronização backend)

**Arquitetura:**
- Frontend: React Native/Expo com navigation tabs
- Backend: FastAPI com MongoDB
- Storage: MongoDB para sincronização + AsyncStorage local

**Estrutura de Dados:**

MongoDB Collections:
1. contacts: {
   _id, name, phone, photo (base64), notes, tags[], isFavorite, rawContactId
}
2. groups: {
   _id, name, color, contactIds[], createdAt
}

**Permissões Necessárias (app.json):**
- expo-contacts (Android: READ_CONTACTS)
- expo-image-picker (Camera/Gallery)

**Navegação (Tab + Stack):**
- Tab 1: Contatos (lista + busca)
- Tab 2: Grupos
- Tab 3: Tags/Categorias
- Modals: Detalhes do contato, Criar grupo, Adicionar tags

**API Endpoints:**
- POST /api/contacts/sync - Sincronizar contatos
- GET /api/contacts - Listar todos
- PUT /api/contacts/{id} - Atualizar contato
- POST /api/groups - Criar grupo
- GET /api/groups - Listar grupos
- PUT /api/groups/{id} - Atualizar grupo
- DELETE /api/groups/{id} - Deletar grupo

**Bibliotecas Necessárias:**
- expo-contacts (importar contatos)
- expo-image-picker (fotos)
- @react-navigation/bottom-tabs (navegação)
- expo-linking (abrir WhatsApp)
- @shopify/flash-list (listas performáticas)

**Fases de Desenvolvimento:**
1. Setup básico: Backend API + MongoDB models
2. Importar contatos do dispositivo
3. Lista e busca de contatos
4. Detalhes do contato (editar, favoritar, tags, notas, foto)
5. Criar e gerenciar grupos
6. Enviar mensagens WhatsApp para grupos
7. UI polish e testes

Vou começar implementando backend e frontend juntos para mostrar resultados rápidos.

Observation: Your thought has been logged.