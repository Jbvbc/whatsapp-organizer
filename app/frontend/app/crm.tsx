import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useCallback, useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useResponsive } from '../hooks/useResponsive';
import { useTheme, Theme } from '../contexts/ThemeContext';
import { get, post, put, del } from '../services/api';

interface CrmProvider {
  id: string;
  name: string;
  description: string;
}

interface CrmIntegration {
  id: string;
  provider: string;
  name: string;
  apiUrl?: string;
  isActive: boolean;
  lastSyncAt: string | null;
  lastSyncStatus: string | null;
  organizationId?: string;
  createdAt: string;
  updatedAt: string;
}

export default function CrmScreen() {
  const { rs } = useResponsive();
  const { theme } = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [integrations, setIntegrations] = useState<CrmIntegration[]>([]);
  const [providers, setProviders] = useState<CrmProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  const [formProvider, setFormProvider] = useState('');
  const [formName, setFormName] = useState('');
  const [formApiKey, setFormApiKey] = useState('');
  const [formApiUrl, setFormApiUrl] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [{ data: integrationsData }, { data: providersData }] = await Promise.all([
        get<CrmIntegration[]>('/api/crm/integrations'),
        get<CrmProvider[]>('/api/crm/providers'),
      ]);
      setIntegrations(integrationsData || []);
      setProviders(providersData || []);
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

  const handleCreate = async () => {
    if (!formProvider || !formApiKey.trim()) return;
    setCreating(true);
    try {
      const provider = providers.find(p => p.id === formProvider);
      await post('/api/crm/integrations', {
        provider: formProvider,
        name: formName.trim() || provider?.name || formProvider,
        apiKey: formApiKey.trim(),
        apiUrl: formApiUrl.trim() || undefined,
      });
      setFormProvider('');
      setFormName('');
      setFormApiKey('');
      setFormApiUrl('');
      setShowForm(false);
      await fetchData();
    } catch (e: any) {
      Alert.alert('Erro', e?.message || 'Falha ao criar integração');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = (integration: CrmIntegration) => {
    Alert.alert('Excluir integração', `Remover conexão com "${integration.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: async () => {
        try {
          await del(`/api/crm/integrations/${integration.id}`);
          await fetchData();
        } catch {
          Alert.alert('Erro', 'Falha ao excluir');
        }
      }},
    ]);
  };

  const handleToggle = async (integration: CrmIntegration) => {
    try {
      await put(`/api/crm/integrations/${integration.id}`, { isActive: !integration.isActive });
      await fetchData();
    } catch {
      Alert.alert('Erro', 'Falha ao alterar status');
    }
  };

  const handleSync = async (integration: CrmIntegration) => {
    setSyncingId(integration.id);
    try {
      const { data } = await post(`/api/crm/integrations/${integration.id}/sync`, {});
      Alert.alert(
        'Sincronização concluída',
        `Status: ${data?.status}\nSincronizados: ${data?.synced}\nErros: ${data?.errors}`,
      );
      await fetchData();
    } catch (e: any) {
      Alert.alert('Erro', e?.message || 'Falha na sincronização');
    } finally {
      setSyncingId(null);
    }
  };

  const providerColors: Record<string, string> = {
    hubspot: '#FF7A59',
    salesforce: '#00A1E0',
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: rs(16), gap: rs(12) }}>
        <TouchableOpacity
          style={[styles.createBtn, { padding: rs(14), borderRadius: rs(10), gap: rs(6) }]}
          onPress={() => setShowForm(!showForm)}
        >
          <Ionicons name="cloud-download" size={rs(20)} color="#fff" />
          <Text style={[styles.createBtnText, { fontSize: rs(15) }]}>
            {showForm ? 'Cancelar' : 'Nova Integração CRM'}
          </Text>
        </TouchableOpacity>

        {showForm && (
          <View style={[styles.form, { padding: rs(16), borderRadius: rs(10), gap: rs(10) }]}>
            <Text style={[styles.formLabel, { fontSize: rs(13) }]}>Provedor</Text>
            <View style={{ flexDirection: 'row', gap: rs(8), flexWrap: 'wrap' }}>
              {(providers.length > 0 ? providers : [
                { id: 'hubspot', name: 'HubSpot', description: '' },
                { id: 'salesforce', name: 'Salesforce', description: '' },
              ]).map(p => (
                <TouchableOpacity
                  key={p.id}
                  style={[styles.providerChip, {
                    padding: rs(10), borderRadius: rs(8),
                    backgroundColor: formProvider === p.id ? (providerColors[p.id] || colors.primary) : colors.surfaceLight,
                  }]}
                  onPress={() => setFormProvider(p.id)}
                >
                  <Text style={{
                    fontSize: rs(13), fontWeight: '600',
                    color: formProvider === p.id ? '#fff' : colors.text,
                  }}>{p.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={[styles.input, { padding: rs(12), borderRadius: rs(8), fontSize: rs(14) }]}
              placeholder="Nome (opcional)"
              placeholderTextColor={colors.textTertiary}
              value={formName}
              onChangeText={setFormName}
            />
            <TextInput
              style={[styles.input, { padding: rs(12), borderRadius: rs(8), fontSize: rs(14) }]}
              placeholder="API Key / Token"
              placeholderTextColor={colors.textTertiary}
              value={formApiKey}
              onChangeText={setFormApiKey}
              secureTextEntry
            />
            <TextInput
              style={[styles.input, { padding: rs(12), borderRadius: rs(8), fontSize: rs(14) }]}
              placeholder="API URL (opcional - padrão do provedor)"
              placeholderTextColor={colors.textTertiary}
              value={formApiUrl}
              onChangeText={setFormApiUrl}
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={[styles.submitBtn, { padding: rs(12), borderRadius: rs(8) }]}
              onPress={handleCreate}
              disabled={creating || !formProvider || !formApiKey.trim()}
            >
              {creating ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={[styles.submitBtnText, { fontSize: rs(14) }]}>Conectar</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: rs(40) }} />
        ) : integrations.length === 0 ? (
          <View style={[styles.empty, { padding: rs(48), gap: rs(8) }]}>
            <Ionicons name="cloud-offline" size={rs(50)} color={colors.border} />
            <Text style={[styles.emptyText, { fontSize: rs(16) }]}>Nenhuma integração CRM</Text>
            <Text style={[styles.emptySubtext, { fontSize: rs(13) }]}>
              Conecte-se ao HubSpot ou Salesforce para sincronizar contatos
            </Text>
          </View>
        ) : (
          integrations.map(integration => {
            const pColor = providerColors[integration.provider] || colors.primary;
            return (
              <View key={integration.id} style={[styles.card, { padding: rs(14), borderRadius: rs(10), gap: rs(8) }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: rs(8) }}>
                  <View style={[styles.providerIcon, {
                    width: rs(36), height: rs(36), borderRadius: rs(18),
                    backgroundColor: pColor + '22',
                  }]}>
                    <Ionicons name="cloud" size={rs(18)} color={pColor} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.cardTitle, { fontSize: rs(15) }]}>{integration.name}</Text>
                    <Text style={[styles.cardProvider, { fontSize: rs(12), color: pColor }]}>
                      {integration.provider === 'hubspot' ? 'HubSpot' : 'Salesforce'}
                    </Text>
                  </View>
                  <View style={[styles.badge, {
                    paddingHorizontal: rs(8), paddingVertical: rs(2), borderRadius: rs(10),
                    backgroundColor: integration.isActive ? colors.success + '22' : colors.danger + '22',
                  }]}>
                    <Text style={{ fontSize: rs(11), color: integration.isActive ? colors.success : colors.danger }}>
                      {integration.isActive ? 'Ativo' : 'Inativo'}
                    </Text>
                  </View>
                </View>

                {integration.lastSyncAt && (
                  <View style={{ flexDirection: 'row', gap: rs(8), alignItems: 'center' }}>
                    <Ionicons
                      name={integration.lastSyncStatus === 'success' ? 'checkmark-circle' : integration.lastSyncStatus === 'partial' ? 'warning' : 'close-circle'}
                      size={rs(14)}
                      color={integration.lastSyncStatus === 'success' ? colors.success : integration.lastSyncStatus === 'partial' ? colors.warning : colors.danger}
                    />
                    <Text style={[styles.meta, { fontSize: rs(11) }]}>
                      Última sync: {new Date(integration.lastSyncAt).toLocaleString('pt-BR')}
                      {integration.lastSyncStatus === 'success' ? ' (OK)' : integration.lastSyncStatus === 'partial' ? ' (parcial)' : ' (falha)'}
                    </Text>
                  </View>
                )}

                <View style={{ flexDirection: 'row', gap: rs(8), marginTop: rs(4) }}>
                  <TouchableOpacity
                    style={[styles.actionBtn, { padding: rs(8), borderRadius: rs(6), flex: 1 }]}
                    onPress={() => handleSync(integration)}
                    disabled={syncingId === integration.id || !integration.isActive}
                  >
                    {syncingId === integration.id ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                      <Text style={{ fontSize: rs(12), color: colors.primary, textAlign: 'center' }}>
                        <Ionicons name="sync" size={rs(12)} /> Sincronizar
                      </Text>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, { padding: rs(8), borderRadius: rs(6), flex: 0.5 }]}
                    onPress={() => handleToggle(integration)}
                  >
                    <Text style={{ fontSize: rs(12), color: colors.textSecondary, textAlign: 'center' }}>
                      {integration.isActive ? 'Desativar' : 'Ativar'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, { padding: rs(8), borderRadius: rs(6), flex: 0.5 }]}
                    onPress={() => handleDelete(integration)}
                  >
                    <Text style={{ fontSize: rs(12), color: colors.danger, textAlign: 'center' }}>Excluir</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  createBtn: {
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  createBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
  form: {
    backgroundColor: theme.colors.surface,
  },
  formLabel: {
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  providerChip: {},
  input: {
    backgroundColor: theme.colors.background,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  submitBtn: {
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
  },
  submitBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
  empty: {
    alignItems: 'center',
  },
  emptyText: {
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  emptySubtext: {
    color: theme.colors.textTertiary,
    textAlign: 'center',
  },
  card: {
    backgroundColor: theme.colors.surface,
  },
  providerIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    color: theme.colors.text,
    fontWeight: '600',
  },
  cardProvider: {
    fontWeight: '500',
  },
  badge: {},
  meta: {
    color: theme.colors.textTertiary,
  },
  actionBtn: {
    backgroundColor: theme.colors.surfaceLight,
  },
});
